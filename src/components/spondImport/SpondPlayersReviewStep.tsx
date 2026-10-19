import { useTranslation } from 'react-i18next';
import type { Player } from '../../types';
import type { SpondMemberDraft, SpondMemberRequiredField, SpondMemberRow } from '../../store/selectors/spondSyncSelectors';
import { Button, Checkbox, Cluster, ContentGrid, EntityContent, EntityMeta, EntityTitle, Panel, Select, Split, Stack, Input } from '../ui';
import SpondWizardActions from './SpondWizardActions';

interface SpondPlayersReviewStepProps {
  rows: SpondMemberRow[];
  drafts: Record<string, SpondMemberDraft>;
  players: Player[];
  issues: Record<string, SpondMemberRequiredField[]>;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onDraftChange: (id: string, update: Partial<SpondMemberDraft>) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function SpondPlayersReviewStep({
  rows,
  drafts,
  players,
  issues,
  onSelectAll,
  onSelectNone,
  onDraftChange,
  onBack,
  onNext,
}: SpondPlayersReviewStepProps) {
  const { t } = useTranslation();

  return (
    <>
      <Split align="start">
        <p className="body-muted">{t('spondSync.wizard.playersHelp')}</p>
        {rows.length > 0 && (
          <Cluster gap="sm">
            <Button variant="secondary" size="sm" onClick={onSelectAll}>{t('common.actions.selectAll')}</Button>
            <Button variant="secondary" size="sm" onClick={onSelectNone}>{t('common.actions.selectNone')}</Button>
          </Cluster>
        )}
      </Split>
      <Stack gap="sm">
        {rows.map((row) => {
          const draft = drafts[row.source.id];
          const selected = Boolean(draft && draft.action !== 'skip');
          const match = row.linkedPlayer ?? row.suggestedPlayers[0];
          const rowIssues = issues[row.source.id] ?? [];

          return (
            <Panel key={row.source.id} padding="compact">
              <label className="spond-review-option">
                <Checkbox
                  checked={selected}
                  onChange={(event) => onDraftChange(row.source.id, {
                    action: event.target.checked ? (match ? 'link' : 'create-player') : 'skip',
                    memberId: event.target.checked ? match?.id ?? '' : '',
                  })}
                />
                <EntityContent>
                  <EntityTitle>{row.source.firstName} {row.source.lastName}</EntityTitle>
                  {row.linkedPlayer && (
                    <EntityMeta><span>
                      {t('spondSync.wizard.alreadyLinked', {
                        name: `${row.linkedPlayer.firstName} ${row.linkedPlayer.lastName}`,
                      })}
                    </span></EntityMeta>
                  )}
                </EntityContent>
              </label>
              {selected && draft && !row.linkedPlayer && (
                <ContentGrid variant="equal" className="spond-review-fields">
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
                <p key={field} className="spond-review-error">
                  {t(`spondSync.requiredFields.${field}`)}
                </p>
              ))}
            </Panel>
          );
        })}
      </Stack>
      <SpondWizardActions
        back={onBack}
        next={onNext}
        nextDisabled={Object.keys(issues).length > 0}
      />
    </>
  );
}
