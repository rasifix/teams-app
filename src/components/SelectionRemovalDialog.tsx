import { useTranslation } from 'react-i18next';
import type { SelectionRemovalReason } from '../types';
import { Button, Field, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Select, Stack } from './ui';

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
    <ModalHeader><ModalTitle>{t('page.teamDetail.removePlayerTitle')}</ModalTitle></ModalHeader>
    <ModalBody>
      <Stack>
      <p>{t('page.teamDetail.removePlayerMessage', { name: playerName })}</p>
      {reasonRequired && <Field label={t('page.teamPlayerSelection.removalReason')} htmlFor="selection-removal-reason">
        <Select
          id="selection-removal-reason"
          value={reason}
          onChange={(event) => onReasonChange(event.target.value as SelectionRemovalReason | '')}
          required
        >
          <option value="">{t('page.teamPlayerSelection.selectRemovalReason')}</option>
          {reasons.map((item) => <option key={item} value={item}>{t(`domain.attendance.reasons.${item}`)}</option>)}
        </Select>
      </Field>}
      </Stack>
    </ModalBody>
    <ModalFooter>
      <Button type="button" variant="secondary" onClick={onCancel}>{t('common.actions.cancel')}</Button>
      <Button type="button" variant="danger" disabled={reasonRequired && !reason} onClick={onConfirm}>
        {t('page.teamDetail.removeAction')}
      </Button>
    </ModalFooter>
  </Modal>;
}
