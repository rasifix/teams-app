import { useTranslation } from 'react-i18next';
import type { Activity, ActivityKind } from '../../types';
import {
  type SpondActivityDraft,
  type SpondActivityRequiredField,
  type SpondEventFilter,
  type SpondEventRow,
} from '../../store/selectors/spondSyncSelectors';
import { formatInstantDateTime } from '../../utils/dateFormatter';
import { Button, Checkbox, Cluster, ContentGrid, EmptyState, EntityContent, EntityMeta, EntityTitle, Field, Input, Panel, Select, Split, Stack } from '../ui';
import SpondWizardActions from './SpondWizardActions';

interface SpondActivitiesReviewStepProps {
  rows: SpondEventRow[];
  drafts: Record<string, SpondActivityDraft>;
  activities: Activity[];
  eventFilter: SpondEventFilter;
  issues: Record<string, SpondActivityRequiredField[]>;
  onFilterChange: (filter: SpondEventFilter) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onDraftChange: (id: string, update: Partial<SpondActivityDraft>) => void;
  onBack: () => void;
  onNext: () => void;
  showActions?: boolean;
}

export default function SpondActivitiesReviewStep({
  rows,
  drafts,
  activities,
  eventFilter,
  issues,
  onFilterChange,
  onSelectAll,
  onSelectNone,
  onDraftChange,
  onBack,
  onNext,
  showActions = true,
}: SpondActivitiesReviewStepProps) {
  const { t, i18n } = useTranslation();

  return (
    <>
      <p className="body-muted">{t('spondSync.wizard.eventsHelp')}</p>
      <Split align="end">
        <Field label={t('spondSync.eventFilter.label')} htmlFor="spond-event-filter">
          <Select
            id="spond-event-filter"
            value={eventFilter}
            onChange={(event) => onFilterChange(event.target.value as SpondEventFilter)}
          >
            <option value="all">{t('spondSync.eventFilter.all')}</option>
            <option value="match">{t('spondSync.eventFilter.match')}</option>
            <option value="tournament">{t('spondSync.eventFilter.tournament')}</option>
          </Select>
        </Field>
        {rows.length > 0 && (
          <Cluster gap="sm">
            <Button variant="secondary" size="sm" onClick={onSelectAll}>{t('common.actions.selectAll')}</Button>
            <Button variant="secondary" size="sm" onClick={onSelectNone}>{t('common.actions.selectNone')}</Button>
          </Cluster>
        )}
      </Split>
      {rows.length === 0 ? (
        <EmptyState>
          {t('spondSync.wizard.noChanges')}
        </EmptyState>
      ) : (
        <Stack gap="sm">
          {rows.map((row) => {
            const draft = drafts[row.source.id];
            const selected = Boolean(draft && draft.action !== 'skip');
            const match = row.linkedActivity ?? (
              row.suggestedActivities.length === 1 ? row.suggestedActivities[0] : undefined
            );
            const rowIssues = issues[row.source.id] ?? [];

            return (
              <Panel key={row.source.id} padding="compact">
                <label className="spond-review-option">
                  <Checkbox
                    checked={selected}
                    onChange={(event) => onDraftChange(row.source.id, {
                      action: event.target.checked ? (match ? 'link' : 'create') : 'skip',
                      activityId: event.target.checked ? match?.id ?? '' : '',
                    })}
                  />
                  <EntityContent>
                    <EntityTitle>{row.source.name}</EntityTitle>
                    <EntityMeta><span>
                      {formatInstantDateTime(row.source.startsAt, i18n.language)}
                    </span></EntityMeta>
                  </EntityContent>
                </label>
                {selected && draft && !row.linkedActivity && (
                  <ContentGrid variant="equal">
                    <Select
                      value={draft.action}
                      onChange={(event) => onDraftChange(row.source.id, {
                        action: event.target.value as SpondActivityDraft['action'],
                      })}
                    >
                      <option value="link">{t('spondSync.linkExisting')}</option>
                      <option value="create">{t('spondSync.createActivity')}</option>
                    </Select>
                    {draft.action === 'link' ? (
                      <Select
                        value={draft.activityId}
                        onChange={(event) => onDraftChange(row.source.id, { activityId: event.target.value })}
                      >
                        {activities.map((activity) => (
                          <option key={activity.id} value={activity.id}>
                            {activity.name} · {activity.startsAt.slice(0, 10)}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <>
                        <Field label={t('domain.activity.fields.kind')} htmlFor={`spond-activity-kind-${row.source.id}`}>
                          <Select
                            id={`spond-activity-kind-${row.source.id}`}
                            value={draft.kind}
                            onChange={(event) => onDraftChange(row.source.id, {
                              kind: event.target.value as ActivityKind,
                            })}
                          >
                            {(['match', 'tournament'] as ActivityKind[]).map((kind) => (
                              <option key={kind} value={kind}>{t(`domain.activity.kinds.${kind}`)}</option>
                            ))}
                          </Select>
                        </Field>
                        {(['match', 'tournament'] as ActivityKind[]).includes(draft.kind) && (
                          <Input
                            value={draft.teamName}
                            placeholder={t('spondSync.teamName')}
                            onChange={(event) => onDraftChange(row.source.id, { teamName: event.target.value })}
                          />
                        )}
                      </>
                    )}
                  </ContentGrid>
                )}
                {rowIssues.map((field) => (
                  <p key={field} className="ui-field__error">
                    {t(`spondSync.requiredFields.${field}`)}
                  </p>
                ))}
              </Panel>
            );
          })}
        </Stack>
      )}
      {showActions && <SpondWizardActions
          back={onBack}
          next={onNext}
          nextDisabled={Object.keys(issues).length > 0}
        />}
    </>
  );
}
