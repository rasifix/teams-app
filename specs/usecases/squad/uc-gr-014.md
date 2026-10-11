# UC-GR-014 - Manage Squad Periods

## Goal

Allow an authorized Squad Manager to create, edit, and delete reusable date
periods in Group Settings for statistics filtering and Spond event
synchronization.

## Scope

This use case covers:

- listing periods in Group Settings,
- creating a period,
- editing a period,
- deleting a period after confirmation,
- exposing periods to Statistics and the Spond event range selector.

This use case does not cover selecting a period in Statistics, synchronizing
Spond Events (UC-EV-012), or Match Format playing periods.

## Primary Actor

Squad Manager

## Preconditions

- The actor is authenticated and may manage the selected Squad.
- The Squad is loaded.

## Trigger

The actor opens the Periods section in Group Settings and chooses Add or Edit.

## Input Data

Required:

- `name` (non-empty string)
- `startDate` (calendar date)
- `endDate` (calendar date on or after `startDate`)

## Main Success Scenario - Create

1. Actor opens Group Settings.
2. System lists existing periods by date.
3. Actor chooses Add.
4. System opens the period form.
5. Actor enters a name, start date, and end date and saves.
6. System persists the period under the active Squad.
7. The period appears in Group Settings and is available as a Statistics
   filter and Spond event synchronization range.

## Main Success Scenario - Edit

1. Actor chooses Edit on an existing period.
2. System opens the form populated with the stored values.
3. Actor changes one or more values and saves.
4. System persists the update and refreshes the period list.
5. Subsequent Statistics filters and Spond syncs use the updated dates.

## Main Success Scenario - Delete

1. Actor edits an existing period and chooses Delete.
2. System asks for confirmation.
3. Actor confirms and the system deletes the Squad period.
4. The period is removed from Group Settings and is no longer offered by
   Statistics or Spond event synchronization.
5. If it was the currently selected Statistics period, that selection is
   cleared.

## Alternative Flows

### A1 - Invalid Period

1. Name or dates are missing, or the end date precedes the start date.
2. System blocks save and shows validation feedback.
3. No period is persisted.

### A2 - Persistence Failure

1. Create, update, or delete fails.
2. System keeps the form available and shows an error.
3. Existing period data remains unchanged.

### A3 - No Periods

1. The Squad has no configured periods.
2. Group Settings shows an empty state.
3. Spond event sync still permits a custom date range, and Statistics still
   permits its all-events view.

## Business Rules

- Periods belong to exactly one Squad.
- Period management is located in Group Settings, not Statistics.
- Period dates are inclusive calendar dates.
- A Spond sync copies the selected period dates into its range; later manual
  date edits switch that sync to a custom range.
- Statistics and Spond sync consume the same Squad period definitions but keep
  their selections independently.

## API Contract

- `POST /api/squads/{squadId}/periods`
- `PUT /api/squads/{squadId}/periods/{periodId}`
- `DELETE /api/squads/{squadId}/periods/{periodId}`

## Acceptance Criteria

1. Given an authorized actor, when Group Settings opens, then configured Squad
   periods are listed.
2. Given valid period data, when Add is saved, then the new period is persisted
   and becomes available to Statistics and Spond sync.
3. Given an existing period, when valid edits are saved, then all consumers use
   the updated dates.
4. Given invalid or incomplete period data, then save is blocked.
5. Given no configured periods, then Spond event sync still offers a custom
   date range.
6. Given an existing period, when deletion is confirmed, then it is removed
   from Group Settings and all period selectors.
