import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePlayers, useTrainers, useSquad, useActivities } from '../store';
import { getActivityAuditEvents } from '../services/activityEventService';
import { selectActivityHistoryRows } from '../store/selectors/activityAuditSelectors';
import type { ActivityEvent } from '../types/activityEvents';
import { Alert, Button, EmptyState, LoadingState, Page, PageActions, PageDescription, PageHeader, PageHeaderContent, PageTitle, Panel, PanelActions, Stack } from '../components/ui';
import { formatInstantDateTime } from '../utils/dateFormatter';
import styles from './ActivityHistoryPage.module.css';

const PAGE_SIZE = 50;

export default function ActivityHistoryPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const squad = useSquad();
  const squadId = squad?.id;
  const { user } = useAuth();
  const { players } = usePlayers();
  const { trainers } = useTrainers();
  const { getActivityById } = useActivities();
  const activity = id ? getActivityById(id) : undefined;
  const people = useMemo(() => [...players, ...trainers], [players, trainers]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [nextCursor, setNextCursor] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const rows = useMemo(() => selectActivityHistoryRows(events, people, user, activity?.teams), [activity?.teams, events, people, user]);

  useEffect(() => {
    if (!squadId || !id) return;
    let cancelled = false;
    setLoading(true);
    getActivityAuditEvents(squadId, { activityId: id, limit: PAGE_SIZE })
      .then((page) => { if (!cancelled) { setEvents(page.items); setNextCursor(page.nextCursor); } })
      .catch(() => { if (!cancelled) setHasError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, squadId]);

  const loadMore = async () => {
    if (!squad || !id || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getActivityAuditEvents(squad.id, { activityId: id, limit: PAGE_SIZE, cursor: nextCursor });
      setEvents((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch { setHasError(true); } finally { setLoadingMore(false); }
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
                <strong className={styles.actor}>{row.actorName}</strong>
                <time className={styles.timestamp} dateTime={row.recordedAt}>{formatInstantDateTime(row.recordedAt, i18n.language)}</time>
              </div>
              <ul className={styles.changeList}>
                {row.changes.map((change, index) => <li key={`${row.id}-${index}`} className={styles.change}>
                  {t(`page.activityHistory.changes.${change.key}`, { ...change.params, fields: change.params.fields?.split(', ').map((field) => t(`page.activityHistory.fields.${field}`)).join(', '), response: t(`page.activityHistory.responses.${change.params.response}`), status: t(`page.activityHistory.statuses.${change.params.status}`) })}
                </li>)}
              </ul>
            </Panel>
          </li>)}
        </ol>
        {nextCursor && <PanelActions className={styles.pagination}><Button variant="secondary" onClick={loadMore} loading={loadingMore}>{t('page.activityHistory.loadMore')}</Button></PanelActions>}
      </Stack>
    )}
  </Page>;
}
