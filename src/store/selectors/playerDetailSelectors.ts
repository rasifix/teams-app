import type { Activity, Period, PlayerEventHistoryItem } from '../../types';
import { getActivityDate, getInvitationStatus, isTeamActivity } from './activitySelectors';

export interface GroupedPlayerEventHistory {
  id: string;
  title: string;
  eventHistory: PlayerEventHistoryItem[];
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

export const selectPlayerEventHistory = (activities: Activity[], playerId: string): PlayerEventHistoryItem[] =>
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

export const selectGroupedPlayerEventHistory = (
  groupPeriods: Period[],
  playerEventHistory: PlayerEventHistoryItem[],
  outsidePeriodsTitle: string
): GroupedPlayerEventHistory[] | null => {
  const validPeriods = groupPeriods.filter(isValidPeriod);
  if (validPeriods.length === 0 || !hasNonOverlappingPeriods(validPeriods)) return null;

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
    const matchingIndex = validPeriods.findIndex((period) => eventDate >= period.startDate && eventDate < period.endDate);
    if (matchingIndex >= 0) groupedByPeriod[matchingIndex].eventHistory.push(historyItem);
    else outsidePeriods.push(historyItem);
  });

  const nonEmptyGroups = groupedByPeriod.filter((group) => group.eventHistory.length > 0);
  if (outsidePeriods.length > 0) nonEmptyGroups.push({ id: 'outside-periods', title: outsidePeriodsTitle, eventHistory: outsidePeriods });
  return nonEmptyGroups.length > 0 ? nonEmptyGroups.reverse() : null;
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
