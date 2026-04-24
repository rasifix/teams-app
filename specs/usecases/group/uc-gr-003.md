# UC-GR-003 - Manage Players

## Goal

Allow an authenticated user with selected group context to manage player records
for the group.

## Scope

This use case covers:
- viewing the player list in Members -> Players,
- filtering players by level and year,
- creating a new player,
- importing players and guardians from Spond CSV,
- opening a player detail view,
- updating a player,
- setting a player to inactive from list or detail flow.

This use case does not cover:
- trainer management,
- guardian management,
- invitations and event attendance updates,
- team assignment or shirt assignment.

## Primary Actor

Authenticated User

## Supporting Actors

- Members page (players tab)
- Add/Edit player modal
- Player detail page
- Zustand store player actions
- Members API endpoints

## Preconditions

- User is authenticated.
- A group is selected in app state.
- Members data can be loaded for the selected group.

## Trigger

The user opens Members and uses the Players tab, or opens a specific player
detail page.

## Input Data

Required player fields:
- firstName
- lastName
- birthDate
- level (1..5)
- status: active, trial, inactive

Optional player fields:
- preferredShirtNumber

Derived field:
- birthYear (derived from birthDate in UI before persistence)

## Main Success Scenario

1. User opens Members Players tab.
2. System shows players sorted alphabetically by lastName + firstName.
3. User can filter displayed players by one or more levels and optional year.
4. User presses Add.
5. System opens Add New Player modal.
6. User enters valid player data and submits (status must be either active or trial).
7. System derives birthYear from birthDate and sends create request with role
   player.
8. Store appends the created player and keeps list alphabetically sorted.
9. Modal closes.
10. User can open a player card to see player detail.
11. On player detail, user can open Edit, update fields, and save.
12. System persists update and refreshes player state in store.
13. User can set a player inactive from Members list or Player detail after
    confirmation.
14. System persists status update and keeps player in store for historical data.

## Main Success Scenario - Import Players And Guardians (CSV)

1. User opens Members > Players and starts Import.
2. System parses Spond CSV rows and computes import diff.
3. System hides unchanged existing-player rows from preview.
4. User reviews actionable rows and confirms Apply.
5. For each row, system applies add-only changes:
   - creates new player when no match exists and birth date is available,
   - updates existing player birth date when player is matched,
   - links or creates guardian references according to matching rules.
6. System deduplicates guardian additions per player and across duplicate CSV
   rows targeting the same existing player.
7. System shows import summary with processed rows and applied changes.

## Alternative Flows

### A1 - Missing Required Input During Create Or Edit

1. User submits without required fields.
2. Browser form constraints and modal guard prevent persistence request.
3. Modal remains open for correction.

### A2 - API Or Network Failure During Create/Update/Set Inactive

1. Persistence request fails.
2. Store action returns failure and logs error.
3. Current implementation provides no field-level inline error in player modal.
4. Existing player state remains unchanged.

### A3 - Empty Player List Or Filter Result

1. Group has no players, or active filters produce no matches.
2. System shows empty-state text in the list area.

### A4 - Authentication Expired

1. Members API responds 401.
2. API client clears token and redirects to login.
3. Pending player mutation is not persisted.

### A5 - Existing Player Name Match With Different Birth Date

1. CSV row matches exactly one existing player by firstName + lastName but has
   a different birthDate.
2. System matches the existing player and plans birthDate update.
3. System does not create a duplicate player.

### A6 - Duplicate Rows In CSV For Same Existing Player

1. Multiple CSV rows resolve to the same existing player.
2. System keeps only the first actionable guardian addition for duplicate
   guardian identities.
3. Later duplicate rows become non-actionable and are hidden in preview.

## Postconditions

Success:
- Player records are persisted for selected group.
- Store state reflects create/update/status-update results.
- Player list remains alphabetically sorted.

Failure:
- No partial mutation is committed in store.
- Existing player records remain unchanged.

## Business Rules Reflected In Current Implementation

- Player create/update requests are sent as member operations with role=player.
- birthYear is computed from birthDate in add/edit modal submit.
- Player list sorting is centralized in store and always alphabetical by
  lastName + firstName.
- Level filter supports multi-select values from 1 to 5.
- Year filter is computed from player birthDate when present, otherwise
  from birthYear.
- Set inactive operations require explicit user confirmation in UI dialogs.
- Inactive players are excluded from invite-player flows.
- If an inactive player remains invited or assigned in a future event, UI
   highlights this as an error indicator.
- Import matching prefers unique same-name player matches even if birthDate
   differs, then updates birthDate instead of creating duplicates.
- Guardian identity matching for import and dedupe uses strict
   firstName + lastName + email.
- Import preview excludes unchanged existing-player rows.

## Validation Rules Reflected In Current Implementation

- firstName, lastName, and birthDate are required in player modal.
- level is constrained by select choices 1..5.
- preferredShirtNumber is optional and, when present, must be numeric
  (input min 1).
- Create/Edit submit does not proceed if required fields are missing.

## Data Persistence Expectations

Create payload contains:
- role: player
- firstName
- lastName
- birthDate
- birthYear
- level
- preferredShirtNumber (optional)

Update payload contains:
- role: player
- updated player fields

Set inactive updates member status to inactive for current group.

## API Contract Used By Current Frontend

- GET /api/groups/{groupId}/members
- POST /api/groups/{groupId}/members (with role=player)
- PUT /api/groups/{groupId}/members/{id} (with role=player)

## Acceptance Criteria

1. Given an authenticated user with selected group, when valid player data is
   submitted in Add modal, then a new player is persisted and appears in Players
   list.
2. Given existing players, when list is shown, then players are ordered
   alphabetically by lastName + firstName.
3. Given active level/year filters, when filters are applied, then only matching
   players are displayed.
4. Given a player detail edit, when valid updates are submitted, then player
   data is updated and reflected in store.
5. Given set-inactive confirmation accepted, when update succeeds, then player
   status is inactive and historical references remain intact.
6. Given inactive players exist, when opening invite players modal, then
   inactive players are not listed as inviteable.
7. Given an inactive player is still invited or assigned in a future event,
   when viewing that event, then the player row shows an error indicator.
8. Given a unique same-name existing player and different imported birthDate,
   when import is applied, then existing player birthDate is updated and no new
   player is created.
9. Given duplicate CSV rows for the same existing player guardian, when import
   preview/apply runs, then guardian is added once and duplicate row additions
   are skipped.

## Notes

- Player detail page also shows historical event participation and future events
  without invitation, but those are read-only enrichments and not part of
  player CRUD itself.
- Current detail-delete flow attempts navigation to /players after success,
  which is the currently implemented behavior.