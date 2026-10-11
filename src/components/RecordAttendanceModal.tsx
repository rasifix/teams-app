import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';
import Button from './ui/Button';
import type { ActivityAttendance } from '../types';
import { ATTENDANCE_REASONS, toAttendanceRecords, type AttendanceDialogRow } from '../store/selectors/attendanceSelectors';

interface RecordAttendanceModalProps {
  isOpen: boolean;
  initialRows: AttendanceDialogRow[];
  onClose: () => void;
  onSave: (attendance: ActivityAttendance[]) => Promise<void>;
}

export default function RecordAttendanceModal({ isOpen, initialRows, onClose, onSave }: RecordAttendanceModalProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<AttendanceDialogRow[]>(initialRows);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setRows(initialRows);
  // Reset only when the dialog opens, not on every store update.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const update = (playerId: string, changes: Partial<AttendanceDialogRow>) => {
    setRows((current) => current.map((row) => (row.playerId === playerId ? { ...row, ...changes } : row)));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSave(toAttendanceRecords(rows));
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <ModalHeader>
          <ModalTitle>{t('attendance.recordTitle')}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          {rows.length === 0 ? (
            <p className="text-sm text-gray-500">{t('attendance.noSelectedPlayers')}</p>
          ) : (
            <ul className="space-y-3">
              {rows.map((row) => {
                const isExcused = row.status === 'excused';
                return (
                  <li key={row.playerId} data-testid="attendance-row">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.name}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isExcused}
                        aria-label={`${row.name}: ${t('attendance.status.excused')}`}
                        onClick={() => update(row.playerId, { status: isExcused ? 'present' : 'excused', reason: '' })}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          isExcused ? 'border-amber-500 bg-amber-500 text-white' : 'border-green-600 bg-green-50 text-green-700'
                        }`}
                      >
                        {t(`attendance.status.${row.status}`)}
                      </button>
                    </div>
                    {isExcused && (
                      <select
                        value={row.reason}
                        onChange={(event) => update(row.playerId, { reason: event.target.value as AttendanceDialogRow['reason'] })}
                        aria-label={t('attendance.reasonPlaceholder')}
                        className="form-input mt-2 text-sm"
                      >
                        <option value="">{t('attendance.reasonPlaceholder')}</option>
                        {ATTENDANCE_REASONS.map((reason) => (
                          <option key={reason} value={reason}>{t(`attendance.reasons.${reason}`)}</option>
                        ))}
                      </select>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving || rows.length === 0} className="flex-1">
            {t('common.actions.save')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
