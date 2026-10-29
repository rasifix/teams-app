# UC-EV-010 - Record Activity Attendance

## Goal

Allow an admin or trainer to record who actually attended an Activity once it
has started.

## Preconditions

- User is authenticated with the admin or trainer role in the active squad.
- The Activity has started (`startsAt` is in the past) and is not cancelled.

## Main Success Scenario

1. User opens Activity Detail of a started Activity.
2. System shows the Attendance section with every selected Player, ordered by
   name. Players who were invited but not selected are not included.
3. System shows the counts of present, absent, excused and not recorded.
4. User picks present, absent or excused for a player.
5. System persists the status through
   `PUT /api/squads/{squadId}/activities/{id}/attendance` and updates the row
   and counts.

## Alternative Flows

- Activity has not started: the section shows that attendance can be recorded
  once the Activity has started; no controls are offered.
- No players are eligible: the section shows an empty state.
- Persisting fails: the previous status stays displayed.

## Business Rules

- Attendance changes are rejected while the Activity is cancelled.

- Attendance records are scoped to selected Players only.
- Attendance requires an Invitation and Team selection.
- A selected Player has at most one attendance record for the Activity.
- A status can be changed at any time after the Activity has started.
- The section is not rendered for users without the admin or trainer role.
- Players without a recorded status count as not recorded, not as absent.

## Acceptance Criteria

1. Given a started Activity, when an admin opens Activity Detail, then the
   Attendance section lists every selected Player with their status.
2. Given an Activity in the future, then no attendance controls are shown.
3. Given a guardian, then the Attendance section is not shown.
4. When a status is chosen, then it is saved and the counts update.

## Notes

- Recorded attendance is not yet part of the statistics (UC-ST-002 shows
  invitation and selection participation).
