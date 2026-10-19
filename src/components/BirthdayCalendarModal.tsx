import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createBirthdayCalendarSubscription,
  getBirthdayCalendarSubscription,
  revokeBirthdayCalendarSubscription,
} from '../services/squadService';
import { Alert, Button, ButtonAnchor, Input, Modal, ModalBody, ModalFooter, ModalHeader, ModalSubtitle, ModalTitle, Stack } from './ui';

interface BirthdayCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  squadId: string;
}

export default function BirthdayCalendarModal({ isOpen, onClose, squadId }: BirthdayCalendarModalProps) {
  const { t } = useTranslation();
  const [subscriptionUrl, setSubscriptionUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setCopied(false);
    getBirthdayCalendarSubscription(squadId)
      .then((result) => {
        if (!cancelled) setSubscriptionUrl(result.subscriptionUrl);
      })
      .catch(() => {
        if (!cancelled) setError(t('members.birthdayCalendar.errors.loadFailed'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, squadId, t]);

  const handleCreate = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await createBirthdayCalendarSubscription(squadId);
      setSubscriptionUrl(result.subscriptionUrl);
    } catch {
      setError(t('members.birthdayCalendar.errors.createFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!subscriptionUrl) return;
    try {
      await navigator.clipboard.writeText(subscriptionUrl);
      setCopied(true);
    } catch {
      setError(t('members.birthdayCalendar.errors.copyFailed'));
    }
  };

  const handleRevoke = async () => {
    if (!window.confirm(t('members.birthdayCalendar.revokeConfirm'))) return;

    setIsSaving(true);
    setError(null);
    try {
      await revokeBirthdayCalendarSubscription(squadId);
      setSubscriptionUrl(null);
      setCopied(false);
    } catch {
      setError(t('members.birthdayCalendar.errors.revokeFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const webcalUrl = subscriptionUrl?.replace(/^https?:/, 'webcal:');
  const canSubscribeDirectly = subscriptionUrl?.startsWith('https://') ?? false;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>{t('members.birthdayCalendar.title')}</ModalTitle>
        <ModalSubtitle>{t('members.birthdayCalendar.description')}</ModalSubtitle>
      </ModalHeader>
      <ModalBody>
        {error && <Alert className="birthday-calendar-error">{error}</Alert>}

        {isLoading ? (
          <p className="body-muted">{t('members.birthdayCalendar.loading')}</p>
        ) : subscriptionUrl ? (
          <Stack>
            <p>{t('members.birthdayCalendar.subscriptionHelp')}</p>
            <div className="birthday-subscription-actions">
              <Input
                className="birthday-subscription-input"
                aria-label={t('members.birthdayCalendar.subscriptionUrl')}
                readOnly
                value={subscriptionUrl}
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button type="button" variant="secondary" onClick={handleCopy}>
                {copied ? t('members.birthdayCalendar.copied') : t('members.birthdayCalendar.copy')}
              </Button>
            </div>
            <p className="field-help">{t('members.birthdayCalendar.privacyNote')}</p>
            {!canSubscribeDirectly && (
              <Alert tone="warning">
                {t('members.birthdayCalendar.secureUrlRequired')}
              </Alert>
            )}
          </Stack>
        ) : (
          <p>{t('members.birthdayCalendar.notCreated')}</p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          {t('common.actions.close')}
        </Button>
        {subscriptionUrl ? (
          <>
            <Button type="button" variant="danger" disabled={isSaving} onClick={handleRevoke}>
              {isSaving ? t('members.birthdayCalendar.revoking') : t('members.birthdayCalendar.revoke')}
            </Button>
            {canSubscribeDirectly && (
              <ButtonAnchor href={webcalUrl}>
                {t('members.birthdayCalendar.subscribe')}
              </ButtonAnchor>
            )}
          </>
        ) : (
          <Button type="button" disabled={isLoading || isSaving} onClick={handleCreate}>
            {isSaving ? t('members.birthdayCalendar.creating') : t('members.birthdayCalendar.create')}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
