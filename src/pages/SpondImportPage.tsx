import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Card, CardBody, CardTitle, EmptyState, Page, PageActions, PageDescription, PageHeader, PageHeaderContent, PageTitle, Stack } from '../components/ui';
import {
  SpondImportTypesStep,
  SpondCredentialsStep,
  SpondGroupStep,
} from '../components/spondImport/SpondConnectionSteps';
import SpondEventsReviewStep from '../components/spondImport/SpondEventsReviewStep';
import SpondGuardiansReviewStep from '../components/spondImport/SpondGuardiansReviewStep';
import SpondPlayersReviewStep from '../components/spondImport/SpondPlayersReviewStep';
import type { SpondSyncResult } from '../components/SpondSyncResultBanner';
import { useAuth } from '../hooks/useAuth';
import { createSpondReadClient, importSpondSnapshot } from '../services/spondService';
import { linkSquadToSpond } from '../services/squadService';
import { useActivities, usePlayers, useSfvCatalog, useSquad, useSquadPeriods, useStore, useTrainers } from '../store';
import {
  selectInitialSpondActivityDrafts,
  selectInitialSpondGuardianSelection,
  selectInitialSpondMemberDrafts,
  selectFilteredSpondEventRows,
  selectSpondActionableEventRows,
  selectSpondActionableGuardianRows,
  selectSpondActionableMemberRows,
  selectSpondActivityDecisions,
  selectSpondLinkedGroup,
  selectSpondActivityDraftsWithSelection,
  selectCurrentSpondPeriodId,
  selectSpondDateRangeError,
  selectSpondDecisionSummary,
  selectSpondEventRows,
  selectSpondGuardianRows,
  selectSpondMemberRows,
  selectSpondMemberDecisions,
  selectSpondMemberDraftsWithSelection,
  selectSpondWizardProgressSteps,
  selectSpondSyncRange,
  type SpondActivityDraft,
  type SpondEventFilter,
  type SpondMemberDraft,
} from '../store/selectors/spondSyncSelectors';
import { selectDefaultActivityLimitsForCategory } from '../store/selectors/sfvCatalogSelectors';
import type { SpondGroupSnapshot, SpondSnapshot } from '../types/spond';
import { canAccessRestrictedManagement } from '../utils/permissions';
import { localDateStartToUtcISOString } from '../utils/dateFormatter';

type Step = 'credentials' | 'group' | 'range' | 'diff' | 'results' | 'linked';

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);
const shiftedDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return isoDate(date);
};

