import { useTranslation } from 'react-i18next';
import { Alert, Button, ChoiceCard, Cluster, ContentGrid, Field, Input, Radio, Select } from '../ui';
import type { Period } from '../../types';
import SpondWizardActions from './SpondWizardActions';

interface SpondCredentialsStepProps {
  email: string;
  password: string;
  busy: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onNext: () => void;
}

export function SpondCredentialsStep({
  email,
  password,
  busy,
  onEmailChange,
  onPasswordChange,
  onNext,
}: SpondCredentialsStepProps) {
  const { t } = useTranslation();

  return (
    <>
      <p className="body-muted">{t('spondSync.description')}</p>
      <Field label={t('spondSync.email')} htmlFor="spond-email">
        <Input
          id="spond-email"
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          autoComplete="username"
        />
      </Field>
      <Field label={t('spondSync.password')} htmlFor="spond-password">
        <Input
          id="spond-password"
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          autoComplete="current-password"
        />
      </Field>
      <Cluster align="end" className="spond-next-action">
        <Button disabled={busy || !email.trim() || !password} onClick={onNext}>
          {busy ? t('common.states.processing') : t('spondSync.wizard.next')}
        </Button>
      </Cluster>
    </>
  );
}

interface SpondGroupStepProps {
  groups: Array<{ id: string; name: string }>;
  groupId: string;
  onGroupChange: (groupId: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function SpondGroupStep({
  groups,
  groupId,
  onGroupChange,
  onBack,
  onNext,
}: SpondGroupStepProps) {
  return (
    <>
      <ContentGrid variant="equal">
        {groups.map((group) => (
          <ChoiceCard
            key={group.id}
            selected={groupId === group.id}
          >
            <Radio
              name="spond-group"
              checked={groupId === group.id}
              onChange={() => onGroupChange(group.id)}
            />
            {group.name}
          </ChoiceCard>
        ))}
      </ContentGrid>
      <SpondWizardActions back={onBack} next={onNext} nextDisabled={!groupId} />
    </>
  );
}

interface SpondSyncRangeStepProps {
  periods: Period[];
  periodId: string;
  from: string;
  to: string;
  dateRangeError: string | null;
  busy: boolean;
  onPeriodChange: (periodId: string) => void;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function SpondSyncRangeStep({
  periods,
  periodId,
  from,
  to,
  dateRangeError,
  busy,
  onPeriodChange,
  onFromChange,
  onToChange,
  onBack,
  onNext,
}: SpondSyncRangeStepProps) {
  const { t } = useTranslation();

  return (
    <>
      <>
        <p className="body-muted">{t('spondSync.wizard.fullSyncHelp')}</p>
        <SpondPeriodSelector periods={periods} periodId={periodId} onChange={onPeriodChange} />
      </>
      <ContentGrid variant="equal">
        <Field label={t('filters.from')} htmlFor="spond-from">
          <Input
            id="spond-from"
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
          />
        </Field>
        <Field label={t('filters.to')} htmlFor="spond-to">
          <Input
            id="spond-to"
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
          />
        </Field>
      </ContentGrid>
      {dateRangeError && <Alert>{t(`spondSync.dateErrors.${dateRangeError}`)}</Alert>}
      <SpondWizardActions
        back={onBack}
        next={onNext}
        nextDisabled={busy || Boolean(dateRangeError)}
        busy={busy}
      />
    </>
  );
}

interface SpondPeriodSelectorProps {
  periods: Period[];
  periodId: string;
  onChange: (periodId: string) => void;
}

function SpondPeriodSelector({ periods, periodId, onChange }: SpondPeriodSelectorProps) {
  const { t } = useTranslation();
  if (periods.length === 0) return null;

  return (
    <Field label={t('spondSync.period')} htmlFor="spond-period">
      <Select
        id="spond-period"
        value={periodId}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{t('spondSync.customRange')}</option>
        {periods.map((period) => (
          <option key={period.id} value={period.id}>
            {period.name} · {period.startDate} – {period.endDate}
          </option>
        ))}
      </Select>
    </Field>
  );
}
