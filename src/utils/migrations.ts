// Migration to move startTime from event level to team level
export function migrateStartTimeToTeam(): void {
  try {
    const eventsJson = localStorage.getItem('events');
    if (!eventsJson) {
      console.log('No events to migrate');
      return;
    }

    const events = JSON.parse(eventsJson);
    let migratedCount = 0;

    const migratedEvents = events.map((event: any) => {
      // Check if teams already have startTime
      if (event.teams && event.teams.length > 0 && event.teams[0].startTime !== undefined) {
        return event; // Already migrated
      }

      // Get startTime from event level
      const eventStartTime = event.startTime || '10:00'; // Default if missing

      // Add startTime to all teams
      const migratedTeams = event.teams?.map((team: any) => ({
        ...team,
        startTime: eventStartTime,
      })) || [];

      migratedCount++;
      
      // Remove startTime from event level
      const { startTime, ...eventWithoutStartTime } = event;
      
      return {
        ...eventWithoutStartTime,
        teams: migratedTeams,
      };
    });

    // Save migrated events back to localStorage
    localStorage.setItem('events', JSON.stringify(migratedEvents));
    console.log(`Start time migration completed: ${migratedCount} event(s) migrated`);
  } catch (error) {
    console.error('Start time migration failed:', error);
  }
}

// Migration to convert shirt assignments from shirtId to shirtNumber
export function migrateShirtAssignments(): void {
  try {
    const eventsJson = localStorage.getItem('events');
    const shirtSetsJson = localStorage.getItem('shirtSets');
    
    if (!eventsJson || !shirtSetsJson) {
      console.log('No data to migrate');
      return;
    }

    const events = JSON.parse(eventsJson);
    const shirtSets = JSON.parse(shirtSetsJson);
    let migratedTeamCount = 0;

    const migratedEvents = events.map((event: any) => {
      const migratedTeams = event.teams?.map((team: any) => {
        // Check if team already has shirtNumber-based assignments
        if (team.shirtAssignments && team.shirtAssignments.length > 0) {
          const firstAssignment = team.shirtAssignments[0];
          if (typeof firstAssignment.shirtNumber === 'number') {
            return team; // Already migrated
          }
        }

        // Migrate shirtId-based assignments to shirtNumber-based
        if (team.shirtAssignments && team.shirtSetId) {
          const shirtSet = shirtSets.find((set: any) => set.id === team.shirtSetId);
          if (shirtSet) {
            const migratedAssignments = team.shirtAssignments.map((assignment: any) => {
              const shirt = shirtSet.shirts.find((s: any) => s.id === assignment.shirtId);
              return {
                playerId: assignment.playerId,
                shirtNumber: shirt ? shirt.number : 1 // Default to shirt #1 if not found
              };
            });

            migratedTeamCount++;
            return {
              ...team,
              shirtAssignments: migratedAssignments
            };
          }
        }

        return team;
      }) || [];

      return {
        ...event,
        teams: migratedTeams
      };
    });

    // Save migrated events back to localStorage
    localStorage.setItem('events', JSON.stringify(migratedEvents));
    console.log(`Shirt assignment migration completed: ${migratedTeamCount} team(s) migrated`);
  } catch (error) {
    console.error('Shirt assignment migration failed:', error);
  }
}
