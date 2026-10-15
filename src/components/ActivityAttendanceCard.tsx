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

  return <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold tracking-tight text-slate-950">{t('attendance.title')}</h2>
      {hasActivityStarted(activity) && (
        <Button className="btn-sm" variant="primary" onClick={() => setIsOpen(true)} data-testid="record-attendance-button">
          {summary.isRecorded ? t('attendance.editAction') : t('attendance.recordAction')}
        </Button>
      )}
    </div>
    {!hasActivityStarted(activity) ? <p className="text-sm text-slate-500">{t('attendance.notStarted')}</p>
      : !summary.isRecorded ? <p className="text-sm text-slate-500">{t('attendance.notRecorded')}</p>
      : <>
        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">{t('attendance.status.present')}: {summary.present}</span>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-700">{t('attendance.status.excused')}: {summary.excused}</span>
        </div>
        {summary.excusedWithReason.length > 0 && <ul className="mt-3 space-y-1 text-sm text-slate-700">
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
