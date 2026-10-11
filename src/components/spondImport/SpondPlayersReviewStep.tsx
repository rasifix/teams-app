import { useTranslation } from 'react-i18next';
import type { Player } from '../../types';
import type { SpondMemberDraft, SpondMemberRequiredField, SpondMemberRow } from '../../store/selectors/spondSyncSelectors';
import Button from '../ui/Button';
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-gray-600">{t('spondSync.wizard.playersHelp')}</p>
        {rows.length > 0 && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onSelectAll}>{t('common.actions.selectAll')}</Button>
            <Button variant="secondary" size="sm" onClick={onSelectNone}>{t('common.actions.selectNone')}</Button>
          </div>
        )}
      </div>
      <div className="space-y-3">
        {rows.map((row) => {
          const draft = drafts[row.source.id];
          const selected = Boolean(draft && draft.action !== 'skip');
          const match = row.linkedPlayer ?? row.suggestedPlayers[0];
          const rowIssues = issues[row.source.id] ?? [];

          return (
            <div key={row.source.id} className="rounded border p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected}
                  onChange={(event) => onDraftChange(row.source.id, {
                    action: event.target.checked ? (match ? 'link' : 'create-player') : 'skip',
                    memberId: event.target.checked ? match?.id ?? '' : '',
                  })}
                />
                <span className="flex-1">
                  <span className="font-medium">{row.source.firstName} {row.source.lastName}</span>
                  {row.linkedPlayer && (
                    <span className="block text-sm text-gray-600">
                      {t('spondSync.wizard.alreadyLinked', {
                        name: `${row.linkedPlayer.firstName} ${row.linkedPlayer.lastName}`,
                      })}
                    </span>
                  )}
                </span>
              </label>
              {selected && draft && !row.linkedPlayer && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <select
                    className="form-select"
                    value={draft.action}
                    onChange={(event) => onDraftChange(row.source.id, {
                      action: event.target.value as SpondMemberDraft['action'],
                    })}
                  >
                    <option value="link">{t('spondSync.linkExisting')}</option>
                    <option value="create-player">{t('spondSync.createPlayer')}</option>
                  </select>
                  {draft.action === 'link' ? (
                    <select
                      className="form-select"
                      value={draft.memberId}
                      onChange={(event) => onDraftChange(row.source.id, { memberId: event.target.value })}
                    >
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>{player.firstName} {player.lastName}</option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <input
                        aria-label={t('spondSync.birthDate')}
                        className="form-input"
                        type="date"
                        value={draft.birthDate}
                        onChange={(event) => onDraftChange(row.source.id, { birthDate: event.target.value })}
                      />
                      <select
                        aria-label={t('spondSync.level')}
                        className="form-select"
                        value={draft.level}
                        onChange={(event) => onDraftChange(row.source.id, { level: Number(event.target.value) })}
                      >
                        {[1, 2, 3, 4, 5].map((level) => (
                          <option key={level} value={level}>{t('spondSync.levelValue', { level })}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              )}
              {rowIssues.map((field) => (
                <p key={field} className="mt-2 text-sm text-red-700">
                  {t(`spondSync.requiredFields.${field}`)}
                </p>
              ))}
            </div>
          );
        })}
      </div>
      <SpondWizardActions
        back={onBack}
        next={onNext}
        nextDisabled={Object.keys(issues).length > 0}
      />
    </>
  );
}
