# UC-EV-006 - Assign Playing Mode To Event

## Goal

Allow an authenticated user to auto-assign, change, or reset an Event's
Playing Mode when its group has match planning enabled.

## Scope

This use case covers:
- auto-assigning the group's default Playing Mode when a new Event is
  created,
- changing an Event's Playing Mode to a different one from the same group,
- resetting an Event's Playing Mode to none.

This use case does not cover:
- enabling match planning for the group (UC-GR-008),
- creating or editing Playing Modes (UC-GR-009),
- selecting a Formation for a Team (UC-EV-007),
- planning a per-period lineup (UC-EV-008).

## Primary Actor

Authenticated User with Role admin or trainer

## Supporting Actors

- Event create/edit UI
- Zustand store event create/update actions
- Events API endpoints

## Preconditions

- User is authenticated and has admin or trainer role in the active group.
- Active group is selected and has `matchPlanningEnabled: true`.

## Trigger

The user creates a new Event, or opens Playing Mode selection on an existing
Event.

## Input Data

Optional:
- `playingModeId` (id of a Playing Mode belonging to the same group, or
  `null` to indicate none)

## Main Success Scenario - Create Event

1. User creates a new Event in a group with `matchPlanningEnabled: true`.
2. If the group has a default Playing Mode, system auto-assigns it as the
   Event's `playingModeId`; otherwise `playingModeId` stays unset.
3. User may override the auto-assigned Playing Mode or explicitly set none
   before saving.
4. System persists the Event with the resulting `playingModeId`.

## Main Success Scenario - Change Or Reset On Existing Event

1. User opens Playing Mode selection on an existing Event.
2. System shows the group's Playing Modes plus a "None" option, with the
   current selection highlighted.
3. User selects a different Playing Mode or "None".
4. System persists the updated `playingModeId` (or clears it).

## Alternative Flows

### A1 - Group Has No Playing Modes

1. Group has `matchPlanningEnabled: true` but no Playing Modes defined yet.
2. System creates/keeps the Event without a `playingModeId`.
3. Playing Mode selection UI shows an empty state prompting the user to
   define one in Group settings.

### A2 - Match Planning Disabled

1. Group has `matchPlanningEnabled: false`.
2. System does not show Playing Mode selection UI for Events in that group.
3. Any existing `playingModeId` on Events in that group is preserved but not
   editable while disabled.

### A3 - Invalid Playing Mode Reference

1. Client attempts to set `playingModeId` to an id that does not belong to
   the Event's group.
2. System rejects the request with a validation error.
3. Event's `playingModeId` remains unchanged.

### A4 - API Failure

1. Create/update request fails.
2. System keeps the previous persisted `playingModeId` and shows an error.

## Postconditions

Success:
- Event's `playingModeId` reflects the selected Playing Mode or is cleared.

Failure:
- Event's `playingModeId` remains unchanged.

## Business Rules

- `playingModeId` is always optional, even immediately after being
  auto-assigned.
- Auto-assignment only happens on Event creation, using the group's current
  default Playing Mode at that time.
- Only group admin or trainer roles may change an Event's `playingModeId`.

## Validation Rules

- `playingModeId`, if provided, must reference a Playing Mode belonging to
  the same group as the Event.
- `playingModeId` may be explicitly `null` to represent "no Playing Mode".
- Setting a non-null `playingModeId` is rejected if the group has
  `matchPlanningEnabled: false`.
