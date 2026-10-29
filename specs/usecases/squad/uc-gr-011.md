# UC-GR-011 - Link Or Unlink A Spond Group

## Goal

Allow an authorized Squad Manager to link the active Squad to one Spond group,
open the linked group in Spond, or remove the link later.

## Scope

This use case covers:

- showing Spond integration status in Group Settings,
- authenticating temporarily with Spond,
- selecting a Spond group during initial linking,
- opening the linked group in Spond,
- unlinking the Spond group.

This use case does not cover later full-group synchronization from Members,
Trainers, or Activities (UC-GR-012, UC-GR-013, UC-EV-012), or editing data in
Spond.

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
5. Actor selects one group and continues.
6. System stores the selected group id as `Squad.spondId`.
7. System clears the Spond credentials and shows a confirmation with a Done
   action.
8. Group Settings now offers Open Spond Group and Unlink Spond.

No members or activities are imported during linking. Later full-group
synchronization is covered by UC-GR-012, UC-GR-013, and UC-EV-012.

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
3. No group link is persisted.

### A2 - Link Or Unlink Fails

1. The Squad update fails.
2. System leaves the existing link intact and displays an error.

## Business Rules

- A Squad links to at most one Spond group.
- The group selector appears only during initial linking.
- Players, Guardians, Trainers, and Activities synchronize together after
  linking; Sync never permits changing the linked group.
- Unlinking is non-destructive and does not clear local record links or delete
  imported data.
- The integration is read-only toward Spond.
- Credentials and Spond tokens are request/session scoped and must not be
  persisted or logged.

## API Contract

- `POST /api/integrations/spond/groups`
- `PUT /api/squads/{squadId}` with the selected `spondId` for linking or
  `spondId: null` for unlinking

## Acceptance Criteria

1. Given an unlinked Squad, when an authorized actor opens Group Settings,
   then Link Spond Group is available.
2. Given valid Spond credentials, when linking starts, then only groups visible
   to that Spond account are selectable.
3. Given a selected Spond group, when the actor continues, then the Squad stores
   the selected group id without importing members or activities.
4. Given a successful link, then the actor sees a translated confirmation and
   can return to Group Settings.
5. Given a linked Squad, then Group Settings shows a link to the corresponding
   Spond group and an unlink action.
6. Given unlink confirmation, when the update succeeds, then `Squad.spondId`
   is cleared without deleting imported local records.
