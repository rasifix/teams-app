import type { Player, Shirt, ShirtSet, Team } from '../../types';

export function selectSortedShirts(shirts: readonly Shirt[] | null | undefined): Shirt[] {
  return [...(shirts ?? [])].sort((left, right) => left.number - right.number);
}

export function selectSortedShirtNumbers(numbers: readonly number[]): number[] {
  return [...numbers].sort((left, right) => left - right);
}

export function selectShirtNumbersForSet(
  shirtSets: ShirtSet[],
  shirtSetId: string | null,
  excludedNumber?: number,
): number[] {
  const numbers = shirtSets.find((shirtSet) => shirtSet.id === shirtSetId)?.shirts
    .map((shirt) => shirt.number)
    .filter((number) => number !== excludedNumber) ?? [];
  return selectSortedShirtNumbers(numbers);
}

export interface GeneratedShirtOptions {
  createShirts: boolean;
  startNumber: number;
  endNumber: number;
  size: Shirt['size'];
  includeGoalkeeper: boolean;
  goalkeeperNumber: number;
}

export function selectGeneratedShirts(options: GeneratedShirtOptions): Shirt[] {
  if (!options.createShirts || options.endNumber < options.startNumber) return [];
  const shirts: Shirt[] = [];
  for (let number = options.startNumber; number <= options.endNumber; number += 1) {
    if (options.includeGoalkeeper && number === options.goalkeeperNumber) continue;
    shirts.push({ number, size: options.size, isGoalkeeper: false, status: 'available' });
  }
  if (options.includeGoalkeeper) {
    shirts.push({ number: options.goalkeeperNumber, size: options.size, isGoalkeeper: true, status: 'available' });
  }
  return shirts;
}

export interface ShirtAssignmentSetup {
  shirtSet: ShirtSet | null;
  availableShirts: Shirt[];
  assignments: Array<{ playerId: string; shirtNumber: number }>;
  usedInOtherTeams: Set<number>;
}

export interface ShirtAssignmentRow {
  player: Player;
  shirtNumber: number;
}

export function selectShirtAssignmentRows(
  team: Team,
  players: Player[],
  assignments: Array<{ playerId: string; shirtNumber: number }>,
): ShirtAssignmentRow[] {
  const playersById = new Map(players.map((player) => [player.id, player]));
  const assignmentsByPlayerId = new Map(assignments.map((assignment) => [assignment.playerId, assignment.shirtNumber]));
  return (team.selectedPlayers ?? []).flatMap((playerId) => {
    const player = playersById.get(playerId);
    return player ? [{ player, shirtNumber: assignmentsByPlayerId.get(playerId) ?? 0 }] : [];
  });
}

export function selectShirtAssignmentSetup(
  team: Team,
  players: Player[],
  shirtSets: ShirtSet[],
  selectedShirtSetId: string,
  currentShirtSetId: string | undefined,
  currentAssignments: Array<{ playerId: string; shirtNumber: number }> | undefined,
  usedShirtNumbersBySetId: Record<string, number[]>,
): ShirtAssignmentSetup {
  const shirtSet = shirtSets.find((candidate) => candidate.id === selectedShirtSetId) ?? null;
  const usedInOtherTeams = new Set(usedShirtNumbersBySetId[selectedShirtSetId] ?? []);
  if (!shirtSet) return { shirtSet: null, availableShirts: [], assignments: [], usedInOtherTeams };

  const availableShirts = selectSortedShirts(shirtSet.shirts.filter((shirt) => shirt.status !== 'unavailable'));
  const availableNumbers = new Set(availableShirts.map((shirt) => shirt.number));
  const playersById = new Map(players.map((player) => [player.id, player]));
  const currentByPlayerId = new Map((currentAssignments ?? []).map((assignment) => [assignment.playerId, assignment.shirtNumber]));
  const preserveCurrent = selectedShirtSetId === currentShirtSetId;
  const isFirstAssignment = !currentShirtSetId;
  const assignedNumbers = new Set<number>();

  const assignments = (team.selectedPlayers ?? []).map((playerId) => {
    const candidates = [
      preserveCurrent ? currentByPlayerId.get(playerId) : undefined,
      playersById.get(playerId)?.preferredShirtNumber,
    ];
    const shirtNumber = candidates.find((number): number is number => Boolean(
      number
      && availableNumbers.has(number)
      && !assignedNumbers.has(number)
      && !usedInOtherTeams.has(number),
    )) ?? 0;
    if (shirtNumber > 0) assignedNumbers.add(shirtNumber);
    return { playerId, shirtNumber };
  });

  if (isFirstAssignment) {
    const remainingNumbers = availableShirts
      .map((shirt) => shirt.number)
      .filter((number) => !assignedNumbers.has(number) && !usedInOtherTeams.has(number));
    let nextNumberIndex = 0;

    assignments.forEach((assignment) => {
      if (assignment.shirtNumber > 0) return;

      const shirtNumber = remainingNumbers[nextNumberIndex];
      if (shirtNumber === undefined) return;

      assignment.shirtNumber = shirtNumber;
      assignedNumbers.add(shirtNumber);
      nextNumberIndex += 1;
    });
  }

  return { shirtSet, availableShirts, assignments, usedInOtherTeams };
}
