import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePlayers, useTrainers, useSquad, useActivities } from '../store';
import { getActivityAuditEvents } from '../services/activityEventService';
import { selectActivityHistoryRows } from '../store/selectors/activityAuditSelectors';
import type { ActivityEvent } from '../types/activityEvents';
import { Alert, Button, EmptyState, LoadingState, Page, PageActions, PageDescription, PageHeader, PageHeaderContent, PageTitle, Panel, PanelActions, PanelHeader, PanelTitle, Stack } from '../components/ui';
import { formatInstantDateTime } from '../utils/dateFormatter';
import { classNames } from '../components/ui/classNames';

const PAGE_SIZE = 50;

export default function ActivityHistoryPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const squad = useSquad();
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
    if (!squad || !id) return;
    let cancelled = false;
    setLoading(true);
    getActivityAuditEvents(squad.id, { activityId: id, limit: PAGE_SIZE })
      .then((page) => { if (!cancelled) { setEvents(page.items); setNextCursor(page.nextCursor); } })
      .catch(() => { if (!cancelled) setHasError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, squad?.id]);

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

  return <Page>
    <PageHeader align="start">
      <PageHeaderContent>
        <PageTitle>{t('page.activityHistory.title')}</PageTitle>
        <PageDescription>{activity.name}</PageDescription>
      </PageHeaderContent>
      <PageActions><Button variant="ghost" onClick={() => navigate(`/activities/${activity.id}`)}>{t('common.actions.back')}</Button></PageActions>
    </PageHeader>
    {hasError && <Alert>{t('page.activityHistory.loadFailed')}</Alert>}
    <Panel>
      <PanelHeader><PanelTitle>{t('page.activityHistory.panelTitle')}</PanelTitle></PanelHeader>
      {loading ? <LoadingState message={t('page.activityHistory.loading')} /> : rows.length === 0 ? <EmptyState>{t('page.activityHistory.empty')}</EmptyState> : (
        <Stack gap="sm">
          {rows.map((row) => <Panel key={row.id} padding="compact">
            <Stack gap="sm">
              <div className={classNames('ui-metadata-list')}>
                <span className={classNames('ui-metadata-item')}><strong>{row.actorName}</strong></span>
                <span className={classNames('ui-metadata-item')}>{formatInstantDateTime(row.recordedAt, i18n.language)}</span>
              </div>
              {row.changes.map((change, index) => <p key={`${row.id}-${index}`} className={classNames('supporting-text')}>
                {t(`page.activityHistory.changes.${change.key}`, { ...change.params, actor: row.actorName, fields: change.params.fields?.split(', ').map((field) => t(`page.activityHistory.fields.${field}`)).join(', '), response: t(`page.activityHistory.responses.${change.params.response}`), status: t(`page.activityHistory.statuses.${change.params.status}`) })}
              </p>)}
            </Stack>
          </Panel>)}
          {nextCursor && <PanelActions><Button variant="secondary" onClick={loadMore} loading={loadingMore}>{t('page.activityHistory.loadMore')}</Button></PanelActions>}
        </Stack>
      )}
    </Panel>
  </Page>;
}
