# UC-GR-007 - Sync Members From Another Group

## Goal

Allow a Group Manager to import selected members from a source group into the
active target group, including automatic guardian import/linking for imported
players.

## Scope

This use case covers:
- opening Import Members from the target group's Members area,
- listing source groups the actor can access,
- selecting one source group,
- filtering source members by one or more birth years,
- listing selectable members from that source group that are not already in the target group,
- importing selected members into the target group,
- importing guardians for imported players,
- showing import progress during execution.

This use case does not cover:
- bulk overwrite or destructive synchronization,
- deleting or deactivating members in source or target group,
- editing imported member data during import,
- conflict-resolution UI beyond skip/report behavior.

## Primary Actor

Group Manager

## Supporting Actors

- System (UI, API, persistence)
- Source Group Access Control

## Preconditions

- Actor is authenticated.
- Actor has permission to manage members in the target group.
- Actor has read access to at least one other group.
- Source group and target group are different groups.

## Trigger

The actor clicks Import Members in the target group's Members area.

## Input Data

Required:
- targetGroupId
- sourceGroupId
- selectedBirthYears[]
- selectedMemberIds[]

Derived during import:
- source member role (player or trainer)
- source player guardian list for each selected player

## Main Success Scenario

1. Group Manager opens Members in the target group.
2. Group Manager clicks Import Members.
3. System opens Import Members dialog.
4. System lists source groups where actor has access, excluding target group.
5. Group Manager selects one source group.
6. System loads members from the selected source group and hides members that
   already exist in the target group by duplicate policy.
7. System shows a birth-year filter with multi-select options derived from the
   source group member list.
8. Group Manager selects one or more birth years and the member list updates.
9. Group Manager selects one or more members to import.
10. Group Manager confirms import.
11. System shows a progress indicator while processing import items.
12. System imports each selected member into the target group.
13. For each imported player, system imports guardians from source player data:
    - if matching guardian already exists in target scope, system links existing
      guardian to imported player,
    - otherwise system creates documented guardian data and links it.
14. During processing, progress indicator is updated with current completion
   state.
15. System skips members that became duplicates after initial list load (for
   example because of concurrent changes) and records skip reasons.
16. System shows import result summary (imported, linked guardians, skipped,
    failed).
17. Members list in target group refreshes.

## Alternative Flows

### A1 - No Eligible Source Groups

1. Actor opens Import Members dialog.
2. System finds no accessible source groups (excluding target group).
3. System shows empty state and disables import action.

### A2 - No Members Selected

1. Actor selects source group but no members.
2. Actor attempts import.
3. System blocks submit and asks actor to select at least one member.

### A3 - Member Becomes Duplicate During Import

1. A selected member becomes duplicate in target after dialog list was loaded.
2. System skips member creation for that member.
3. System records duplicate skip reason in result summary.
4. System continues processing remaining selected members.

### A4 - Guardian Import Conflict

1. Imported player has one or more guardians conflicting with existing data.
2. System applies guardian duplicate policy (match/link existing guardian).
3. If guardian cannot be linked or created, system records guardian-level
   failure for that player and continues with other guardians/members.

### A5 - Permission Denied

1. Actor lacks required permission in source or target scope.
2. System rejects operation with authorization error.
3. No new members are imported.

### A6 - Technical Failure

1. API/network/persistence failure happens during import.
2. System returns partial result when available and marks failed items.
3. UI shows non-destructive error and allows retry.

## Postconditions

Success:
- Selected eligible members are present in target group.
- Imported players have guardians linked/imported according to rules.
- Result summary is available to actor.

Failure:
- No destructive change is applied to source group.
- Items that failed import are not partially created without traceable result.

## Business Rules

- Source group chooser must only show groups actor can access.
- Target group must never appear as selectable source group.
- Member selection is explicit; no implicit import of all members.
- Birth-year filtering is optional and narrows the selectable member list to
   one or more chosen years when active.
- Members already existing in target group must be hidden in the selection list.
- Inactive players must not be shown as importable members.
- Importing a player must include guardian import/link processing.
- Importing a trainer does not trigger guardian import.
- Duplicate members in target group must be skipped, not duplicated.
- Duplicate guardian identities should be linked, not duplicated.
- Import operation must produce item-level outcomes (imported, skipped, failed).
- Import must display a visible progress indicator while processing selected members.

## Validation Rules

- `sourceGroupId` is required and must differ from `targetGroupId`.
- `selectedBirthYears[]` is optional but, when present, must contain one or
   more valid birth years available in the source group.
- `selectedMemberIds` must contain at least one entry.
- Each selected member must belong to source group at execution time.
- Inactive players in the source group are never eligible for import.
- Actor must be authorized for source read and target member management.
- Guardian import must validate required guardian identity/contact fields based
  on guardian model constraints.

## Data Persistence Expectations

For each imported member:
- Member is created in target group with role-specific payload.
- If role is player, guardian relationships are persisted in target group.

For each imported guardian:
- Either linked to existing guardian identity in target scope,
  or created as documented guardian and linked to the imported player.

Audit/trace fields should capture:
- sourceGroupId,
- import timestamp,
- actor id,
- item-level status.

## API Contract Alignment

Current contracts that can be used in an orchestration flow:
- `GET /api/groups` (source group options)
- `GET /api/groups/{groupId}/members` (source members)
- `POST /api/groups/{groupId}/members` (create target member)
- `POST /api/groups/{groupId}/members/{id}/guardians` (link/create guardian)

Suggested API enhancement for robust bulk import:
- `POST /api/groups/{groupId}/members/import`

Suggested request shape:
- `sourceGroupId`
- `memberIds[]`
- optional conflict strategy flags (for example `skipExisting: true`)

Suggested response shape:
- itemized results with imported/skipped/failed counts and reasons.

## Acceptance Criteria

1. Given a Group Manager in target group, when opening Import Members, then
   only accessible source groups other than target are listed.
2. Given a selected source group, when dialog loads members, then members
   already existing in target are hidden and only import-eligible members are
   selectable.
3. Given a selected source group, when birth-year options are shown, then the
   actor can select one or more years to filter the member list.
4. Given the source group contains inactive players, when the dialog loads,
   then inactive players are not shown as importable members.
5. Given selected members include players with guardians, when import
   succeeds, then players are created in target and guardians are linked/imported.
6. Given import is running, when processing starts, then dialog shows a
   progress indicator that updates until completion.
7. Given a selected member becomes duplicate before creation, when import
   runs, then member is skipped and reported as duplicate.
8. Given mixed success/failure during import, when operation completes, then
   actor sees item-level summary with imported/skipped/failed results.
9. Given actor lacks permission in source or target scope, when import is
   attempted, then operation is rejected and no unauthorized changes occur.

## Notes

- This use case defines additive sync behavior (import-only), not full mirror.
- Conflict policy should remain deterministic and visible in result summary.
- UX detail: dialog has two steps in one flow:
  - select source group,
   - optionally filter by birth year,
  - select members to import.
- Progress indicator should communicate completion state (for example count or
   percentage) and remain visible until final result summary is shown.
