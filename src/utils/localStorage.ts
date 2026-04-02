const SELECTED_GROUP_KEY = 'selectedGroupId';
const STATISTICS_PERIOD_KEY = 'statisticsPeriod';

interface StoredStatisticsPeriod {
  startDate: string;
  endDate: string;
}

export function getSelectedGroupId(): string | null {
  return localStorage.getItem(SELECTED_GROUP_KEY);
}

export function setSelectedGroupId(groupId: string): void {
  localStorage.setItem(SELECTED_GROUP_KEY, groupId);
}

export function clearSelectedGroupId(): void {
  localStorage.removeItem(SELECTED_GROUP_KEY);
}

export function getStatisticsPeriod(): StoredStatisticsPeriod | null {
  const raw = localStorage.getItem(STATISTICS_PERIOD_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredStatisticsPeriod>;
    if (!parsed.startDate || !parsed.endDate) return null;
    return { startDate: parsed.startDate, endDate: parsed.endDate };
  } catch {
    return null;
  }
}

export function setStatisticsPeriod(period: StoredStatisticsPeriod): void {
  localStorage.setItem(STATISTICS_PERIOD_KEY, JSON.stringify(period));
}

export function clearStatisticsPeriod(): void {
  localStorage.removeItem(STATISTICS_PERIOD_KEY);
}
