import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, EntityContent, EntityList, EntityRow, EntityTitle, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Select, Split, Stack } from './ui';
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
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{t('attendance.recordTitle')}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          {rows.length === 0 ? (
            <p className="body-muted">{t('attendance.noSelectedPlayers')}</p>
          ) : (
            <EntityList variant="separated">
              {rows.map((row) => {
                const isExcused = row.status === 'excused';
                return (
                  <EntityRow key={row.playerId} align="start" data-testid="attendance-row">
                    <EntityContent>
                    <Stack gap="sm">
                    <Split gap="sm">
                      <EntityTitle>{row.name}</EntityTitle>
                      <Button
                        type="button"
                        variant={isExcused ? 'secondary' : 'success'}
                        size="sm"
                        role="switch"
                        aria-checked={isExcused}
                        aria-label={`${row.name}: ${t('attendance.status.excused')}`}
                        onClick={() => update(row.playerId, { status: isExcused ? 'present' : 'excused', reason: '' })}
                      >
                        {t(`attendance.status.${row.status}`)}
                      </Button>
                    </Split>
                    {isExcused && (
                      <Select
                        value={row.reason}
                        onChange={(event) => update(row.playerId, { reason: event.target.value as AttendanceDialogRow['reason'] })}
                        aria-label={t('attendance.reasonPlaceholder')}
                      >
                        <option value="">{t('attendance.reasonPlaceholder')}</option>
                        {ATTENDANCE_REASONS.map((reason) => (
                          <option key={reason} value={reason}>{t(`attendance.reasons.${reason}`)}</option>
                        ))}
                      </Select>
                    )}
                    </Stack>
                    </EntityContent>
                  </EntityRow>
                );
              })}
            </EntityList>
          )}
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving || rows.length === 0}>
            {t('common.actions.save')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
