import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, CardTitle } from '../components/ui';
import Button from '../components/ui/Button';
import type { SpondSyncResult } from '../components/SpondSyncResultBanner';
import { useAuth } from '../hooks/useAuth';
import { createSpondReadClient, importSpondSnapshot } from '../services/spondService';
import { useActivities, usePlayers, useSquad, useSquadPeriods, useStore, useTrainers } from '../store';
import {
  selectInitialSpondActivityDrafts,
  selectInitialSpondMemberDrafts,
  selectFilteredSpondEventRows,
  selectNextSpondReviewStep,
  selectSpondActionableEventRows,
  selectSpondActivityDraftsWithSelection,
  selectSpondDateRangeError,
  selectSpondDecisionSummary,
  selectSpondEventRows,
  selectSpondGuardianRows,
  selectSpondImportPreview,
  selectSpondMemberRows,
  selectSpondMemberDraftsWithSelection,
  selectSpondSyncRange,
  selectSpondWizardProgressSteps,
  type SpondActivityDraft,
  type SpondEventFilter,
  type SpondMemberDraft,
} from '../store/selectors/spondSyncSelectors';
import type { ActivityKind } from '../types';
import type { SpondActivityDecision, SpondMemberDecision, SpondSnapshot } from '../types/spond';
import { canAccessRestrictedManagement } from '../utils/permissions';
import { formatWallClockDateTime, localDateStartToUtcISOString } from '../utils/dateFormatter';

type ImportType = 'players' | 'guardians' | 'events';
type BaseStep = 'credentials' | 'group' | 'types' | 'summary';
type Step = BaseStep | ImportType;

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);
const shiftedDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return isoDate(date);
};

