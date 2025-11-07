import type { Player, Team, Event } from '../types';
import { getPlayers, getEvents } from './localStorage';

interface PlayerWithStats extends Player {
  eventsParticipated: number;
}

/**
 * Get the number of events a player has participated in
 */
function getPlayerEventCount(playerId: string): number {
  const events = getEvents();
  return events.filter(event => 
    event.teams.some(team => 
      (team.selectedPlayers || []).includes(playerId)
    )
  ).length;
}

/**
 * Calculate team balance score (lower is better)
 * Considers skill level variance and participation fairness
 */
function calculateTeamBalance(teams: Team[], players: Player[], playerStats: Map<string, number>): number {
  const teamSkills = teams.map(team => {
    const teamPlayers = (team.selectedPlayers || [])
      .map(id => players.find(p => p.id === id))
      .filter(Boolean) as Player[];
    
    if (teamPlayers.length === 0) return 0;
    
    const avgSkill = teamPlayers.reduce((sum, p) => sum + p.level, 0) / teamPlayers.length;
    return avgSkill;
  });

  // Calculate variance in average skills
  const avgSkill = teamSkills.reduce((sum, s) => sum + s, 0) / teamSkills.length;
  const skillVariance = teamSkills.reduce((sum, s) => sum + Math.pow(s - avgSkill, 2), 0);

  // Calculate participation fairness (lower past participation should be prioritized)
  const avgParticipation = Array.from(playerStats.values()).reduce((sum, count) => sum + count, 0) / playerStats.size;
  const participationVariance = Array.from(playerStats.values())
    .reduce((sum, count) => sum + Math.pow(count - avgParticipation, 2), 0);

  return skillVariance + participationVariance * 0.5;
}

/**
 * Auto-select players into teams with fairness algorithm
 */
export function autoSelectTeams(event: Event): Team[] {
  const allPlayers = getPlayers();
  
  // Get accepted invitations
  const acceptedInvitations = event.invitations.filter(inv => inv.status === 'accepted');
  const acceptedPlayerIds = acceptedInvitations.map(inv => inv.playerId);
  
  // Get player data with stats
  const playersWithStats: PlayerWithStats[] = acceptedPlayerIds
    .map(id => {
      const player = allPlayers.find(p => p.id === id);
      if (!player) return null;
      return {
        ...player,
        eventsParticipated: getPlayerEventCount(id),
      };
    })
    .filter(Boolean) as PlayerWithStats[];

  if (playersWithStats.length === 0) {
    // Return teams with empty selectedPlayers arrays
    return event.teams.map(team => ({
      ...team,
      selectedPlayers: [],
    }));
  }

  // Sort players by participation (ascending) then by level (descending for balance)
  const sortedPlayers = [...playersWithStats].sort((a, b) => {
    if (a.eventsParticipated !== b.eventsParticipated) {
      return a.eventsParticipated - b.eventsParticipated; // Less participation first
    }
    return b.level - a.level; // Higher level first within same participation
  });

  // Calculate total capacity and select players that fit
  const totalCapacity = event.teams.length * event.maxPlayersPerTeam;
  const selectedPlayers = sortedPlayers.slice(0, totalCapacity)
    .sort((a, b) => b.level - a.level); // Sort by level descending

  // Initialize teams with empty selectedPlayers arrays
  const teams: Team[] = event.teams.map(team => ({
    ...team,
    selectedPlayers: [],
  }));

  // Check if teams have differing strengths
  const uniqueStrengths = new Set(teams.map(t => t.strength || 2));
  const hasVaryingStrengths = uniqueStrengths.size > 1 && teams.length > 1;

  if (hasVaryingStrengths) {
    // Assign players based on team strength
    // Sort teams by strength (1 = highest, 3 = lowest)
    const teamsByStrength = teams.map((team, index) => ({ team, index }))
      .sort((a, b) => (a.team.strength || 2) - (b.team.strength || 2));

    // Sort available players by level (high to low)
    const availablePlayers = [...selectedPlayers].sort((a, b) => b.level - a.level);
    const assignedPlayerIds = new Set<string>();

    // Process each team in strength order
    for (const { team } of teamsByStrength) {
     
      // Fill this team to capacity
      while (team.selectedPlayers.length < event.maxPlayersPerTeam) {
        let selectedPlayer: PlayerWithStats | undefined;

        selectedPlayer = availablePlayers.find(p => !assignedPlayerIds.has(p.id));

        if (selectedPlayer) {
          team.selectedPlayers.push(selectedPlayer.id);
          assignedPlayerIds.add(selectedPlayer.id);
        } else {
          break; // No more players available
        }
      }
    }
  } else {
    // Original snake draft approach when strengths are equal
    let teamIndex = 0;
    let direction = 1; // 1 for forward, -1 for backward

    for (const player of selectedPlayers) {
      // Ensure selectedPlayers is initialized
      if (!teams[teamIndex].selectedPlayers) {
        teams[teamIndex].selectedPlayers = [];
      }
      
      // Check if team is not full
      if (teams[teamIndex].selectedPlayers.length < event.maxPlayersPerTeam) {
        teams[teamIndex].selectedPlayers.push(player.id);
      } else {
        // Find next available team with space
        let found = false;
        for (let i = 0; i < teams.length; i++) {
          if (!teams[i].selectedPlayers) {
            teams[i].selectedPlayers = [];
          }
          if (teams[i].selectedPlayers.length < event.maxPlayersPerTeam) {
            teams[i].selectedPlayers.push(player.id);
            found = true;
            break;
          }
        }
        if (!found) {
          // All teams full, skip remaining players
          break;
        }
        continue;
      }

      // Move to next team (snake pattern)
      if (direction === 1) {
        teamIndex++;
        if (teamIndex >= teams.length) {
          teamIndex = teams.length - 1;
          direction = -1;
        }
      } else {
        teamIndex--;
        if (teamIndex < 0) {
          teamIndex = 0;
          direction = 1;
        }
      }
    }

    // Balance teams by skill when strengths are equal
    balanceTeamsBySkill(teams, playersWithStats);
  }

  return teams;
}

