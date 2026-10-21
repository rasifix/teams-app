# UC-EV-006 - Assign Match Format to Activity

## Goal

Allow an authenticated user to auto-assign, change, or reset a Match Activity's
Match Format when its Squad has match planning enabled.

## Scope

This use case covers:
- auto-assigning the Squad's default Match Format when a new Match Activity is
  created,
- changing a Match Activity's Match Format to a different one from the same
  Squad,
- resetting a Match Activity's Match Format to none.

This use case does not cover:
- enabling match planning for the squad (UC-GR-008),
- creating or editing Match Formats (UC-GR-009),
- selecting a Formation for a Team (UC-EV-007),
- planning a per-period lineup (UC-EV-008).

## Primary Actor

Authenticated User with Role admin or trainer

## Supporting Actors

- Activity create/edit UI
- Zustand store Activity create/update actions
- Activities API endpoints

## Preconditions

- User is authenticated and has admin or trainer role in the active squad.
- Active squad is selected and has `matchPlanningEnabled: true`.
- Target Activity has `kind: match`.

## Trigger

The user creates a new Match Activity, or opens Match Format selection on an
existing Match Activity.

## Input Data

Optional:
- `matchFormatId` (id of a Match Format belonging to the same Squad, or
  `null` to indicate none)

## Main Success Scenario - Create Match Activity

1. User creates a new Match Activity in a Squad with
   `matchPlanningEnabled: true`.
2. If the squad has a default Match Format, system auto-assigns it as the
   Activity's `matchFormatId`; otherwise `matchFormatId` stays unset.
3. User may override the auto-assigned Match Format or explicitly set none
   before saving.
4. System persists the Activity with the resulting `matchFormatId`.

## Main Success Scenario - Change Or Reset On Existing Match Activity

1. User opens Match Format selection on an existing Match Activity.
2. System shows the squad's Match Formats plus a "None" option, with the
   current selection highlighted.
3. User selects a different Match Format or "None".
4. System persists the updated `matchFormatId` (or clears it).

## Alternative Flows

### A1 - Squad Has No Match Formats

1. Squad has `matchPlanningEnabled: true` but no Match Formats defined yet.
2. System creates/keeps the Match Activity without a `matchFormatId`.
3. Match Format selection UI shows an empty state prompting the user to
   define one in Squad settings.

### A2 - Match Planning Disabled

1. Squad has `matchPlanningEnabled: false`.
2. System does not show Match Format selection UI for Match Activities in that
   Squad.
3. Any existing `matchFormatId` on Match Activities in that Squad is preserved
   but not
   editable while disabled.

### A3 - Invalid Match Format Reference

1. Client attempts to set `matchFormatId` to an id that does not belong to
   the Activity's Squad.
2. System rejects the request with a validation error.
3. Activity's `matchFormatId` remains unchanged.

### A4 - API Failure

1. Create/update request fails.
2. System keeps the previous persisted `matchFormatId` and shows an error.

## Postconditions

Success:
- Activity's `matchFormatId` reflects the selected Match Format or is cleared.

Failure:
- Activity's `matchFormatId` remains unchanged.

## Business Rules

- Changes are rejected while the Activity is cancelled.

- `matchFormatId` is always optional, even immediately after being
  auto-assigned.
- Auto-assignment only happens on Match Activity creation, using the Squad's
  current default Match Format at that time.
- Only Squad admin or trainer roles may change an Activity's `matchFormatId`.

## Validation Rules

- `matchFormatId`, if provided, must reference a Match Format belonging to
  the same Squad as the Activity.
- A Tournament Activity must not receive a `matchFormatId`.
- `matchFormatId` may be explicitly `null` to represent "no Match Format".
- Setting a non-null `matchFormatId` is rejected if the squad has
  `matchPlanningEnabled: false`.
