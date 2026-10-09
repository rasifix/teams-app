# Activity domain model: frontend plan (teams-app)

Status legend: `[ ]` not started, `[~]` in progress, `[x]` done, `[!]` blocked.
Overview: [activity-model-overview.md](./activity-model-overview.md).
Backend plan (done through phase 6): `../../teams-api/plans/activity-model-backend.md`.
Target model: `brainstorming/typespec/main.tsp`.

## Starting point

- The backend is expanded and compatible: `/api/groups/...` and `/api/squads/...` serve the same handlers,
  `/events` still works (legacy shape), `/activities` is the new shape, `/api/sfv-categories` exists.
- The frontend still uses only `/api/groups/...` and `/events`; nothing is broken today.
- Size of the frontend change (files touching): Event ~58, invitations ~30, selectedPlayers ~29,
  birthYear ~30, trainerId ~20, PlayingMode ~19, Group ~11, groupId/currentGroup ~12.
- `useStore.ts` is ~2000 lines and event-centric.

## Backend wire contract the frontend targets

- Base path `/api/squads/:squadId/...` (same payloads as `/groups`; squad payload keeps the `Group` shape
  with `playingModes` and the alias `matchFormats`).
- `GET /api/sfv-categories` returns `{ version, source, categories }`; `categories` is keyed by category code
  (`A`, `B`, ..., `FF17`) with `activityType: 'match' | 'tournament'` and an optional single `matchFormat`
  (name, periods, length, minimumPeriodsPerPlayer, playersOnField, min/maxPlayersPerTeam).
  Categories without `matchFormat` (e.g. E, F, G) are tournament-only. Official formats are copied into the
  squad on creation with `origin`.
- Match format fields: `playersOnField?`, `minPlayersPerTeam?`, `maxPlayersPerTeam?`, `origin?` (all optional on legacy formats).
- `Activity`: `id`, `squadId`, `kind` (`match|tournament|training|social`), `name`, `startsAt`, `endsAt?`, `location?`,
  `matchFormatId?`, `opponentName?`, `min/maxPlayersPerTeam?`, `teams[]`, `invitations[]`
  (`response`, `declineReason?`, `respondedBy?`), `selectionSentAt?`, `attendance?[]`
  (`personId`, `present|absent|excused`), `tasks?[]` (`id`, `name`, `description?`, `requiredPeople`,
  `signups[]` of `personId` + `signedUpAt?`, `isFulfilled`), `trainerIds?`, `groups?[]` → `units[]` → `plannedPlayerIds[]`.
- Team: `responsiblePersonIds?` next to legacy `trainerId`; `startTime` still present; `status` still present.
- Routes under `/activities`: list/create/get/update/delete, `PUT /:id/invitations` and `/:id/invitations/:playerId`,
  `GET|PUT /:id/teams`, `PUT /:id/selection`, `PUT /:id/selection/sent`, `PUT /:id/attendance` and `/:id/attendance/:personId`,
  `POST /:id/tasks`, `PUT|DELETE /:id/tasks/:taskId`, `PUT|DELETE /:id/tasks/:taskId/signup`.
- Permissions: attendance and task management are admin/trainer only; adult squad members sign themselves up
  (guardians cannot sign up children); over-subscription is allowed.
- `birthDate` is canonical for players; `birthYear` is returned read-only and deprecated; guardian `userId` is deprecated.
- Gap to check against the model: the catalog has one format per category and an `activityType`; the TypeSpec
  model has `SfvCategory.officialMatchFormats[]`. Treat the API as the truth and update the model docs (F0.2).

## Strategy

Same expand/contract idea on the client. Migrate in small, individually shippable slices; every slice
leaves the app fully working and tests green.

1. **Keep the in-app `Event` shape stable first.** Switch the transport to `/squads` and `/activities`
   behind the service layer with a mapper (`activityToEvent`/`eventToActivityPayload`) so pages, selectors
   and tests keep working unchanged. Only then migrate screens to the `Activity` type one at a time.
2. **New types next to old ones**, not in place; remove old types in the contract phase.
3. **Renames in code are mechanical and last** (Group→Squad, PlayingMode→MatchFormat in identifiers/i18n),
   done with the editor/refactoring tooling, in their own commits, so behavior changes stay reviewable.
4. **New features land behind existing screens** (tasks, attendance, training) only after the activity
   store is in place.

Rules for every task: Zustand store only (components never call services), all texts via react-i18next
with keys in `public/locales/{en,de}/translation.json`, derived data in selectors, every new/changed
selector has tests (happy path, edge cases, fallback), mobile-first Tailwind (375px), small focused
components, typecheck and tests green before ticking a task.

