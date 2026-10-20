import { useTranslation } from 'react-i18next';
import type { Activity, ActivityKind, Trainer } from '../../types';
import {
  type SpondActivityDraft,
  type SpondActivityRequiredField,
  type SpondEventFilter,
  type SpondEventRow,
} from '../../store/selectors/spondSyncSelectors';
import { formatInstantDateTime } from '../../utils/dateFormatter';
import { Button, Checkbox, Cluster, ContentGrid, EmptyState, EntityContent, EntityMeta, EntityTitle, Field, Input, Panel, Select, Split, Stack } from '../ui';
import SpondWizardActions from './SpondWizardActions';

interface SpondEventsReviewStepProps {
  rows: SpondEventRow[];
  drafts: Record<string, SpondActivityDraft>;
  activities: Activity[];
  trainers: Trainer[];
  eventFilter: SpondEventFilter;
  issues: Record<string, SpondActivityRequiredField[]>;
  onFilterChange: (filter: SpondEventFilter) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onDraftChange: (id: string, update: Partial<SpondActivityDraft>) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function SpondEventsReviewStep({
  rows,
  drafts,
  activities,
  trainers,
  eventFilter,
  issues,
  onFilterChange,
  onSelectAll,
  onSelectNone,
  onDraftChange,
  onBack,
  onNext,
}: SpondEventsReviewStepProps) {
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
            <option value="training">{t('spondSync.eventFilter.training')}</option>
            <option value="match">{t('spondSync.eventFilter.match')}</option>
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
          {t('spondSync.wizard.noEventsToSync')}
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
                  <ContentGrid variant="equal" className="spond-review-fields">
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
                        <Select
                          value={draft.kind}
                          onChange={(event) => onDraftChange(row.source.id, {
                            kind: event.target.value as ActivityKind,
                          })}
                        >
                          {(['match', 'tournament', 'training', 'social'] as ActivityKind[]).map((kind) => (
                            <option key={kind} value={kind}>{t(`activity.kinds.${kind}`)}</option>
                          ))}
                        </Select>
                        {draft.kind === 'training' && (
                          <Select
                            value={draft.trainerIds[0] ?? ''}
                            onChange={(event) => onDraftChange(row.source.id, {
                              trainerIds: event.target.value ? [event.target.value] : [],
                            })}
                          >
                            <option value="">{t('spondSync.selectTrainer')}</option>
                            {trainers.map((trainer) => (
                              <option key={trainer.id} value={trainer.id}>
                                {trainer.firstName} {trainer.lastName}
                              </option>
                            ))}
                          </Select>
                        )}
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
                  <p key={field} className="spond-review-error">
                    {t(`spondSync.requiredFields.${field}`)}
                  </p>
                ))}
              </Panel>
            );
          })}
        </Stack>
      )}
      <SpondWizardActions
        back={onBack}
        next={onNext}
        nextDisabled={Object.keys(issues).length > 0}
      />
    </>
  );
}
