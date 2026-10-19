import { useTranslation } from 'react-i18next';
import { Alert, Button, Checkbox, ChoiceCard, Cluster, ContentGrid, Field, FieldLegend, Input, Radio, Select, Stack } from '../ui';
import type { Period } from '../../types';
import type { SpondGroupSnapshot } from '../../types/spond';
import SpondWizardActions from './SpondWizardActions';
import type { SpondImportType } from './types';

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

interface SpondImportTypesStepProps {
  scope: 'all' | 'events' | 'players';
  groups: SpondGroupSnapshot[];
  groupId: string;
  selectedSubGroupId: string;
  subGroupSelectionLocked: boolean;
  onSubGroupSelectionChange: (subGroupId: string) => void;
  types: SpondImportType[];
  periods: Period[];
  periodId: string;
  from: string;
  to: string;
  dateRangeError: string | null;
  busy: boolean;
  onToggleType: (type: 'players' | 'events') => void;
  onPeriodChange: (periodId: string) => void;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function SpondImportTypesStep({
  scope,
  groups,
  groupId,
  selectedSubGroupId,
  subGroupSelectionLocked,
  onSubGroupSelectionChange,
  types,
  periods,
  periodId,
  from,
  to,
  dateRangeError,
  busy,
  onToggleType,
  onPeriodChange,
  onFromChange,
  onToChange,
  onBack,
  onNext,
}: SpondImportTypesStepProps) {
  const { t } = useTranslation();
  const isEventOnly = scope === 'events';
  const isPlayerOnly = scope === 'players';
  const hasEvents = types.includes('events');
  const subGroups = groups.find((group) => group.id === groupId)?.subGroups ?? [];

  return (
    <>
      {subGroups.length > 0 && !subGroupSelectionLocked && (
        <Stack gap="sm">
          <div>
            <FieldLegend>{t('spondSync.wizard.subgroups.title')}</FieldLegend>
            <p className="body-muted">{t('spondSync.wizard.subgroups.help')}</p>
          </div>
          <ContentGrid variant="equal">
            {subGroups.map((subGroup) => (
              <ChoiceCard key={subGroup.id} density="compact" selected={selectedSubGroupId === subGroup.id}>
                <Radio
                  name="spond-subgroup"
                  checked={selectedSubGroupId === subGroup.id}
                  onChange={() => onSubGroupSelectionChange(subGroup.id)}
                />
                <span className="spond-subgroup-color" style={{ backgroundColor: subGroup.color ?? 'var(--color-text-disabled)' }} aria-hidden="true" />
                <span>{subGroup.name}</span>
              </ChoiceCard>
            ))}
          </ContentGrid>
        </Stack>
      )}
      {isEventOnly ? (
        <>
          <p className="body-muted">{t('spondSync.wizard.periodHelp')}</p>
          <SpondPeriodSelector periods={periods} periodId={periodId} onChange={onPeriodChange} />
        </>
      ) : isPlayerOnly ? (
        <p className="body-muted">{t('spondSync.wizard.playerImportHelp')}</p>
      ) : (
        <>
          <p className="body-muted">{t('spondSync.wizard.typesHelp')}</p>
          <ContentGrid variant="equal">
            {(['players', 'events'] as const).map((type) => (
              <ChoiceCard
                key={type}
                selected={types.includes(type)}
              >
                <Checkbox
                  checked={types.includes(type)}
                  onChange={() => onToggleType(type)}
                />
                {t(`spondSync.wizard.importTypes.${type}`)}
              </ChoiceCard>
            ))}
          </ContentGrid>
        </>
      )}
      {!isEventOnly && hasEvents && (
        <SpondPeriodSelector periods={periods} periodId={periodId} onChange={onPeriodChange} />
      )}
      {hasEvents && (
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
      )}
      {hasEvents && dateRangeError && <Alert>{t(`spondSync.dateErrors.${dateRangeError}`)}</Alert>}
      <SpondWizardActions
        back={onBack}
        next={onNext}
        nextDisabled={busy || types.length === 0 || (!subGroupSelectionLocked && subGroups.length > 0 && !selectedSubGroupId) || (hasEvents && Boolean(dateRangeError))}
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
