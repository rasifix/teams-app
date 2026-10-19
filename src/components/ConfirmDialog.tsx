import { useTranslation } from 'react-i18next';
import { Button, Cluster, EntityContent, IconTile, Modal, ModalBody, ModalFooter, ModalTitle } from './ui';
import type { ButtonVariant } from './ui';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonColor?: 'red' | 'blue' | 'green';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  confirmButtonColor = 'red'
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const resolvedConfirmText = confirmText ?? t('common.actions.confirm');
  const resolvedCancelText = cancelText ?? t('common.actions.cancel');

  const confirmButtonVariants: Record<NonNullable<ConfirmDialogProps['confirmButtonColor']>, ButtonVariant> = {
    red: 'danger',
    blue: 'primary',
    green: 'success',
  };
  const iconTones = {
    red: 'danger',
    blue: 'info',
    green: 'success',
  } as const;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm">
      <ModalBody>
        <Cluster align="start" wrap={false}>
          <IconTile tone={iconTones[confirmButtonColor]}>
              {confirmButtonColor === 'red' ? (
                <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              ) : confirmButtonColor === 'blue' ? (
                <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
          </IconTile>
          <EntityContent>
            <ModalTitle>
              {title}
            </ModalTitle>
            <p className="supporting-text">
              {message}
            </p>
          </EntityContent>
        </Cluster>
      </ModalBody>

      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {resolvedCancelText}
        </Button>
        <Button type="button" variant={confirmButtonVariants[confirmButtonColor]} onClick={onConfirm}>
          {resolvedConfirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
