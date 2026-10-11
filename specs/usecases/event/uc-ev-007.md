# UC-EV-007 - Select Team Formation

## Goal

Allow an authenticated user to select a Formation for a Team once its Event
has a Match Format assigned, fixing the Formation for the whole match.

## Scope

This use case covers:
- selecting a Formation from the squad's Formations for a Team,
- changing the selected Formation before or during lineup planning,
- clearing the selected Formation.

This use case does not cover:
- creating or editing Formations (UC-GR-010),
- assigning an Event's Match Format (UC-EV-006, a precondition here),
- assigning players to slots per period (UC-EV-008).

## Primary Actor

Authenticated User with Role admin or trainer

## Supporting Actors

- Team detail UI (Formation picker)
- Zustand store team update action
- Events API endpoint used for team update

## Preconditions

- User is authenticated and has admin or trainer role in the active squad.
- Active squad has `matchPlanningEnabled: true`.
- Target Team's Event has a non-null `matchFormatId`.

## Trigger

The user selects the Formation row on a Team in Team Detail.

## Input Data

Optional:
- `formationId` (id of a Formation belonging to the same squad, or `null` to
  clear)

## Main Success Scenario

1. User opens Team Detail for a Team whose Event has a Match Format.
2. User selects the Formation row.
3. System opens an assignment modal showing the squad's Formations plus a
   "None" option, with the current selection preselected.
4. User selects a Formation and saves the modal.
5. System persists `formationId` on the Team and closes the modal.
6. Team Detail now offers the per-period lineup editor (UC-EV-008) using the
   selected Formation's slots.

## Alternative Flows

### A1 - No Match Format On Event

1. Event has no `matchFormatId` set.
2. System hides the Formation picker and lineup editor for the Team.

### A2 - Change Formation After Lineup Exists

1. Team already has a `lineup` planned using a previously selected
   Formation.
2. User selects a different Formation.
3. System persists the new `formationId`.
4. Existing lineup `assignments` that reference slot ids not present in the
   newly selected Formation become invalid and are dropped from the stored
   lineup; affected players revert to implicitly benched for those periods.
5. System shows a warning that previous slot assignments were cleared.

### A3 - Invalid Formation Reference

1. Client attempts to set `formationId` to an id that does not belong to the
   Team's squad.
2. System rejects the request with a validation error.
3. Team's `formationId` remains unchanged.

### A4 - API Failure

1. Update request fails.
2. System keeps the previous persisted `formationId` and shows an error.

## Postconditions

Success:
- Team's `formationId` reflects the selected Formation or is cleared.

Failure:
- Team's `formationId` remains unchanged.

## Business Rules

- A Formation is fixed for the whole match once selected; only the
  per-period player-to-slot assignments vary.
- `formationId` can only be set while the Team's Event has a Match Format.
- Only squad admin or trainer roles may change a Team's `formationId`.
- Formation is assigned through the clickable Team Detail row and a focused
  modal; it is not edited through an inline select control.

## Validation Rules

- `formationId`, if provided, must reference a Formation belonging to the
  same squad as the Team's Event.
- `formationId` may be explicitly `null` to represent "no Formation".
- Setting a `formationId` is rejected if the Team's Event has no
  `matchFormatId`.
