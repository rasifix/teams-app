# Spond Integration

## Purpose

The Spond integration imports reviewed data from one Spond group into one
Squad. It supplements local planning; it is not a bidirectional mirror and does
not write changes back to Spond.

Spond is the user-facing system and the source of truth for events,
membership, guardians, and RSVP. This application owns match planning:
selection, teams, formations, lineups, shirts, responsible people, and
statistics. Manual RSVP entry is only for Squads without a Spond link; it is
never written back to Spond.

## Roles: This Application Vs. Spond

For a Squad linked to Spond, responsibilities are split as follows.

| Concern | Spond | This application |
| --- | --- | --- |
| Members, guardians, cross-squad membership | Source of truth; managed and imported between squads in Spond | Read-only synchronized copy |
| Events (date, time, location, opponent) | Source of truth; created, edited, deleted in Spond | Read-only synchronized copy |
| RSVP, invitations, notifications | Source of truth; responses given in Spond | Read-only synchronized copy; no invite action |
| Selection, teams, formations, lineups | Not provided | Source of truth |
| Shirts, responsible people, statistics | Not provided | Source of truth |
| Planning-only attributes (level, preferred shirt number, active-for-selection) | Not provided | Locally editable on synchronized players |

Rules for Spond-linked Squads:

- Synchronized fields of players, trainers, guardians, and events are
  read-only; only locally added fields are editable.
- Local member creation, editing, deletion, merging, import, deduplication,
  cross-squad import, and export to Spond are unavailable.
- Local event creation, scheduling edits, and deletion are unavailable.
- No invite action exists and RSVP cannot be changed locally.
- "Selection finalized" is an internal planning state; this application
  never sends or publishes selections.
- Guardians have no access to this application; guardian records are
  read-only references for assigning a responsible adult to a Team.
- Trainer/admin identities keep a local representation for permissions.

Squads without a Spond link keep full local functionality (member and event
management, invitations, manual RSVP). Spond is never a hard requirement.

## Link Model

- `Squad.spondId` links a Squad to one Spond group.
- `Player.spondId`, `Guardian.spondId`, and `Event.spondId` link imported or
  matched local records to their Spond source records.
- The initial link flow may list and select a Spond group.
- After a Squad is linked, player and event synchronization always use that
  group. The user cannot choose another group from those scoped flows.
- Unlinking clears `Squad.spondId` only. Existing local data remains intact.

## Read And Apply Boundary

Spond access is split into two stages:

1. A read-only proxy logs in to Spond, lists accessible groups, and loads a
   normalized snapshot by group and date range.
2. The application submits the snapshot together with explicit create, link,
   skip, and update decisions to an atomic local import endpoint.

The read proxy may only use Spond login and read operations. Spond credentials
and access tokens are kept in memory for the active wizard, are cleared when it
closes, and must never be stored or logged.

## Review And Idempotency

- No snapshot changes local data until the user reviews and applies it.
- Every selected record has an explicit decision.
- All mandatory local fields must be valid before Apply is enabled.
- The apply request includes a unique `importId`. Repeating a completed
  `importId` returns its original result instead of applying it twice.
- The request carries the Squad revision when available. A stale preview,
  duplicate external link, or concurrent import is rejected as a conflict.
- A successful apply is atomic and reports created, linked, updated, unchanged,
  skipped, and warning counts.

## Matching And Normalization

- Existing links by `spondId` take precedence over suggestions.
- Player suggestions compare normalized first name, last name, and compatible
  birth date.
- Name normalization uses Unicode compatibility normalization, case folding,
  whitespace normalization, HTML apostrophe decoding, and common apostrophe
  variant normalization.
- Event suggestions are local Events on the same calendar date. Exactly one
  suggestion may be selected automatically; ambiguous suggestions require a
  choice.
- Duplicate external identifiers are invalid.

## Time Semantics

- Date-range inputs and predefined Squad periods are Europe/Zurich calendar
  dates.
- A range boundary is converted from local midnight to the corresponding UTC
  instant before requesting Spond.
- Spond event timestamps are real instants. They are converted once into the
  application's UTC-shaped Europe/Zurich wall-clock representation.
- Rendering that stored wall-clock representation must not apply another
  timezone conversion.

## Completion Behavior

After a successful apply, the application reloads Squad data, returns to the
page that launched the flow, and shows a one-time translated message containing
the created, updated, and linked counts.

## Related Use Cases

- UC-GR-011 - Link Or Unlink A Spond Group
- UC-GR-012 - Synchronize Players And Guardians From Spond
- UC-EV-012 - Synchronize Events From Spond
