# UC-GR-010 - Manage Formations

## Goal

Allow a Group Manager to define, edit, and delete reusable Formations
(position slots using translatable, language-neutral position codes,
including exactly one goalkeeper slot) for a group.

## Scope

This use case covers:
- viewing all Formations of the active group,
- creating a new Formation with a name and a list of slots,
- editing a Formation's name and slots,
- deleting a Formation.

This use case does not cover:
- enabling match planning for the group (UC-GR-008; a precondition here),
- managing Playing Modes (UC-GR-009),
- selecting a Formation for a specific Team (UC-EV-007),
- assigning players to Formation slots per period (UC-EV-008).

## Primary Actor

Authenticated User with Role admin or trainer

## Supporting Actors

- Group settings UI (Formations section)
- Zustand store formation actions
- Formations API endpoints (`/api/groups/{groupId}/formations`)

## Preconditions

- User is authenticated and has admin or trainer role in the active group.
- Active group is selected and has `matchPlanningEnabled: true`.

## Trigger

The user opens the Formations section in Group settings and starts a create,
edit, or delete action.

## Input Data

Required for create/update:
- `name` (non-empty string, e.g. "3-3")
- `slots` (array, minimum 2 entries), each with:
  - `positionCode` (one of the fixed catalog values, e.g. `GK`, `LB`, `CB`,
    `RB`, `LWB`, `RWB`, `CDM`, `CM`, `CAM`, `LM`, `RM`, `LW`, `RW`, `CF`,
    `ST`; exactly one slot in the array must be `GK`; other codes may repeat,
    e.g. two `CB` slots)

The UI renders each `positionCode` as a localized label via i18n (for
example English "LB" for "left back" vs. German "LV" for "linker
Verteidiger"); the stored value is always the language-neutral code.

## Main Success Scenario - Create Formation

1. User opens Formations section.
2. System shows existing Formations with their slot counts.
3. User presses Add.
4. User enters a name and adds slots by picking a position code for each
   (localized in the UI), with exactly one slot set to the goalkeeper code.
5. User confirms Create.
6. System validates and persists the new Formation.
7. System updates the local list with the new Formation.

## Main Success Scenario - Edit / Delete

1. User opens actions on a Formation row.
2. User chooses Edit or Delete.
3. For Edit: system opens an edit form, user updates name/slots, system
   validates and persists the update.
4. For Delete: system opens a confirmation dialog; on confirm, system removes
   the Formation, unless it is currently referenced by a Team in the group,
   in which case deletion is blocked.

## Alternative Flows

### A1 - Invalid Slot Configuration

1. User submits with fewer than 2 slots, a `positionCode` outside the fixed
   catalog, zero `GK` slots, or more than one `GK` slot.
2. System blocks submission with validation feedback.
3. No API request is sent.

### A2 - Delete Blocked By Dependent Teams

1. User attempts to delete a Formation referenced by at least one Team's
   `formationId` in the group.
2. System rejects the delete request (409 Conflict) and shows an explanatory
   message.
3. Formation remains unchanged.

### A3 - API Failure

1. Create/update/delete request fails.
2. System keeps current UI state unchanged and shows an error.

## Postconditions

Success:
- Formation is created, updated, or deleted as requested.
- Every stored Formation has exactly one slot with `positionCode: 'GK'` and
  every slot's `positionCode` is one of the fixed catalog values.

Failure:
- Formation data remains unchanged.

## Business Rules

- A Formation belongs to exactly one group and is never shared across groups
  (no top-level Formation collection exists).
- Slot position codes are language-neutral; translated labels are a
  frontend i18n concern, not stored data.
- Only group admin or trainer roles may create, edit, or delete Formations.

## Validation Rules

- `name`: required, non-empty string.
- `slots`: required array, minimum 2 entries.
- `slots[].positionCode`: required, must be one of the fixed catalog values
  (`GK`, `LB`, `CB`, `RB`, `LWB`, `RWB`, `CDM`, `CM`, `CAM`, `LM`, `RM`,
  `LW`, `RW`, `CF`, `ST`).
- Exactly one slot must have `positionCode: 'GK'`; other codes may repeat.
- Delete is rejected while any Team in the group references the Formation.