export default function SpondImportPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEventOnly = searchParams.get('scope') === 'events';
  const isPlayerOnly = searchParams.get('scope') === 'players';
  const isScopedSync = isEventOnly || isPlayerOnly;
  const closePath = isPlayerOnly ? '/members/players' : isEventOnly ? '/events' : '/match-planning';
  const { user } = useAuth();
  const squad = useSquad();
  const periods = useSquadPeriods();
  const { players } = usePlayers();
  const { trainers } = useTrainers();
  const { activities } = useActivities();
  const initializeApp = useStore((state) => state.initializeApp);
  const clientRef = useRef<ReturnType<typeof createSpondReadClient> | null>(null);
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [groupId, setGroupId] = useState(squad?.spondId ?? '');
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

  const memberRows = useMemo(() => selectSpondMemberRows(snapshot?.group.members ?? [], players), [snapshot, players]);
  const guardianRows = useMemo(() => selectSpondGuardianRows(snapshot?.group.members ?? [], players), [snapshot, players]);
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
  const reviewSteps = types.filter((type) => type !== 'guardians' || types.includes('players'));
  const progressSteps = selectSpondWizardProgressSteps(reviewSteps, !isScopedSync) as Step[];

  if (!squad) return <Navigate to="/squads" replace />;
  if (!canImport) return <Navigate to={closePath} replace />;
  if (isScopedSync && !squad.spondId?.trim()) return <Navigate to={closePath} replace />;

  const errorMessage = (caught: unknown): string => {
    const code = caught instanceof Error ? caught.message : 'SPOND_REQUEST_FAILED';
    const key = `spondSync.errors.${code}`;
    const translated = t(key);
    return translated === key ? t('spondSync.errors.generic') : translated;
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
      const summaries = available.map(({ id, name }) => ({ id, name }));
      setGroups(summaries);
      if (isScopedSync) {
        const linkedGroupId = squad.spondId?.trim();
        if (!linkedGroupId || !summaries.some((group) => group.id === linkedGroupId)) {
          throw new Error('SPOND_LINKED_GROUP_NOT_FOUND');
        }
        setGroupId(linkedGroupId);
        setStep('types');
        return;
      }
      const preferred = squad.spondId && summaries.some((group) => group.id === squad.spondId)
        ? squad.spondId
        : summaries.length === 1 ? summaries[0].id : '';
      setGroupId(preferred);
      setStep(summaries.length === 1 ? 'types' : 'group');
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
      );
      const nextMemberRows = selectSpondMemberRows(nextSnapshot.group.members, players);
      const nextGuardianRows = selectSpondGuardianRows(nextSnapshot.group.members, players);
      const nextEventRows = selectSpondActionableEventRows(selectSpondEventRows(nextSnapshot.events, activities, players));
      setSnapshot(nextSnapshot);
      setMemberDrafts(selectInitialSpondMemberDrafts(nextMemberRows));
      setActivityDrafts(selectInitialSpondActivityDrafts(nextEventRows));
      setGuardianSelection(Object.fromEntries(nextGuardianRows.map((row) => [row.source.id, !row.linkedGuardian])));
      setPassword('');
      setStep(reviewSteps[0] ?? 'summary');
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

  const buildMemberDecisions = (): SpondMemberDecision[] => memberRows.flatMap<SpondMemberDecision>((row) => {
    const draft = memberDrafts[row.source.id];
    if (!types.includes('players') || !draft || draft.action === 'skip') return [{ action: 'skip', spondMemberId: row.source.id }];
    if (draft.action === 'link') return [{ action: 'link', spondMemberId: row.source.id, memberId: draft.memberId }];
    const guardianIds = types.includes('guardians')
      ? row.source.guardians.filter((guardian) => guardianSelection[guardian.id]).map((guardian) => guardian.id)
      : [];
    return [{ action: 'create-player', spondMemberId: row.source.id, birthDate: draft.birthDate, level: draft.level, status: 'active', guardianIds }];
  });

  const buildActivityDecisions = (): SpondActivityDecision[] => allEventRows.flatMap<SpondActivityDecision>((row) => {
    if (!row.needsSync) return [{ action: 'skip', spondEventId: row.source.id }];
    const draft = activityDrafts[row.source.id];
    if (!types.includes('events') || !draft || draft.action === 'skip') return [{ action: 'skip', spondEventId: row.source.id }];
    if (draft.action === 'link') return [{ action: 'link', spondEventId: row.source.id, activityId: draft.activityId }];
    const needsTeam = draft.kind === 'match' || draft.kind === 'tournament';
    return [{
      action: 'create', spondEventId: row.source.id, kind: draft.kind,
      trainerIds: draft.kind === 'training' ? draft.trainerIds : undefined,
      teams: needsTeam && draft.teamName.trim() ? [{ name: draft.teamName.trim(), strength: 2, selectedPlayers: [] }] : undefined,
    }];
  });

  const memberDecisions = buildMemberDecisions();
  const activityDecisions = buildActivityDecisions();
  const decisionSummary = selectSpondDecisionSummary(memberRows, eventRows, memberDecisions, activityDecisions);
  const importPreview = selectSpondImportPreview(memberRows, guardianRows, eventRows, memberDecisions, activityDecisions);

  const apply = async () => {
    if (!snapshot || !decisionSummary.isReady) return;
    setBusy(true);
    setError(null);
    try {
      const imported = await importSpondSnapshot(squad.id, {
        importId: crypto.randomUUID(), spondGroupId: snapshot.group.id, from, to,
        squadUpdatedAt: squad.updatedAt, snapshot,
        members: memberDecisions, activities: activityDecisions,
      });
      await initializeApp();
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

  const stepTitle = step === 'types'
    ? t(isEventOnly ? 'spondSync.wizard.steps.period' : isPlayerOnly ? 'spondSync.wizard.steps.playerImport' : 'spondSync.wizard.steps.types')
    : t(`spondSync.wizard.steps.${step}`);
  const periodSelector = periods.length > 0 && (
    <div>
      <label className="form-label" htmlFor="spond-period">{t('spondSync.period')}</label>
      <select id="spond-period" className="form-select" value={periodId} onChange={(event) => selectPeriod(event.target.value)}>
        <option value="">{t('spondSync.customRange')}</option>
        {periods.map((period) => <option key={period.id} value={period.id}>{period.name} · {period.startDate} – {period.endDate}</option>)}
      </select>
    </div>
  );
  return (
    <div className="page-container max-w-5xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">{t(isEventOnly ? 'spondSync.eventsTitle' : isPlayerOnly ? 'spondSync.playersTitle' : 'spondSync.title')}</h1><p className="mt-1 text-sm text-gray-600">{stepTitle}</p></div>
        <Button variant="secondary" onClick={() => navigate(closePath)}>{t('common.actions.close')}</Button>
      </div>
      <div className="mb-6 flex gap-2" aria-label={t('spondSync.wizard.progress')}>
        {progressSteps.map((item, index) => <div key={item} className={`h-2 flex-1 rounded ${item === step ? 'bg-orange-600' : index < progressSteps.indexOf(step) ? 'bg-orange-300' : 'bg-gray-200'}`} />)}
      </div>
      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <Card><CardBody className="space-y-5 p-5 lg:p-8"><CardTitle>{stepTitle}</CardTitle>
        {step === 'credentials' && <><p className="text-sm text-gray-600">{t('spondSync.description')}</p><div><label className="form-label" htmlFor="spond-email">{t('spondSync.email')}</label><input id="spond-email" className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></div><div><label className="form-label" htmlFor="spond-password">{t('spondSync.password')}</label><input id="spond-password" className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div><div className="flex justify-end"><Button disabled={busy || !email.trim() || !password} onClick={() => void connect()}>{busy ? t('common.states.processing') : t('spondSync.wizard.next')}</Button></div></>}
        {step === 'group' && <><div className="grid gap-3 sm:grid-cols-2">{groups.map((group) => <label key={group.id} className={`cursor-pointer rounded border p-4 ${groupId === group.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}><input className="mr-3" type="radio" name="spond-group" checked={groupId === group.id} onChange={() => setGroupId(group.id)} />{group.name}</label>)}</div><WizardActions back={previousStep} next={() => setStep('types')} nextDisabled={!groupId} t={t} /></>}
        {step === 'types' && <>{isEventOnly ? <><p className="text-sm text-gray-600">{t('spondSync.wizard.periodHelp')}</p>{periodSelector}</> : isPlayerOnly ? <p className="text-sm text-gray-600">{t('spondSync.wizard.playerImportHelp')}</p> : <><p className="text-sm text-gray-600">{t('spondSync.wizard.typesHelp')}</p><div className="grid gap-3 sm:grid-cols-2">{(['players', 'events'] as const).map((type) => <label key={type} className={`cursor-pointer rounded border p-4 ${types.includes(type) ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}><input type="checkbox" className="mr-3" checked={types.includes(type)} onChange={() => toggleImportType(type)} />{t(`spondSync.wizard.importTypes.${type}`)}</label>)}</div></>}{!isEventOnly && types.includes('events') && periodSelector}{types.includes('events') && <div className="grid gap-3 sm:grid-cols-2"><div><label className="form-label" htmlFor="spond-from">{t('filters.from')}</label><input id="spond-from" className="form-input" type="date" value={from} onChange={(e) => { setPeriodId(''); setFrom(e.target.value); }} /></div><div><label className="form-label" htmlFor="spond-to">{t('filters.to')}</label><input id="spond-to" className="form-input" type="date" value={to} onChange={(e) => { setPeriodId(''); setTo(e.target.value); }} /></div></div>}{types.includes('events') && dateRangeError && <p className="text-sm text-red-700">{t(`spondSync.dateErrors.${dateRangeError}`)}</p>}<WizardActions back={previousStep} next={() => void loadSnapshot()} nextDisabled={busy || types.length === 0 || (types.includes('events') && Boolean(dateRangeError))} busy={busy} t={t} /></>}
        {step === 'players' && <><div className="flex flex-wrap items-start justify-between gap-3"><p className="text-sm text-gray-600">{t('spondSync.wizard.playersHelp')}</p>{memberRows.length > 0 && <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setPlayerSelection(true)}>{t('common.actions.selectAll')}</Button><Button variant="secondary" size="sm" onClick={() => setPlayerSelection(false)}>{t('common.actions.selectNone')}</Button></div>}</div><div className="space-y-3">{memberRows.map((row) => { const draft = memberDrafts[row.source.id]; const selected = Boolean(draft && draft.action !== 'skip'); const match = row.linkedPlayer ?? row.suggestedPlayers[0]; return <div key={row.source.id} className="rounded border p-4"><label className="flex items-start gap-3"><input type="checkbox" className="mt-1" checked={selected} onChange={(e) => updateMember(row.source.id, { action: e.target.checked ? (match ? 'link' : 'create-player') : 'skip', memberId: e.target.checked ? match?.id ?? '' : '' })} /><span className="flex-1"><span className="font-medium">{row.source.firstName} {row.source.lastName}</span>{row.linkedPlayer && <span className="block text-sm text-gray-600">{t('spondSync.wizard.alreadyLinked', { name: `${row.linkedPlayer.firstName} ${row.linkedPlayer.lastName}` })}</span>}</span></label>{selected && !row.linkedPlayer && <div className="mt-3 grid gap-3 sm:grid-cols-2"><select className="form-select" value={draft.action} onChange={(e) => updateMember(row.source.id, { action: e.target.value as SpondMemberDraft['action'] })}><option value="link">{t('spondSync.linkExisting')}</option><option value="create-player">{t('spondSync.createPlayer')}</option></select>{draft.action === 'link' ? <select className="form-select" value={draft.memberId} onChange={(e) => updateMember(row.source.id, { memberId: e.target.value })}>{players.map((player) => <option key={player.id} value={player.id}>{player.firstName} {player.lastName}</option>)}</select> : <><input aria-label={t('spondSync.birthDate')} className="form-input" type="date" value={draft.birthDate} onChange={(e) => updateMember(row.source.id, { birthDate: e.target.value })} /><select aria-label={t('spondSync.level')} className="form-select" value={draft.level} onChange={(e) => updateMember(row.source.id, { level: Number(e.target.value) })}>{[1,2,3,4,5].map((level) => <option key={level} value={level}>{t('spondSync.levelValue', { level })}</option>)}</select></>}</div>}{(decisionSummary.memberIssues[row.source.id] ?? []).map((field) => <p key={field} className="mt-2 text-sm text-red-700">{t(`spondSync.requiredFields.${field}`)}</p>)}</div>; })}</div><WizardActions back={previousStep} next={nextReviewStep} nextDisabled={Object.keys(decisionSummary.memberIssues).length > 0} t={t} /></>}
        {step === 'guardians' && <><p className="text-sm text-gray-600">{t('spondSync.wizard.guardiansHelp')}</p><div className="space-y-3">{guardianRows.map((row) => <div key={row.source.id} className="rounded border p-4"><span className="min-w-0"><span className="font-medium">{row.source.firstName} {row.source.lastName}</span><span className="block text-sm text-gray-600">{t('spondSync.wizard.guardianChildren', { count: row.childNames.length, names: row.childNames.join(', ') })}</span><span className="block text-sm text-gray-600">{t('spondSync.wizard.guardianEmail', { email: row.source.email ?? t('members.noEmail') })}</span>{row.linkedGuardian && <span className="block text-sm text-gray-600">{t('spondSync.wizard.alreadyExists', { name: `${row.linkedGuardian.firstName} ${row.linkedGuardian.lastName}` })}</span>}</span></div>)}</div><WizardActions back={previousStep} next={nextReviewStep} t={t} /></>}
        {step === 'events' && <><p className="text-sm text-gray-600">{t('spondSync.wizard.eventsHelp')}</p><div className="flex flex-wrap items-end justify-between gap-3"><div><label className="form-label" htmlFor="spond-event-filter">{t('spondSync.eventFilter.label')}</label><select id="spond-event-filter" className="form-select" value={eventFilter} onChange={(event) => setEventFilter(event.target.value as SpondEventFilter)}><option value="all">{t('spondSync.eventFilter.all')}</option><option value="training">{t('spondSync.eventFilter.training')}</option><option value="match">{t('spondSync.eventFilter.match')}</option></select></div>{visibleEventRows.length > 0 && <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setVisibleEventSelection(true)}>{t('common.actions.selectAll')}</Button><Button variant="secondary" size="sm" onClick={() => setVisibleEventSelection(false)}>{t('common.actions.selectNone')}</Button></div>}</div>{visibleEventRows.length === 0 ? <div className="rounded bg-gray-50 p-4 text-sm text-gray-600">{t('spondSync.wizard.noEventsToSync')}</div> : <div className="space-y-3">{visibleEventRows.map((row) => { const draft = activityDrafts[row.source.id]; const selected = Boolean(draft && draft.action !== 'skip'); const match = row.linkedActivity ?? (row.suggestedActivities.length === 1 ? row.suggestedActivities[0] : undefined); return <div key={row.source.id} className="rounded border p-4"><label className="flex items-start gap-3"><input className="mt-1" type="checkbox" checked={selected} onChange={(e) => updateActivity(row.source.id, { action: e.target.checked ? (match ? 'link' : 'create') : 'skip', activityId: e.target.checked ? match?.id ?? '' : '' })} /><span className="flex-1"><span className="font-medium">{row.source.name}</span><span className="block text-sm text-gray-600">{formatWallClockDateTime(row.source.startsAt, i18n.language)}</span></span></label>{selected && !row.linkedActivity && <div className="mt-3 grid gap-3 sm:grid-cols-2"><select className="form-select" value={draft.action} onChange={(e) => updateActivity(row.source.id, { action: e.target.value as SpondActivityDraft['action'] })}><option value="link">{t('spondSync.linkExisting')}</option><option value="create">{t('spondSync.createActivity')}</option></select>{draft.action === 'link' ? <select className="form-select" value={draft.activityId} onChange={(e) => updateActivity(row.source.id, { activityId: e.target.value })}>{activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.name} · {activity.startsAt.slice(0, 10)}</option>)}</select> : <><select className="form-select" value={draft.kind} onChange={(e) => updateActivity(row.source.id, { kind: e.target.value as ActivityKind })}>{(['match','tournament','training','social'] as ActivityKind[]).map((kind) => <option key={kind} value={kind}>{t(`activity.kinds.${kind}`)}</option>)}</select>{draft.kind === 'training' && <select className="form-select" value={draft.trainerIds[0] ?? ''} onChange={(e) => updateActivity(row.source.id, { trainerIds: e.target.value ? [e.target.value] : [] })}><option value="">{t('spondSync.selectTrainer')}</option>{trainers.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.firstName} {trainer.lastName}</option>)}</select>}{(['match','tournament'] as ActivityKind[]).includes(draft.kind) && <input className="form-input" value={draft.teamName} placeholder={t('spondSync.teamName')} onChange={(e) => updateActivity(row.source.id, { teamName: e.target.value })} />}</>}</div>}{(decisionSummary.activityIssues[row.source.id] ?? []).map((field) => <p key={field} className="mt-2 text-sm text-red-700">{t(`spondSync.requiredFields.${field}`)}</p>)}</div>; })}</div>}<WizardActions back={previousStep} next={nextReviewStep} nextDisabled={Object.keys(decisionSummary.activityIssues).length > 0} t={t} /></>}
        {step === 'summary' && <><p className="text-sm text-gray-600">{t('spondSync.wizard.summaryHelp')}</p>{!decisionSummary.isReady && <p className="text-sm text-red-700">{t('spondSync.requiredFields.summary')}</p>}{importPreview.length === 0 ? <div className="rounded bg-gray-50 p-4 text-sm text-gray-600">{t('spondSync.wizard.noChanges')}</div> : <div className="divide-y rounded border">{importPreview.map((item) => <div key={item.id} className="flex items-start gap-3 p-4"><span className={`mt-0.5 rounded px-2 py-0.5 text-xs font-medium ${item.action === 'create' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{t(`spondSync.wizard.actions.${item.action}`)}</span><div><p className="font-medium">{item.sourceName}</p><p className="text-sm text-gray-600">{t(`spondSync.wizard.preview.${item.kind}.${item.action}`, { target: item.targetName, changes: item.changes?.map((change) => t(`spondSync.wizard.changedFields.${change}`)).join(', ') })}</p></div></div>)}</div>}<WizardActions back={previousStep} next={() => void apply()} nextDisabled={importPreview.length === 0 || !decisionSummary.isReady} busy={busy} nextLabel={t('spondSync.apply')} t={t} /></>}
      </CardBody></Card>
    </div>
  );
}

function WizardActions({ back, next, nextDisabled = false, busy = false, nextLabel, t }: { back: () => void; next: () => void; nextDisabled?: boolean; busy?: boolean; nextLabel?: string; t: (key: string) => string }) {
  return <div className="flex justify-between border-t pt-5"><Button variant="secondary" onClick={back}>{t('common.actions.back')}</Button><Button disabled={nextDisabled || busy} onClick={next}>{busy ? t('common.states.processing') : nextLabel ?? t('spondSync.wizard.next')}</Button></div>;
}
