import type { Team } from '../types';

export function getUsedShirtNumbersBySetId(
  teams: Team[],
  excludedTeamId?: string
): Record<string, number[]> {
  const usedBySet = new Map<string, Set<number>>();

  teams.forEach((team) => {
    if (team.id === excludedTeamId || !team.shirtSetId) {
      return;
    }

    const currentSet = usedBySet.get(team.shirtSetId) ?? new Set<number>();
    team.shirtAssignments?.forEach((assignment) => {
      if (assignment.shirtNumber > 0) {
        currentSet.add(assignment.shirtNumber);
      }
    });
    usedBySet.set(team.shirtSetId, currentSet);
  });

  const result: Record<string, number[]> = {};
  usedBySet.forEach((numbers, setId) => {
    result[setId] = Array.from(numbers);
  });

  return result;
}