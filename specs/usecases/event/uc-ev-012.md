# UC-EV-012 - Synchronize Events From Spond

## Goal

Allow an authorized Squad Manager to review and synchronize only Events from
the Squad's linked Spond group for a selected date range.

## Scope

This use case covers:

- starting Sync from the Events page,
- using a predefined Squad period or custom date range,
- reading Events only from the linked Spond group,
- hiding unchanged Events,
- filtering actionable Events by Training or Match name,
- selecting all or none of the visible Events,
- creating, linking, and updating Events and invitation responses,
- preserving Europe/Zurich wall-clock time,
- returning to Events with a completion message.

This use case does not import Players or Guardians, permit choosing another
Spond group, or write changes back to Spond.

## Primary Actor

Squad Manager (admin or trainer with restricted-management permission)

## Preconditions

- The actor is authenticated and may manage the selected Squad.
- The Squad has a non-empty `spondId`.
- The actor has Spond credentials for an account that can access the linked
  group.

## Trigger

The actor chooses the Spond-logo Sync action on Events.

## Main Success Scenario

1. System shows Sync only when the Squad has an active Spond link and the actor
   has permission.
2. Actor starts Sync and enters Spond credentials.
3. System authenticates and verifies access to `Squad.spondId`; no group
   selector is shown.
4. System offers configured Squad periods when at least one exists, plus a
   custom date range. Selecting a period sets the range to its start/end dates.
5. System validates the range and converts its Europe/Zurich calendar
   boundaries to UTC instants before loading the Spond snapshot.
6. System converts returned Spond event instants exactly once into the
   application's Europe/Zurich wall-clock convention.
7. System matches Events by existing `spondId`; otherwise same-calendar-day
   Events are suggestions. A single suggestion is selected automatically.
8. System entirely removes unchanged linked Events from the actionable list.
9. For a new Event, system defaults the type to Training when its name contains
   `training` case-insensitively; otherwise it defaults to Match.
10. Actor may filter the actionable list:
    - Training shows Events classified or named as Training.
    - Matches shows Events whose name contains `match` case-insensitively.
11. Actor may Select all or Select none for the currently visible filtered
    Events.
12. Actor may skip, link, or create each actionable Event and fills required
    fields: a Trainer for Training, or a Team name for Match/Tournament.
13. Actor reviews the exact final change summary and applies the sync.
14. System applies Event decisions atomically, reloads local data, returns to
    Events, and shows a one-time success message with created, updated, and
    linked counts.

## Alternative Flows

### A1 - Squad Is Not Linked

1. The Squad has no `spondId`.
2. Events does not show the Spond Sync action.
3. Direct navigation to the scoped route returns to Events.

### A2 - Linked Group Is Inaccessible

1. Credentials are valid, but the account cannot access `Squad.spondId`.
2. System reports the linked-group error and does not offer another group.

### A3 - Invalid Range

1. A date is missing, the end is not after the start, or the range exceeds 365
   days.
2. System shows the relevant validation error and does not load a snapshot.

### A4 - No Event Needs Synchronization

1. Every Spond Event in range is already linked and its supported fields and
   mapped invitation responses match local data.
2. System does not render those Events as import candidates.
3. Review shows that there is nothing to synchronize and Apply is disabled.

### A5 - Filter Has No Matches

1. The selected Training or Matches filter has no actionable rows.
2. System shows a no-events-to-sync message for that filter and hides bulk
   selection controls.

### A6 - Mandatory Event Field Missing

1. A selected new Training has no Trainer, or a selected Match/Tournament has
   no non-empty Team name.
2. System identifies the missing field and blocks progression/apply.

### A7 - Apply Fails

1. Permission, validation, stale-preview, uniqueness, network, or persistence
   validation fails.
2. System displays an error and remains in the wizard.
3. No partial changes are committed.

## Business Rules

- Event sync uses only `Squad.spondId` and never displays a group selector.
- The scoped flow submits skip decisions for member data and changes Events
  only.
- An Event is actionable when it is unlinked or when supported metadata or a
  mapped Player invitation response differs.
- Supported comparison fields are name, start, end, location, and invitation
  response for Players already linked by Spond id.
- Matches filtering is based strictly on case-insensitive substring `match` in
  the Spond Event name.
- Training defaulting is based on case-insensitive substring `training` in the
  name; all other new Events default to Match.
- Select all/none affects only the rows currently visible under the filter.
- Imported times must preserve the intended Europe/Zurich local time across
  standard time and daylight-saving time.

## API Contract

- `POST /api/integrations/spond/groups` for authentication and linked-group
  access verification
- `POST /api/integrations/spond/snapshot`
- `POST /api/squads/{squadId}/spond/import`

## Acceptance Criteria

1. Given an authorized actor and linked Squad, then Events shows a Sync action
   with the Spond logo.
2. Given event sync, then no group selector appears and the linked group id is
   used.
3. Given configured periods, then choosing one sets the event synchronization
   date range.
4. Given a new Spond Event named with `training` in any case, then Training is
   selected by default; otherwise Match is selected.
5. Given the Matches filter, then only actionable Events whose names contain
   `match` case-insensitively are shown.
6. Given a filter and visible rows, then Select all/none changes only those
   visible decisions.
7. Given an unchanged linked Event, then it is absent from the review list.
8. Given a Spond event at a known instant, then its displayed and persisted
   time matches the intended Europe/Zurich wall-clock time without a two-hour
   offset.
9. Given a selected Event missing a mandatory Trainer or Team name, then Apply
   is blocked.
10. Given a successful apply, then the actor returns to Events and sees a
    one-time translated completion message.

