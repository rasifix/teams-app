# UC-ST-003 - Team Selections

## Goal

Allow an authenticated user to analyze how often players were selected into
specific teams across events in the selected statistics period.

## Scope

This use case covers:
- opening Team Selections from the Statistics area,
- applying the selected statistics period to event data,
- switching grouping mode between team name and team strength,
- filtering players by level range,
- rendering a player-by-group selection matrix,
- opening selection details for a matrix cell,
- navigating from selection details to a concrete team detail page.

This use case does not cover:
- creating or editing statistics periods,
- changing invitation status,
- selecting players into teams,
- editing team setup (trainers, shirt sets, strengths),
- player-level performance details outside the Team Selections matrix.

## Primary Actor

Authenticated User

## Supporting Actors

- Frontend UI (Statistics page, Team Selections tab, Team Selection matrix)
- Zustand store selectors (players, events, selected statistics period)
- Router navigation (player detail and team detail routes)

## Preconditions

- User is authenticated.
- A group is selected and group data is loaded.
- Players and events are available in application state (may be empty).
- User can access the Statistics page.

## Trigger

The user opens Statistics and selects the Team Selections tab.

## Input Data

User-controlled inputs:
- selected statistics period (All events or one group period),
- grouping mode switch (`teamName` or `teamStrength`),
- level range filter (`minLevel`, `maxLevel`) using the level-range selector,
- matrix-cell selection (player/team intersection),
- action to open a specific team from the selection-details modal.

Derived data used by the screen:
- filtered events from selected statistics period,
- group columns derived from all teams in filtered events based on selected
   grouping mode,
- player rows derived from players filtered by level range.

## Main Success Scenario

1. User opens Statistics and switches to Team Selections.
2. System receives `filteredEvents` from Statistics context based on selected
   period.
3. System loads players from store, initializes level range to 1..5, and sets
   default grouping mode to team strength.
4. User can toggle grouping mode:
   - team name: group columns represent normalized team names across events,
   - team strength: group columns represent strength buckets (1..3).
5. System derives group columns from filtered events according to grouping mode.
6. System filters players by level range.
7. For each filtered player, system computes:
   - `selectedCount`: number of filtered events where the player is in any
     team's `selectedPlayers`,
   - `acceptedCount`: number of filtered events where the player's invitation
     status is `accepted`,
   - per-group cell counts and event references for matching group column.
8. System renders the matrix with:
   - sticky player column,
   - one column per derived group,
   - one clickable count button per player/group cell,
   - player row summary badge `selectedCount / acceptedCount`.
9. User clicks a non-zero or zero cell count.
10. System opens selection-details modal for that player/group intersection and
   lists matching events (event name + date).
11. User presses Open team for an event entry.
12. System navigates to `/events/{eventId}/teams/{teamId}` and closes modal.

## Alternative Flows

### A1 - No Players Or No Events Available

1. Team Selections is opened with no players or no filtered events.
2. System shows empty state message:
   `No data available. Add players and events to see team selection statistics.`
3. No matrix is rendered.

### A2 - No Teams In Selected Period

1. Filtered events exist, but no teams are present in those events.
2. System keeps level-range selector visible.
3. System keeps grouping-mode switch visible.
4. System shows message: `No teams exist in the selected period.`
5. No matrix is rendered.

### A3 - No Players Match Level Range

1. User changes level range so no players qualify.
2. System shows message: `No players match the selected level range.`
3. Group columns remain defined; matrix body is replaced by empty state.

### A4 - Selected Cell Has No Matching Events

1. User opens a cell with count `0`.
2. Modal opens for the selected player/team.
3. System shows message:
   `This player has not been selected for this team in the current statistics period.`

### A5 - Authentication Or Route Protection Denies Access

1. User is unauthenticated or session expires.
2. Protected routing and API auth behavior redirect user to login.
3. Team Selections content is not available until authentication is restored.

## Postconditions

Success:
- User can inspect per-player selection counts by team name or team strength in
   selected period.
- User can navigate from matrix detail to the concrete team detail page.
- No data mutation occurs; operation is read-only analytics.

Failure or empty-data outcomes:
- Existing state remains unchanged.
- Appropriate empty-state or access behavior is shown.

## Business Rules Reflected In Current Implementation

- Team Selections operates only on events visible in selected statistics period.
- Grouping mode controls how matrix columns are built:
   - team name mode groups by normalized team name,
   - team strength mode groups by numeric strength bucket.
- Team strength is the default selected grouping mode when the screen opens.
- Player rows can be constrained by level range and default to 1..5.
- In team name mode, columns are consolidated by normalized team name across
   events.
- In team strength mode, columns represent strength values 1, 2, and 3.
- Selection count for a cell is event-based occurrences of player assignment to
   teams matching that group column.
- Player row summary displays selected-versus-accepted ratio as
  `selectedCount / acceptedCount`.
- Clicking any cell always opens details modal, including count `0` cells.

## Validation Rules Reflected In Current Implementation

- Statistics period filter includes events with date in inclusive range
  (`startDate <= eventDate <= endDate`).
- If period dates are invalid/unparseable, event filtering falls back to all
  events.
- Team name normalization trims whitespace and compares case-insensitively.
- Team strength grouping uses team strength value as column key.
- Event entries with unparseable event dates are excluded from period-filtered
  results.

## Data And Integration Expectations

- No dedicated Team Selections API call is made by this screen.
- Data is sourced from already-loaded Zustand store state and route context:
  - players from `usePlayers`,
  - period-filtered events from Statistics outlet context.
- Navigation integrations:
  - player click: `/players/{playerId}`,
  - open team: `/events/{eventId}/teams/{teamId}`.

## Acceptance Criteria

1. Given authenticated access and available data, when Team Selections is opened,
   then a matrix of players vs grouping columns is shown for the selected
   period.
2. Given the grouping switch, when user selects team name or team strength,
   then matrix columns are rebuilt according to the selected grouping mode.
3. Given a selected period, when event dates fall inside the inclusive period
   bounds, then those events are included in matrix calculations.
4. Given a modified level range, when players are outside the range, then they
   are excluded from matrix rows.
5. Given a matrix cell click, when selections exist, then modal lists matching
   events and allows opening a specific team detail route.
6. Given a matrix cell click with zero selections, when modal opens, then a
   no-selection message is displayed.
7. Given no players or no events, when Team Selections is opened, then the
   screen shows the no-data empty state instead of a matrix.

## Notes

- This specification documents the current behavior in the implemented React
  frontend.
- Team Selections is an analytical view and does not modify invitations,
  selections, or team configuration.