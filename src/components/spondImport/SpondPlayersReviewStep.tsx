import { useTranslation } from 'react-i18next';
import type { Player } from '../../types';
import type { SpondMemberDraft, SpondMemberRequiredField, SpondMemberRow } from '../../store/selectors/spondSyncSelectors';
import { selectSpondPlayerChanges } from '../../store/selectors/spondSyncSelectors';
import { ContentGrid, EntityContent, EntityMeta, EntityTitle, Panel, Select, Stack, Input } from '../ui';
import SpondWizardActions from './SpondWizardActions';

interface SpondPlayersReviewStepProps {
  rows: SpondMemberRow[];
  drafts: Record<string, SpondMemberDraft>;
  players: Player[];
  issues: Record<string, SpondMemberRequiredField[]>;
  onDraftChange: (id: string, update: Partial<SpondMemberDraft>) => void;
  onBack: () => void;
  onNext: () => void;
  showActions?: boolean;
}

export default function SpondPlayersReviewStep({
  rows,
  drafts,
  players,
  issues,
  onDraftChange,
  onBack,
  onNext,
  showActions = true,
}: SpondPlayersReviewStepProps) {
  const { t } = useTranslation();

  return (
    <>
      <p className="body-muted">{t('spondSync.wizard.playersHelp')}</p>
      <Stack gap="sm">
        {rows.map((row) => {
          const draft = drafts[row.source.id];
          const rowIssues = issues[row.source.id] ?? [];
          const changes = selectSpondPlayerChanges(row.source, row.linkedPlayer);

          return (
            <Panel key={row.source.id} padding="compact">
              <EntityContent>
                <EntityTitle>{row.source.firstName} {row.source.lastName}</EntityTitle>
                {row.linkedPlayer && (
                  <EntityMeta><span>
                    {t('spondSync.wizard.alreadyLinked', {
                      name: `${row.linkedPlayer.firstName} ${row.linkedPlayer.lastName}`,
                    })}
                  </span></EntityMeta>
                )}
                {changes.length > 0 && <EntityMeta>{t('spondSync.wizard.changeList', {
                  changes: changes.map((change) => t(`spondSync.wizard.changedFields.${change}`)).join(', '),
                })}</EntityMeta>}
              </EntityContent>
              {draft && !row.linkedPlayer && (
                <ContentGrid variant="equal">
                  <Select
                    value={draft.action}
                    onChange={(event) => onDraftChange(row.source.id, {
                      action: event.target.value as SpondMemberDraft['action'],
                    })}
                  >
                    <option value="link">{t('spondSync.linkExisting')}</option>
                    <option value="create-player">{t('spondSync.createPlayer')}</option>
                  </Select>
                  {draft.action === 'link' ? (
                    <Select
                      value={draft.memberId}
                      onChange={(event) => onDraftChange(row.source.id, { memberId: event.target.value })}
                    >
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>{player.firstName} {player.lastName}</option>
                      ))}
                    </Select>
                  ) : (
                    <>
                      <Input
                        aria-label={t('spondSync.birthDate')}
                        type="date"
                        value={draft.birthDate}
                        onChange={(event) => onDraftChange(row.source.id, { birthDate: event.target.value })}
                      />
                      <Select
                        aria-label={t('spondSync.level')}
                        value={draft.level}
                        onChange={(event) => onDraftChange(row.source.id, { level: Number(event.target.value) })}
                      >
                        {[1, 2, 3, 4, 5].map((level) => (
                          <option key={level} value={level}>{t('spondSync.levelValue', { level })}</option>
                        ))}
                      </Select>
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
      {showActions && <SpondWizardActions
          back={onBack}
          next={onNext}
          nextDisabled={Object.keys(issues).length > 0}
        />}
    </>
  );
}
