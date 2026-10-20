# Spond Integration

Spond is optional. An unlinked Squad remains fully usable locally; a linked
Squad uses one fixed Spond group as the source of truth for membership,
Match/Tournament schedule data, cancellation status, and RSVP response.

## Ownership boundary

| Concern | Spond-linked Squad | This application |
| --- | --- | --- |
| Members and identity fields | Read-only synchronized copy | Local planning fields only |
| Match/Tournament existence and schedule | Read-only synchronized copy | No local create/delete/schedule edit |
| RSVP response | Read-only synchronized copy | Decline reason may be edited locally |
| Selection and Teams | Not provided | Source of truth |
| Formations and Match Plans | Not provided | Source of truth for Matches |
| Shirts and shirt assignments | Not provided | Source of truth |
| Attendance | Not provided | Source of truth |

If Spond deletes an imported activity, synchronization deletes the local
activity and its activity-owned data. If Spond cancels it, the local activity
is preserved as cancelled and read-only. The local model permits restoration,
but linked status changes come from synchronization.

## Permissions

- Only Admins may link or unlink a Spond group.
- Trainers may run synchronization.
- Linked member creation, deletion, and identity edits are unavailable locally.
- Admins and Trainers may edit local planning data.
- Unlinked Squads support local member, activity, and RSVP management.

## Link model

- `Squad.spondId` links one Squad to one Spond group.
- `Player.spondId`, `Guardian.spondId`, and activity `spondId` link synchronized
  records to their Spond source.
- Unlinking clears the Squad link without deleting existing local data.

## Import boundary

Synchronization reads a normalized Spond snapshot, presents explicit create,
link, skip, and update decisions, and applies the result atomically. Credentials
and access tokens are request-scoped and must never be persisted or logged.

Existing external links take precedence over suggestions. Duplicate external
identifiers are invalid. Date ranges use Squad periods and Europe/Zurich
calendar semantics; Spond timestamps are converted exactly once.
