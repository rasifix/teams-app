import { useTranslation } from 'react-i18next';
import { Alert, Button, ButtonAnchor, Input, Modal, ModalBody, ModalFooter, ModalHeader, ModalSubtitle, ModalTitle, Split, Stack } from './ui';

interface BirthdayCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionUrl: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  copied: boolean;
  onCreate: () => void;
  onCopy: () => void;
  onRevoke: () => void;
}

export default function BirthdayCalendarModal({ isOpen, onClose, subscriptionUrl, isLoading, isSaving, error, copied, onCreate, onCopy, onRevoke }: BirthdayCalendarModalProps) {
  const { t } = useTranslation();
  const webcalUrl = subscriptionUrl?.replace(/^https?:/, 'webcal:');
  const canSubscribeDirectly = subscriptionUrl?.startsWith('https://') ?? false;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>{t('page.members.birthdayCalendar.title')}</ModalTitle>
        <ModalSubtitle>{t('page.members.birthdayCalendar.description')}</ModalSubtitle>
      </ModalHeader>
      <ModalBody>
        {error && <Alert>{error}</Alert>}

        {isLoading ? (
          <p className="body-muted">{t('page.members.birthdayCalendar.loading')}</p>
        ) : subscriptionUrl ? (
          <Stack>
            <p>{t('page.members.birthdayCalendar.subscriptionHelp')}</p>
            <Split gap="sm" className="ui-responsive-action-row">
              <Input
                className="birthday-subscription-input"
                aria-label={t('page.members.birthdayCalendar.subscriptionUrl')}
                readOnly
                value={subscriptionUrl}
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button type="button" variant="secondary" onClick={onCopy}>
                {copied ? t('page.members.birthdayCalendar.copied') : t('page.members.birthdayCalendar.copy')}
              </Button>
            </Split>
            <p className="field-help">{t('page.members.birthdayCalendar.privacyNote')}</p>
            {!canSubscribeDirectly && (
              <Alert tone="warning">
                {t('page.members.birthdayCalendar.secureUrlRequired')}
              </Alert>
            )}
          </Stack>
        ) : (
          <p>{t('page.members.birthdayCalendar.notCreated')}</p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          {t('common.actions.close')}
        </Button>
        {subscriptionUrl ? (
          <>
            <Button type="button" variant="danger" disabled={isSaving} onClick={onRevoke}>
              {isSaving ? t('page.members.birthdayCalendar.revoking') : t('page.members.birthdayCalendar.revoke')}
            </Button>
            {canSubscribeDirectly && (
              <ButtonAnchor href={webcalUrl}>
                {t('page.members.birthdayCalendar.subscribe')}
              </ButtonAnchor>
            )}
          </>
        ) : (
          <Button type="button" disabled={isLoading || isSaving} onClick={onCreate}>
            {isSaving ? t('page.members.birthdayCalendar.creating') : t('page.members.birthdayCalendar.create')}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
