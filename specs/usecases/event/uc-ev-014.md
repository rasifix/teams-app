# UC-EV-014 - Cancel or Restore Activity

## Goal

Allow an admin or trainer to cancel a locally managed Activity and restore it
when appropriate.

## Main Success Scenario - Cancel

1. Actor opens an active Activity in an unlinked Squad.
2. Actor chooses Cancel Activity and confirms.
3. System sets the Activity status to `cancelled`.
4. Invitations, Teams, lineups, shirts, and attendance are preserved.
5. Activity Detail remains available in read-only mode.

## Main Success Scenario - Restore

1. Actor opens a locally cancelled Activity.
2. Actor chooses Restore Activity and confirms.
3. System sets the Activity status back to `active`.
4. Normal Activity mutations become available again.

## Spond-Linked Activities

Local cancellation and restoration are unavailable for Spond-linked Activities.
Spond synchronization applies cancellation status and keeps linked cancelled
Activities read-only.

## Rules

- Cancelled Activities are never considered completed.
- Cancellation is reversible for locally managed Activities.
- Only admins and trainers may cancel or restore Activities.
