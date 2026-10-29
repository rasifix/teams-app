import { useTranslation } from 'react-i18next';
import type { Trainer } from '../../types';
import type { SpondTrainerDraft, SpondTrainerRequiredField, SpondTrainerRow } from '../../store/selectors/spondSyncSelectors';
import { ContentGrid, EntityContent, EntityMeta, EntityTitle, Panel, Select, Stack } from '../ui';

interface SpondTrainersReviewStepProps {
  rows: SpondTrainerRow[];
  drafts: Record<string, SpondTrainerDraft>;
  trainers: Trainer[];
  issues: Record<string, SpondTrainerRequiredField[]>;
  onDraftChange: (id: string, update: Partial<SpondTrainerDraft>) => void;
}

export default function SpondTrainersReviewStep({
  rows, drafts, trainers, issues, onDraftChange,
}: SpondTrainersReviewStepProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="lg">
      <p className="body-muted">{t('spondSync.wizard.trainersHelp')}</p>
      {rows.map((row) => {
        const draft = drafts[row.source.id];
        return (
          <Panel key={row.source.id} padding="compact">
            <EntityContent>
              <EntityTitle>{row.source.firstName} {row.source.lastName}</EntityTitle>
              {row.linkedTrainer && <EntityMeta>{t('spondSync.wizard.alreadyLinked', {
                name: `${row.linkedTrainer.firstName} ${row.linkedTrainer.lastName}`,
              })}</EntityMeta>}
            </EntityContent>
            {draft && !row.linkedTrainer && (
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
