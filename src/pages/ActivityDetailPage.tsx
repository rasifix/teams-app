import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActivities } from '../hooks/useActivities';
import { useAuth } from '../hooks/useAuth';
import { useSquad, useTrainers } from '../store/useStore';
import { canAccessRestrictedManagement } from '../utils/permissions';
import { usePlayers, useAppLoading, useAppHasErrors, useAppErrors, useShirtSets } from '../store';
import type { ActivityAttendance, InvitationDeclineReason, InvitationResponse, SelectionRemovalReason, Team } from '../types';
import type { ActivityDetailsPatch } from '../services/activityIntentService';
import InvitePlayersModal from '../components/InvitePlayersModal';
import PlayerInvitationsCard from '../components/PlayerInvitationsCard';
import EditActivityModal from '../components/EditActivityModal';
import ActivityAttendanceCard from '../components/ActivityAttendanceCard';
import TeamCard from '../components/TeamCard';
import { selectTeamCardView } from '../store/selectors/teamCardSelectors';
import ConfirmDialog from '../components/ConfirmDialog';
import TeamPrintSummary from '../components/TeamPrintSummary';
import styles from './ActivityDetailPage.module.css';
import { selectIsSpondLinked } from '../store/selectors/squadSettingsSelectors';
import { formatDate, formatInstantDateTime } from '../utils/dateFormatter';
import { getActivityDate, getActivityStartTime, selectSelectedPlayerIds } from '../store/selectors/activitySelectors';
import { selectActivityPhase, selectActivityPhaseSections } from '../store/selectors/activityLifecycleSelectors';
import { selectAdjacentActivities, selectCanAddActivityTeam, selectMinimumActivityMaxPlayers } from '../store/selectors/activityViewSelectors';
import { selectCanMarkSelectionSent, selectSelectionEditState, selectSelectionValidation } from '../store/selectors/selectionSelectors';
import { selectChangedAttendanceRecords } from '../store/selectors/attendanceSelectors';
import { selectTeamWhatsAppMessage } from '../store/selectors/teamCardSelectors';
import { AddCardButton, AdjacentNavigation, AdjacentNavigationLabel, Alert, Badge, Button, ChevronRightIcon, Cluster, ContentGrid, EmptyState, IconButton, MenuDivider, MenuItem, MenuItemTitle, MenuLabel, MenuSurface, MetadataItem, MetadataList, Modal, ModalBody, ModalFooter, ModalTitle, Page, PageActions, PageHeader, PageHeaderContent, PageTitle, Panel, PanelActions, PanelHeader, PanelTitle, Select, Stack } from '../components/ui';

