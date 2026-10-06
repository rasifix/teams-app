# UC-GR-008 - Enable Or Disable Match Planning

## Goal

Allow a Group Manager to opt a Group in or out of the match planning feature
(Playing Modes, Formations, per-period lineups) without losing existing data.

## Scope

This use case covers:
- viewing the current `matchPlanningEnabled` state for the active group,
- turning match planning on or off for the group,
- assigning or clearing the Group's SFV category from Match Planning.

This use case does not cover:
- creating or editing Playing Modes (UC-GR-009),
- creating or editing Formations (UC-GR-010),
- assigning a Playing Mode to an Event (UC-EV-006),
- selecting a Formation or planning a lineup for a Team (UC-EV-007, UC-EV-008).

## Primary Actor

Authenticated User with Role admin or trainer

## Supporting Actors

- Group settings UI
- Zustand store group update action
- Groups API endpoint used for group update

## Preconditions

- User is authenticated.
- User has admin or trainer role in the active group.
- Active group is selected.

## Trigger

The user opens Group settings and toggles the match planning switch.

## Input Data

Required:
- `matchPlanningEnabled` (boolean)

Optional category update:
- `category` (supported SFV category or null)
- current Group `name`, included in the Group update request to satisfy the
  Groups API update contract

## Main Success Scenario

1. User opens Group settings.
2. System shows the current match planning toggle state (off by default for
   groups that never enabled it).
3. User switches the toggle on.
4. System persists `matchPlanningEnabled: true` for the group.
5. System reveals Playing Modes and Formations management sections in Group
   settings, and enables the Playing Mode/Formation/lineup fields on Events
   and Teams within the group.

## Alternative Flows

### A1 - Disable Match Planning

1. User switches the toggle off on a group that has existing Playing Modes,
   Formations, or Team lineups.
2. System persists `matchPlanningEnabled: false`.
3. System hides Playing Modes/Formations management sections and the
   Playing Mode/Formation/lineup fields on Events and Teams.
4. Existing Playing Modes, Formations, Event `playingModeId` values, Team
   `formationId` values, and Team `lineup` data are left untouched in
   storage (soft hide only).

### A2 - Re-enable After Disabling

1. User switches the toggle back on for a group with prior match planning
   data.
2. System persists `matchPlanningEnabled: true`.
3. System reveals the previously hidden data unchanged (Playing Modes,
   Formations, Event/Team assignments reappear as they were).

### A3 - Persistence Failure

1. Match-planning toggle or category update request fails.
2. System keeps the previously persisted value and shows a translated inline
   error message next to the affected control.
3. No group data is changed.

### A4 - Insufficient Permissions

1. User without admin/trainer role attempts to change the toggle.
2. System blocks the action (control not shown, or request rejected).
3. No group data is changed.

### A5 - Assign Or Clear Category

1. User selects an SFV category or the empty category option and saves.
2. System sends the current Group name together with the selected `category`
   in the Group update request.
3. System persists the category without changing the Group name.
4. If the selected category has one unambiguous official Playing Mode, the UI
   enables match planning and creates or selects that mode as defined by the
   category mapping.

## Postconditions

Success:
- Group's `matchPlanningEnabled` reflects the new value.
- No Playing Mode, Formation, Event, or Team data is deleted by toggling.

Failure:
- Group's `matchPlanningEnabled` remains unchanged.

## Business Rules

- Match planning is opt-in per group; default is disabled.
- Toggling the flag is non-destructive in both directions.
- Only group admin or trainer roles may change the flag.
- Saving a category must preserve the current Group name and include it in the
  update payload because category alone does not satisfy the Groups API's
  required update fields.

## Validation Rules

- `matchPlanningEnabled` must be a boolean.
- `category` must be null or one of the supported SFV categories.
- `name` included with a category update must be the current non-empty Group
  name.
