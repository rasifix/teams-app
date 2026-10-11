import { useTranslation } from 'react-i18next';
import type { Activity, ActivityKind, Trainer } from '../../types';
import {
  type SpondActivityDraft,
  type SpondActivityRequiredField,
  type SpondEventFilter,
  type SpondEventRow,
} from '../../store/selectors/spondSyncSelectors';
import { formatWallClockDateTime } from '../../utils/dateFormatter';
import Button from '../ui/Button';
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
      <p className="text-sm text-gray-600">{t('spondSync.wizard.eventsHelp')}</p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label className="form-label" htmlFor="spond-event-filter">{t('spondSync.eventFilter.label')}</label>
          <select
            id="spond-event-filter"
            className="form-select"
            value={eventFilter}
            onChange={(event) => onFilterChange(event.target.value as SpondEventFilter)}
          >
            <option value="all">{t('spondSync.eventFilter.all')}</option>
            <option value="training">{t('spondSync.eventFilter.training')}</option>
            <option value="match">{t('spondSync.eventFilter.match')}</option>
          </select>
        </div>
        {rows.length > 0 && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onSelectAll}>{t('common.actions.selectAll')}</Button>
            <Button variant="secondary" size="sm" onClick={onSelectNone}>{t('common.actions.selectNone')}</Button>
          </div>
        )}
      </div>
      {rows.length === 0 ? (
        <div className="rounded bg-gray-50 p-4 text-sm text-gray-600">
          {t('spondSync.wizard.noEventsToSync')}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const draft = drafts[row.source.id];
            const selected = Boolean(draft && draft.action !== 'skip');
            const match = row.linkedActivity ?? (
              row.suggestedActivities.length === 1 ? row.suggestedActivities[0] : undefined
            );
            const rowIssues = issues[row.source.id] ?? [];

            return (
              <div key={row.source.id} className="rounded border p-4">
                <label className="flex items-start gap-3">
                  <input
                    className="mt-1"
                    type="checkbox"
                    checked={selected}
                    onChange={(event) => onDraftChange(row.source.id, {
                      action: event.target.checked ? (match ? 'link' : 'create') : 'skip',
                      activityId: event.target.checked ? match?.id ?? '' : '',
                    })}
                  />
                  <span className="flex-1">
                    <span className="font-medium">{row.source.name}</span>
                    <span className="block text-sm text-gray-600">
                      {formatWallClockDateTime(row.source.startsAt, i18n.language)}
                    </span>
                  </span>
                </label>
                {selected && draft && !row.linkedActivity && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <select
                      className="form-select"
                      value={draft.action}
                      onChange={(event) => onDraftChange(row.source.id, {
                        action: event.target.value as SpondActivityDraft['action'],
                      })}
                    >
                      <option value="link">{t('spondSync.linkExisting')}</option>
                      <option value="create">{t('spondSync.createActivity')}</option>
                    </select>
                    {draft.action === 'link' ? (
                      <select
                        className="form-select"
                        value={draft.activityId}
                        onChange={(event) => onDraftChange(row.source.id, { activityId: event.target.value })}
                      >
                        {activities.map((activity) => (
                          <option key={activity.id} value={activity.id}>
                            {activity.name} · {activity.startsAt.slice(0, 10)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <select
                          className="form-select"
                          value={draft.kind}
                          onChange={(event) => onDraftChange(row.source.id, {
                            kind: event.target.value as ActivityKind,
                          })}
                        >
                          {(['match', 'tournament', 'training', 'social'] as ActivityKind[]).map((kind) => (
                            <option key={kind} value={kind}>{t(`activity.kinds.${kind}`)}</option>
                          ))}
                        </select>
                        {draft.kind === 'training' && (
                          <select
                            className="form-select"
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
                          </select>
                        )}
                        {(['match', 'tournament'] as ActivityKind[]).includes(draft.kind) && (
                          <input
                            className="form-input"
                            value={draft.teamName}
                            placeholder={t('spondSync.teamName')}
                            onChange={(event) => onDraftChange(row.source.id, { teamName: event.target.value })}
                          />
                        )}
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
      )}
      <SpondWizardActions
        back={onBack}
        next={onNext}
        nextDisabled={Object.keys(issues).length > 0}
      />
    </>
  );
}
