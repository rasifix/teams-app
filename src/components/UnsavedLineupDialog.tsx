import { useTranslation } from 'react-i18next';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';
import Button from './ui/Button';

interface UnsavedLineupDialogProps {
  isOpen: boolean;
  isSaving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export default function UnsavedLineupDialog({
  isOpen,
  isSaving,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedLineupDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <ModalHeader>
        <ModalTitle>{t('teamLineup.unsavedChangesTitle')}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <p className="text-sm text-gray-600">{t('teamLineup.unsavedChangesMessage')}</p>
      </ModalBody>
      <ModalFooter className="flex-col sm:flex-row">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving} className="flex-1">
          {t('common.actions.cancel')}
        </Button>
        <Button type="button" variant="secondary" onClick={onDiscard} disabled={isSaving} className="flex-1">
          {t('teamLineup.discardChanges')}
        </Button>
        <Button type="button" variant="primary" onClick={onSave} disabled={isSaving} className="flex-1">
          {t('teamLineup.saveAndLeave')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
