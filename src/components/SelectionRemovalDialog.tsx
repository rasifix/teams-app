import { useTranslation } from 'react-i18next';
import type { SelectionRemovalReason } from '../types';
import { Button, Field, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Select } from './ui';

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
      <p className="text-sm text-content">{t('teamDetail.removePlayerMessage', { name: playerName })}</p>
      {reasonRequired && <Field className="mt-4" label={t('teamPlayerSelection.removalReason')} htmlFor="selection-removal-reason">
        <Select
          id="selection-removal-reason"
          value={reason}
          onChange={(event) => onReasonChange(event.target.value as SelectionRemovalReason | '')}
          required
        >
          <option value="">{t('teamPlayerSelection.selectRemovalReason')}</option>
          {reasons.map((item) => <option key={item} value={item}>{t(`attendance.reasons.${item}`)}</option>)}
        </Select>
      </Field>}
    </ModalBody>
    <ModalFooter>
      <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">{t('common.actions.cancel')}</Button>
      <Button type="button" variant="danger" disabled={reasonRequired && !reason} onClick={onConfirm} className="flex-1">
        {t('teamDetail.removeAction')}
      </Button>
    </ModalFooter>
  </Modal>;
}