/**
 * Balance teams by swapping players to minimize skill variance
 */
function balanceTeamsBySkill(teams: Team[], players: PlayerWithStats[]): void {
  const maxIterations = 50;
  let improved = true;
  let iteration = 0;

  while (improved && iteration < maxIterations) {
    improved = false;
    iteration++;

    // Try swapping players between teams
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const team1 = teams[i];
        const team2 = teams[j];

        // Ensure selectedPlayers arrays exist
        if (!team1.selectedPlayers) team1.selectedPlayers = [];
        if (!team2.selectedPlayers) team2.selectedPlayers = [];

        // Try each player swap
        for (const p1Id of team1.selectedPlayers) {
          for (const p2Id of team2.selectedPlayers) {
            // Calculate current balance
            const currentBalance = calculateTeamBalance(teams, players, new Map());

            // Swap players
            team1.selectedPlayers = team1.selectedPlayers.filter(id => id !== p1Id);
            team2.selectedPlayers = team2.selectedPlayers.filter(id => id !== p2Id);
            team1.selectedPlayers.push(p2Id);
            team2.selectedPlayers.push(p1Id);

            // Calculate new balance
            const newBalance = calculateTeamBalance(teams, players, new Map());

            // Keep swap if it improves balance
            if (newBalance < currentBalance) {
              improved = true;
            } else {
              // Revert swap
              team1.selectedPlayers = team1.selectedPlayers.filter(id => id !== p2Id);
              team2.selectedPlayers = team2.selectedPlayers.filter(id => id !== p1Id);
              team1.selectedPlayers.push(p1Id);
              team2.selectedPlayers.push(p2Id);
            }
          }
        }
      }
    }
  }
}

/**
 * Get selection statistics for display
 */
export function getSelectionStats(event: Event) {
  const allPlayers = getPlayers();
  const acceptedCount = event.invitations.filter(inv => inv.status === 'accepted').length;
  const totalSelectedCount = event.teams.reduce((sum, team) => sum + (team.selectedPlayers || []).length, 0);
  const totalCapacity = event.teams.length * event.maxPlayersPerTeam;

  // Calculate team balance
  const teamStats = event.teams.map(team => {
    const selectedPlayers = team.selectedPlayers || [];
    const teamPlayers = selectedPlayers
      .map(id => allPlayers.find(p => p.id === id))
      .filter(Boolean) as Player[];
    
    const avgSkill = teamPlayers.length > 0
      ? teamPlayers.reduce((sum, p) => sum + p.level, 0) / teamPlayers.length
      : 0;

    return {
      teamName: team.name,
      playerCount: selectedPlayers.length,
      avgSkill: avgSkill.toFixed(1),
    };
  });

  return {
    acceptedCount,
    totalSelectedCount,
    totalCapacity,
    unassignedCount: acceptedCount - totalSelectedCount,
    teamStats,
  };
}
