import { useTranslation } from 'react-i18next';
import { Alert, Button, Checkbox, Field, FieldLegend, Input, Radio, Select } from '../ui';
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
      <div className="flex justify-end">
        <Button disabled={busy || !email.trim() || !password} onClick={onNext}>
          {busy ? t('common.states.processing') : t('spondSync.wizard.next')}
        </Button>
      </div>
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
      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((group) => (
          <label
            key={group.id}
            className={`cursor-pointer rounded border p-4 ${groupId === group.id ? 'border-brand bg-brand-subtle' : 'border-edge'}`}
          >
            <Radio
              className="mr-3"
              name="spond-group"
              checked={groupId === group.id}
              onChange={() => onGroupChange(group.id)}
            />
            {group.name}
          </label>
        ))}
      </div>
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
        <div className="space-y-2">
          <div>
            <FieldLegend className="mb-0">{t('spondSync.wizard.subgroups.title')}</FieldLegend>
            <p className="body-muted">{t('spondSync.wizard.subgroups.help')}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {subGroups.map((subGroup) => (
              <label key={subGroup.id} className="flex cursor-pointer items-center gap-2 rounded border border-edge p-3 hover:bg-surface-subtle">
                <Radio
                  name="spond-subgroup"
                  checked={selectedSubGroupId === subGroup.id}
                  onChange={() => onSubGroupSelectionChange(subGroup.id)}
                />
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subGroup.color ?? 'var(--color-text-disabled)' }} aria-hidden="true" />
                <span>{subGroup.name}</span>
              </label>
            ))}
          </div>
        </div>
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
          <div className="grid gap-3 sm:grid-cols-2">
            {(['players', 'events'] as const).map((type) => (
              <label
                key={type}
                className={`cursor-pointer rounded border p-4 ${types.includes(type) ? 'border-brand bg-brand-subtle' : 'border-edge'}`}
              >
                <Checkbox
                  className="mr-3"
                  checked={types.includes(type)}
                  onChange={() => onToggleType(type)}
                />
                {t(`spondSync.wizard.importTypes.${type}`)}
              </label>
            ))}
          </div>
        </>
      )}
      {!isEventOnly && hasEvents && (
        <SpondPeriodSelector periods={periods} periodId={periodId} onChange={onPeriodChange} />
      )}
      {hasEvents && (
        <div className="grid gap-3 sm:grid-cols-2">
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
        </div>
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
