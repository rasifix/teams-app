# UC-ST-001 - Player Statistics

## Goal

Allow an authenticated user to analyze invitation, acceptance, and selection
outcomes per player for the selected statistics period.

## Scope

This use case covers:
- opening Player Statistics from the Statistics area,
- applying the selected statistics period to event data,
- calculating per-player metrics for invited, accepted, and selected events,
- calculating acceptance and selection rates,
- filtering players by level range,
- sorting rows by supported metrics,
- navigating from a player row to the player detail page.

This use case does not cover:
- creating or editing statistics periods,
- changing invitation status,
- selecting players into teams,
- editing player master data,
- editing events or teams.

## Primary Actor

Authenticated User

## Supporting Actors

- Frontend UI (Statistics page, Player Statistics tab, Player Statistics table)
- Zustand store selectors (players, events, selected statistics period)
- Router navigation (player detail route)

## Preconditions

- User is authenticated.
- A group is selected and group data is loaded.
- Players and events are available in application state (may be empty).
- User can access the Statistics page.

## Trigger

The user opens Statistics and selects the Player Statistics tab.

## Input Data

User-controlled inputs:
- selected statistics period (All events or one group period),
- level range filter (`minLevel`, `maxLevel`) using the level-range selector,
- sort action on one of the table headers,
- player row click for navigation.

Derived data used by the screen:
- `filteredEvents` from selected statistics period,
- `statisticsPlayers` (players excluding trial status) from statistics context,
- computed per-player metrics:
  - `invitedCount`,
  - `acceptedCount`,
  - `selectedCount`,
  - `acceptanceRate`,
  - `selectionRate`.

## Main Success Scenario

1. User opens Statistics and switches to Player Statistics.
2. System receives `filteredEvents` and `statisticsPlayers` from Statistics
   context.
3. System computes player statistics for each statistics player:
   - `invitedCount`: number of filtered events with an invitation for player,
   - `acceptedCount`: number of filtered events with invitation status
     `accepted`,
   - `selectedCount`: number of filtered events where player is in any team
     `selectedPlayers`,
   - `acceptanceRate`: `acceptedCount / invitedCount * 100`, or `0` when
     `invitedCount = 0`,
   - `selectionRate`: `selectedCount / acceptedCount * 100`, or `0` when
     `acceptedCount = 0`.
4. System sorts computed list by player last name, then first name
   (case-insensitive).
5. System initializes level range to 1..5 and default sorting to:
   - field: `name`,
   - direction: ascending.
6. System filters rows by selected level range.
7. System renders a statistics table with columns:
   - Player,
   - Invited,
   - Accepted,
   - Selected,
   - Acceptance Rate,
   - Selection Rate.
8. User clicks a sortable column header.
9. System applies sorting rules:
   - clicking current sort field toggles asc/desc,
   - clicking another field sets default direction:
     - `name`: ascending,
     - numeric/rate fields: descending,
   - ties on non-name fields are broken by player name ascending.
10. User clicks a player row.
11. System navigates to `/players/{playerId}`.

## Alternative Flows

### A1 - No Player Statistics Rows After Filtering

1. User opens Player Statistics with no players, or no rows remain after level
   range filtering.
2. System shows empty state message:
   `No player data available yet. Add players and events to see statistics.`
3. Table rows are not rendered.

### A2 - Authentication Or Route Protection Denies Access

1. User is unauthenticated or session expires.
2. Protected routing and API auth behavior redirect user to login.
3. Player Statistics content is not available until authentication is restored.

## Postconditions

Success:
- User can inspect per-player invitation, acceptance, and selection statistics
  in selected period.
- User can reorder table by supported dimensions.
- User can navigate to player detail page.
- No data mutation occurs; operation is read-only analytics.

Failure or empty-data outcomes:
- Existing state remains unchanged.
- Appropriate empty-state or access behavior is shown.

## Business Rules Reflected In Current Implementation

- Player Statistics operates only on events visible in selected statistics
  period.
- Only non-trial players are included via Statistics context.
- Counts are event-based (at most one count increment per player/event for each
  metric).
- Selection count is based on player presence in any team selectedPlayers list
  for an event.
- Acceptance rate denominator is invited count.
- Selection rate denominator is accepted count.
- Division-by-zero cases return rate `0`.
- Initial table sort is by player name ascending.
- Level range filter defaults to 1..5.

## Validation Rules Reflected In Current Implementation

- Statistics period filter includes events with date in inclusive range
  (`startDate <= eventDate <= endDate`).
- If period dates are invalid/unparseable, event filtering falls back to all
  events.
- Events with unparseable dates are excluded from period-filtered results.
- Player level filter includes only players where
  `minLevel <= player.level <= maxLevel`.

## Data And Integration Expectations

- No dedicated Player Statistics API call is made by this screen.
- Data is sourced from already-loaded Zustand store state and Statistics route
  context:
  - players from `usePlayers` filtered by non-trial status,
  - period-filtered events from `useEvents` and statistics period utilities.
- Navigation integration:
  - player row click: `/players/{playerId}`.

## Acceptance Criteria

1. Given authenticated access and available data, when Player Statistics is
   opened, then one row per eligible player is shown with invited, accepted,
   selected counts and both rates.
2. Given a selected statistics period, when event dates are inside inclusive
   bounds, then those events are included in metric calculations.
3. Given no invitations for a player in filtered events, when rates are shown,
   then acceptance rate is `0%`.
4. Given no accepted invitations for a player in filtered events, when rates are
   shown, then selection rate is `0%`.
5. Given a level range update, when players are outside range, then those
   players are excluded from visible rows.
6. Given a sortable column click, when sorting is applied, then rows are ordered
   by selected field/direction with name as tie-breaker for non-name fields.
7. Given a player row click, when navigation runs, then player detail route is
   opened.
8. Given no rows to display, when Player Statistics is rendered, then the player
   statistics empty state is shown.

## Notes

- This specification documents the current behavior in the implemented React
  frontend.
- Player Statistics is an analytical view and does not modify invitations,
  selections, players, or events.
