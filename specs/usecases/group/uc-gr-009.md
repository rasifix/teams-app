# UC-GR-009 - Manage Playing Modes

## Goal

Allow a Group Manager to define, edit, and delete reusable Playing Modes
(period count and length) for a group, and mark one as the group's default.

## Scope

This use case covers:
- viewing all Playing Modes of the active group,
- creating a new Playing Mode,
- editing a Playing Mode's name, number of periods, and period length,
- marking a Playing Mode as the group's default,
- deleting a Playing Mode.

This use case does not cover:
- enabling match planning for the group (UC-GR-008; a precondition here),
- managing Formations (UC-GR-010),
- assigning a Playing Mode to a specific Event (UC-EV-006).

## Primary Actor

Authenticated User with Role admin or trainer

## Supporting Actors

- Group settings UI (Playing Modes section)
- Zustand store playing mode actions
- Playing Modes API endpoints (`/api/groups/{groupId}/playing-modes`)

## Preconditions

- User is authenticated and has admin or trainer role in the active group.
- Active group is selected and has `matchPlanningEnabled: true`.

## Trigger

The user opens the Playing Modes section in Group settings and starts a
create, edit, set-default, or delete action.

## Input Data

Required for create/update:
- `name` (non-empty string, e.g. "4x20")
- `numberOfPeriods` (integer ≥ 1)
- `periodLengthMinutes` (integer ≥ 1)

## Main Success Scenario - Create Playing Mode

1. User opens Playing Modes section.
2. System shows existing Playing Modes with their default marker.
3. User presses Add.
4. User enters name, number of periods, and period length.
5. User confirms Create.
6. System persists the new Playing Mode.
   - If this is the group's first Playing Mode, system marks it default
     automatically.
7. System updates the local list with the new Playing Mode.

## Main Success Scenario - Edit / Set Default / Delete

1. User opens actions on a Playing Mode row.
2. User chooses Edit, Set as default, or Delete.
3. For Edit: system opens an edit form, user updates fields, system persists
   the update.
4. For Set as default: system marks this Playing Mode default and unmarks any
   previous default, atomically.
5. For Delete: system opens a confirmation dialog; on confirm, system removes
   the Playing Mode, unless it is currently referenced by an Event in the
   group, in which case deletion is blocked.

## Alternative Flows

### A1 - Invalid Field Values

1. User submits with empty name, or `numberOfPeriods`/`periodLengthMinutes`
   less than 1.
2. System blocks submission with validation feedback.
3. No API request is sent.

### A2 - Delete Blocked By Dependent Events

1. User attempts to delete a Playing Mode referenced by at least one Event's
   `playingModeId` in the group.
2. System rejects the delete request (409 Conflict) and shows an explanatory
   message.
3. Playing Mode remains unchanged.

### A3 - API Failure

1. Create/update/set-default/delete request fails.
2. System keeps current UI state unchanged and shows an error.

## Postconditions

Success:
- Playing Mode is created, updated, marked default, or deleted as requested.
- Exactly one Playing Mode in the group is marked default whenever at least
  one Playing Mode exists.

Failure:
- Playing Mode data remains unchanged.

## Business Rules

- A Playing Mode belongs to exactly one group and is never shared across
  groups (no top-level Playing Mode collection exists).
- Exactly one Playing Mode per group may be default at a time.
- Only group admin or trainer roles may create, edit, set default, or delete
  Playing Modes.

## Validation Rules

- `name`: required, non-empty string.
- `numberOfPeriods`: required, integer, minimum 1.
- `periodLengthMinutes`: required, integer, minimum 1.
- Delete is rejected while any Event in the group references the Playing
  Mode.
