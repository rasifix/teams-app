import type { Activity, AttendanceStatus, Player } from '../../types';

export interface ActivityAttendanceRow {
  playerId: string;
  name: string;
  status?: AttendanceStatus;
}

export interface ActivityAttendanceView {
  /** Attendance can be recorded only once the activity has started (same rule as the backend). */
  isAvailable: boolean;
  rows: ActivityAttendanceRow[];
  counts: Record<AttendanceStatus | 'unrecorded', number>;
}

export const hasActivityStarted = (activity: Pick<Activity, 'startsAt'>, now: Date = new Date()): boolean => {
  const startsAt = Date.parse(activity.startsAt);
  return !Number.isNaN(startsAt) && startsAt < now.getTime();
};

/** Rows are everyone who accepted or was selected, plus anyone with a recorded status, sorted by name. */
export function selectActivityAttendance(activity: Activity, players: Player[], now: Date = new Date()): ActivityAttendanceView {
  const statusByPlayer = new Map((activity.attendance ?? []).map((record) => [record.personId, record.status]));
  const expectedIds = new Set<string>([
    ...(activity.invitations ?? []).filter((invitation) => invitation.response === 'accepted').map((invitation) => invitation.playerId),
    ...(activity.teams ?? []).flatMap((team) => team.selectedPlayers ?? []),
    ...statusByPlayer.keys(),
  ]);
  const rows = players
    .filter((player) => expectedIds.has(player.id))
    .map((player) => ({ playerId: player.id, name: `${player.firstName} ${player.lastName}`, status: statusByPlayer.get(player.id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const counts = { present: 0, absent: 0, excused: 0, unrecorded: 0 };
  rows.forEach((row) => { counts[row.status ?? 'unrecorded'] += 1; });
  return { isAvailable: hasActivityStarted(activity, now), rows, counts };
}
