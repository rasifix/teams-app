import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Card, CardBody, CardTitle, Page, PageActions, PageDescription, PageHeader, PageHeaderContent, PageTitle, Stack } from '../components/ui';
import {
  SpondCredentialsStep,
  SpondGroupStep,
  SpondImportTypesStep,
} from '../components/spondImport/SpondConnectionSteps';
import SpondEventsReviewStep from '../components/spondImport/SpondEventsReviewStep';
import SpondGuardiansReviewStep from '../components/spondImport/SpondGuardiansReviewStep';
import SpondImportSummaryStep from '../components/spondImport/SpondImportSummaryStep';
import SpondPlayersReviewStep from '../components/spondImport/SpondPlayersReviewStep';
import type { SpondImportType } from '../components/spondImport/types';
import type { SpondSyncResult } from '../components/SpondSyncResultBanner';
import { useAuth } from '../hooks/useAuth';
import { createSpondReadClient, importSpondSnapshot } from '../services/spondService';
import { useActivities, usePlayers, useSfvCatalog, useSquad, useSquadPeriods, useStore, useTrainers } from '../store';
import {
  selectInitialSpondActivityDrafts,
  selectInitialSpondGuardianSelection,
  selectInitialSpondMemberDrafts,
  selectFilteredSpondEventRows,
  selectNextSpondReviewStep,
  selectSpondActionableEventRows,
  selectSpondActionableGuardianRows,
  selectSpondActionableMemberRows,
  selectSpondActivityDecisions,
  selectSpondLinkedGroup,
  selectSpondActivityDraftsWithSelection,
  selectSpondDateRangeError,
  selectSpondDecisionSummary,
  selectSpondEventRows,
  selectSpondGuardianRows,
  selectSpondImportPreview,
  selectSpondMemberRows,
  selectSpondMemberDecisions,
  selectSpondMemberDraftsWithSelection,
  selectSpondReviewSteps,
  selectSpondSyncRange,
  selectSpondWizardProgressSteps,
  type SpondActivityDraft,
  type SpondEventFilter,
  type SpondMemberDraft,
} from '../store/selectors/spondSyncSelectors';
import { selectDefaultActivityLimitsForCategory } from '../store/selectors/sfvCatalogSelectors';
import type { SpondGroupSnapshot, SpondSnapshot } from '../types/spond';
import { canAccessRestrictedManagement } from '../utils/permissions';
import { localDateStartToUtcISOString } from '../utils/dateFormatter';

