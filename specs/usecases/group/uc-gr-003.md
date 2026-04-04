# UC-GR-003 - Manage Players

## Goal

Allow an authenticated user with selected group context to manage player records
for the group.

## Scope

This use case covers:
- viewing the player list in Members -> Players,
- filtering players by level and year,
- creating a new player,
- opening a player detail view,
- updating a player,
- deleting a player from list or detail flow.

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
6. User enters valid player data and submits.
7. System derives birthYear from birthDate and sends create request with role
   player.
8. Store appends the created player and keeps list alphabetically sorted.
9. Modal closes.
10. User can open a player card to see player detail.
11. On player detail, user can open Edit, update fields, and save.
12. System persists update and refreshes player state in store.
13. User can delete a player from Members list or Player detail after
    confirmation.
14. System persists delete and removes player from store.

## Alternative Flows

### A1 - Missing Required Input During Create Or Edit

1. User submits without required fields.
2. Browser form constraints and modal guard prevent persistence request.
3. Modal remains open for correction.

### A2 - API Or Network Failure During Create/Update/Delete

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

## Postconditions

Success:
- Player records are persisted for selected group.
- Store state reflects create/update/delete results.
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
- Delete operations require explicit user confirmation in UI dialogs.

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

Delete removes member by id for current group.

## API Contract Used By Current Frontend

- GET /api/groups/{groupId}/members
- POST /api/groups/{groupId}/members (with role=player)
- PUT /api/groups/{groupId}/members/{id} (with role=player)
- DELETE /api/groups/{groupId}/members/{id}

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
5. Given delete confirmation accepted, when delete succeeds, then player is
   removed from list and store.

## Notes

- Player detail page also shows historical event participation and future events
  without invitation, but those are read-only enrichments and not part of
  player CRUD itself.
- Current detail-delete flow attempts navigation to /players after success,
  which is the currently implemented behavior.