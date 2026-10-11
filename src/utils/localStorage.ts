const SELECTED_GROUP_KEY = 'selectedGroupId';
const SELECTED_STATISTICS_PERIOD_KEY = 'selectedStatisticsPeriodId';

export function getSelectedSquadId(): string | null {
  return localStorage.getItem(SELECTED_GROUP_KEY);
}

export function setSelectedSquadId(squadId: string): void {
  localStorage.setItem(SELECTED_GROUP_KEY, squadId);
}

export function clearSelectedSquadId(): void {
  localStorage.removeItem(SELECTED_GROUP_KEY);
}

export function getSelectedStatisticsPeriodId(): string | null {
  return localStorage.getItem(SELECTED_STATISTICS_PERIOD_KEY);
}

export function setSelectedStatisticsPeriodId(periodId: string | null): void {
  if (periodId === null) {
    localStorage.removeItem(SELECTED_STATISTICS_PERIOD_KEY);
  } else {
    localStorage.setItem(SELECTED_STATISTICS_PERIOD_KEY, periodId);
  }
}

export function clearSelectedStatisticsPeriodId(): void {
  localStorage.removeItem(SELECTED_STATISTICS_PERIOD_KEY);
}
