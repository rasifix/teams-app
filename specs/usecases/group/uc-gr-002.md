# UC-GR-002 - Manage Trainers

## Goal

Allow a Group Manager to manage trainers within the active group by creating,
viewing, editing, and deleting trainer records.

## Scope

This use case covers:
- listing trainers in Members > Trainers,
- creating a trainer,
- opening trainer detail,
- editing trainer first and last name,
- deleting a trainer.

This use case does not cover:
- trainer authentication or registration,
- trainer invitation workflows,
- trainer availability planning.

## Primary Actor

Group Manager

## Supporting Actors

- Trainer
- System (UI, API, persistence)

## Preconditions

- Actor is authenticated.
- Active group is selected.
- Actor has permission to manage members in the active group.

## Trigger

The actor navigates to Members > Trainers and starts a trainer management
action.

## Input Data

Required:
- firstName
- lastName

Optional (API schema supports it):
- email

## Main Success Scenario - Create Trainer

1. Group Manager opens Members > Trainers.
2. System displays trainer list sorted by last name, then first name.
3. Group Manager presses Add.
4. System opens Add New Trainer modal.
5. Group Manager enters first name and last name, and optionally email.
6. Group Manager confirms Add Trainer.
7. System sends create member request with role `trainer`.
8. System updates store and displays new trainer in Trainers list.

## Main Success Scenario - Edit Trainer

1. Group Manager opens a trainer detail page.
2. Group Manager presses Edit.
3. System opens Edit Trainer modal with current values.
4. Group Manager changes values and confirms update.
5. System persists update and refreshes trainer data in list/detail.

## Main Success Scenario - Delete Trainer

1. Group Manager starts delete action from trainer list or detail view.
2. System displays confirmation dialog.
3. Group Manager confirms delete.
4. System persists removal.
5. System removes trainer from list; detail view navigates back to members if
   delete started from detail page.

## Alternative Flows

### A1 - Missing Required Fields

1. Group Manager leaves first name or last name empty.
2. UI/browser validation blocks submission.
3. No API request is sent.

### A2 - API Failure

1. Create, edit, or delete request fails.
2. System keeps current data unchanged.
3. Dialog closes only where implemented; failure is logged and surfaced through
   existing global error patterns.

### A3 - Trainer Not Found

1. Group Manager opens a trainer detail route with unknown id.
2. System shows Trainer not found state.
3. No mutation is performed.

## Postconditions

Success:
- Trainer data is persisted and visible in members views.
- Trainer ordering remains alphabetical by last name then first name.

Failure:
- Existing trainer data remains unchanged.
- No partial trainer mutation is persisted.

## Business Rules

- Trainer creation and updates require first name and last name.
- Trainer operations are group-scoped.
- Trainer list is sorted alphabetically (lastName, firstName).

## Validation Rules

- `firstName` must be non-empty.
- `lastName` must be non-empty.
- `role` for create/update trainer payloads must be `trainer`.

## API Contract Alignment

Implementation aligns to members endpoints:
- `GET /api/groups/{groupId}/members` (list hydration)
- `POST /api/groups/{groupId}/members` (create trainer with `role: trainer`)
- `PUT /api/groups/{groupId}/members/{id}` (update trainer)
- `DELETE /api/groups/{groupId}/members/{id}` (delete trainer)

Schema alignment:
- `CreateTrainerRequest` requires `role`, `firstName`, `lastName`
- `UpdateTrainerRequest` requires `role`, `firstName`, `lastName`

Current implementation note:
- create/edit trainer modal captures first and last name, and supports optional
   email input.

## Acceptance Criteria

1. Given valid trainer name data, when Group Manager creates trainer, then
   trainer is persisted and shown in Trainers list.
2. Given trainer exists, when Group Manager updates trainer data, then updated
   values are shown in trainer detail/list.
3. Given trainer exists, when Group Manager confirms deletion, then trainer is
   removed from list.
4. Given missing required name fields, when submit is attempted, then trainer
   is not created or updated.
5. Given optional email is provided, when trainer is created or updated, then
   email is included in the persisted trainer payload.