import type { Event, Period, PlayerEventHistoryItem } from '../../types';

export interface GroupedPlayerEventHistory {
  id: string;
  title: string;
  eventHistory: PlayerEventHistoryItem[];
}

const toComparableDate = (dateString: string): string | null => {
  if (!dateString) return null;

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

const isValidPeriod = (period: Period): boolean => period.startDate < period.endDate;

const hasNonOverlappingPeriods = (periods: Period[]): boolean => {
  if (periods.length < 2) {
    return true;
  }

  const sortedPeriods = [...periods].sort((left, right) => {
    const startCompare = left.startDate.localeCompare(right.startDate);
    if (startCompare !== 0) {
      return startCompare;
    }

    return left.endDate.localeCompare(right.endDate);
  });

  for (let index = 1; index < sortedPeriods.length; index += 1) {
    const previous = sortedPeriods[index - 1];
    const current = sortedPeriods[index];

    if (current.startDate < previous.endDate) {
      return false;
    }
  }

  return true;
};

export const selectPlayerEventHistory = (
  events: Event[],
  playerId: string
): PlayerEventHistoryItem[] => {
  return events
    .filter((event) => event.invitations.some((inv) => inv.playerId === playerId))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((event) => {
      const invitation = event.invitations.find((inv) => inv.playerId === playerId);
      const invitationStatus = invitation?.status || 'open';
      const isSelected = event.teams.some((team) =>
        (team.selectedPlayers || []).includes(playerId)
      );
      const team = event.teams.find((entry) =>
        (entry.selectedPlayers || []).includes(playerId)
      );

      return {
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        invitationStatus,
        isSelected,
        teamName: team?.name,
      };
    });
};

export const selectGroupedPlayerEventHistory = (
  groupPeriods: Period[],
  playerEventHistory: PlayerEventHistoryItem[],
  outsidePeriodsTitle: string
): GroupedPlayerEventHistory[] | null => {
  const validPeriods = groupPeriods.filter(isValidPeriod);

  if (validPeriods.length === 0 || !hasNonOverlappingPeriods(validPeriods)) {
    return null;
  }

  const groupedByPeriod: GroupedPlayerEventHistory[] = validPeriods.map((period) => ({
    id: period.id,
    title: period.name,
    eventHistory: [],
  }));

  const outsidePeriods: PlayerEventHistoryItem[] = [];

  playerEventHistory.forEach((historyItem) => {
    const eventDate = toComparableDate(historyItem.eventDate);
    if (!eventDate) {
      outsidePeriods.push(historyItem);
      return;
    }

    const matchingIndex = validPeriods.findIndex((period) => (
      eventDate >= period.startDate && eventDate < period.endDate
    ));

    if (matchingIndex >= 0) {
      groupedByPeriod[matchingIndex].eventHistory.push(historyItem);
    } else {
      outsidePeriods.push(historyItem);
    }
  });

  const nonEmptyGroups = groupedByPeriod.filter((group) => group.eventHistory.length > 0);

  if (outsidePeriods.length > 0) {
    nonEmptyGroups.push({
      id: 'outside-periods',
      title: outsidePeriodsTitle,
      eventHistory: outsidePeriods,
    });
  }

  return nonEmptyGroups.length > 0 ? nonEmptyGroups.reverse() : null;
};

export const selectFutureEventsWithoutInvitation = (
  events: Event[],
  playerId: string,
  now: Date = new Date()
): Event[] => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return events
    .filter((event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      const isFuture = eventDate >= today;
      const isNotInvited = !event.invitations.some((inv) => inv.playerId === playerId);
      return isFuture && isNotInvited;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
