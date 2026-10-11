# UC-GR-011 - Link Or Unlink A Spond Group

## Goal

Allow an authorized Squad Manager to link the active Squad to one Spond group,
review an optional initial import, open the linked group in Spond, or remove the
link later.

## Scope

This use case covers:

- showing Spond integration status in Group Settings,
- authenticating temporarily with Spond,
- selecting a Spond group during initial linking,
- optionally importing players, guardians, and events as part of the link flow,
- selecting a predefined Squad period or a custom range when events are
  included,
- opening the linked group in Spond,
- unlinking the Spond group.

This use case does not cover later scoped synchronization from the Players page
(UC-GR-012), later event synchronization from the Events page (UC-EV-012), or
editing data in Spond.

## Primary Actor

Squad Manager (admin or trainer with restricted-management permission)

## Preconditions

- The actor is authenticated.
- A Squad is selected.
- The actor may manage the Squad.
- For linking, the Squad has no `spondId`.

## Trigger

The actor opens Group Settings and chooses Link Spond Group or Unlink Spond.

## Main Success Scenario - Link

1. Group Settings shows that no Spond group is linked.
2. Actor starts Link Spond Group.
3. System asks for Spond email and password and states that credentials and the
   resulting token are not stored.
4. System authenticates through the read-only proxy and lists accessible Spond
   groups.
5. Actor selects one group. If only one group is available, the system may
   preselect it and continue.
6. Actor selects whether to review Players (including their Guardians), Events,
   or both.
7. If Events are selected, the system offers configured Squad periods and a
   custom date range. Selecting a period copies its start and end dates into
   the range.
8. System loads a normalized snapshot and presents the applicable player,
   guardian, and event review steps.
9. Actor reviews an exact summary of creates, links, and updates and applies
   the import.
10. System validates permissions, Squad revision, link uniqueness, required
    fields, snapshot completeness, and all decisions.
11. System applies the import atomically and stores the selected group id as
    `Squad.spondId`.
12. System clears the Spond credentials, reloads local data, returns to Group
    Settings, and shows a one-time success message with created, updated, and
    linked counts.
13. Group Settings now offers Open Spond Group and Unlink Spond.

## Main Success Scenario - Open Linked Group

1. The Squad has a non-empty `spondId`.
2. Actor opens Group Settings.
3. System builds the Spond group URL from the encoded `spondId`.
4. Actor opens the group in a new browser context.

## Main Success Scenario - Unlink

1. Actor chooses Unlink Spond in Group Settings.
2. System asks for confirmation.
3. Actor confirms.
4. System updates the Squad with `spondId: null` and reloads local data.
5. Group Settings returns to the unlinked state.

## Alternative Flows

### A1 - Spond Authentication Or Access Fails

1. Spond rejects the credentials, rate-limits the request, or denies access.
2. System shows the mapped error and keeps the actor in the wizard.
3. No group link or import is persisted.

### A2 - Selected Group Is No Longer Available

1. The group disappears or the account loses access before snapshot load.
2. System reports that the group is unavailable.
3. No changes are applied.

### A3 - Invalid Event Range

1. The range is incomplete, the end is not after the start, or the range
   exceeds 365 days.
2. System shows the range validation error and disables continuation.

### A4 - Stale Or Conflicting Apply

1. The Squad changes after preview, an external id is already linked, or an
   import with conflicting state is running.
2. API returns conflict.
3. No partial changes are committed; the actor must reload the preview.

### A5 - Unlink Fails

1. The Squad update fails.
2. System leaves the existing link intact and displays an error.

## Business Rules

- A Squad links to at most one Spond group.
- The group selector appears only during initial linking.
- Players and Events scoped syncs never permit changing the linked group.
- Guardians are not an independent import type; they accompany imported
  Players.
- Predefined periods are owned and managed in Group Settings, not Statistics.
- Unlinking is non-destructive and does not clear local record links or delete
  imported data.
- The integration is read-only toward Spond.
- Credentials and Spond tokens are request/session scoped and must not be
  persisted or logged.

## API Contract

- `POST /api/integrations/spond/groups`
- `POST /api/integrations/spond/snapshot`
- `POST /api/squads/{squadId}/spond/import`
- `PUT /api/squads/{squadId}` with `spondId: null` for unlinking

## Acceptance Criteria

1. Given an unlinked Squad, when an authorized actor opens Group Settings,
   then Link Spond Group is available.
2. Given valid Spond credentials, when linking starts, then only groups visible
   to that Spond account are selectable.
3. Given configured Squad periods and Events selected, then those periods can
   populate the event date range.
4. Given a reviewed valid import, when Apply succeeds, then the Squad stores
   the selected Spond group id and all selected changes are committed atomically.
5. Given a successful link/import, then the actor returns to Group Settings and
   sees a one-time translated result message.
6. Given a linked Squad, then Group Settings shows a link to the corresponding
   Spond group and an unlink action.
7. Given unlink confirmation, when the update succeeds, then `Squad.spondId`
   is cleared without deleting imported local records.

