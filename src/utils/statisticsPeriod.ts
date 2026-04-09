import type { Event } from '../types';
import i18n from '../i18n/config';

export interface StatisticsPeriod {
  name?: string;
  startDate: string;
  endDate: string;
}

const toComparableDate = (dateString: string): string | null => {
  if (!dateString) return null;

  // Keep date-only values unchanged.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

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

export function filterEventsByStatisticsPeriod(events: Event[], period: StatisticsPeriod | null): Event[] {
  if (!period) return events;

  const start = toComparableDate(period.startDate);
  const end = toComparableDate(period.endDate);
  if (!start || !end) return events;

  return events.filter((event) => {
    const eventDate = toComparableDate(event.date);
    if (!eventDate) return false;
    return eventDate >= start && eventDate <= end;
  });
}

export function getStatisticsPeriodLabel(period: StatisticsPeriod | null): string {
  if (!period) return i18n.t('statistics.period.allEvents');
  if (period.name) return period.name;
  return i18n.t('statistics.period.rangeLabel', {
    startDate: period.startDate,
    endDate: period.endDate,
  });
}