export default function ActivityDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activities, getActivityById, updateActivity, updateActivityInvitation, executeActivityIntent, markActivitySelectionSent, deleteActivity, cancelActivity, restoreActivity } = useActivities();
  const { players } = usePlayers();
  const { shirtSets } = useShirtSets();
  const { user } = useAuth();
  const squad = useSquad();
  const trainers = useTrainers();
  const spondLinked = selectIsSpondLinked(squad);
  const canManage = canAccessRestrictedManagement(user, { squad, trainers });
  const loading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();
  const activity = id ? getActivityById(id) : undefined;
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isPrintSummaryOpen, setIsPrintSummaryOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const sheetSwipeStart = useRef<{ x: number; y: number; scrollTop: number } | null>(null);
  const actionsMenuId = useId();
  const [isSendingSelection, setIsSendingSelection] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [whatsAppShareError, setWhatsAppShareError] = useState(false);
  const dragSourceRef = useRef<{ playerId: string; teamId?: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<{ playerId: string; teamId: string } | null>(null);
  const [removalReason, setRemovalReason] = useState<SelectionRemovalReason | ''>('');
  const [teamsStacked, setTeamsStacked] = useState(true);
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);
  const [switchingTeam, setSwitchingTeam] = useState<{ from: number; to: number; direction: 'next' | 'previous' } | null>(null);
  const [stackAnimating, setStackAnimating] = useState(false);
  const stackAnimationTimerRef = useRef<number | null>(null);
  const teamStackRef = useRef<HTMLDivElement>(null);
  const teamContentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const switchHeightFrameRef = useRef<number | null>(null);
  const { previous, next } = selectAdjacentActivities(activities, activity?.id ?? '');
  const error = !id ? t('page.eventDetail.errors.noEventId') : errors.activities || (hasErrors ? t('common.errors.failedToLoadData') : null);

  useLayoutEffect(() => {
    if (stackAnimationTimerRef.current !== null) window.clearTimeout(stackAnimationTimerRef.current);
    if (switchHeightFrameRef.current !== null) window.cancelAnimationFrame(switchHeightFrameRef.current);
    if (teamStackRef.current) teamStackRef.current.style.height = '';
    stackAnimationTimerRef.current = null;
    switchHeightFrameRef.current = null;
    setTeamsStacked(true);
    setActiveTeamIndex(0);
    setSwitchingTeam(null);
    setStackAnimating(false);
  }, [id]);

  useEffect(() => () => {
    if (stackAnimationTimerRef.current !== null) window.clearTimeout(stackAnimationTimerRef.current);
    if (switchHeightFrameRef.current !== null) window.cancelAnimationFrame(switchHeightFrameRef.current);
  }, []);

  useEffect(() => {
    if (!isActionsMenuOpen) return;
    actionsMenuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const isMobileSheet = window.matchMedia('(max-width: 39.999rem)').matches;
    const sheet = actionsMenuRef.current?.querySelector<HTMLElement>('[role="menu"]');
    const previousBodyOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.documentElement.style.overscrollBehaviorY;
    if (isMobileSheet) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overscrollBehaviorY = 'none';
    }

    const preventPullToRefresh = (event: TouchEvent) => {
      const start = sheetSwipeStart.current;
      const touch = event.touches[0];
      if (start && touch && start.scrollTop === 0 && sheet?.scrollTop === 0 && touch.clientY > start.y && Math.abs(touch.clientY - start.y) > Math.abs(touch.clientX - start.x)) {
        event.preventDefault();
      }
    };
    if (isMobileSheet) sheet?.addEventListener('touchmove', preventPullToRefresh, { passive: false });

    const handlePointerDown = (event: PointerEvent) => {
      if (!actionsMenuRef.current?.contains(event.target as Node)) setIsActionsMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsActionsMenuOpen(false);
        actionsMenuRef.current?.querySelector<HTMLElement>('[aria-haspopup="menu"]')?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      sheet?.removeEventListener('touchmove', preventPullToRefresh);
      if (isMobileSheet) {
        document.body.style.overflow = previousBodyOverflow;
        document.documentElement.style.overscrollBehaviorY = previousOverscrollBehavior;
      }
      sheetSwipeStart.current = null;
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActionsMenuOpen]);

  const handleInvite = async (playerIds: string[], response: InvitationResponse) => {
    if (!activity) return;
    await executeActivityIntent(activity.id, { type: 'addInvitations', players: playerIds.map((playerId) => ({ playerId, response })) });
  };

  const handleInvitationStatusChange = async (invitationId: string, response: InvitationResponse, declineReason?: InvitationDeclineReason) => {
    const invitation = activity?.invitations.find((entry) => entry.id === invitationId);
    if (!activity || !invitation) return;
    await updateActivityInvitation(activity.id, invitation.playerId, { response, declineReason: response === 'declined' ? declineReason : undefined });
  };

  const handleRemoveInvitation = async (invitationId: string) => {
    if (!activity) return;
    const invitation = activity.invitations.find((entry) => entry.id === invitationId);
    if (invitation) await executeActivityIntent(activity.id, { type: 'removeInvitation', playerId: invitation.playerId });
  };

  const dragAllowed = Boolean(activity && selectSelectionEditState(activity).canEdit && activity.status === 'active');
  const canDropOnTeam = (team: Team) => Boolean(dragAllowed && dragSourceRef.current && !dragSourceRef.current.teamId
    && !(team.selectedPlayers ?? []).includes(dragSourceRef.current.playerId)
    && (team.selectedPlayers?.length ?? 0) < (activity?.maxPlayersPerTeam ?? players.length));
  const canDropOnInvitations = () => Boolean(dragAllowed && dragSourceRef.current?.teamId);
  const leaveDropTarget = (event: DragEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(null);
  };
  const startPlayerDrag = (event: DragEvent<HTMLElement>, playerId: string, teamId?: string) => {
    if (!dragAllowed) { event.preventDefault(); return; }
    dragSourceRef.current = { playerId, teamId };
    setDropTarget(null);
    setDragError(null);
    event.dataTransfer.setData('text/plain', playerId);
    event.dataTransfer.effectAllowed = 'move';
  };
  const endPlayerDrag = () => { dragSourceRef.current = null; setDropTarget(null); };
  const dropOnTeam = async (event: DragEvent<HTMLElement>, team: Team) => {
    event.preventDefault();
    const source = dragSourceRef.current;
    const playerId = event.dataTransfer.getData('text/plain') || source?.playerId;
    endPlayerDrag();
    if (!dragAllowed || !activity || !source || source.teamId || source.playerId !== playerId || (team.selectedPlayers ?? []).includes(playerId)) return;
    if ((team.selectedPlayers?.length ?? 0) >= (activity.maxPlayersPerTeam ?? players.length)) {
      setDragError(t('page.eventDetail.errors.teamFull'));
      return;
    }
    if (!await executeActivityIntent(activity.id, { type: 'selection', teamId: team.id, add: [playerId], remove: [] })) setDragError(t('page.eventDetail.errors.movePlayerFailed'));
  };
  const dropOnInvitations = async (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const source = dragSourceRef.current;
    const playerId = event.dataTransfer.getData('text/plain') || source?.playerId;
    endPlayerDrag();
    if (!dragAllowed || !activity || !source?.teamId || source.playerId !== playerId) return;
    const assignedTeam = activity.teams.find((team) => team.id === source.teamId && team.selectedPlayers?.includes(playerId));
    if (!assignedTeam) return;
    if (selectionEditState.requiresRemovalReason) {
      setRemovalReason('');
      setPendingRemoval({ playerId, teamId: assignedTeam.id });
      return;
    }
    if (!await executeActivityIntent(activity.id, { type: 'selection', teamId: assignedTeam.id, add: [], remove: [{ playerId }] })) setDragError(t('page.eventDetail.errors.movePlayerFailed'));
  };
  const confirmRemoval = async () => {
    if (!activity || !pendingRemoval || !removalReason) return;
    const { playerId, teamId } = pendingRemoval;
    setPendingRemoval(null);
    if (!await executeActivityIntent(activity.id, { type: 'selection', teamId, add: [], remove: [{ playerId, reason: removalReason }] })) setDragError(t('page.eventDetail.errors.movePlayerFailed'));
  };

  const handleAddTeam = async () => {
    if (!activity || !selectCanAddActivityTeam(activity)) return;
    await executeActivityIntent(activity.id, { type: 'addTeam', team: {
      id: crypto.randomUUID(),
      name: `${t('domain.team.label')} ${activity.teams.length + 1}`,
      strength: 2,
      startTime: getActivityStartTime(activity),
    } });
  };

  const handleRecordAttendance = async (attendance: ActivityAttendance[]) => {
    if (activity) {
      const changes = selectChangedAttendanceRecords(activity.attendance, attendance);
      if (changes.length > 0) await executeActivityIntent(activity.id, { type: 'attendance', changes });
    }
  };

  const handleMarkSelectionSent = async () => {
    if (!activity) return;
    const validation = selectSelectionValidation(activity);
    if (!validation.canSend) {
      setSelectionError(t('page.eventDetail.errors.selectionMinimumRequired', {
        count: activity.minPlayersPerTeam ?? 0,
      }));
      return;
    }
    setSelectionError(null);
    setIsSendingSelection(true);
    await markActivitySelectionSent(activity.id);
    setIsSendingSelection(false);
  };

  const handleShareTeamToWhatsApp = (team: Team) => {
    if (!activity || activity.status !== 'active') return;
    const view = selectTeamCardView(team, players, trainers, new Set(), activity.maxPlayersPerTeam ?? players.length);
    const message = selectTeamWhatsAppMessage(activity, view, i18n.language, {
      activityTitle: activity.kind === 'match' && activity.opponentName
        ? t('page.eventDetail.whatsappMessage.matchWithOpponent', { name: activity.name, opponent: activity.opponentName })
        : activity.name,
      responsiblePerson: t('page.eventDetail.whatsappMessage.responsiblePerson'),
      meetingTime: t('domain.team.fields.meetingTime'),
      meetingLocation: t('domain.team.fields.meetingLocation'),
      selectedPlayers: t('page.eventDetail.whatsappMessage.selectedPlayers'),
      unknownPlayer: t('page.teamCard.unknownPlayer'),
    });
    if (!message) return;
    const whatsappWindow = window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
    if (whatsappWindow) {
      whatsappWindow.opener = null;
      setWhatsAppShareError(false);
    } else {
      setWhatsAppShareError(true);
    }
  };

  const handleDeleteActivity = async () => {
    if (activity && await deleteActivity(activity.id)) navigate('/activities');
  };

  const handleCancelActivity = async () => {
    if (activity) await cancelActivity(activity.id);
    setIsCancelOpen(false);
  };

  const handleRestoreActivity = async () => {
    if (activity) await restoreActivity(activity.id);
    setIsRestoreOpen(false);
  };

  if (loading) return <Page><EmptyState><p>{t('page.eventDetail.loading')}</p></EmptyState></Page>;
  if (error) return <Page><EmptyState><Alert>{error}</Alert></EmptyState></Page>;
  if (!activity) return <Page><EmptyState><p>{t('page.eventDetail.notFound')}</p></EmptyState></Page>;

  const phase = selectActivityPhase(activity);
  const sections = selectActivityPhaseSections(phase);
  const selectionEditState = selectSelectionEditState(activity);
  const canMarkSelectionSent = selectCanMarkSelectionSent(activity, trainers, players);
  const assignedPlayerIds = selectSelectedPlayerIds(activity);
  const assignedIds = Array.from(assignedPlayerIds);
  const isStacked = teamsStacked && activity.teams.length > 1;
  const visibleTeamIndex = Math.min(activeTeamIndex, Math.max(0, activity.teams.length - 1));
  const switchTeam = (direction: 'next' | 'previous') => {
    if (switchingTeam || stackAnimating) return;
    const nextIndex = visibleTeamIndex + (direction === 'next' ? 1 : -1);
    if (nextIndex < 0 || nextIndex >= activity.teams.length) return;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const stack = teamStackRef.current;
      const nextContent = teamContentRefs.current[activity.teams[nextIndex].id];
      if (stack && nextContent) {
        stack.style.height = `${stack.getBoundingClientRect().height}px`;
        switchHeightFrameRef.current = window.requestAnimationFrame(() => {
          stack.style.height = `${nextContent.scrollHeight}px`;
          switchHeightFrameRef.current = null;
        });
      }
      setSwitchingTeam({ from: visibleTeamIndex, to: nextIndex, direction });
    }
    setActiveTeamIndex(nextIndex);
  };
  const toggleTeamStack = () => {
    if (stackAnimating) return;
    setSwitchingTeam(null);
    const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setStackAnimating(shouldAnimate);
    if (shouldAnimate) {
      stackAnimationTimerRef.current = window.setTimeout(() => {
        setStackAnimating(false);
        stackAnimationTimerRef.current = null;
      }, 420);
    }
    setTeamsStacked((value) => !value);
  };
  const showManageActions = canManage && !spondLinked;
  return <Page className={styles.page}>
    <AdjacentNavigation className={styles.navigation} aria-label={t('page.eventDetail.navigationLabel')}>
        {previous ? <IconButton label={t('page.eventDetail.previousActivity', { name: previous.name })} onClick={() => navigate(`/activities/${previous.id}`)}><svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 4.5-7.5 7.5 7.5 7.5" /></svg></IconButton> : <span />}
        <AdjacentNavigationLabel>{t('page.eventDetail.navigationLabel')}</AdjacentNavigationLabel>
        {next ? <IconButton label={t('page.eventDetail.nextActivity', { name: next.name })} onClick={() => navigate(`/activities/${next.id}`)}><ChevronRightIcon /></IconButton> : <span />}
    </AdjacentNavigation>
    <PageHeader align="start" className={styles.header}>
        <PageHeaderContent>
          <span className={styles.activityType}>{t(`domain.activity.kinds.${activity.kind}`)}</span>
          <Cluster gap="sm" className={styles.titleCluster}>
            <PageTitle>{activity.name}</PageTitle>
            {activity.status === 'cancelled' && <Badge tone="danger" size="sm">{t('page.eventDetail.cancelled')}</Badge>}
            <Badge tone="info" size="sm" data-testid="activity-phase">{t(`page.eventDetail.phases.${phase}`)}</Badge>
          </Cluster>
          <MetadataList>
            <MetadataItem>📅 {formatDate(getActivityDate(activity))}</MetadataItem>
            <MetadataItem>🕐 {getActivityStartTime(activity)}</MetadataItem>
            {activity.location && <MetadataItem>📍 {activity.location}</MetadataItem>}
          </MetadataList>
          {activity.kind === 'match' && activity.opponentName && <p className="ui-page-description">{t('domain.activity.fields.opponent')}: {activity.opponentName}</p>}
        </PageHeaderContent>
        <PageActions className={styles.actions}>
          <div className={`ui-menu-anchor ${styles.anchor}`} ref={actionsMenuRef}>
            <IconButton
              label={t('page.eventDetail.actionsMenu')}
              aria-haspopup="menu"
              aria-expanded={isActionsMenuOpen}
              aria-controls={isActionsMenuOpen ? actionsMenuId : undefined}
              onClick={() => setIsActionsMenuOpen((current) => !current)}
            >
              <svg className="icon-sm" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                <circle cx="12" cy="5" r="1.75" />
                <circle cx="12" cy="12" r="1.75" />
                <circle cx="12" cy="19" r="1.75" />
              </svg>
            </IconButton>
            {isActionsMenuOpen && <>
              <div className={styles.backdrop} aria-hidden="true" onClick={() => setIsActionsMenuOpen(false)} />
              <MenuSurface
                id={actionsMenuId}
                onTouchStart={(event) => {
                  const touch = event.touches[0];
                  if (touch) sheetSwipeStart.current = { x: touch.clientX, y: touch.clientY, scrollTop: event.currentTarget.scrollTop };
                }}
                onTouchEnd={(event) => {
                  const start = sheetSwipeStart.current;
                  const touch = event.changedTouches[0];
                  sheetSwipeStart.current = null;
                  if (start && touch && start.scrollTop === 0 && event.currentTarget.scrollTop === 0 && touch.clientY - start.y > 70 && touch.clientY - start.y > Math.abs(touch.clientX - start.x)) {
                    setIsActionsMenuOpen(false);
                  }
                }}
                onTouchCancel={() => { sheetSwipeStart.current = null; }}
              >
              <div className={styles.sheetHandle} aria-hidden="true" />
              <MenuLabel className={styles.sheetTitle}>{t('page.eventDetail.actionsMenu')}</MenuLabel>
              <Link to={`/activities/${activity.id}/history`} role="menuitem" className="ui-menu__item"><MenuItemTitle>{t('page.eventDetail.viewHistory')}</MenuItemTitle></Link>
              {activity.status === 'active' && <MenuItem onClick={() => { setIsActionsMenuOpen(false); setIsEditOpen(true); }}><MenuItemTitle>{t('common.actions.edit')}</MenuItemTitle></MenuItem>}
              {showManageActions && activity.status === 'cancelled' && <MenuItem onClick={() => { setIsActionsMenuOpen(false); setIsRestoreOpen(true); }}><MenuItemTitle>{t('page.eventDetail.restoreActivity')}</MenuItemTitle></MenuItem>}
              {showManageActions && <MenuDivider />}
              {showManageActions && activity.status === 'active' && <MenuItem className="ui-menu__item--danger" onClick={() => { setIsActionsMenuOpen(false); setIsCancelOpen(true); }}><MenuItemTitle>{t('page.eventDetail.cancelActivity')}</MenuItemTitle></MenuItem>}
              {showManageActions && <MenuItem className="ui-menu__item--danger" onClick={() => { setIsActionsMenuOpen(false); setIsDeleteOpen(true); }}><MenuItemTitle>{t('common.actions.delete')}</MenuItemTitle></MenuItem>}
              <MenuDivider className={styles.mobileClose} />
              <MenuItem className={styles.mobileClose} onClick={() => setIsActionsMenuOpen(false)}><MenuItemTitle>{t('common.actions.close')}</MenuItemTitle></MenuItem>
              </MenuSurface>
            </>}
          </div>
        </PageActions>
    </PageHeader>

    {activity.status === 'cancelled' && <Alert tone="warning">{t('page.eventDetail.cancelledReadOnly')}</Alert>}

    <ContentGrid variant="equal" className="event-detail-content-grid">
      <Panel>
        <PanelHeader className="ui-responsive-action-row">
          <PanelTitle>{t('page.eventDetail.teamsTitle')}</PanelTitle>
          <PanelActions>
            {activity.teams.length > 1 && <>
              {isStacked && <>
                <IconButton label={t('page.eventDetail.previousTeam')} disabled={visibleTeamIndex === 0 || Boolean(switchingTeam) || stackAnimating} onClick={() => switchTeam('previous')}><ChevronRightIcon className={`icon-sm ${styles.previousChevron}`} /></IconButton>
                <Badge>{t('page.eventDetail.teamPosition', { current: visibleTeamIndex + 1, total: activity.teams.length })}</Badge>
                <IconButton label={t('page.eventDetail.nextTeam')} disabled={visibleTeamIndex >= activity.teams.length - 1 || Boolean(switchingTeam) || stackAnimating} onClick={() => switchTeam('next')}><ChevronRightIcon /></IconButton>
              </>}
              <IconButton label={t(isStacked ? 'page.eventDetail.showAllTeams' : 'page.eventDetail.stackTeams')} aria-pressed={isStacked} disabled={stackAnimating} onClick={toggleTeamStack}>
                <svg className="icon-sm" viewBox="0 0 24 24" fill="rgb(var(--color-surface))" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false">
                  {isStacked ? <><rect x="4" y="3" width="16" height="7" rx="1.5" /><rect x="4" y="14" width="16" height="7" rx="1.5" /></> : <><rect x="4" y="7" width="14" height="13" rx="1.5" /><rect x="7" y="4" width="13" height="13" rx="1.5" /></>}
                </svg>
              </IconButton>
            </>}
            {activity.teams.length > 0 && (
              <IconButton label={t('page.eventDetail.printTeams')} onClick={() => setIsPrintSummaryOpen(true)}>
                <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V4h12v5M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v6H6z" />
                </svg>
              </IconButton>
            )}
            {!selectionEditState.isSent && selectionEditState.canEdit && activity.teams.length > 0 && (
              <IconButton label={t('page.eventDetail.markSelectionSent')} disabled={isSendingSelection || !canMarkSelectionSent} onClick={() => void handleMarkSelectionSent()}>
                <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.5 5 5 10-11" /></svg>
              </IconButton>
            )}
          </PanelActions>
        </PanelHeader>
        {selectionError && <Alert tone="warning">{selectionError}</Alert>}
        {dragError && <Alert tone="warning">{dragError}</Alert>}
        {whatsAppShareError && <Alert tone="warning">{t('page.eventDetail.errors.whatsAppUnavailable')}</Alert>}
        {activity.selectionSentAt && <Alert tone="success">
          {t('page.eventDetail.selectionSentAt', { dateTime: formatInstantDateTime(activity.selectionSentAt, i18n.language) })}
        </Alert>}
        {activity.teams.length === 0 && !selectCanAddActivityTeam(activity) && <Alert tone="warning">{t('domain.activity.noTeamsLegacy')}</Alert>}
        <Stack gap="card">
          <div ref={teamStackRef} className={`${styles.teamStack}${isStacked ? ` ${styles.teamStacked}` : ''}${stackAnimating ? ` ${styles.teamStackAnimating}` : ''}${switchingTeam ? ` ${styles.teamStackSwitching}` : ''}`}>
          {(activity.kind === 'match' ? activity.teams.slice(0, 1) : activity.teams).map((team, index) => {
            const isSwitchOutgoing = Boolean(isStacked && switchingTeam?.from === index);
            const isSwitchIncoming = Boolean(isStacked && switchingTeam?.to === index);
            const isHiddenInStack = isStacked && index !== visibleTeamIndex && !isSwitchOutgoing;
            const isInactive = isHiddenInStack || isSwitchOutgoing;
            const switchClass = isSwitchOutgoing
              ? (switchingTeam?.direction === 'next' ? styles.teamFrameExitLeft : styles.teamFrameExitRight)
              : isSwitchIncoming
                ? (switchingTeam?.direction === 'next' ? styles.teamFrameEnterRight : styles.teamFrameEnterLeft)
                : '';
            return <div key={team.id} className={`${styles.teamFrame}${isHiddenInStack ? ` ${styles.teamFrameHidden}` : ''}${isStacked && !isHiddenInStack ? ` ${styles.teamFrameTop}` : ''}${switchClass ? ` ${switchClass}` : ''}`} aria-hidden={isInactive} inert={isInactive} onAnimationEnd={(event) => { if (isSwitchIncoming && event.target === event.currentTarget) { if (teamStackRef.current) teamStackRef.current.style.height = ''; setSwitchingTeam(null); } }}>
            <div ref={(element) => { teamContentRefs.current[team.id] = element; }} className={styles.teamFrameContent}>
            <TeamCard
              view={selectTeamCardView(team, players, trainers, new Set(), activity.maxPlayersPerTeam ?? players.length)}
              onOpenTeam={() => navigate(`/activities/${activity.id}/teams/${team.id}`)}
              onShareWhatsApp={canManage && activity.status === 'active'
                ? () => handleShareTeamToWhatsApp(team)
                : undefined}
              dragEnabled={dragAllowed && !isInactive}
              dropState={!isInactive && dropTarget === team.id ? (canDropOnTeam(team) ? 'active' : 'invalid') : null}
              onPlayerDragStart={(event, playerId) => startPlayerDrag(event, playerId, team.id)}
              onPlayerDragEnd={endPlayerDrag}
              onDragOver={(event) => { if (isInactive || !dragSourceRef.current) return; setDropTarget(team.id); if (canDropOnTeam(team)) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } else event.dataTransfer.dropEffect = 'none'; }}
              onDragLeave={leaveDropTarget}
              onDrop={(event) => void dropOnTeam(event, team)}
            />
            </div>
            </div>;
          })}
          </div>
          {selectCanAddActivityTeam(activity) && <AddCardButton cardSize="sm" onClick={() => void handleAddTeam()} label={t('page.eventDetail.addTeam')} />}
        </Stack>
      </Panel>
      {sections.invitations && <PlayerInvitationsCard
        invitations={activity.invitations}
        currentActivity={activity}
        players={players}
        readOnly={spondLinked || activity.status === 'cancelled' || phase !== 'planning'}
        allowDeclineReasonEdit={spondLinked && activity.status === 'active'}
        onInviteClick={() => setIsInviteOpen(true)}
        onStatusChange={handleInvitationStatusChange}
        onRemoveInvitation={handleRemoveInvitation}
        assignedPlayerIds={assignedIds}
        onPlayerDragStart={startPlayerDrag}
        onPlayerDragEnd={endPlayerDrag}
        allowPlayerDrag={dragAllowed}
        dropState={dropTarget === 'invitations' ? (canDropOnInvitations() ? 'active' : 'invalid') : null}
        onPlayersDragOver={(event) => { if (!dragSourceRef.current) return; setDropTarget('invitations'); if (canDropOnInvitations()) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } else event.dataTransfer.dropEffect = 'none'; }}
        onPlayersDragLeave={leaveDropTarget}
        onPlayersDrop={(event) => void dropOnInvitations(event)}
      />}
      {canManage && sections.attendance && <ActivityAttendanceCard activity={activity} players={players} readOnly={activity.status === 'cancelled'} onSave={handleRecordAttendance} />}
    </ContentGrid>

    <Modal isOpen={Boolean(pendingRemoval)} onClose={() => setPendingRemoval(null)} size="sm">
      <ModalBody>
        <ModalTitle>{t('page.eventDetail.removePlayerTitle')}</ModalTitle>
        <Select value={removalReason} onChange={(event) => setRemovalReason(event.target.value as SelectionRemovalReason | '')} aria-label={t('page.teamPlayerSelection.selectRemovalReason')}>
          <option value="">{t('page.teamPlayerSelection.selectRemovalReason')}</option>
          {(['sick', 'injured', 'noShow', 'other'] as SelectionRemovalReason[]).map((reason) => <option key={reason} value={reason}>{t(`domain.attendance.reasons.${reason}`)}</option>)}
        </Select>
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={() => setPendingRemoval(null)}>{t('common.actions.cancel')}</Button>
        <Button type="button" disabled={!removalReason} onClick={() => void confirmRemoval()}>{t('common.actions.confirm')}</Button>
      </ModalFooter>
    </Modal>

    {!spondLinked && activity.status === 'active' && <InvitePlayersModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} onInvite={handleInvite} alreadyInvitedPlayerIds={activity.invitations.map((invitation) => invitation.playerId)} players={players} />}
    {activity.status === 'active' && <EditActivityModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onSave={(data: ActivityDetailsPatch) => updateActivity(activity.id, data)} currentActivity={activity} minMaxPlayers={selectMinimumActivityMaxPlayers(activity)} />}
    <ConfirmDialog isOpen={isCancelOpen} title={t('page.eventDetail.cancelActivityTitle')} message={t('page.eventDetail.cancelActivityMessage', { name: activity.name })} confirmText={t('page.eventDetail.cancelActivity')} cancelText={t('common.actions.back')} onConfirm={handleCancelActivity} onCancel={() => setIsCancelOpen(false)} confirmButtonColor="red" />
    <ConfirmDialog isOpen={isRestoreOpen} title={t('page.eventDetail.restoreActivityTitle')} message={t('page.eventDetail.restoreActivityMessage', { name: activity.name })} confirmText={t('page.eventDetail.restoreActivity')} cancelText={t('common.actions.cancel')} onConfirm={handleRestoreActivity} onCancel={() => setIsRestoreOpen(false)} confirmButtonColor="green" />
    <ConfirmDialog isOpen={isDeleteOpen} title={t('page.eventDetail.deleteEventTitle')} message={t('page.eventDetail.deleteEventMessage', { name: activity.name })} confirmText={t('common.actions.delete')} cancelText={t('common.actions.cancel')} onConfirm={handleDeleteActivity} onCancel={() => setIsDeleteOpen(false)} confirmButtonColor="red" />
    <TeamPrintSummary event={activity} teams={activity.teams} players={players} trainers={trainers} shirtSets={shirtSets} club={squad?.club} isOpen={isPrintSummaryOpen} onClose={() => setIsPrintSummaryOpen(false)} />
  </Page>;
}
