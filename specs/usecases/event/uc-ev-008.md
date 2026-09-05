# UC-EV-008 - Plan Per-Period Lineup

## Goal

Allow an authenticated user to assign each of a Team's selected Players to a
Formation slot or the bench, independently for each period of the Event's
Playing Mode.

## Scope

This use case covers:
- viewing the lineup editor for one period at a time,
- assigning a selected Player to a Formation slot for the current period,
- leaving a selected Player unassigned (implicitly benched) for a period,
- showing for every Player how many periods currently include a field
  assignment,
- reviewing and printing a summary of all periods, position assignments, and
  benched Players,
- starting the print flow directly from Team Detail once all required lineup
  and shirt data is complete,
- printing the lineup overview and the Player shirt-number list on separate
  pages,
- copying or clearing assignments when moving between periods,
- non-blocking validation warnings when assignment counts don't match the
  roster.

This use case does not cover:
- selecting the Team's Formation (UC-EV-007, a precondition here),
- assigning the Event's Playing Mode (UC-EV-006, a precondition here),
- selecting players into the Team (UC-EV-003).

## Primary Actor

Authenticated User with Role admin or trainer

## Supporting Actors

- Team detail UI (per-period lineup editor)
- Zustand store team update action
- Events API endpoint used for team update

## Preconditions

- User is authenticated and has admin or trainer role in the active group.
- Active group has `matchPlanningEnabled: true`.
- Target Team's Event has a non-null `playingModeId`.
- Target Team has a non-null `formationId`.
- Target Team has at least one selected Player.

## Trigger

The user opens the per-period lineup editor on a Team in Team Detail.

## Input Data

Required per period being edited:
- `periodNumber` (integer, 1 to the Playing Mode's `numberOfPeriods`)
- `assignments`: list of `{ slotId, playerId }` pairs for Players placed on
  the field for that period

Derived (not user input):
- Players in `selectedPlayers` absent from `assignments` for a period are
  implicitly on the bench for that period.

## Main Success Scenario

1. User opens the lineup editor for a Team with a Formation and Playing Mode
   assigned.
2. System shows a period selector (1 to `numberOfPeriods`) and, for the
   selected period, a graphical playing field with one selectable marker per
   Formation slot plus a bench list. Each Player is shown with the number of
   periods in which they are currently planned.
3. User assigns a selected Player by clicking a field slot and choosing an
   available Player. On desktop, the user may alternatively drag a Player
   from the bench onto a field slot.
4. System validates the assignment (player is selected on the team, slot
   exists in the Formation, no player used twice in this period) and updates
   the in-progress lineup for that period.
5. User switches to another period and repeats step 3-4 for that period
   independently.
6. For period 2 or later, the user may copy all assignments from the
   immediately preceding period. The copied assignments replace any existing
   assignments in the current period and remain editable.
7. User may open the Summary tab to review all periods. The summary includes
   every Formation slot and its assigned Player or empty state, plus the
   implicitly benched Players for each period.
8. Once a shirt set and a valid shirt number for every selected Player have
   been assigned and the lineup contains at least one position assignment,
   the print action on Team Detail becomes enabled. Selecting it opens the
   Summary tab and the browser print dialog.
9. User may also print from the Summary tab. Navigation, editing controls,
   and save actions are excluded from the printed output. An explicit page
   break separates the lineup overview from the additional A4 page listing
   every selected Player and the assigned shirt number in a large font.
10. User saves the lineup.
11. System persists the Team's full `lineup` (all edited periods) via team
   update.

## Alternative Flows

### A1 - Roster/Slot Count Mismatch

1. Total assigned Players for a period plus implicitly benched Players does
   not equal `selectedPlayers.length` (for example a Player was added to the
   Team after the lineup was drafted).
2. System shows a non-blocking warning for that period.
3. User may still save the lineup as-is.

### A2 - Duplicate Player In Same Period

1. User attempts to assign the same Player to two slots in the same period.
2. System blocks the second assignment and indicates the conflict.
3. No invalid assignment is added to the in-progress lineup.

### A3 - Invalid Slot Or Player Reference

1. Client attempts to save an assignment whose `slotId` is not in the Team's
   Formation, or whose `playerId` is not in `selectedPlayers`.
2. System rejects the save request with a validation error.
3. Team's persisted `lineup` remains unchanged.

### A4 - Period Number Out Of Range

1. Client attempts to save a lineup entry with `periodNumber` greater than
   the Playing Mode's `numberOfPeriods`, or less than 1.
2. System rejects the save request with a validation error.
3. Team's persisted `lineup` remains unchanged.

### A5 - API Failure

1. Save request fails.
2. System keeps the previously persisted `lineup` and shows an error; local
   in-progress edits remain available for retry.

### A6 - Print Requirements Incomplete

1. The Event has no Playing Mode, the Team has no Formation or shirt set, the
   lineup has no position assignment, the Team has no selected Players, or at
   least one selected Player has no positive shirt number.
2. The print action remains visible but disabled on Team Detail.
3. User completes the missing configuration or assignments.
4. System enables the print action once every requirement is satisfied.

## Postconditions

Success:
- Team's `lineup` contains the saved per-period `assignments`.
- Each period's assignments reference valid slots and selected Players, with
  no duplicate Player per period.

Failure:
- Team's persisted `lineup` remains unchanged.

## Business Rules

- The Formation is fixed for the whole match; only the player-to-slot
  mapping (or bench) changes per period.
- Bench is implicit: no explicit bench list is stored, only field
  assignments.
- A Player's planned-period count is the number of distinct lineup periods
  containing a field assignment for that Player. It is derived from the
  current in-progress lineup and updates immediately when assignments change.
- Only group admin or trainer roles may edit or save a Team's lineup.
- Team Detail enables the lineup print action only when the Event has a
  Playing Mode, the Team has a Formation and shirt set, at least one lineup
  position assignment exists, and every selected Player has a positive shirt
  number assigned.
- The printed lineup overview and Player shirt-number list must be separated
  by a forced page break; the shirt-number list always starts on a new page.
- In print, each graphical playing field uses a white background with a clear
  border instead of the interactive view's green background to improve
  readability and reduce ink usage.

## Validation Rules

- `assignments[].playerId` must be in `team.selectedPlayers`.
- `assignments[].slotId` must exist in the Team's selected Formation's
  `slots`.
- No duplicate `playerId` within the same period's `assignments`.
- `periodNumber` must be within `1..playingMode.numberOfPeriods`.
- Mismatch between filled-slot count plus benched count and
  `selectedPlayers.length` is a warning only, not a blocking error.
