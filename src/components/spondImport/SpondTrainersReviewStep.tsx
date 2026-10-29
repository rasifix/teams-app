import { useTranslation } from 'react-i18next';
import type { Trainer } from '../../types';
import type { SpondTrainerDraft, SpondTrainerRequiredField, SpondTrainerRow } from '../../store/selectors/spondSyncSelectors';
import { Button, Checkbox, Cluster, ContentGrid, EntityContent, EntityMeta, EntityTitle, Panel, Select, Split, Stack } from '../ui';

interface SpondTrainersReviewStepProps {
  rows: SpondTrainerRow[];
  drafts: Record<string, SpondTrainerDraft>;
  trainers: Trainer[];
  issues: Record<string, SpondTrainerRequiredField[]>;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onDraftChange: (id: string, update: Partial<SpondTrainerDraft>) => void;
}

export default function SpondTrainersReviewStep({
  rows, drafts, trainers, issues, onSelectAll, onSelectNone, onDraftChange,
}: SpondTrainersReviewStepProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="lg">
      <Split align="start">
        <p className="body-muted">{t('spondSync.wizard.trainersHelp')}</p>
        {rows.length > 0 && (
          <Cluster gap="sm">
            <Button variant="secondary" size="sm" onClick={onSelectAll}>{t('common.actions.selectAll')}</Button>
            <Button variant="secondary" size="sm" onClick={onSelectNone}>{t('common.actions.selectNone')}</Button>
          </Cluster>
        )}
      </Split>
      {rows.map((row) => {
        const draft = drafts[row.source.id];
        const selected = Boolean(draft && draft.action !== 'skip');
        const match = row.linkedTrainer ?? row.suggestedTrainers[0];
        return (
          <Panel key={row.source.id} padding="compact">
            <label className="spond-review-option">
              <Checkbox
                checked={selected}
                onChange={(event) => onDraftChange(row.source.id, {
                  action: event.target.checked ? (match ? 'link' : 'create-trainer') : 'skip',
                  memberId: event.target.checked ? match?.id ?? '' : '',
                })}
              />
              <EntityContent>
                <EntityTitle>{row.source.firstName} {row.source.lastName}</EntityTitle>
                {row.linkedTrainer && <EntityMeta>{t('spondSync.wizard.alreadyLinked', {
                  name: `${row.linkedTrainer.firstName} ${row.linkedTrainer.lastName}`,
                })}</EntityMeta>}
              </EntityContent>
            </label>
            {selected && draft && !row.linkedTrainer && (
              <ContentGrid variant="equal">
                <Select value={draft.action} onChange={(event) => onDraftChange(row.source.id, {
                  action: event.target.value as SpondTrainerDraft['action'],
                })}>
                  <option value="link">{t('spondSync.linkExistingTrainer')}</option>
                  <option value="create-trainer">{t('spondSync.createTrainer')}</option>
                </Select>
                {draft.action === 'link' && (
                  <Select value={draft.memberId} onChange={(event) => onDraftChange(row.source.id, { memberId: event.target.value })}>
                    {trainers.map((trainer) => (
                      <option key={trainer.id} value={trainer.id}>{trainer.firstName} {trainer.lastName}</option>
                    ))}
                  </Select>
                )}
              </ContentGrid>
            )}
            {(issues[row.source.id] ?? []).map((field) => (
              <p key={field} className="ui-field__error">{t('spondSync.requiredFields.trainer')}</p>
            ))}
          </Panel>
        );
      })}
    </Stack>
  );
}
