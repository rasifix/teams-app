# UC-GR-005 - Edit Guardian

## Goal

Allow a Group Manager to edit guardian details assigned to an underage player.

## Scope

This use case covers:
- opening edit action for an existing guardian assignment,
- updating guardian identity/contact fields,
- persisting the edit and refreshing guardian cards.

This use case does not cover:
- creating user accounts,
- converting documented-only guardians into platform users,
- legal consent workflows.

## Primary Actor

Group Manager

## Supporting Actors

- Guardian (account-linked or documented-only)
- System (UI, API, persistence)

## Preconditions

- Actor is authenticated.
- Actor has Group Manager permissions for the active group.
- Target player exists and has at least one guardian assignment.

## Trigger

The Group Manager selects Edit on a guardian card in player detail.

## Input Data

Required:
- playerId
- guardianId
- firstName
- lastName

Required for existing-user guardian edit:
- email

Optional:
- email for documented-only guardian remains optional

## Main Success Scenario

1. Group Manager opens player detail and sees guardian cards.
2. Group Manager presses Edit on a guardian card.
3. System opens guardian modal in edit mode, prefilled with guardian data.
4. Group Manager updates fields and confirms Save.
5. System validates edit input and duplicate constraints.
6. System persists edit using current API capabilities:
   - delete current guardian assignment,
   - add new guardian payload.
7. System refreshes player guardian data in store.
8. Updated guardian card is shown with new values.

## Alternative Flows

### A1 - Validation Error

1. Group Manager submits incomplete/invalid data.
2. System blocks save and shows validation message.
3. No API request is sent.

### A2 - Duplicate Guardian

1. Edited values would duplicate another guardian assignment on same player.
2. System rejects save with duplicate message.
3. Existing guardian data remains unchanged.

### A3 - Delete Step Fails

1. Guardian delete request fails.
2. System aborts edit flow and shows error.
3. Existing assignment remains unchanged.

### A4 - Add Step Fails After Delete

1. Delete succeeds but add fails.
2. System attempts rollback by re-adding previous guardian data.
3. If rollback succeeds, assignment returns to previous value.
4. System reports edit failure.

### A5 - Permission Denied

1. Non-manager attempts edit action.
2. Frontend hides/blocks action, and backend returns authorization error if called.
3. No change is persisted.

## Postconditions

Success:
- Guardian assignment is updated with edited data.
- Guardian card reflects latest persisted value.

Failure:
- No final partial edit is intentionally kept.
- Best-effort rollback is attempted when edit flow fails after delete.

## Business Rules

- Only Group Managers can edit guardians.
- Existing-user guardian edit requires firstName, lastName, and email.
- Documented-only guardian edit requires firstName and lastName.
- Duplicate guardian assignments for same player are not allowed.

## Validation Rules

- `playerId` and `guardianId` must exist in active group scope.
- `firstName` and `lastName` are mandatory.
- For existing-user mode, email must be present and valid format.

## API Contract Alignment

Current API provides dedicated single-guardian operations:
- `POST /api/groups/{groupId}/members/{id}/guardians`
- `DELETE /api/groups/{groupId}/members/{id}/guardians/{guardianId}`

No dedicated guardian update endpoint is available.
Current implementation edits by delete-then-add sequence with best-effort rollback.

## Acceptance Criteria

1. Given a guardian assignment exists, when manager edits and saves valid data,
   then updated guardian data is persisted and shown.
2. Given an existing-user guardian, when email is removed in edit, then save is
   blocked.
3. Given duplicate data conflict, when save is attempted, then edit is rejected.
4. Given API failure during edit, when save is attempted, then UI shows failure
   and rollback is attempted.

## Notes

- This use case is intentionally scoped to guardian edit only.
- Separate use cases cover guardian assign/remove and other member operations.
