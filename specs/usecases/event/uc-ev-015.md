# UC-EV-015 - Delete Activity

## Goal

Allow an admin or trainer to permanently delete a locally managed Activity and
its Activity-owned data.

## Main Success Scenario

1. Actor opens an Activity in an unlinked Squad.
2. Actor chooses Delete Activity and confirms the destructive action.
3. System permanently deletes the Activity and its invitations, Teams,
   lineups, shirt assignments, and attendance.
4. The Activity disappears from Activity lists and cannot be restored.

## Alternative Flow - Spond-Linked Activity

1. Actor attempts to delete an Activity linked to Spond.
2. System blocks the local deletion.
3. If Spond later reports that the external Activity was deleted,
   synchronization removes the local Activity and its Activity-owned data.

## Rules

- Deletion is available only for unlinked Activities.
- The confirmation must clearly state that deletion is permanent.
- Cancelled Activities may still be deleted locally.
- Only admins and trainers may delete Activities.
