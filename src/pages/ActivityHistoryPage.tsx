import { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlayers, useTrainers, useSquad, useActivities, useShirtSets, useMatchPlanning } from '../store';
import { getActivityHistory } from '../services/activityHistoryService';
import { selectEnrichedActivityHistoryRows } from '../store/selectors/activityAuditSelectors';
import type { ActivityHistoryItem } from '../types/activityHistory';
import { Alert, Button, DateColumn, EmptyState, LoadingState, Page, PageActions, PageDescription, PageHeader, PageHeaderContent, PageTitle, Panel, PanelActions, Stack } from '../components/ui';
import { formatInstantDateTime, formatInstantTime } from '../utils/dateFormatter';
import styles from './ActivityHistoryPage.module.css';

const PAGE_SIZE = 50;

export default function ActivityHistoryPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const squad = useSquad();
  const { getActivityById } = useActivities();
  const { players } = usePlayers();
  const { trainers } = useTrainers();
  const { shirtSets } = useShirtSets();
  const { matchFormats, formations } = useMatchPlanning();
  const activity = id ? getActivityById(id) : undefined;
  const [items, setItems] = useState<ActivityHistoryItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const rows = useMemo(() => selectEnrichedActivityHistoryRows(items.slice(0, visibleCount)), [items, visibleCount]);
  const peopleById = useMemo(() => new Map([...players, ...trainers].map((person) => [person.id, `${person.firstName} ${person.lastName}`])), [players, trainers]);
  const formatsById = useMemo(() => new Map(matchFormats.map((format) => [format.id, format.name])), [matchFormats]);
  const formationsById = useMemo(() => new Map(formations.map((formation) => [formation.id, formation.name])), [formations]);
  const shirtsById = useMemo(() => new Map(shirtSets.map((shirtSet) => [shirtSet.id, shirtSet.sponsor])), [shirtSets]);

  useEffect(() => {
    if (!squad?.id || !id) return;
    let cancelled = false;
    setLoading(true);
    setHasError(false);
    setItems([]);
    setVisibleCount(PAGE_SIZE);
    getActivityHistory(squad.id, id)
      .then((page) => { if (!cancelled) setItems(page.items); })
      .catch(() => { if (!cancelled) setHasError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, squad?.id]);

  const displayValue = (field: string, value: string, subjectType?: string): string => {
    if (!value) return t('page.activityHistory.values.empty');
    if (field === 'response') return t(`page.activityHistory.responses.${value}`, { defaultValue: value });
    if (field === 'status' && ['present', 'absent', 'excused'].includes(value)) return t(`page.activityHistory.statuses.${value}`);
    if (field === 'status' && ['active', 'cancelled'].includes(value)) return t(`page.activityHistory.activityStatuses.${value}`);
    if (field === 'status' && subjectType === 'team' && ['new', 'selected'].includes(value)) return t(`page.activityHistory.teamStatuses.${value}`);
    if (field === 'reason' || field === 'declineReason') return t(`page.activityHistory.reasons.${value}`, { defaultValue: value });
    if (field === 'kind') return t(`domain.activity.kinds.${value}`, { defaultValue: value });
    if (field === 'strength') return t(`domain.team.strength.${value === '1' ? 'highest' : value === '2' ? 'medium' : 'lowest'}`);
    if (field === 'matchFormatId') return formatsById.get(value) ?? t('page.activityHistory.values.unknown');
    if (field === 'formationId') return formationsById.get(value) ?? t('page.activityHistory.values.unknown');
    if (field === 'shirtSetId') return shirtsById.get(value) ?? t('page.activityHistory.values.unknown');
    if (field === 'responsiblePersonId') return peopleById.get(value) ?? t('page.activityHistory.values.unknown');
    if (field === 'startsAt' || field === 'endsAt' || field === 'selectionSentAt' || field === 'removedAt') {
      const timestamp = Date.parse(value);
      return Number.isNaN(timestamp) ? value : formatInstantDateTime(value, i18n.language);
    }
    if (field === 'shirtAssignments') {
      try {
        const assignments = JSON.parse(value) as Array<{ playerId: string; shirtNumber: number }>;
        return assignments.map((assignment) => `${peopleById.get(assignment.playerId) ?? t('page.activityHistory.values.unknown')} #${assignment.shirtNumber}`).join(', ') || t('page.activityHistory.values.empty');
      } catch { return t('page.activityHistory.values.changed'); }
    }
    return value;
  };

  const renderChange = (change: (typeof rows)[number]['changes'][number]) => {
    const params = change.params;
    const subject = params.subject || t('page.activityHistory.values.unknown');
    const message = (key: string, values: Record<string, string | number>) => (
      <Trans
        i18nKey={`page.activityHistory.changes.${key}`}
        values={values}
        components={{
          subject: <span className={styles.variable} />,
          field: <span className={styles.variable} />,
          previous: <span className={styles.variable} />,
          current: <span className={styles.variable} />,
          player: <span className={styles.variable} />,
          response: <span className={styles.variable} />,
          team: <span className={styles.variable} />,
          reason: <span className={styles.variable} />,
          periods: <span className={styles.variable} />,
          count: <span className={styles.variable} />,
          dateTime: <span className={styles.variable} />,
          person: <span className={styles.variable} />,
          status: <span className={styles.variable} />,
        }}
      />
    );
    switch (change.key) {
      case 'fieldChanged':
        return message('fieldChanged', {
          subject,
          field: t(`page.activityHistory.fields.${params.subjectType === 'team' && params.field === 'status' ? 'teamSelectionStatus' : params.field}`, { defaultValue: t('page.activityHistory.fields.unknown') }),
          previous: displayValue(params.field, params.previous, params.subjectType),
          current: displayValue(params.field, params.current, params.subjectType),
        });
      case 'teamAdded': return message('teamAdded', { team: params.team || t('page.activityHistory.values.unknown') });
      case 'teamRemoved': return message('teamRemoved', { team: params.team || t('page.activityHistory.values.unknown') });
      case 'invitationAdded': return message('invitationAdded', { player: params.player || t('page.activityHistory.values.unknown'), response: displayValue('response', params.response) });
      case 'invitationRemoved': return message('invitationRemoved', { player: params.player || t('page.activityHistory.values.unknown'), response: displayValue('response', params.response) });
      case 'playerSelected': return message('playerSelected', { player: params.player || t('page.activityHistory.values.unknown'), team: params.team || t('page.activityHistory.values.unknown') });
      case 'playerUnselected': return params.reason
        ? message('playerUnselectedWithReason', { player: params.player || t('page.activityHistory.values.unknown'), team: params.team || t('page.activityHistory.values.unknown'), reason: t(`page.activityHistory.reasons.${params.reason}`, { defaultValue: params.reason }) })
        : message('playerUnselected', { player: params.player || t('page.activityHistory.values.unknown'), team: params.team || t('page.activityHistory.values.unknown') });
      case 'selectionMarkedSent': return message('selectionMarkedSent', { dateTime: displayValue('selectionSentAt', params.dateTime) });
      case 'lineupChanged': return message('lineupChanged', { team: params.team || t('page.activityHistory.values.unknown'), periods: params.periods, count: params.assignmentChanges });
      case 'attendanceRemoved': return message('attendanceRemoved', { person: params.person || t('page.activityHistory.values.unknown'), status: displayValue('status', params.status) });
      case 'activityCreated': return t('page.activityHistory.changes.activityCreated');
      case 'activityImported': return t('page.activityHistory.changes.activityImported');
      case 'activityDeleted': return t('page.activityHistory.changes.activityDeleted');
      default: return t('page.activityHistory.changes.unsupportedChange');
    }
  };

  if (!activity) return <Page><EmptyState><Alert>{t('page.eventDetail.notFound')}</Alert></EmptyState></Page>;

  return <Page width="medium">
    <PageHeader align="start">
      <PageHeaderContent>
        <PageTitle>{t('page.activityHistory.title')}</PageTitle>
        <PageDescription>{activity.name}</PageDescription>
      </PageHeaderContent>
      <PageActions><Button variant="ghost" onClick={() => navigate(`/activities/${activity.id}`)}>{t('common.actions.back')}</Button></PageActions>
    </PageHeader>
    {hasError && <Alert>{t('page.activityHistory.loadFailed')}</Alert>}
    {loading ? <Panel><LoadingState message={t('page.activityHistory.loading')} /></Panel> : rows.length === 0 ? <Panel><EmptyState>{t('page.activityHistory.empty')}</EmptyState></Panel> : (
      <Stack gap="md">
        <ol className={styles.timeline}>
          {rows.map((row) => <li key={row.id} className={styles.entry}>
            <Panel padding="compact">
              <div className={styles.entryHeader}>
                <DateColumn date={row.recordedAt} />
                <div className={styles.entryMeta}>
                  <strong className={styles.actor}>{row.actorName}</strong>
                  <time className={styles.timestamp} dateTime={row.recordedAt}>{formatInstantTime(row.recordedAt, i18n.language)}</time>
                </div>
              </div>
              <ul className={styles.changeList}>
                {row.changes.map((change, index) => <li key={`${row.id}-${index}`} className={styles.change}>{renderChange(change)}</li>)}
              </ul>
            </Panel>
          </li>)}
        </ol>
        {visibleCount < items.length && <PanelActions className={styles.pagination}><Button variant="secondary" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>{t('page.activityHistory.loadMore')}</Button></PanelActions>}
      </Stack>
    )}
  </Page>;
}
