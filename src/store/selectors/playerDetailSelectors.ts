import type { Activity, Period, PlayerActivityHistoryItem } from '../../types';
import { getActivityDate, getInvitationStatus, isTeamActivity } from './activitySelectors';

export interface GroupedPlayerActivityHistory {
  id: string;
  title: string;
  eventHistory: PlayerActivityHistoryItem[];
}

export interface GroupedDatedHistory<T> {
  id: string;
  title: string;
  eventHistory: T[];
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

const isValidPeriod = (period: Period): boolean => period.startDate < period.endDate;

const hasNonOverlappingPeriods = (periods: Period[]): boolean => {
  if (periods.length < 2) return true;
  const sortedPeriods = [...periods].sort((left, right) =>
    left.startDate.localeCompare(right.startDate) || left.endDate.localeCompare(right.endDate));
  for (let index = 1; index < sortedPeriods.length; index += 1) {
    if (sortedPeriods[index].startDate < sortedPeriods[index - 1].endDate) return false;
  }
  return true;
};

export const selectPlayerActivityHistory = (activities: Activity[], playerId: string): PlayerActivityHistoryItem[] =>
  activities
    .filter((activity) => isTeamActivity(activity) && activity.invitations.some((invitation) => invitation.playerId === playerId))
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
    .map((activity) => {
      const invitation = activity.invitations.find((entry) => entry.playerId === playerId);
      const team = activity.teams.find((entry) => (entry.selectedPlayers || []).includes(playerId));
      return {
        eventId: activity.id,
        eventName: activity.name,
        eventDate: getActivityDate(activity),
        invitationStatus: invitation ? getInvitationStatus(invitation) : 'open',
        isSelected: Boolean(team),
        teamName: team?.name,
      };
    });

export const selectGroupedPlayerActivityHistory = (
  squadPeriods: Period[],
  playerEventHistory: PlayerActivityHistoryItem[],
  outsidePeriodsTitle: string
): GroupedPlayerActivityHistory[] | null => selectGroupedDatedHistory(squadPeriods, playerEventHistory, outsidePeriodsTitle);

export const selectGroupedDatedHistory = <T extends { eventDate: string }>(
  squadPeriods: Period[],
  eventHistory: T[],
  outsidePeriodsTitle: string,
): GroupedDatedHistory<T>[] | null => {
  const validPeriods = squadPeriods.filter(isValidPeriod);
  if (validPeriods.length === 0 || !hasNonOverlappingPeriods(validPeriods)) return null;

  const groupedByPeriod: GroupedDatedHistory<T>[] = validPeriods.map((period) => ({
    id: period.id,
    title: period.name,
    eventHistory: [],
  }));
  const outsidePeriods: T[] = [];

  eventHistory.forEach((historyItem) => {
    const eventDate = toComparableDate(historyItem.eventDate);
    if (!eventDate) {
      outsidePeriods.push(historyItem);
      return;
    }
    const matchingIndex = validPeriods.findIndex((period) => eventDate >= period.startDate && eventDate < period.endDate);
    if (matchingIndex >= 0) groupedByPeriod[matchingIndex].eventHistory.push(historyItem);
    else outsidePeriods.push(historyItem);
  });

  const nonEmptySquads = groupedByPeriod.filter((group) => group.eventHistory.length > 0);
  if (outsidePeriods.length > 0) nonEmptySquads.push({ id: 'outside-periods', title: outsidePeriodsTitle, eventHistory: outsidePeriods });
  return nonEmptySquads.length > 0 ? nonEmptySquads.reverse() : null;
};

export const selectFutureEventsWithoutInvitation = (activities: Activity[], playerId: string, now: Date = new Date()): Activity[] => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return activities
    .filter((activity) => {
      const activityDate = new Date(getActivityDate(activity));
      activityDate.setHours(0, 0, 0, 0);
      return activityDate >= today && !activity.invitations.some((invitation) => invitation.playerId === playerId);
    })
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
};