export default function SpondImportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEventOnly = searchParams.get('scope') === 'events';
  const isPlayerOnly = searchParams.get('scope') === 'players';
  const isScopedSync = isEventOnly || isPlayerOnly;
  const closePath = isPlayerOnly ? '/members/players' : isEventOnly ? '/activities' : '/squad-settings';
  const { user } = useAuth();
  const squad = useSquad();
  const sfvCatalog = useSfvCatalog();
  const { players, addGuardianToPlayer } = usePlayers();
  const { trainers } = useTrainers();
  const { activities, updateActivity: updateActivityRecord } = useActivities();
  const initializeApp = useStore((state) => state.initializeApp);
  const clientRef = useRef<ReturnType<typeof createSpondReadClient> | null>(null);
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [groups, setGroups] = useState<SpondGroupSnapshot[]>([]);
  const [groupId, setGroupId] = useState(squad?.spondId ?? '');
  const [selectedSubGroupId, setSelectedSubGroupId] = useState('');
  const types = isEventOnly ? ['events'] : ['players', 'guardians'];
  const periods = useSquadPeriods();
  const fallbackRange = useMemo(() => ({ from: shiftedDate(-30), to: shiftedDate(180) }), []);
  const defaultPeriodId = useMemo(() => selectCurrentSpondPeriodId(periods), [periods]);
  const initialRange = useMemo(
    () => selectSpondSyncRange(periods, defaultPeriodId, fallbackRange),
    [defaultPeriodId, fallbackRange, periods],
  );
  const [periodId, setPeriodId] = useState(defaultPeriodId);
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [snapshot, setSnapshot] = useState<SpondSnapshot | null>(null);
  const [memberDrafts, setMemberDrafts] = useState<Record<string, SpondMemberDraft>>({});
  const [activityDrafts, setActivityDrafts] = useState<Record<string, SpondActivityDraft>>({});
  const [eventFilter, setEventFilter] = useState<SpondEventFilter>('all');
  const [guardianSelection, setGuardianSelection] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SpondSyncResult | null>(null);
  const [noChanges, setNoChanges] = useState(false);

  useEffect(() => () => {
    clientRef.current?.dispose();
    clientRef.current = null;
  }, []);

  const memberRows = useMemo(
    () => selectSpondActionableMemberRows(selectSpondMemberRows(snapshot?.group.members ?? [], players)),
    [snapshot, players],
  );
  const guardianRows = useMemo(
    () => selectSpondActionableGuardianRows(selectSpondGuardianRows(snapshot?.group.members ?? [], players)),
    [snapshot, players],
  );
  const allEventRows = useMemo(
    () => selectSpondEventRows(snapshot?.activities ?? [], activities, players),
    [snapshot, activities, players],
  );
  const eventRows = useMemo(() => selectSpondActionableEventRows(allEventRows), [allEventRows]);
  const visibleEventRows = useMemo(
    () => selectFilteredSpondEventRows(eventRows, activityDrafts, eventFilter),
    [eventRows, activityDrafts, eventFilter],
  );
  const dateRangeError = selectSpondDateRangeError(from, to);
  const canImport = Boolean(squad && canAccessRestrictedManagement(user, { squad, trainers }));
  const progressSteps = selectSpondWizardProgressSteps(
    !isScopedSync ? 'link' : isPlayerOnly ? 'players' : 'events',
  ) as Step[];
  const defaultActivityLimits = selectDefaultActivityLimitsForCategory(sfvCatalog, squad?.category);

  if (!squad) return <Navigate to="/squads" replace />;
  if (!canImport) return <Navigate to={closePath} replace />;
  if (isScopedSync && !squad.spondId?.trim()) return <Navigate to={closePath} replace />;

  const errorMessage = (caught: unknown): string => {
    const code = caught instanceof Error ? caught.message : 'SPOND_REQUEST_FAILED';
    const key = `spondSync.errors.${code}`;
    const translated = t(key);
    return translated === key ? t('spondSync.errors.generic') : translated;
  };

  const selectGroup = (nextGroupId: string) => {
    setGroupId(nextGroupId);
    setSelectedSubGroupId('');
  };

  const loadSnapshot = async (groupIdOverride?: string, selectedSubGroupIdOverride?: string) => {
    const selectedGroupId = groupIdOverride ?? groupId;
    const selectedSubGroup = selectedSubGroupIdOverride ?? selectedSubGroupId;
    if (!clientRef.current || !selectedGroupId || types.length === 0 || (types.includes('events') && dateRangeError)) return;
    setBusy(true);
    setError(null);
    try {
      const nextSnapshot = await clientRef.current.getSnapshot(
        selectedGroupId,
        localDateStartToUtcISOString(from),
        localDateStartToUtcISOString(to),
        selectedSubGroup || undefined,
      );
      const nextMemberRows = selectSpondActionableMemberRows(selectSpondMemberRows(nextSnapshot.group.members, players));
      const nextGuardianRows = selectSpondActionableGuardianRows(selectSpondGuardianRows(nextSnapshot.group.members, players));
      const nextEventRows = selectSpondActionableEventRows(selectSpondEventRows(nextSnapshot.activities, activities, players));
      setSnapshot(nextSnapshot);
      setMemberDrafts(selectInitialSpondMemberDrafts(nextMemberRows));
      setActivityDrafts(selectInitialSpondActivityDrafts(nextEventRows));
      setGuardianSelection(selectInitialSpondGuardianSelection(nextGuardianRows));
      setPassword('');
      const hasChanges = isPlayerOnly
        ? nextMemberRows.length > 0 || nextGuardianRows.length > 0
        : nextEventRows.length > 0;
      if (!hasChanges) {
        setSyncResult(null);
        setNoChanges(true);
        setStep('results');
      } else {
        setNoChanges(false);
        setStep('diff');
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const connect = async () => {
    setBusy(true);
    setError(null);
    const client = createSpondReadClient();
    clientRef.current?.dispose();
    clientRef.current = client;
    try {
      await client.login(email.trim(), password);
      const available = await client.getGroups();
      setGroups(available);
      if (isScopedSync) {
        const linkedGroupId = squad.spondId?.trim();
        const linkedGroup = selectSpondLinkedGroup(available, linkedGroupId);
        if (!linkedGroup) {
          throw new Error('SPOND_LINKED_GROUP_NOT_FOUND');
        }
        setGroupId(linkedGroup.groupId);
        setSelectedSubGroupId(linkedGroup.subGroupId ?? '');
        setStep('range');
        return;
      }
      const preferred = selectSpondLinkedGroup(available, squad.spondId)?.groupId
        ?? (available.length === 1 ? available[0].id : '');
      if (preferred) {
        setGroupId(preferred);
        const linkedGroup = selectSpondLinkedGroup(available, squad.spondId);
        setSelectedSubGroupId(linkedGroup?.subGroupId ?? '');
      }
      else {
        setGroupId('');
        setSelectedSubGroupId('');
      }
      setStep('group');
    } catch (caught) {
      client.dispose();
      clientRef.current = null;
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const updateMember = (id: string, update: Partial<SpondMemberDraft>) => {
    setMemberDrafts((current) => ({ ...current, [id]: { ...current[id], ...update } }));
  };
  const updateActivity = (id: string, update: Partial<SpondActivityDraft>) => {
    setActivityDrafts((current) => ({ ...current, [id]: { ...current[id], ...update } }));
  };

  const updatePeriod = (nextPeriodId: string) => {
    setPeriodId(nextPeriodId);
    const nextRange = selectSpondSyncRange(periods, nextPeriodId, { from, to });
    setFrom(nextRange.from);
    setTo(nextRange.to);
  };

  const setVisibleEventSelection = (selected: boolean) => {
    setActivityDrafts((current) => selectSpondActivityDraftsWithSelection(current, visibleEventRows, selected));
  };

  const setPlayerSelection = (selected: boolean) => {
    setMemberDrafts((current) => selectSpondMemberDraftsWithSelection(current, memberRows, selected));
  };

  const previousStep = () => {
    if (step === 'group') setStep('credentials');
    else if (step === 'range') setStep('credentials');
    else if (step === 'diff') setStep('credentials');
  };

  const memberDecisions = selectSpondMemberDecisions(
    memberRows,
    memberDrafts,
    types.includes('players'),
    types.includes('guardians'),
    guardianSelection,
  );
  const activityDecisions = selectSpondActivityDecisions(
    allEventRows,
    activityDrafts,
    types.includes('events'),
  );
  const decisionSummary = selectSpondDecisionSummary(memberRows, eventRows, memberDecisions, activityDecisions);
  const apply = async () => {
    if (!snapshot || !decisionSummary.isReady) return;
    setBusy(true);
    setError(null);
    try {
      const existingSpondEventIds = new Set(activities.flatMap((activity) => activity.spondId ? [activity.spondId] : []));
      const imported = await importSpondSnapshot(squad.id, {
        importId: crypto.randomUUID(), spondGroupId: snapshot.group.id, from, to,
        squadUpdatedAt: squad.updatedAt, snapshot,
        members: memberDecisions, activities: activityDecisions,
      });
      await initializeApp();
      const refreshedPlayers = useStore.getState();
      const sourceGuardians = new Map(
        snapshot.group.members.flatMap((member) => member.guardians).map((guardian) => [guardian.id, guardian]),
      );
      const existingGuardians = players
        .flatMap((player) => player.guardians ?? [])
        .filter((guardian, index, all) => all.findIndex((candidate) => candidate.id === guardian.id) === index);

      for (const decision of memberDecisions) {
        if (decision.action !== 'link' || decision.guardianIds.length === 0) continue;
        const player = refreshedPlayers.getPlayerById(decision.memberId);
        if (!player) continue;

        for (const guardianId of decision.guardianIds) {
          const sourceGuardian = sourceGuardians.get(guardianId);
          if (!sourceGuardian || player.guardians?.some((guardian) => guardian.spondId === guardianId)) continue;
          const existingGuardian = existingGuardians.find((guardian) => guardian.spondId === guardianId);
          await addGuardianToPlayer(player.id, existingGuardian
            ? { guardianId: existingGuardian.id }
            : {
                firstName: sourceGuardian.firstName,
                lastName: sourceGuardian.lastName,
                email: sourceGuardian.email,
              });
        }
      }
      if (defaultActivityLimits) {
        const newlyCreatedActivities = useStore.getState().activities.filter((activity) => (
          activity.spondId
          && !existingSpondEventIds.has(activity.spondId)
          && (activity.kind === 'match' || activity.kind === 'tournament')
        ));
        for (const activity of newlyCreatedActivities) {
          await updateActivityRecord(activity.id, defaultActivityLimits);
        }
      }
      clientRef.current?.dispose();
      clientRef.current = null;
      const syncResult: SpondSyncResult = {
        created: imported.created,
        updated: imported.updated,
        linked: imported.linked,
      };
      setSyncResult(syncResult);
      setStep('results');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const linkGroup = async () => {
    if (!groupId || busy) return;
    setBusy(true);
    setError(null);
    try {
      await linkSquadToSpond(squad.id, squad.name, selectedSubGroupId || groupId);
      await initializeApp();
      clientRef.current?.dispose();
      clientRef.current = null;
      setStep('linked');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const stepTitle = noChanges && step === 'results'
    ? t('spondSync.wizard.steps.noChanges')
    : t(`spondSync.wizard.steps.${step}`);

  return (
    <Page width="medium">
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>
            {t(isEventOnly ? "spondSync.eventsTitle" : isPlayerOnly ? "spondSync.playersTitle" : "spondSync.title")}
          </PageTitle>
          <PageDescription>{stepTitle}</PageDescription>
        </PageHeaderContent>
        <PageActions>
        <Button variant="secondary" onClick={() => navigate(closePath)}>{t("common.actions.close")}</Button>
        </PageActions>
      </PageHeader>
      <div className="spond-wizard-progress" aria-label={t("spondSync.wizard.progress")}>
        {progressSteps.map((item, index) => (
          <div
            key={item}
            className={`spond-wizard-progress-segment ${item === step ? "spond-wizard-progress-segment--active" : index < progressSteps.indexOf(step) ? "spond-wizard-progress-segment--complete" : ""}`}
          />
        ))}
      </div>
      {error && <Alert className="spond-wizard-error">{error}</Alert>}
      <Card>
        <CardBody className="spond-wizard-body">
          <Stack>
          <CardTitle>{stepTitle}</CardTitle>
          {step === "credentials" && (
            <SpondCredentialsStep
              email={email}
              password={password}
              busy={busy}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onNext={() => void connect()}
            />
          )}
          {step === "group" && (
            <SpondGroupStep
              groups={groups}
              groupId={groupId}
              onGroupChange={selectGroup}
              onBack={previousStep}
              onNext={() => void linkGroup()}
            />
          )}
          {step === "range" && isEventOnly && (
            <SpondImportTypesStep
              scope="events"
              groups={groups}
              groupId={groupId}
              selectedSubGroupId={selectedSubGroupId}
              subGroupSelectionLocked
              onSubGroupSelectionChange={setSelectedSubGroupId}
              types={['events']}
              periods={periods}
              periodId={periodId}
              from={from}
              to={to}
              dateRangeError={dateRangeError}
              busy={busy}
              onToggleType={() => undefined}
              onPeriodChange={updatePeriod}
              onFromChange={(nextFrom) => { setPeriodId(''); setFrom(nextFrom); }}
              onToChange={(nextTo) => { setPeriodId(''); setTo(nextTo); }}
              onBack={previousStep}
              onNext={() => void loadSnapshot()}
            />
          )}
          {step === "diff" && isPlayerOnly && (
            <Stack gap="lg">
              {memberRows.length === 0 && guardianRows.length === 0 ? (
                <EmptyState>{t('spondSync.wizard.noChanges')}</EmptyState>
              ) : (
                <>
                  <SpondPlayersReviewStep
                    rows={memberRows}
                    drafts={memberDrafts}
                    players={players}
                    issues={decisionSummary.memberIssues}
                    onSelectAll={() => setPlayerSelection(true)}
                    onSelectNone={() => setPlayerSelection(false)}
                    onDraftChange={updateMember}
                    onBack={previousStep}
                    onNext={() => void apply()}
                    showActions={false}
                  />
                  <SpondGuardiansReviewStep rows={guardianRows} onBack={() => undefined} onNext={() => undefined} showActions={false} />
                </>
              )}
              <Button disabled={busy || !decisionSummary.isReady} onClick={() => void apply()}>
                {busy ? t('common.states.processing') : t('spondSync.apply')}
              </Button>
            </Stack>
          )}
          {step === "diff" && isEventOnly && (
            <SpondEventsReviewStep
              rows={visibleEventRows}
              drafts={activityDrafts}
              activities={activities}
              eventFilter={eventFilter}
              issues={decisionSummary.activityIssues}
              onFilterChange={setEventFilter}
              onSelectAll={() => setVisibleEventSelection(true)}
              onSelectNone={() => setVisibleEventSelection(false)}
              onDraftChange={updateActivity}
              onBack={previousStep}
              onNext={() => void apply()}
            />
          )}
          {step === "linked" && (
            <>
              <p className="body-muted">{t('spondSync.wizard.linkedHelp')}</p>
              <Button onClick={() => navigate(closePath, { replace: true })}>{t('common.actions.done')}</Button>
            </>
          )}
          {step === "results" && noChanges && (
            <EmptyState>{t('spondSync.wizard.nothingToImport')}</EmptyState>
          )}
          {step === "results" && !noChanges && syncResult && (
            <>
              <p className="body-muted">{t('spondSync.wizard.resultsHelp')}</p>
              <Stack gap="sm">
                <p>{t('spondSync.wizard.results.created', { count: syncResult.created })}</p>
                <p>{t('spondSync.wizard.results.updated', { count: syncResult.updated })}</p>
                <p>{t('spondSync.wizard.results.linked', { count: syncResult.linked })}</p>
              </Stack>
              <Button onClick={() => navigate(closePath, { replace: true, state: { spondSyncResult: syncResult } })}>{t('common.actions.done')}</Button>
            </>
          )}
          </Stack>
        </CardBody>
      </Card>
    </Page>
  );
}
