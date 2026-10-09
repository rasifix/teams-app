# UC-EV-010 - Record Attendance

## Goal

Allow an admin or trainer to record who actually attended an Event once it has
started.

## Preconditions

- User is authenticated with the admin or trainer role in the active group.
- The Event has started (its start time is in the past).

## Main Success Scenario

1. User opens Event Detail of a started Event.
2. System shows the Attendance section with every player who accepted, was
   selected, or already has a recorded status, ordered by name.
3. System shows the counts of present, absent, excused and not recorded.
4. User picks present, absent or excused for a player.
5. System persists the status through `PUT /activities/{id}/attendance` and
   updates the row and counts.

## Alternative Flows

- Event has not started: the section shows that attendance can be recorded once
  the Event has started; no controls are offered.
- No players are eligible: the section shows an empty state.
- Persisting fails: the previous status stays displayed.

## Business Rules

- Attendance is independent of invitation response and team selection.
- A status can be changed at any time after the Event has started.
- The section is not rendered for users without the admin or trainer role.
- Players without a recorded status count as not recorded, not as absent.

## Acceptance Criteria

1. Given a started Event, when an admin opens Event Detail, then the Attendance
   section lists accepted and selected players with their status.
2. Given an Event in the future, then no attendance controls are shown.
3. Given a guardian, then the Attendance section is not shown.
4. When a status is chosen, then it is saved and the counts update.

## Notes

- Recorded attendance is not yet part of the statistics (UC-ST-002 shows
  invitation and selection participation).
