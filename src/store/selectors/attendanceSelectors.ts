import type { Activity, ActivityAttendance, AttendanceReason, AttendanceStatus, Player } from '../../types';
import { selectSelectedPlayerIds } from './activitySelectors';

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

/** Rows are selected Players only, plus recorded selected Players, sorted by name. */
export function selectActivityAttendance(activity: Activity, players: Player[], now: Date = new Date()): ActivityAttendanceView {
  const statusByPlayer = new Map((activity.attendance ?? []).map((record) => [record.personId, record.status]));
  const expectedIds = selectSelectedPlayerIds(activity);
  const rows = players
    .filter((player) => expectedIds.has(player.id))
    .map((player) => ({ playerId: player.id, name: `${player.firstName} ${player.lastName}`, status: statusByPlayer.get(player.id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const counts = { present: 0, absent: 0, excused: 0, unrecorded: 0 };
  rows.forEach((row) => { counts[row.status ?? 'unrecorded'] += 1; });
  return { isAvailable: hasActivityStarted(activity, now), rows, counts };
}

export const ATTENDANCE_REASONS: AttendanceReason[] = ['sick', 'injured', 'noShow', 'other'];

export type RecordableAttendanceStatus = AttendanceStatus;

export interface AttendanceDialogRow {
  playerId: string;
  name: string;
  status: RecordableAttendanceStatus;
  reason: AttendanceReason | '';
}

/** Only selected players are listed; they default to present unless another status was recorded. */
export function selectAttendanceDialogRows(activity: Activity, players: Player[]): AttendanceDialogRow[] {
  const selectedIds = selectSelectedPlayerIds(activity);
  const recorded = new Map((activity.attendance ?? []).map((record) => [record.personId, record]));
  return players
    .filter((player) => selectedIds.has(player.id))
    .map((player) => {
      const record = recorded.get(player.id);
      const status = record?.status ?? 'present';
      return {
        playerId: player.id,
        name: `${player.firstName} ${player.lastName}`,
        status,
        reason: (status === 'excused' ? record?.reason ?? '' : '') as AttendanceDialogRow['reason'],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function toAttendanceRecords(rows: AttendanceDialogRow[]): ActivityAttendance[] {
  return rows.map((row) => (
    row.status === 'excused' && row.reason
      ? { personId: row.playerId, status: row.status, reason: row.reason }
      : { personId: row.playerId, status: row.status }
  ));
}

export function selectChangedAttendanceRecords(
  current: ActivityAttendance[] = [],
  next: ActivityAttendance[],
): Array<{ personId: string; status: AttendanceStatus | null; reason?: AttendanceReason }> {
  const previousById = new Map(current.map((record) => [record.personId, record]));
  return next.filter((record) => {
    const previous = previousById.get(record.personId);
    return !previous || previous.status !== record.status || previous.reason !== record.reason;
  }).map((record) => ({ personId: record.personId, status: record.status, ...(record.reason ? { reason: record.reason } : {}) }));
}

export interface AttendanceSummary {
  isRecorded: boolean;
  present: number;
  absent: number;
  excused: number;
  recordedRows: Array<{ playerId: string; name: string; status: AttendanceStatus; reason?: AttendanceReason }>;
}

/** Summary of recorded attendance restricted to selected players. */
export function selectAttendanceSummary(activity: Activity, players: Player[]): AttendanceSummary {
  const selectedIds = selectSelectedPlayerIds(activity);
  const records = (activity.attendance ?? []).filter((record) => selectedIds.has(record.personId));
  const namesById = new Map(players.map((player) => [player.id, `${player.firstName} ${player.lastName}`]));
  const excused = records.filter((record) => record.status === 'excused');
  return {
    isRecorded: records.length > 0,
    present: records.filter((record) => record.status === 'present').length,
    absent: records.filter((record) => record.status === 'absent').length,
    excused: excused.length,
    recordedRows: records
      .map((record) => ({ playerId: record.personId, name: namesById.get(record.personId) ?? record.personId, status: record.status, reason: record.reason }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}
