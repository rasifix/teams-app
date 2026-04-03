const SELECTED_GROUP_KEY = 'selectedGroupId';
const SELECTED_STATISTICS_PERIOD_KEY = 'selectedStatisticsPeriodId';

export function getSelectedGroupId(): string | null {
  return localStorage.getItem(SELECTED_GROUP_KEY);
}

export function setSelectedGroupId(groupId: string): void {
  localStorage.setItem(SELECTED_GROUP_KEY, groupId);
}

export function clearSelectedGroupId(): void {
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
