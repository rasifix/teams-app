# UC-EV-004 - Manually Change Player Invitation Response

## Goal

Allow an admin or trainer to correct a Player's invitation response in an
unlinked Squad, or locally correct a Spond-linked response after the Activity
has started.

## Scope

For Spond-linked Squads, the response remains managed by Spond until the
Activity starts. After that point, authorized staff may locally correct the
response and decline reason; the correction is not written back to Spond.

This use case covers staff-only updates to RSVP data used for match planning
and statistics. It does not send an invitation, notify a member, write a change
back to Spond, or allow a guardian or player to respond in this application.

## Primary Actor

Admin or trainer

## Preconditions

- The actor is authenticated and may manage the selected Squad.
- The Activity and Player Invitation record exist.

## Main Success Scenario

1. Actor opens Activity Detail.
2. System shows the current response, decline reason, and Spond-linked context.
3. For an unlinked Activity, the actor selects the corrected response and may
   set a decline reason when the response is declined. For a linked Activity
   before it starts, the response control is read-only but the actor may set or
   edit only the local decline reason. Once the linked Activity has started,
   the actor may also locally correct the response.
4. System persists the change and, if the response becomes declined, removes
   the Player from Team and Match planning data while retaining the Invitation.
5. Activity Detail and planning views show the updated value.

## Business Rules

- Guardians and players cannot change RSVP status in this application.
- Spond is the source of response data for linked Squads before the Activity
  starts; manual response entry is available for unlinked Squads and local
  post-start correction is available for linked Squads.
- Manual changes are local and are not written back to Spond.
- A later Spond synchronization must show the actor when imported RSVP data
  differs from a local manual value before overwriting it.
- Only accepted Players are selectable for planning.
- Response and decline-reason changes are rejected while the Activity is
  cancelled.
- A decline reason may be set or changed without changing the Spond-managed
  response before the Activity starts.

## Acceptance Criteria

1. Given an admin or trainer in an unlinked Squad, when a valid response is
   saved, then the local Invitation is updated.
2. Given an admin or trainer in a linked Squad before the Activity starts, then
   the response control is read-only while the local decline reason remains
   editable.
3. Given an admin or trainer in a linked Squad after the Activity starts, when
   a valid local correction is saved, then the local Invitation response and
   decline reason are updated without writing to Spond.
4. Given a guardian or player, then no RSVP mutation control or authorized API
   operation is available.
5. Given a response change to declined, then the Invitation remains with
   `response: declined` while the Player is removed from Team and Match
   planning data.
6. Given a later Spond value that conflicts with manual data, then the import
   review identifies the difference before Apply.