type ImportType = SpondImportType;
type BaseStep = 'credentials' | 'group' | 'types' | 'summary';
type Step = BaseStep | ImportType;

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
  const closePath = isPlayerOnly ? '/members/players' : isEventOnly ? '/events' : '/squad-settings';
  const { user } = useAuth();
  const squad = useSquad();
  const sfvCatalog = useSfvCatalog();
  const periods = useSquadPeriods();
  const { players } = usePlayers();
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
  const [subGroupSelectionLocked, setSubGroupSelectionLocked] = useState(false);
  const [types, setTypes] = useState<ImportType[]>(isEventOnly ? ['events'] : isPlayerOnly ? ['players', 'guardians'] : ['players', 'guardians', 'events']);
  const [periodId, setPeriodId] = useState('');
  const [from, setFrom] = useState(shiftedDate(-30));
  const [to, setTo] = useState(shiftedDate(180));
  const [snapshot, setSnapshot] = useState<SpondSnapshot | null>(null);
  const [memberDrafts, setMemberDrafts] = useState<Record<string, SpondMemberDraft>>({});
  const [activityDrafts, setActivityDrafts] = useState<Record<string, SpondActivityDraft>>({});
  const [eventFilter, setEventFilter] = useState<SpondEventFilter>('all');
  const [guardianSelection, setGuardianSelection] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    () => selectSpondEventRows(snapshot?.events ?? [], activities, players),
    [snapshot, activities, players],
  );
  const eventRows = useMemo(() => selectSpondActionableEventRows(allEventRows), [allEventRows]);
  const visibleEventRows = useMemo(
    () => selectFilteredSpondEventRows(eventRows, activityDrafts, eventFilter),
    [eventRows, activityDrafts, eventFilter],
  );
  const dateRangeError = selectSpondDateRangeError(from, to);
  const canImport = Boolean(squad && canAccessRestrictedManagement(user, { squad, trainers }));
  const reviewSteps = selectSpondReviewSteps(types);
  const progressSteps = selectSpondWizardProgressSteps(reviewSteps, !isScopedSync) as Step[];
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
    setSelectedSubGroupId(groups.find((group) => group.id === nextGroupId)?.subGroups?.[0]?.id ?? '');
    setSubGroupSelectionLocked(false);
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
        setSubGroupSelectionLocked(Boolean(linkedGroup.subGroupId));
        setStep('types');
        return;
      }
      const preferred = selectSpondLinkedGroup(available, squad.spondId)?.groupId
        ?? (available.length === 1 ? available[0].id : '');
      if (preferred) {
        setGroupId(preferred);
        const linkedGroup = selectSpondLinkedGroup(available, squad.spondId);
        setSelectedSubGroupId(linkedGroup?.subGroupId ?? '');
        setSubGroupSelectionLocked(Boolean(linkedGroup?.subGroupId));
      }
      else {
        setGroupId('');
        setSelectedSubGroupId('');
        setSubGroupSelectionLocked(false);
      }
      setStep(available.length === 1 ? 'types' : 'group');
    } catch (caught) {
      client.dispose();
      clientRef.current = null;
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const loadSnapshot = async () => {
    if (!clientRef.current || !groupId || types.length === 0 || (types.includes('events') && dateRangeError)) return;
    setBusy(true);
    setError(null);
    try {
      const nextSnapshot = await clientRef.current.getSnapshot(
        groupId,
        localDateStartToUtcISOString(from),
        localDateStartToUtcISOString(to),
        selectedSubGroupId || undefined,
      );
      const nextMemberRows = selectSpondActionableMemberRows(selectSpondMemberRows(nextSnapshot.group.members, players));
      const nextGuardianRows = selectSpondActionableGuardianRows(selectSpondGuardianRows(nextSnapshot.group.members, players));
      const nextEventRows = selectSpondActionableEventRows(selectSpondEventRows(nextSnapshot.events, activities, players));
      setSnapshot(nextSnapshot);
      setMemberDrafts(selectInitialSpondMemberDrafts(nextMemberRows));
      setActivityDrafts(selectInitialSpondActivityDrafts(nextEventRows));
      setGuardianSelection(selectInitialSpondGuardianSelection(nextGuardianRows));
      setPassword('');
      const firstReviewStep = reviewSteps.find((reviewStep) => (
        reviewStep === 'players' ? nextMemberRows.length > 0
          : reviewStep === 'guardians' ? nextGuardianRows.length > 0
            : nextEventRows.length > 0
      ));
      setStep(firstReviewStep ?? 'summary');
    } catch (caught) {
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

  const selectPeriod = (nextPeriodId: string) => {
    setPeriodId(nextPeriodId);
    const range = selectSpondSyncRange(periods, nextPeriodId, { from, to });
    setFrom(range.from);
    setTo(range.to);
  };

  const setVisibleEventSelection = (selected: boolean) => {
    setActivityDrafts((current) => selectSpondActivityDraftsWithSelection(current, visibleEventRows, selected));
  };

  const setPlayerSelection = (selected: boolean) => {
    setMemberDrafts((current) => selectSpondMemberDraftsWithSelection(current, memberRows, selected));
  };

  const toggleImportType = (type: Exclude<ImportType, 'guardians'>) => {
    setTypes((current) => {
      if (type === 'players') {
        return current.includes('players')
          ? current.filter((item) => item !== 'players' && item !== 'guardians')
          : [...current, 'players', 'guardians'];
      }
      return current.includes(type) ? current.filter((item) => item !== type) : [...current, type];
    });
  };

  const nextReviewStep = () => {
    setStep(selectNextSpondReviewStep(reviewSteps, step as ImportType));
  };
  const previousStep = () => {
    if (step === 'group') setStep('credentials');
    else if (step === 'types') setStep(isScopedSync || groups.length === 1 ? 'credentials' : 'group');
    else if (step === 'summary') setStep(reviewSteps.at(-1) ?? 'types');
    else {
      const index = reviewSteps.indexOf(step as ImportType);
      setStep(index > 0 ? reviewSteps[index - 1] : 'types');
    }
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
  const importPreview = selectSpondImportPreview(memberRows, guardianRows, eventRows, memberDecisions, activityDecisions);

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
      navigate(closePath, { replace: true, state: { spondSyncResult: syncResult } });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const stepTitle = step === "types"
    ? t(isEventOnly ? "spondSync.wizard.steps.period" : isPlayerOnly ? "spondSync.wizard.steps.playerImport" : "spondSync.wizard.steps.types")
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
              onNext={() => setStep("types")}
            />
          )}
          {step === "types" && (
            <SpondImportTypesStep
              scope={isEventOnly ? "events" : isPlayerOnly ? "players" : "all"}
              groups={groups}
              groupId={groupId}
              selectedSubGroupId={selectedSubGroupId}
              subGroupSelectionLocked={subGroupSelectionLocked}
              onSubGroupSelectionChange={setSelectedSubGroupId}
              types={types}
              periods={periods}
              periodId={periodId}
              from={from}
              to={to}
              dateRangeError={dateRangeError}
              busy={busy}
              onToggleType={toggleImportType}
              onPeriodChange={selectPeriod}
              onFromChange={(date) => { setPeriodId(""); setFrom(date); }}
              onToChange={(date) => { setPeriodId(""); setTo(date); }}
              onBack={previousStep}
              onNext={() => void loadSnapshot()}
            />
          )}
          {step === "players" && (
            <SpondPlayersReviewStep
              rows={memberRows}
              drafts={memberDrafts}
              players={players}
              issues={decisionSummary.memberIssues}
              onSelectAll={() => setPlayerSelection(true)}
              onSelectNone={() => setPlayerSelection(false)}
              onDraftChange={updateMember}
              onBack={previousStep}
              onNext={nextReviewStep}
            />
          )}
          {step === "events" && (
            <SpondEventsReviewStep
              rows={visibleEventRows}
              drafts={activityDrafts}
              activities={activities}
              trainers={trainers}
              eventFilter={eventFilter}
              issues={decisionSummary.activityIssues}
              onFilterChange={setEventFilter}
              onSelectAll={() => setVisibleEventSelection(true)}
              onSelectNone={() => setVisibleEventSelection(false)}
              onDraftChange={updateActivity}
              onBack={previousStep}
              onNext={nextReviewStep}
            />
          )}
          {step === "guardians" && (
            <SpondGuardiansReviewStep
              rows={guardianRows}
              onBack={previousStep}
              onNext={nextReviewStep}
            />
          )}
          {step === "summary" && (
            <SpondImportSummaryStep
              items={importPreview}
              decisionSummary={decisionSummary}
              busy={busy}
              onBack={previousStep}
              onApply={() => void apply()}
            />
          )}
          </Stack>
        </CardBody>
      </Card>
    </Page>
  );
}
