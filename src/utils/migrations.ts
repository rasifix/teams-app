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
