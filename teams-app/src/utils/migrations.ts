// Migration to rename player property from 'score' to 'level'
export function migrateScoreToLevel(): void {
  try {
    const playersJson = localStorage.getItem('players');
    if (!playersJson) {
      console.log('No players to migrate');
      return;
    }

    const players = JSON.parse(playersJson);
    let migratedCount = 0;

    const migratedPlayers = players.map((player: any) => {
      // Check if player already has 'level' property
      if (player.level !== undefined) {
        return player; // Already migrated
      }

      // Check if player has old 'score' property
      if (player.score !== undefined) {
        migratedCount++;
        const { score, ...playerWithoutScore } = player;
        return {
          ...playerWithoutScore,
          level: score,
        };
      }

      // Player has neither - set default level
      return {
        ...player,
        level: 3,
      };
    });

    // Save migrated players back to localStorage
    localStorage.setItem('players', JSON.stringify(migratedPlayers));
    console.log(`Player migration completed: ${migratedCount} player(s) migrated from 'score' to 'level'`);
  } catch (error) {
    console.error('Player migration failed:', error);
  }
}

// Migration to move maxPlayers from team level to event level
export function migrateMaxPlayersToEvent(): void {
  try {
    const eventsJson = localStorage.getItem('events');
    if (!eventsJson) {
      console.log('No events to migrate');
      return;
    }

    const events = JSON.parse(eventsJson);
    let migratedCount = 0;

    const migratedEvents = events.map((event: any) => {
      // Check if event already has maxPlayersPerTeam
      if (event.maxPlayersPerTeam !== undefined) {
        return event; // Already migrated
      }

      // Get maxPlayers from first team, or default to 11
      let maxPlayersPerTeam = 11;
      if (event.teams && event.teams.length > 0 && event.teams[0].maxPlayers) {
        maxPlayersPerTeam = event.teams[0].maxPlayers;
      }

      // Remove maxPlayers from all teams
      const migratedTeams = event.teams?.map((team: any) => {
        const { maxPlayers, ...teamWithoutMaxPlayers } = team;
        return teamWithoutMaxPlayers;
      }) || [];

      migratedCount++;
      return {
        ...event,
        maxPlayersPerTeam,
        teams: migratedTeams,
      };
    });

    // Save migrated events back to localStorage
    localStorage.setItem('events', JSON.stringify(migratedEvents));
    console.log(`Migration completed: ${migratedCount} event(s) migrated`);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
