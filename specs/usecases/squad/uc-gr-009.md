# UC-GR-009 - Manage Match Formats

## Goal

Allow a Squad Manager to define, edit, and delete reusable Match Formats
(period count, length, and minimum periods per Player) for a squad, and mark
one as the squad's default.

## Scope

This use case covers:
- viewing all Match Formats of the active squad,
- creating a new Match Format,
- editing a Match Format's name, number of periods, period length, and minimum
  periods per Player,
- marking a Match Format as the squad's default,
- deleting a Match Format.

This use case does not cover:
- enabling match planning for the squad (UC-GR-008; a precondition here),
- managing Formations (UC-GR-010),
- assigning a Match Format to a specific Event (UC-EV-006).

## Primary Actor

Authenticated User with Role admin or trainer

## Supporting Actors

- Group Settings UI (Match Formats section)
- Zustand store match format actions
- Match Formats API endpoints (`/api/squads/{squadId}/match-formats`)

## Preconditions

- User is authenticated and has admin or trainer role in the active squad.
- Active squad is selected and has `matchPlanningEnabled: true`.

## Trigger

The user opens the Match Formats section in Group Settings and starts a
create, edit, set-default, or delete action.

## Input Data

Required for create/update:
- `name` (non-empty string, e.g. "4x20")
- `numberOfPeriods` (integer ≥ 1)
- `periodLengthMinutes` (integer ≥ 1)
- `minimumPeriodsPerPlayer` (integer from 0 to `numberOfPeriods`; 0 disables
  the minimum-playing-time rule)

## Main Success Scenario - Create Match Format

1. User opens Match Formats section.
2. System shows existing Match Formats with their default marker.
3. User presses Add.
4. User enters name, number of periods, period length, and minimum periods per
   Player.
5. User confirms Create.
6. System persists the new Match Format.
   - If this is the squad's first Match Format, system marks it default
     automatically.
7. System updates the local list with the new Match Format.

## Main Success Scenario - Edit / Set Default / Delete

1. User opens actions on a Match Format row.
2. User chooses Edit, Set as default, or Delete.
3. For Edit: system opens an edit form, user updates fields, system persists
   the update.
4. For Set as default: system marks this Match Format default and unmarks any
   previous default, atomically.
5. For Delete: system opens a confirmation dialog; on confirm, system removes
   the Match Format, unless it is currently referenced by an Event in the
   squad, in which case deletion is blocked.

## Alternative Flows

### A1 - Invalid Field Values

1. User submits with empty name, or `numberOfPeriods`/`periodLengthMinutes`
   less than 1.
2. System blocks submission with validation feedback.
3. No API request is sent.

### A2 - Delete Blocked By Dependent Events

1. User attempts to delete a Match Format referenced by at least one Event's
   `matchFormatId` in the squad.
2. System rejects the delete request (409 Conflict) and shows an explanatory
   message.
3. Match Format remains unchanged.

### A3 - API Failure

1. Create/update/set-default/delete request fails.
2. System keeps current UI state unchanged and shows an error.

## Postconditions

Success:
- Match Format is created, updated, marked default, or deleted as requested.
- Exactly one Match Format in the squad is marked default whenever at least
  one Match Format exists.

Failure:
- Match Format data remains unchanged.

## Business Rules

- A Match Format belongs to exactly one squad and is never shared across
  squads (no top-level Match Format collection exists).
- Exactly one Match Format per squad may be default at a time.
- Only squad admin or trainer roles may create, edit, set default, or delete
  Match Formats.

## Validation Rules

- `name`: required, non-empty string.
- `numberOfPeriods`: required, integer, minimum 1.
- `periodLengthMinutes`: required, integer, minimum 1.
- `minimumPeriodsPerPlayer`: required, integer, minimum 0, and must not exceed
  `numberOfPeriods`.
- Delete is rejected while any Event in the squad references the Match Format.
