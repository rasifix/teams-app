import { useTranslation } from 'react-i18next';
import type { Activity, AttendanceStatus, Player } from '../types';
import { selectActivityAttendance } from '../store/selectors/attendanceSelectors';

interface ActivityAttendanceCardProps {
  activity: Activity;
  players: Player[];
  onChange: (playerId: string, status: AttendanceStatus) => void;
}

const STATUSES: AttendanceStatus[] = ['present', 'absent', 'excused'];

export default function ActivityAttendanceCard({ activity, players, onChange }: ActivityAttendanceCardProps) {
  const { t } = useTranslation();
  const view = selectActivityAttendance(activity, players);

  return <section className="rounded-lg border border-gray-200 bg-white p-4 lg:p-6">
    <h2 className="mb-2 text-lg font-semibold text-gray-900">{t('attendance.title')}</h2>
    {!view.isAvailable ? <p className="text-sm text-gray-500">{t('attendance.notStarted')}</p>
      : view.rows.length === 0 ? <p className="text-sm text-gray-500">{t('attendance.empty')}</p>
      : <>
        <div className="mb-3 flex flex-wrap gap-3 text-sm text-gray-600">
          {STATUSES.map((status) => <span key={status}>{t(`attendance.status.${status}`)}: {view.counts[status]}</span>)}
          <span>{t('attendance.unrecorded')}: {view.counts.unrecorded}</span>
        </div>
        <ul className="space-y-2">
          {view.rows.map((row) => <li key={row.playerId} className="flex items-center justify-between gap-2 text-sm">
            <span>{row.name}</span>
            <div className="flex gap-1" role="group" aria-label={row.name}>
              {STATUSES.map((status) => <button
                key={status}
                type="button"
                aria-pressed={row.status === status}
                onClick={() => onChange(row.playerId, status)}
                className={`rounded border px-2 py-1 text-xs ${row.status === status ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 text-gray-700'}`}
              >{t(`attendance.status.${status}`)}</button>)}
            </div>
          </li>)}
        </ul>
      </>}
  </section>;
}
