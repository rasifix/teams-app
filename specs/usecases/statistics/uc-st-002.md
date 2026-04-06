# UC-ST-002 - Event Attendance Overview

## Goal

Allow an authenticated user to analyze per-event attendance outcomes for players
in the selected statistics period using a player-by-event matrix.

## Scope

This use case covers:
- opening Event Attendance from the Statistics area,
- applying the selected statistics period to event data,
- filtering players by level range,
- rendering a player-by-event attendance matrix,
- displaying invitation/selection attendance states per matrix cell,
- navigating to player details and event details from the matrix,
- auto-scrolling horizontally to the next upcoming event column.

This use case does not cover:
- creating or editing statistics periods,
- creating events or changing event setup,
- inviting players or changing invitation status,
- selecting players into teams,
- editing player master data.

## Primary Actor

Authenticated User

## Supporting Actors

- Frontend UI (Statistics page, Event Attendance tab, Event Attendance matrix)
- Zustand store selectors (events, players, selected statistics period)
- Router navigation (player detail and event detail routes)

## Preconditions

- User is authenticated.
- A group is selected and group data is loaded.
- Players and events are available in application state (may be empty).
- User can access the Statistics page.

## Trigger

The user opens Statistics and selects the Event Attendance tab.

## Input Data

User-controlled inputs:
- selected statistics period (All events or one group period),
- level range filter (`minLevel`, `maxLevel`) using the level-range selector,
- click on a player row,
- click on an event date header.

Derived data used by the screen:
- `filteredEvents` from selected statistics period,
- `statisticsPlayers` (players excluding trial status) from statistics context,
- attendance state per player/event cell derived from invitation and selection
  data.

## Main Success Scenario

1. User opens Statistics and switches to Event Attendance.
2. System receives `filteredEvents` and `statisticsPlayers` from Statistics
   context.
3. System initializes level range to 1..5.
4. System filters players by selected level range.
5. For each visible player and each visible event, system derives a status using
   this precedence:
   - `not-invited`: no invitation exists for player/event,
   - `selected`: player is assigned in any team `selectedPlayers` for event,
   - `accepted`: invitation status is accepted,
   - `injured`: invitation status is injured,
   - `sick`: invitation status is sick,
   - `unavailable`: invitation status is unavailable,
   - `declined`: invitation status is declined,
   - `open`: fallback for remaining invitation states.
6. System renders attendance matrix with:
   - sticky player column,
   - one event column per filtered event,
   - status icon and color for each player/event cell,
   - status legend for selected, invitation statuses, and not invited.
7. System sorts player rows by last name, then first name.
8. System attempts horizontal auto-scroll to the first upcoming event column
   (if one exists and is not the first event column).
9. User can click a player row.
10. System navigates to `/players/{playerId}`.
11. User can click an event date header.
12. System navigates to `/events/{eventId}`.

## Alternative Flows

### A1 - No Players Or No Events Available

1. Event Attendance is opened with no players or no filtered events.
2. System shows empty state message:
   `No data available. Add players and events to see the attendance matrix.`
3. Matrix is not rendered.

### A2 - No Players Match Level Range

1. User changes level range so no players qualify.
2. System keeps event columns and legend visible.
3. Matrix body renders with zero rows.

### A3 - Authentication Or Route Protection Denies Access

1. User is unauthenticated or session expires.
2. Protected routing and API auth behavior redirect user to login.
3. Event Attendance content is not available until authentication is restored.

## Postconditions

Success:
- User can inspect attendance outcome per player across period-filtered events.
- User can navigate to related player and event detail pages.
- No data mutation occurs; operation is read-only analytics.

Failure or empty-data outcomes:
- Existing state remains unchanged.
- Appropriate empty-state or access behavior is shown.

## Business Rules Reflected In Current Implementation

- Event Attendance operates only on events visible in selected statistics period.
- Only non-trial players are included via Statistics context.
- Level range filter defaults to 1..5.
- Attendance status is derived per player/event with deterministic precedence:
  selected overrides invitation status.
- A `not-invited` state is shown when no invitation exists for a player/event.
- Player ordering is alphabetical by last name, then first name
  (case-insensitive).
- Event columns are rendered in the order provided by filtered events.
- Matrix attempts to auto-scroll to next upcoming event after first render when
  applicable.

## Validation Rules Reflected In Current Implementation

- Statistics period filter includes events with date in inclusive range
  (`startDate <= eventDate <= endDate`).
- If period dates are invalid/unparseable, event filtering falls back to all
  events.
- Events with unparseable dates are excluded from period-filtered results.
- Player level filter includes only players where
  `minLevel <= player.level <= maxLevel`.

## Data And Integration Expectations

- No dedicated Event Attendance API call is made by this screen.
- Data is sourced from already-loaded Zustand store state and Statistics route
  context:
  - players from `usePlayers` filtered by non-trial status,
  - period-filtered events from `useEvents` and statistics period utilities.
- Navigation integrations:
  - player click: `/players/{playerId}`,
  - event header click: `/events/{eventId}`.

## Acceptance Criteria

1. Given authenticated access and available data, when Event Attendance is
   opened, then a matrix of players vs filtered events is shown.
2. Given a selected statistics period, when event dates are inside the inclusive
   bounds, then those events are included in the matrix.
3. Given no invitation for a player/event pair, when the matrix cell is
   rendered, then the cell shows Not Invited status.
4. Given a player selected in any event team, when the matrix cell is rendered,
   then Selected status is shown even if invitation status is accepted.
5. Given a level range update, when players are outside the range, then they
   are excluded from rendered matrix rows.
6. Given a player row click, when navigation runs, then player detail route is
   opened.
7. Given an event date header click, when navigation runs, then event detail
   route is opened.
8. Given no players or no events, when Event Attendance is opened, then an
   attendance empty state is shown instead of matrix content.

## Notes

- This specification documents the current behavior in the implemented React
  frontend.
- Event Attendance is an analytical view and does not modify invitations,
  selections, players, or events.
