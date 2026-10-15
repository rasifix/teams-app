import { useTranslation } from 'react-i18next';
import type { SelectionRemovalReason } from '../types';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';

interface SelectionRemovalDialogProps {
  isOpen: boolean;
  playerName: string;
  reason: SelectionRemovalReason | '';
  reasonRequired: boolean;
  onReasonChange: (reason: SelectionRemovalReason | '') => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const reasons: SelectionRemovalReason[] = ['sick', 'injured', 'noShow', 'other'];

export default function SelectionRemovalDialog({
  isOpen,
  playerName,
  reason,
  reasonRequired,
  onReasonChange,
  onConfirm,
  onCancel,
}: SelectionRemovalDialogProps) {
  const { t } = useTranslation();

  return <Modal isOpen={isOpen} onClose={onCancel}>
    <ModalHeader><ModalTitle>{t('teamDetail.removePlayerTitle')}</ModalTitle></ModalHeader>
    <ModalBody>
      <p className="text-sm text-gray-700">{t('teamDetail.removePlayerMessage', { name: playerName })}</p>
      {reasonRequired && <div className="mt-4">
        <label htmlFor="selection-removal-reason" className="form-label">{t('teamPlayerSelection.removalReason')}</label>
        <select
          id="selection-removal-reason"
          className="form-input"
          value={reason}
          onChange={(event) => onReasonChange(event.target.value as SelectionRemovalReason | '')}
          required
        >
          <option value="">{t('teamPlayerSelection.selectRemovalReason')}</option>
          {reasons.map((item) => <option key={item} value={item}>{t(`attendance.reasons.${item}`)}</option>)}
        </select>
      </div>}
    </ModalBody>
    <ModalFooter>
      <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">{t('common.actions.cancel')}</Button>
      <Button type="button" variant="danger" disabled={reasonRequired && !reason} onClick={onConfirm} className="flex-1">
        {t('teamDetail.removeAction')}
      </Button>
    </ModalFooter>
  </Modal>;
}
