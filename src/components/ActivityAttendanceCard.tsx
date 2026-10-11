import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Activity, ActivityAttendance, Player } from '../types';
import { hasActivityStarted, selectAttendanceDialogRows, selectAttendanceSummary } from '../store/selectors/attendanceSelectors';
import RecordAttendanceModal from './RecordAttendanceModal';
import Button from './ui/Button';

interface ActivityAttendanceCardProps {
  activity: Activity;
  players: Player[];
  onSave: (attendance: ActivityAttendance[]) => Promise<void>;
}

export default function ActivityAttendanceCard({ activity, players, onSave }: ActivityAttendanceCardProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const summary = selectAttendanceSummary(activity, players);

  return <section className="rounded-lg border border-gray-200 bg-white p-4 lg:p-6">
    <div className="mb-2 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-gray-900">{t('attendance.title')}</h2>
      {hasActivityStarted(activity) && (
        <Button className="btn-sm" variant="primary" onClick={() => setIsOpen(true)} data-testid="record-attendance-button">
          {summary.isRecorded ? t('attendance.editAction') : t('attendance.recordAction')}
        </Button>
      )}
    </div>
    {!hasActivityStarted(activity) ? <p className="text-sm text-gray-500">{t('attendance.notStarted')}</p>
      : !summary.isRecorded ? <p className="text-sm text-gray-500">{t('attendance.notRecorded')}</p>
      : <>
        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          <span>{t('attendance.status.present')}: {summary.present}</span>
          <span>{t('attendance.status.excused')}: {summary.excused}</span>
        </div>
        {summary.excusedWithReason.length > 0 && <ul className="mt-2 space-y-1 text-sm text-gray-700">
          {summary.excusedWithReason.map((entry) => <li key={entry.playerId}>
            {entry.name}{entry.reason ? ` – ${t(`attendance.reasons.${entry.reason}`)}` : ''}
          </li>)}
        </ul>}
      </>}
    <RecordAttendanceModal
      isOpen={isOpen}
      initialRows={selectAttendanceDialogRows(activity, players)}
      onClose={() => setIsOpen(false)}
      onSave={onSave}
    />
  </section>;
}
