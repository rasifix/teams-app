const STORAGE_KEYS = {
  PLAYERS: 'players',
  EVENTS: 'events',
  TEAMS: 'teams',
  INVITATIONS: 'invitations',
  SHIRT_SETS: 'shirtSets',
  TRAINERS: 'trainers',
} as const;

// Export all data from localStorage
export function exportAllData(): Record<string, any> {
  const data: Record<string, any> = {};
  
  // Export all storage keys
  Object.values(STORAGE_KEYS).forEach(key => {
    const item = localStorage.getItem(key);
    if (item) {
      try {
        data[key] = JSON.parse(item);
      } catch (error) {
        console.error(`Error parsing ${key}:`, error);
        data[key] = item; // Store as string if parsing fails
      }
    }
  });
  
  return data;
}

// Download data as JSON file
export function downloadDataAsJSON(): void {
  const data = exportAllData();
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  link.download = `my-teams-data-${timestamp}.json`;
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
