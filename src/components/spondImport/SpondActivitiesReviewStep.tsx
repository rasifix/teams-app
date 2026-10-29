import { useTranslation } from 'react-i18next';
import type { Activity, ActivityKind } from '../../types';
import {
  type SpondActivityDraft,
  type SpondActivityRequiredField,
  type SpondEventRow,
} from '../../store/selectors/spondSyncSelectors';
import { formatInstantDateTime } from '../../utils/dateFormatter';
import { ContentGrid, EntityContent, EntityMeta, EntityTitle, Field, Input, Panel, Select, Stack } from '../ui';
import SpondWizardActions from './SpondWizardActions';

interface SpondActivitiesReviewStepProps {
  rows: SpondEventRow[];
  drafts: Record<string, SpondActivityDraft>;
  activities: Activity[];
  issues: Record<string, SpondActivityRequiredField[]>;
  onDraftChange: (id: string, update: Partial<SpondActivityDraft>) => void;
  onBack: () => void;
  onNext: () => void;
  showActions?: boolean;
}

export default function SpondActivitiesReviewStep({
  rows,
  drafts,
  activities,
  issues,
  onDraftChange,
  onBack,
  onNext,
  showActions = true,
}: SpondActivitiesReviewStepProps) {
  const { t, i18n } = useTranslation();

  return (
    <>
      <p className="body-muted">{t('spondSync.wizard.eventsHelp')}</p>
      {rows.length > 0 && (
        <Stack gap="sm">
          {rows.map((row) => {
            const draft = drafts[row.source.id];
            const rowIssues = issues[row.source.id] ?? [];

            return (
              <Panel key={row.source.id} padding="compact">
                <EntityContent>
                  <EntityTitle>{row.source.name}</EntityTitle>
                  <EntityMeta>
                    <span>{formatInstantDateTime(row.source.startsAt, i18n.language)}</span>
                    {row.changes.length > 0 && <span>{t('spondSync.wizard.changeList', {
                      changes: row.changes.map((change) => t(`spondSync.wizard.changedFields.${change}`)).join(', '),
                    })}</span>}
                    {row.source.status === 'deleted' && <span>{t('spondSync.wizard.actions.delete')}</span>}
                  </EntityMeta>
                </EntityContent>
                {draft && !row.linkedActivity && row.source.status !== 'deleted' && (
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