## Phase 0: safety net and alignment

- [x] F0.1 Record baseline: typecheck, lint and full test run green before starting; note current failures if any (tsc clean, 166 tests green, eslint 2 errors + 2 warnings pre-existing)
- [x] F0.2 Update `brainstorming/typespec/main.tsp` and `event-domain-model.puml` to match the real API (Person owned by Squad with `roles`, `SquadMembership` removed; login as association; `SfvCategory` keyed by `code` with `activityType` and optional single `officialMatchFormat`) and re-render
- [x] F0.3 Check `AppInitializer`/store loading flow and list every place that calls `eventService` (inventory for F3) (only `useStore.ts` imports `eventService`)
- [x] F0.4 Sync `specs/api/openapi-spec.yaml` from `teams-api/specs/openapi-spec.yaml`

## Phase 1: transport switch and cleanup (no visible change)

- [x] F1.1 `apiClient.getGroupEndpoint` → `/api/squads/...` (single switch point, `SQUADS_PATH` constant); services and their tests adapted
- [x] F1.2 Remove `birthYear` from `Player` and all usages: `birthDate` required in the type; `getBirthYear` util in `src/utils/birthDate.ts`; import and add-player flows write `birthDate`
- [x] F1.3 Removed `Guardian.userId` from the frontend: login identity is the email, a guardian is identified by its member `id`; linked vs. documented-only is `isDocumentedOnly`. Backend `userId` (never populated) to be removed in BC.3.
- [x] F1.4 Smoke test: login, squad switch, members, events, shirt sets, statistics (automated: tsc, 168 tests, eslint at baseline; manual smoke pending)

## Phase 2: SFV catalog and match formats

- [x] F2.1 Types for the catalog and extended match format fields (`playersOnField`, `minPlayersPerTeam`, `maxPlayersPerTeam`, `origin`)
- [x] F2.2 `sfvService` + store slice, loaded in `AppInitializer` (static data, cache for the session)
- [x] F2.3 Selector for category options and the suggested format/activity type of a category (tests: tournament-only category, unknown code, missing catalog)
- [x] F2.4 Squad creation modal: category picker driven by the catalog; hint that official formats are created for the chosen category; tournament-only categories explained
- [x] F2.5 Match format modal: new fields, "official" badge when `origin` is set, validation min ≤ max
- [x] F2.6 Selector for default activity limits from the chosen match format (fallbacks for legacy formats without the new fields)
- [x] F2.7 i18n en + de

## Phase 3: activities

Step A: transport and compatibility mapper (no UI change)
- [ ] F3.1 Types: `Activity` (discriminated by `kind`), invitation (`response` + `declineReason`), attendance, task, training group/unit, team with `responsiblePersonIds`
- [ ] F3.2 `activityService` for `/activities` (list, create, update, delete, invitations, selection, selection/sent, teams)
- [ ] F3.3 Mapper `activityToEvent` and payload mapper back; decision on invitation status mapping (`declineReason ?? response`) so existing selectors keep working; tests for the mappers (incl. missing optional fields)
- [ ] F3.4 Extract the events/activities slice out of `useStore.ts` into its own module; store reads/writes through `activityService` and exposes the same `Event` shape (match + tournament only; training/social are filtered out here)
- [ ] F3.5 Verify all existing store, selector and page behavior unchanged (tests + manual flows at 375px)

Step B: migrate the model screen by screen to `Activity`
- [ ] F3.6 Store exposes `activities` (all kinds) sorted by `startsAt`; hook `useActivities`; selectors for upcoming/past (`isCompleted`), per kind, selection-sent state, invitation counts and decline reasons, player history rows (with tests)
- [ ] F3.7 Create/edit modals: kind picker (match/tournament in this step), match asks opponent + format, tournament asks number of teams, limits prefilled from the format, start date + time instead of date only
- [ ] F3.8 `EventsPage`, `EventCard`, `UpcomingEventCard`: kind, start time, location
- [ ] F3.9 `EventDetailPage`: match shows its single team inline; tournament keeps the team list
- [ ] F3.10 `TeamCard`, `EditTeamModal`: responsible persons (one or more, any squad member) instead of `trainerId`; start time and location as optional overrides, hidden for match
- [ ] F3.11 Invitations: accept/decline with optional reason (sick/injured/unavailable); guardian flow unchanged (`InvitePlayersModal`, `PlayerInvitationsCard`)
- [ ] F3.12 Selection and lineup (`TeamPlayerSelectionPage`, `TeamLineupPage`, `MatchPlanningPage`): lineup for match only; `selectionSentAt` replaces team status
- [ ] F3.13 Shirts, print summary and statistics pages (`AssignShirtsModal`, `TeamPrintSummary`, `StatisticsPage`, `PlayerStatisticsPage`, `TeamSelectionStatisticsPage`) moved to `Activity`; selectors migrated with updated tests
- [ ] F3.14 Remove the `activityToEvent` compatibility layer and the old `Event` type once nothing uses them
- [ ] F3.15 i18n en + de; manual test of every flow at 375px

