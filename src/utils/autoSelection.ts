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
  
  // Calculate total capacity
  const totalCapacity = teams.reduce((sum, team) => sum + team.maxPlayers, 0);
  
  // Check if all teams have the same strength (backward compatibility)
  const uniqueStrengths = new Set(teams.map(t => t.strength));
  const useLevelPreferences = uniqueStrengths.size > 1;
  
  // Track remaining unassigned players and total slots
  let remainingSlots = totalCapacity;
  const assignedPlayerIds = new Set<string>();
  
  // Process each strength level (from highest to lowest)
  const strengthLevels = Array.from(teamsByStrength.keys()).sort((a, b) => a - b);
  
  for (const strength of strengthLevels) {
    const teamsInGroup = teamsByStrength.get(strength)!;
    const groupCapacity = teamsInGroup.reduce((sum, team) => sum + team.maxPlayers, 0);
    
    if (remainingSlots === 0) break;
    
    // Get unassigned players
    const availablePlayers = scoredPlayers.filter(p => !assignedPlayerIds.has(p.id));
    
    let sortedForGroup: ScoredPlayer[];
    
    if (useLevelPreferences) {
      // Define preferred levels based on team strength
      let preferredLevels: number[];
      if (strength === 1) {
        // Strength 1 teams prefer highest two levels (4, 5)
        preferredLevels = [4, 5];
      } else if (strength === 2) {
        // Strength 2 teams prefer middle three levels (2, 3, 4)
        preferredLevels = [2, 3, 4];
      } else {
          // Strength 3 teams prefer lowest levels (1, 2)
          preferredLevels = [1, 2];
      }
      
      // Split players into preferred and other groups
      const preferredPlayers = availablePlayers.filter(p => preferredLevels.includes(p.level));
      const otherPlayers = availablePlayers.filter(p => !preferredLevels.includes(p.level));
      
      // Sort both groups by score (descending), then by random tie-breaker
      const sortByScore = (a: ScoredPlayer, b: ScoredPlayer) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.randomTieBreaker - a.randomTieBreaker;
      };
      
      preferredPlayers.sort(sortByScore);
      otherPlayers.sort(sortByScore);
      
      // Combine: preferred players first, then others
      sortedForGroup = [...preferredPlayers, ...otherPlayers];
    } else {
      // No level preferences, just sort by score
      sortedForGroup = [...availablePlayers].sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.randomTieBreaker - a.randomTieBreaker;
      });
    }
    
    // Take the top players for this group (limited by group capacity and remaining slots)
    const playersForGroup = sortedForGroup.slice(0, Math.min(groupCapacity, remainingSlots, sortedForGroup.length));
    
    // Mark these players as assigned
    playersForGroup.forEach(p => assignedPlayerIds.add(p.id));
    remainingSlots -= playersForGroup.length;
    
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
