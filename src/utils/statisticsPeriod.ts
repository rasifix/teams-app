import type { Activity } from '../types';
import { getActivityDate } from '../store/selectors/activitySelectors';
import i18n from '../i18n/config';

export interface StatisticsPeriod {
  name?: string;
  startDate: string;
  endDate: string;
}

const toComparableDate = (dateString: string): string | null => {
  if (!dateString) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function isValidStatisticsPeriod(period: Partial<StatisticsPeriod> | null): period is StatisticsPeriod {
  if (!period?.startDate || !period?.endDate) return false;
  return period.startDate <= period.endDate;
}

export function filterEventsByStatisticsPeriod(activities: Activity[], period: StatisticsPeriod | null): Activity[] {
  if (!period) return activities;

  const start = toComparableDate(period.startDate);
  const end = toComparableDate(period.endDate);
  if (!start || !end) return activities;

  return activities.filter((activity) => {
    const activityDate = toComparableDate(getActivityDate(activity));
    if (!activityDate) return false;
    return activityDate >= start && activityDate <= end;
  });
}

export function getStatisticsPeriodLabel(period: StatisticsPeriod | null): string {
  if (!period) return i18n.t('page.statistics.period.allEvents');
  if (period.name) return period.name;
  return i18n.t('page.statistics.period.rangeLabel', {
    startDate: period.startDate,
    endDate: period.endDate,
  });
}
