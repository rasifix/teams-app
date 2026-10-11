# UC-EV-004 - Manually Change Player RSVP Status

## Goal

Allow an admin or trainer to correct or enter a Player's RSVP status in a
Squad without a Spond link.

## Scope

Not available for Spond-linked Squads; RSVP is changed in Spond only.

This use case covers staff-only updates to RSVP data used for match planning
and statistics. It does not send an invitation, notify a member, write a change
back to Spond, or allow a guardian or player to respond in this application.

## Primary Actor

Admin or trainer

## Preconditions

- The actor is authenticated and may manage the selected Squad.
- The Event and Player RSVP record exist.

## Main Success Scenario

1. Actor opens Event Detail.
2. System shows the current RSVP status and its Spond-linked context.
3. Actor selects the corrected status.
4. System persists the status and revalidates any existing Team selection.
5. Event Detail and planning views show the updated value.

## Business Rules

- Guardians and players cannot change RSVP status in this application.
- Spond is the normal source of RSVP data; manual entry is a fallback for an
  admin or trainer.
- Manual changes are local and are not written back to Spond.
- A later Spond synchronization must show the actor when imported RSVP data
  differs from a local manual value before overwriting it.
- Only accepted Players are selectable by default.

## Acceptance Criteria

1. Given an admin or trainer, when a valid status is saved, then the local RSVP
   record is updated.
2. Given a guardian or player, then no RSVP mutation control or authorized API
   operation is available.
3. Given a status change that makes a selected Player unavailable, then the
   existing selection is flagged for revalidation.
4. Given a later Spond value that conflicts with manual data, then the import
   review identifies the difference before Apply.
