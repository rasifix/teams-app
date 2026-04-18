# UC-GR-004 - Manage Guardians

## Goal

Allow a Group Manager to assign a guardian to an underage player, whether the
guardian already exists as a user account or is only documented as guardian
contact data, and to remove guardian assignments when needed.

## Scope

This use case covers:
- viewing guardians linked to a player,
- viewing unique guardians in Members > Guardians with all linked players,
- assigning one or more guardians to an underage player,
- assigning existing users from both trainer and guardian member pools,
- removing a guardian assignment from a player,
- detecting duplicate guardians by identity and resolving duplicates by merging
   player references to a single guardian,
- persisting guardian assignments as part of player data.

This use case does not cover:
- creating user accounts for guardians,
- full guardian profile management outside assignment context,
- legal consent workflows,
- invitation response flows (covered elsewhere).

## Primary Actor

Group Manager

## Supporting Actors

- Guardian (account-linked or documented-only)
- System (UI, API, persistence)

## Preconditions

- Actor is authenticated.
- Actor has Group Manager permission in the active group.
- Target player exists in the active group.
- Target player is underage according to configured age policy.
- Guardian data is available for assignment (either existing user reference or
   documented guardian fields).

## Trigger

The Group Manager opens a player management context and selects the action to
manage guardians for a player.

## Input Data

Required for assignment:
- playerId
- one of:
   - guardian user reference (guardianId or equivalent stable identifier), or
   - documented guardian identity/contact fields

Optional for assignment (if model supports):
- relationship (for example mother, father, legal guardian)
- contact preference metadata
- email (optional for documented-only guardian contacts)

Required for removal:
- playerId
- guardian assignment identifier or guardian reference

## Main Success Scenario - Assign Guardian

1. Group Manager opens player detail/management view.
2. System shows current guardian assignments for the player.
3. Group Manager chooses Add Guardian.
4. System allows either selecting an existing user or entering documented
   guardian details.
5. Group Manager confirms assignment.
6. System validates guardian eligibility and duplicate constraints.
   Duplicate matching for assignment uses guardian identity
   (firstName + lastName + email) when those fields are present.
7. System persists assignment to player guardians collection, including account
   link when present or documented-only guardian data when no user exists.
8. System refreshes player data and displays new guardian in assigned list.
9. System confirms success.

## Main Success Scenario - Remove Guardian

1. Group Manager opens player guardians list.
2. Group Manager selects Remove on a guardian assignment.
3. System asks for confirmation.
4. Group Manager confirms removal.
5. System persists removal from player guardians collection.
6. System refreshes player data and updates guardian list.
7. System confirms success.

## Alternative Flows

### A1 - Player Not Underage

1. Group Manager attempts to assign guardian to a player that is not underage.
2. System rejects the action with policy message.
3. No assignment is persisted.

### A2 - Guardian Already Assigned

1. Group Manager selects a guardian already linked to the player.
2. System rejects duplicate assignment.
3. Existing assignments remain unchanged.

### A7 - Resolve Duplicate Guardians

1. Group Manager opens Members > Guardians.
2. System detects duplicate guardians sharing firstName + lastName + email.
3. Group Manager triggers Resolve duplicates for one duplicate group.
4. System selects one target guardian and re-links all affected player
   guardian references to that target.
5. System removes obsolete duplicate references from player guardian arrays.
6. System refreshes guardians list and duplicate warning section.

### A3 - Guardian Candidate Not Eligible

1. Selected user does not meet guardian eligibility rules.
2. System rejects assignment with validation feedback.
3. No assignment is persisted.

### A4 - Guardian Assigned Without Existing User

1. Group Manager enters guardian details without selecting an existing user.
2. System validates minimum documented guardian data.
3. System persists guardian as documented-only assignment.
4. System marks assignment as non-account guardian (no login capability).

### A5 - Permission Denied

1. Non-manager user attempts assignment/removal.
2. System returns authorization error.
3. No changes are persisted.

### A6 - Technical Failure

1. Persist request fails due to network/API/server error.
2. System shows non-destructive error state.
3. Existing assignments remain unchanged.

## Postconditions

Success:
- Player guardian assignments reflect requested add/remove change.
- Assignment data is queryable through player/member endpoints.
- Audit trail is recorded if auditing is enabled.

Failure:
- No partial assignment changes are stored.
- Existing guardian links remain unchanged.

## Business Rules

- Only Group Managers can assign or remove guardians.
- Guardian assignment is permitted only for underage players.
- A player may have multiple guardians.
- The same guardian may be linked to multiple players in the same group.
- The same guardian cannot be linked more than once to the same player.
- Removing one guardian must not affect other guardian assignments.
- A guardian assignment may be account-linked or documented-only.
- Documented-only guardians must not be treated as authenticated app users and
   must not be able to log in unless a user account is explicitly created and
   linked later.

## Validation Rules

- `playerId` must belong to active group scope.
- Guardian input must provide either a valid user reference or sufficient
   documented guardian identity/contact data.
- Duplicate guardian links for one player are invalid.
- Duplicate detection and merge actions on Members > Guardians use strict
   identity: firstName + lastName + email.
- Underage eligibility check must pass at assignment time.

## Data Persistence Expectations

Player record stores guardian links in `guardians` collection (as modeled in API
schemas), at minimum containing guardian identity fields required by domain.

If available, persistable guardian fields should align with API `Guardian`
schema (derived from trainer/user-like identity fields).

For documented-only guardians, persistence should include guardian contact
identity fields without requiring a linked user account id.

## API Contract Alignment

Current API schemas already model player guardians in:
- `Player.guardians`
- `CreatePlayerRequest.guardians`
- `UpdatePlayerRequest.guardians`

Suggested persistence path for this use case:
- Update player via `PUT /api/groups/{groupId}/members/{id}` with updated
  `guardians` array.

## Acceptance Criteria

1. Given an underage player and Group Manager role, when a valid guardian is
   assigned, then player guardian list includes the new guardian.
2. Given an existing guardian assignment, when Group Manager removes it, then
   guardian no longer appears in player guardian list.
3. Given guardian data without existing user account, when Group Manager
   assigns guardian, then assignment is persisted as documented-only and the
   guardian cannot log in.
4. Given duplicate assignment attempt, when submit occurs, then assignment is
   rejected and list remains unchanged.
5. Given non-manager actor, when assignment/removal is attempted, then request
   is denied and no data changes.
6. Given technical failure during save, when operation is attempted, then no
   partial update is persisted.
7. Given duplicate guardians with same firstName + lastName + email, when
   Group Manager resolves duplicates, then all linked players reference the
   selected target guardian and duplicates are removed.

## Notes

- This is a feature sketch specification for planned behavior.
- Current frontend implementation does not yet provide dedicated guardian
  assignment/removal UI flows.
- Underage threshold must be defined centrally (for example by age cutoff at
  event date or current date) before implementation.