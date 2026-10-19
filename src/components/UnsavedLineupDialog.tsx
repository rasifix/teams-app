import { useTranslation } from 'react-i18next';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';

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
        <p className="body-muted">{t('teamLineup.unsavedChangesMessage')}</p>
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          {t('common.actions.cancel')}
        </Button>
        <Button type="button" variant="secondary" onClick={onDiscard} disabled={isSaving}>
          {t('teamLineup.discardChanges')}
        </Button>
        <Button type="button" variant="primary" onClick={onSave} disabled={isSaving}>
          {t('teamLineup.saveAndLeave')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
