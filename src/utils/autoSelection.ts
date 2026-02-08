import type { PlayerWithStats, TeamForSelection, SelectionResult } from '../types';

/**
 * Selects players for teams based on fairness algorithm.
 * 
 * Algorithm:
 * 1. Score players: (baseWeight - selectedCount * penaltyPerSelection) + (acceptanceRate * acceptanceBonus)
 *    - Acceptance rate threshold: 80-100% treated equally (max bonus)
 * 2. Sort teams by strength (1 = highest strength gets best players first)
 * 3. Assign players to teams based on their level, distributing fairly within same-strength teams
 * 
 * @param players - Players with their statistics (must have invitedCount > 0)
 * @param teams - Teams to assign players to
 * @returns Object mapping player IDs to team IDs
 */
export function selectPlayers(
  players: PlayerWithStats[],
  teams: TeamForSelection[]
): SelectionResult {
  const result: SelectionResult = {};
  
  // Constants for scoring algorithm
  const BASE_WEIGHT = 100;
  const PENALTY_PER_SELECTION = 30;
  const ACCEPTANCE_BONUS = 0.5;
  const ACCEPTANCE_THRESHOLD = 80;
  
  // Score and rank all players
  interface ScoredPlayer extends PlayerWithStats {
    score: number;
    randomTieBreaker: number;
  }
  
  const scoredPlayers: ScoredPlayer[] = players.map(player => {
    const acceptanceRate = (player.acceptedCount / player.invitedCount) * 100;
    const cappedAcceptanceRate = Math.min(acceptanceRate, ACCEPTANCE_THRESHOLD);
    const score = (BASE_WEIGHT - player.selectedCount * PENALTY_PER_SELECTION) 
                  + (cappedAcceptanceRate * ACCEPTANCE_BONUS);
    
    return {
      ...player,
      score,
      randomTieBreaker: Math.random()
    };
  });
  
  // Sort players by score (descending), then by random for tie-breaking
  scoredPlayers.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.randomTieBreaker - a.randomTieBreaker;
  });
  
  // Calculate total capacity and select top players
  const totalCapacity = teams.reduce((sum, team) => sum + team.maxPlayers, 0);
  const selectedPlayers = scoredPlayers.slice(0, totalCapacity);
  
  // Sort teams by strength (1 = highest strength, assign best players first)
  const sortedTeams = [...teams].sort((a, b) => a.strength - b.strength);
  
  // Group teams by strength level
  const teamsByStrength = new Map<number, TeamForSelection[]>();
  sortedTeams.forEach(team => {
    if (!teamsByStrength.has(team.strength)) {
      teamsByStrength.set(team.strength, []);
    }
    teamsByStrength.get(team.strength)!.push(team);
  });
  
  // Track assignments for each team
  const teamAssignments = new Map<string, string[]>();
  teams.forEach(team => {
    teamAssignments.set(team.id, []);
  });
  
  // Track remaining players to assign
  const remainingPlayers = [...selectedPlayers];
  
  // Process each strength level (from highest to lowest)
  const strengthLevels = Array.from(teamsByStrength.keys()).sort((a, b) => a - b);
  
  for (const strength of strengthLevels) {
    const teamsInGroup = teamsByStrength.get(strength)!;
    const groupCapacity = teamsInGroup.reduce((sum, team) => sum + team.maxPlayers, 0);
    
    if (remainingPlayers.length === 0) break;
    
    // Sort remaining players by level (highest first), then by score
    remainingPlayers.sort((a, b) => {
      if (b.level !== a.level) {
        return b.level - a.level;
      }
      // If same level, use score as tie-breaker
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Finally use random tie-breaker
      return b.randomTieBreaker - a.randomTieBreaker;
    });
    
    // Take the top players by level for this group
    const playersForGroup = remainingPlayers.splice(0, Math.min(groupCapacity, remainingPlayers.length));
    
    // Distribute players across teams in round-robin fashion for fair distribution
    let teamIdx = 0;
    for (const player of playersForGroup) {
      // Find next team with available space
      let assigned = false;
      for (let attempt = 0; attempt < teamsInGroup.length; attempt++) {
        const team = teamsInGroup[teamIdx];
        const currentAssignments = teamAssignments.get(team.id)!;
        
        if (currentAssignments.length < team.maxPlayers) {
          currentAssignments.push(player.id);
          result[player.id] = team.id;
          teamIdx = (teamIdx + 1) % teamsInGroup.length;
          assigned = true;
          break;
        }
        
        teamIdx = (teamIdx + 1) % teamsInGroup.length;
      }
      
      if (!assigned) break;
    }
  }
  
  return result;
}
