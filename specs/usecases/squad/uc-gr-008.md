# UC-GR-008 - Enable Or Disable Match Planning

## Goal

Allow a Squad Manager to opt a Squad in or out of the match planning feature
(Match Formats, Formations, per-period lineups) without losing existing data.

## Scope

This use case covers:
- viewing the current `matchPlanningEnabled` state for the active squad,
- turning match planning on or off for the squad,
- assigning or clearing the Squad's SFV category from Group Settings.

This use case does not cover:
- creating or editing Match Formats (UC-GR-009),
- creating or editing Formations (UC-GR-010),
- assigning a Match Format to an Activity (UC-EV-006),
- selecting a Formation or planning a lineup for a Team (UC-EV-007, UC-EV-008).

## Primary Actor

Authenticated User with Role admin or trainer

## Supporting Actors

- Group Settings UI
- Zustand store squad update action
- Squads API endpoint used for squad update

## Preconditions

- User is authenticated.
- User has admin or trainer role in the active squad.
- Active squad is selected.

## Trigger

The user opens Group Settings and toggles the match planning switch.

## Input Data

Required:
- `matchPlanningEnabled` (boolean)

Optional category update:
- `category` (supported SFV category or null)
- current Squad `name`, included in the Squad update request to satisfy the
  Squads API update contract

## Main Success Scenario

1. User opens Group Settings.
2. System shows the current match planning toggle state (off by default for
   squads that never enabled it).
3. User switches the toggle on.
4. System persists `matchPlanningEnabled: true` for the squad.
5. System reveals Match Formats and Formations management sections in Group
   Settings, and enables the Match Format/Formation/lineup fields on Match
   Activities
   and Teams within the squad.

## Alternative Flows

### A1 - Disable Match Planning

1. User switches the toggle off on a squad that has existing Match Formats,
   Formations, or Team lineups.
2. System persists `matchPlanningEnabled: false`.
3. System hides Match Formats/Formations management sections and the
   Match Format/Formation/lineup fields on Match Activities and Teams.
4. Existing Match Formats, Formations, Activity `matchFormatId` values, Team
   `formationId` values, and Team `lineup` data are left untouched in
   storage (soft hide only).

### A2 - Re-enable After Disabling

1. User switches the toggle back on for a squad with prior match planning
   data.
2. System persists `matchPlanningEnabled: true`.
3. System reveals the previously hidden data unchanged (Match Formats,
   Formations, Activity/Team assignments reappear as they were).

### A3 - Persistence Failure

1. Match-planning toggle or category update request fails.
2. System keeps the previously persisted value and shows a translated inline
   error message next to the affected control.
3. No squad data is changed.

### A4 - Insufficient Permissions

1. User without admin/trainer role attempts to change the toggle.
2. System blocks the action (control not shown, or request rejected).
3. No squad data is changed.

### A5 - Assign Or Clear Category

1. User selects an SFV category or the empty category option and saves.
2. System sends the current Squad name together with the selected `category`
   in the Squad update request.
3. System persists the category without changing the Squad name.
4. If the selected category has one unambiguous official Match Format, the UI
   enables match planning and creates or selects that mode as defined by the
   category mapping.

## Postconditions

Success:
- Squad's `matchPlanningEnabled` reflects the new value.
- No Match Format, Formation, Activity, or Team data is deleted by toggling.

Failure:
- Squad's `matchPlanningEnabled` remains unchanged.

## Business Rules

- Match planning is opt-in per squad; default is disabled.
- Toggling the flag is non-destructive in both directions.
- Only squad admin or trainer roles may change the flag.
- Saving a category must preserve the current Squad name and include it in the
  update payload because category alone does not satisfy the Squads API's
  required update fields.

## Validation Rules

- `matchPlanningEnabled` must be a boolean.
- `category` must be null or one of the supported SFV categories.
- `name` included with a category update must be the current non-empty Squad
  name.