## Phase 4: attendance (admin/trainer only)

- [ ] F4.1 Store mutation and service call for `PUT /attendance` (bulk) and per person
- [ ] F4.2 Selector for attendance rows and counts, available only after `startsAt` (tests)
- [ ] F4.3 Attendance section on past activities (present/absent/excused per invitee); hidden for non-privileged roles
- [ ] F4.4 Rename `EventAttendancePage` to avoid confusion (it shows invitations and selection, not actual attendance)
- [ ] F4.5 i18n

## Phase 5: tasks (admin/trainer manage, adult members sign up)

- [ ] F5.1 Service and store mutations for tasks and signups (sign up, withdraw)
- [ ] F5.2 Selector `selectActivityTasks`: open slots, `isFulfilled`, my signups, over-subscription (tests)
- [ ] F5.3 Components in their own files: `ActivityTasksCard`, `AddActivityTaskModal`, sign-up button; management actions only for admin/trainer; no sign-up button for guardians-on-behalf
- [ ] F5.4 Shown on all activity kinds
- [ ] F5.5 i18n

## Phase 6: training and social

- [ ] F6.1 Create/edit training with trainers (one or more, any squad member) and no teams/limits
- [ ] F6.2 Training groups and units UI: split accepted players, move players between units (planning only)
- [ ] F6.3 Selector: accepted players not yet planned, group/unit sizes (tests)
- [ ] F6.4 Social event: invitations, tasks, attendance; no team UI
- [ ] F6.5 Kind filter on the activity list; home "upcoming" shows all kinds
- [ ] F6.6 i18n

## Phase 7: renames and cleanup (mechanical, last)

- [ ] F7.1 Rename identifiers: `Group`→`Squad`, `GroupRole`→`SquadRole`, `PlayingMode`→`MatchFormat`, `playingModeId`→`matchFormatId`, `groupService`→`squadService`, store keys (`currentGroup`, `groupId`), routes `/groups/...`→`/squads/...` with redirects
- [ ] F7.2 i18n keys and wording in en + de (needs Q4)
- [ ] F7.3 Remove legacy usage: `/events` calls, `trainerId`, invitation status values injured/sick/unavailable as statuses, `playingModes` alias reads
- [ ] F7.4 Update `specs/domain`, `specs/usecases` (`uc-ev-*` → activity use cases; add tasks, attendance, training, SFV categories), sync OpenAPI
- [ ] F7.5 Remove dead i18n keys; full typecheck, lint and test run
- [ ] F7.6 Tell the backend when `/events` and `/groups` traffic has stopped (unblocks backend contract phase BC.1)

## Open questions

| # | Question | Needed by | Status |
|---|---|---|---|
| Q4 | German wording for Squad and MatchFormat | F7.2 | [ ] |
| Q6 | Which role may create each activity kind and edit responsible persons (squad `trainer`/`admin` only?) | F3.7 | [ ] |
| Q7 | Zero-team legacy events: how are they shown/handled in the UI? | F3.9 | [ ] |
| Q8 | Statistics: do training/social activities count toward fairness metrics, or are they excluded? | F3.13, F6 | [ ] |

## Risks

- Statistics and history selectors rely on the legacy invitation status; the split to response + reason touches them (F3.3, F3.13).
- Many pages are event-centric; migrate screen by screen and keep the compatibility mapper until the last one is done.
- Backend still returns both representations; avoid reading deprecated fields in new code.
- Large mechanical rename (F7.1) should run when no feature branches are open.

## Change log

| Date | Change |
|---|---|
| 2026-10-09 | Plan created against the expanded backend |
| 2026-10-09 | F0.1/F0.3/F0.4, F1.1, F1.2 done; F1.3 deferred, F1.4 (manual) open |
| 2026-10-09 | F0.2 done: model docs aligned with the API |
| 2026-10-09 | F1.3 resolved (email is identity, `userId` removed); phase 2 done (F2.1–F2.7); F2.6 selector wired in phase 3 |
