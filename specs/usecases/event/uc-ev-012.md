# UC-EV-012 - Synchronize Activities From Spond

## Goal

Allow an authorized Squad Manager to review and synchronize only supported
Match and Tournament Activities from the Squad's linked Spond group for a
selected date range.

## Scope

This use case covers:

- starting Sync from the Activities page,
- using a predefined Squad period or custom date range,
- reading Activities only from the linked Spond group,
- selecting one subgroup of that linked group for synchronization,
- hiding unchanged Activities,
- hiding unsupported Spond activity types,
- selecting all or none of the visible Activities,
- creating, linking, and updating Match/Tournament Activities and invitation
  responses,
- preserving Europe/Zurich wall-clock time,
- returning to Activities with a completion message.

This use case does not import Players or Guardians, permit choosing another
Spond group, write changes back to Spond, or allow guardians or players to
respond in this application.

## Primary Actor

Squad Manager (admin or trainer with restricted-management permission)

## Preconditions

- The actor is authenticated and may manage the selected Squad.
- The Squad has a non-empty `spondId`.
- The actor has Spond credentials for an account that can access the linked
  group.

## Trigger

The actor chooses the Spond-logo Sync action on Activities.

## Main Success Scenario

1. System shows Sync only when the Squad has an active Spond link and the actor
   has permission.
2. Actor starts Sync and enters Spond credentials.
3. System authenticates and verifies access to `Squad.spondId`; no group
   selector is shown.
4. System offers configured Squad periods when at least one exists, plus a
   custom date range. Selecting a period sets the range to its start/end dates.
5. System lists the linked group's subgroups and selects the first subgroup by
   default. The actor selects exactly one subgroup; when no subgroups are
   returned, the whole group is synchronized.
6. System validates the range and converts its Europe/Zurich calendar
   boundaries to UTC instants before loading the Spond snapshot.
7. System converts returned Spond Activity instants exactly once into the
   application's Europe/Zurich wall-clock convention.
8. System skips and hides unsupported Spond activity types. It never classifies
   them by name.
9. System matches supported Activities by existing `spondId`; otherwise
   same-calendar-day Activities are suggestions. A single suggestion is
   selected automatically.
10. System entirely removes unchanged linked Activities from the actionable
    list.
11. Actor may Select all or Select none for the currently visible Activities.
12. Actor may skip, link, or create each actionable Activity and fills the
    required Match/Tournament fields, including at least one Team for a
    Tournament and exactly one Team for a Match.
13. Actor reviews the exact final change summary and applies the sync.
14. System applies Activity decisions atomically, reloads local data, returns
    to Activities, and shows a one-time success message with created, updated,
    linked counts.

## Alternative Flows

### A1 - Squad Is Not Linked

1. The Squad has no `spondId`.
2. Activities does not show the Spond Sync action.
3. Direct navigation to the scoped route returns to Activities.

### A2 - Linked Group Is Inaccessible

1. Credentials are valid, but the account cannot access `Squad.spondId`.
2. System reports the linked-group error and does not offer another group.

### A3 - Invalid Range

1. A date is missing, the end is not after the start, or the range exceeds 365
   days.
2. System shows the relevant validation error and does not load a snapshot.

### A4 - No Activity Needs Synchronization

1. Every supported Spond Activity in range is already linked and its supported
   fields and
   mapped invitation responses match local data.
2. System does not render those Activities as import candidates.
3. Review shows that there is nothing to synchronize and Apply is disabled.

### A5 - Filter Has No Matches

1. No supported Match or Tournament Activity has actionable rows.
2. System shows a no-activities-to-sync message and hides bulk selection
   controls.

### A6 - Mandatory Activity Field Missing

1. A selected Activity has an invalid kind or does not have the required Team
   count for its kind.
2. System identifies the missing field and blocks progression/apply.

### A7 - Apply Fails

1. Permission, validation, stale-preview, uniqueness, network, or persistence
   validation fails.
2. System displays an error and remains in the wizard.
3. No partial changes are committed.

## Business Rules

- Activity sync uses only `Squad.spondId` and never displays a group selector.
- Subgroup selection is local to each synchronization run; all returned
  subgroups are selected by default.
- The scoped flow submits skip decisions for member data and changes Activities
  only.
- An Activity is actionable when it is unlinked or when supported metadata or a
  mapped Player invitation response differs.
- Supported comparison fields are kind, name, start, end, location, and invitation
  response for Players already linked by Spond id.
- Unsupported Spond activity types are skipped and hidden rather than imported.
- Select all/none affects only the rows currently visible under the filter.
- Imported times must preserve the intended Europe/Zurich local time across
  standard time and daylight-saving time.
- Imported RSVP responses are planning data. Guardian and player response
  actions remain in Spond.

## API Contract

- `POST /api/integrations/spond/groups` for authentication and linked-group
  access verification
- `POST /api/integrations/spond/snapshot`
- `POST /api/squads/{squadId}/spond/import`

## Acceptance Criteria

1. Given an authorized actor and linked Squad, then Activities shows a Sync action
   with the Spond logo.
2. Given Activity sync, then no group selector appears and the linked group id is
   used.
3. Given configured periods, then choosing one sets the Activity synchronization
   date range.
4. Given a Spond record with a supported activity type, then it is mapped to a
   Match or Tournament Activity.
5. Given a Spond record with an unsupported activity type, then it is hidden
   and not imported.
6. Given visible rows, then Select all/none changes only those visible
   decisions.
7. Given an unchanged linked Activity, then it is absent from the review list.
8. Given a Spond Activity at a known instant, then its displayed and persisted
   time matches the intended Europe/Zurich wall-clock time without a two-hour
   offset.
9. Given a selected Activity with invalid kind-specific Team data, then Apply
   is blocked.
10. Given a successful apply, then the actor returns to Activities and sees a
    one-time translated completion message.
