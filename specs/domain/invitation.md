# Invitation

An Invitation links one Player to one Match or Tournament and stores that
Player's RSVP state for selection and attendance workflows.

The response is `open`, `accepted`, or `declined`. A declined Invitation may
carry one reason: `sick`, `injured`, or `unavailable`. The reason is editable
locally because Spond does not provide it.

For Spond-linked Squads, the RSVP response is imported and read-only. Admins
and Trainers may still edit the local decline reason. For unlinked Squads,
Admins and Trainers may manually create and edit RSVP data. Guardians and
Players do not answer Invitations in this application.

Invariants:

- An Invitation targets a Player, never a Guardian or Trainer.
- There is at most one Invitation for a Player in an activity.
- Only Players with `accepted` Invitations may be selected.
- If a selected Player becomes declined, the Player is removed from the
  Invitation and all Match planning data.
- Attendance requires an Invitation but does not require acceptance or Team
  selection.
