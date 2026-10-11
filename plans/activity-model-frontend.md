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
- [x] F3.1 Types: `Activity` (discriminated by `kind`), invitation (`response` + `declineReason`), attendance, task, training group/unit, team with `responsiblePersonIds`
- [x] F3.2 `activityService` for `/activities` (list, create, update, delete, invitations, selection, selection/sent, teams)
- [x] F3.3 Mapper `activityToEvent` and payload mapper back; decision on invitation status mapping (`declineReason ?? response`) so existing selectors keep working; tests for the mappers (incl. missing optional fields)
- [x] F3.4 Extract the events/activities slice out of `useStore.ts` into its own module; store reads/writes through `activityService` and exposes the same `Event` shape (match + tournament only; training/social are filtered out here)
- [ ] F3.5 Verify all existing store, selector and page behavior unchanged (tests + manual flows at 375px) (automated part green; manual flows at 375px still open)

Step B: migrate the model screen by screen to `Activity`
- [x] F3.6 Store exposes `activities` (all kinds) sorted by `startsAt`; hook `useActivities`; selectors for upcoming/past (`isCompleted`), per kind, selection-sent state, invitation counts and decline reasons, player history rows (with tests)
- [x] F3.7 Create/edit modals: kind picker (match/tournament in this step), match asks opponent + format, tournament asks number of teams, limits prefilled from the format, start date + time instead of date only
- [x] F3.8 `EventsPage`, `EventCard`, `UpcomingEventCard`: kind, start time, location
- [x] F3.9 `EventDetailPage`: match shows its single team inline; tournament keeps the team list
- [x] F3.10 `TeamCard`, `EditTeamModal`: responsible persons (one or more, any squad member) instead of `trainerId`; start time and location as optional overrides, hidden for match
- [x] F3.11 Invitations: accept/decline with optional reason (sick/injured/unavailable); guardian flow unchanged (`InvitePlayersModal`, `PlayerInvitationsCard`)
- [x] F3.12 Selection and lineup (`TeamPlayerSelectionPage`, `TeamLineupPage`, `MatchPlanningPage`): lineup for match only; `selectionSentAt` replaces team status
- [x] F3.13 Shirts, print summary and statistics pages (`AssignShirtsModal`, `TeamPrintSummary`, `StatisticsPage`, `PlayerStatisticsPage`, `TeamSelectionStatisticsPage`) moved to `Activity`; selectors migrated with updated tests
- [x] F3.14 Remove the `activityToEvent` compatibility layer and the old `Event` type once nothing uses them
- [ ] F3.15 i18n en + de; manual test of every flow at 375px (i18n done; manual 375px test still open)

## Phase 4: attendance (admin/trainer only)

- [x] F4.1 Store mutation and service call for `PUT /attendance` (bulk) and per person
- [x] F4.2 Selector for attendance rows and counts, available only after `startsAt` (tests)
- [x] F4.3 Attendance section on past activities (present/absent/excused per invitee); hidden for non-privileged roles
- [x] F4.4 Rename `EventAttendancePage` to avoid confusion (it shows invitations and selection, not actual attendance)
- [x] F4.5 i18n

## Phase 5: tasks (admin/trainer manage, adult members sign up)

- [x] F5.1 Service and store mutations for tasks and signups (sign up, withdraw)
- [x] F5.2 Selector `selectActivityTasks`: open slots, `isFulfilled`, my signups, over-subscription (tests)
- [x] F5.3 Components in their own files: `ActivityTasksCard`, `AddActivityTaskModal`, sign-up button; management actions only for admin/trainer; no sign-up button for guardians-on-behalf
- [x] F5.4 Shown on all activity kinds
- [x] F5.5 i18n

## Phase 6: training and social

- [ ] F6.1 Create/edit training with trainers (one or more, any squad member) and no teams/limits
- [ ] F6.2 Training groups and units UI: split accepted players, move players between units (planning only)
- [ ] F6.3 Selector: accepted players not yet planned, group/unit sizes (tests)
- [ ] F6.4 Social event: invitations, tasks, attendance; no team UI
- [ ] F6.5 Kind filter on the activity list; home "upcoming" shows all kinds
- [ ] F6.6 i18n

## Phase 7: renames and cleanup (mechanical, last)

- [x] F7.1 Rename identifiers: `Group`→`Squad`, `GroupRole`→`SquadRole`, `PlayingMode`→`MatchFormat`, `playingModeId`→`matchFormatId`, `groupService`→`squadService`, store keys (`currentGroup`, `groupId`), routes `/groups/...`→`/squads/...` with redirects
- [x] F7.2 i18n keys and wording in en + de (de: Mannschaft, Spielformat)
- [x] F7.3 Remove legacy usage: no `/events` calls or `trainerId` left; `playingModes` read only as a fallback in `normalizeSquad`; the injured/sick/unavailable values stay in `InvitationStatus` because the UI still uses them (not removed)
- [x] F7.4 Update `specs/domain`, `specs/usecases` (`uc-ev-*` → activity use cases; add tasks, attendance, training, SFV categories), sync OpenAPI
- [x] F7.5 Full typecheck, lint (2 baseline errors), test and build run; dead-key scan not done
- [ ] F7.6 Tell the backend when `/events` and `/groups` traffic has stopped (unblocks backend contract phase BC.1)

## Open questions

| # | Question | Needed by | Status |
|---|---|---|---|
| Q4 | German wording for Squad and MatchFormat | F7.2 | [x] Mannschaft / Spielformat |
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
| 2026-10-09 | Phase 3 step A: F3.1–F3.4 done (`Activity` types, `activityService`, `activityMapper`, event-shaped `eventService` facade, `eventActions` module); F3.5 manual check open |
| 2026-10-09 | Phase 3 step B: F3.6–F3.14 done (store holds `activities`, `Event` type and mapper removed, screens migrated, activity selectors with tests); Q6 assumed admin/trainer only, Q8 assumed fairness stats count match/tournament only; F3.5/F3.15 manual 375px checks open; no UI yet for `markActivitySelectionSent` |
| 2026-10-09 | Phase 4: attendance recorded on Event Detail (admin/trainer, after start) with selector + tests; `PUT /teams` response fix; statistics "Event Attendance" renamed to "Event Participation"; specs updated (event, invitation, UC-EV-010, UC-ST-002); manual 375px check open |
| 2026-10-09 | Phase 5: helper tasks on Event Detail (all kinds): service, store actions, `taskSelectors` + tests, `ActivityTasksCard`, `AddActivityTaskModal`; specs updated (event.md, UC-EV-011); sign-up identifies the user by email via group members; manual check open |
| 2026-10-09 | Phase 7: Group→Squad and PlayingMode→MatchFormat renamed in code, files, routes (`/groups` redirects to `/squads`), i18n (en/de) and specs (`squad.md`, `match-format.md`, `usecases/squad`); UC ids `UC-GR-*` kept; localStorage key kept; F7.6 open until `/events` and `/groups` traffic stops |
