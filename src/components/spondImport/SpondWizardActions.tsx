import { useTranslation } from 'react-i18next';
import { Button } from '../ui';

interface SpondWizardActionsProps {
  back: () => void;
  next: () => void;
  nextDisabled?: boolean;
  busy?: boolean;
  nextLabel?: string;
}

export default function SpondWizardActions({
  back,
  next,
  nextDisabled = false,
  busy = false,
  nextLabel,
}: SpondWizardActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex justify-between border-t pt-5">
      <Button variant="secondary" onClick={back}>{t('common.actions.back')}</Button>
      <Button disabled={nextDisabled || busy} onClick={next}>
        {busy ? t('common.states.processing') : nextLabel ?? t('spondSync.wizard.next')}
      </Button>
    </div>
  );
}
