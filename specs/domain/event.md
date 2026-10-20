# Match and Tournament

## Purpose

An activity is one scheduled Match or Tournament in a Squad. It holds the
invitation, selection, team, lineup, shirt, and attendance data for that
occurrence.

## Activity types

- A **Match** contains exactly one Team. Only Matches support a Formation and
  per-period Match Plan.
- A **Tournament** contains one or more Teams. Tournament Teams do not use
  Formations or Match Plans.

Both types have a name, start time, optional end time and location, optional
opponent name for Matches, player limits, status (`active` or `cancelled`),
and an optional Spond event link.

## Spond ownership

For a Spond-linked Squad, Spond is authoritative for activity existence,
schedule fields, cancellation status, and RSVP response. Local creation,
deletion, and schedule edits are unavailable. If Spond deletes an activity,
synchronization deletes the local activity and its activity-owned data.

For an unlinked Squad, Admins and Trainers may create, edit, cancel, restore,
and delete activities locally.

## Planning

- Only Players with an `accepted` Invitation may be selected.
- A Player may belong to at most one Team in an activity.
- If a selected Player becomes `declined`, the Player is removed from the
  Invitation and all Match planning data.
- Team sizes must respect the activity's minimum and maximum player limits.
- A Team has exactly one responsible person with the Trainer or Guardian role.
- A Team may use one Shirt Set and assign at most one Shirt to each selected
  Player. A Shirt may not be reused by another Team in the same activity.

## Cancellation and deletion

Cancellation preserves invitations, selection, Teams, lineups, shirts, and
attendance, and makes the activity read-only. Cancellation is reversible in
this model. Cancelled activities are never considered completed.

Deletion is permanent and removes the activity-owned data. It is a cleanup
operation for local activities; a future event-sourced backend may omit it from
the UI.

## Attendance

Attendance targets invited Players only, with at most one record per Player.
It is independent of RSVP response and Team selection. Only Admins and Trainers
may edit attendance, and only after the activity has started.

## Scope boundaries

This application does not model Social Events, Training Sessions, helper tasks,
or activity history. Helper tasks remain Spond-only. Event-sourced history is
deferred to a future backend.
