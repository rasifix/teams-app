# UC-GR-001 - Create New Group

## Goal

Allow an authenticated user to create a new Group.

## Scope

This use case covers creating a Group record and making it available in the
application for further setup (for example adding players and trainers).

This use case does not cover:
- adding members to the Group,
- setting invitation periods,
- creating Events for the Group,
- assigning shirts or trainers.

## Primary Actor

User

## Supporting Actors

- System (API and persistence layer)
- Authenticated User Context

## Preconditions

- The actor is authenticated.
- Required Group input fields are available in the UI form.

## Trigger

The actor selects the action to create a new Group from the Groups area.

## Input Data

Required:
- `name` (string)

Optional:
- `description` (string)
- `club` (string)

## Main Success Scenario

1. The actor opens the create-group form.
2. The system displays required and optional input fields.
3. The actor enters valid Group data.
4. The actor submits the form.
5. The system validates input.
6. The system creates the Group record.
7. The system returns the created Group including generated identifier.
8. The UI refreshes Group state and shows the newly created Group
9. The system confirms successful creation to the actor.

## Alternative Flows

### A1 - Validation Error (client or server)

1. The actor submits incomplete or invalid data (for example empty `name`).
2. The system rejects the request with validation details.
3. The UI highlights invalid fields and keeps already entered values.
4. The actor corrects the input and retries submission.

### A2 - Duplicate Group Name In Same Ownership Scope

1. The actor submits a name that already exists
2. The system rejects the request with a duplicate-name error.
3. The UI shows a clear message and asks for a unique name.
4. The actor changes the name and retries.

### A3 - Technical Failure

1. The request cannot be completed because of network, API, or DB failure.
2. The system reports a technical error.
3. The UI shows a non-destructive error state and allows retry.

## Postconditions

Success:
- A new Group exists and is persisted.
- The Group can be selected for downstream use cases (members, events,
  invitations, statistics).
- Audit metadata is stored (creator, timestamp) if audit is enabled.

Failure:
- No partial Group is persisted.
- Existing Group data remains unchanged.

## Business Rules

- Group `name` is mandatory.
- Group `name` must be unique
- Newly created Groups are active by default
- The authenticated user is added as member with role Group Manager
- Group creation must not implicitly add Players, Trainers, or Events.

## Validation Rules

- `name` must be non-empty after trimming whitespace.
- `name` length must be within configured limits.
- Optional fields must satisfy type and length constraints.
- Unsupported fields must be ignored or rejected according to API policy.

## Data Persistence Expectations

Minimum stored fields:
- `id`
- `name`
- `description` (nullable)
- `createdAt`
- `updatedAt`
- `createdBy`

## Non-Functional Requirements

- API responds within acceptable interactive latency for normal load.
- The operation is atomic: either Group creation succeeds entirely or fails.
- Errors are observable through logs for diagnostics.
- User-facing error messages avoid leaking sensitive internal details.

## Acceptance Criteria

1. Given a user with create permission, when valid Group data is submitted,
   then a new Group is created and visible in the Group list.
2. Given missing required data, when submission occurs, then creation is
   rejected with field-level validation feedback.
3. Given a duplicate Group name in the same scope, when submission occurs,
   then creation is rejected with a uniqueness error.
4. Given a user without permission, when submission occurs, then the request is
   rejected and no Group is created.
5. Given a transient technical failure, when submission occurs, then no partial
   Group is saved and the user can retry.

## Notes

- This use case is intentionally limited to Group creation.
- Follow-up setup should be handled by separate Group management use cases.
