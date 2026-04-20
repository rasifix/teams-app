# UC-GR-006 - Manage Shirt Sets

## Goal

Allow a Group Manager to manage reusable shirt sets for a group, including
creating, editing, and deleting shirt sets, as well as adding, editing, and
removing shirts within each set.

## Scope

This use case covers:
- viewing all shirt sets of the active group,
- creating a new shirt set,
- editing sponsor/color metadata of a shirt set,
- deleting a shirt set,
- adding a shirt to a set,
- editing a shirt in a set,
- removing a shirt from a set,
- marking a shirt as unavailable or available.

This use case does not cover:
- assigning shirts to players in a team,
- event-level shirt assignment history,
- inventory forecasting or stock reservations.

## Primary Actor

Group Manager

## Supporting Actors

- System (UI, API, persistence)

## Preconditions

- Actor is authenticated.
- Actor has access to the active group context.
- Active group is selected.

## Trigger

The actor navigates to Shirts and starts one of the shirt set management
actions.

## Input Data

Required for shirt set creation:
- sponsor
- color
- shirts array (can be empty)

Required for shirt set update:
- sponsor
- color
- shirts array

Required for shirt creation/update in set:
- number (1-99)
- size (128, 140, 152, 164, XS, S, M, L, XL)
- isGoalkeeper
- status (available, unavailable)

## Main Success Scenario - Create Shirt Set

1. Group Manager opens Shirts page.
2. System shows existing shirt sets sorted by sponsor, then color.
3. Group Manager presses Add.
4. System opens Add New Shirt Set modal.
5. Group Manager enters sponsor and color.
6. Optional: Group Manager enables automatic shirt creation and configures
   number range, size, and goalkeeper option.
7. Group Manager confirms Create Shirt Set.
8. System submits create request and persists shirt set.
9. System updates local store and shows the new shirt set card.

## Main Success Scenario - Edit/Delete Shirt Set

1. Group Manager opens actions on a shirt set card.
2. Group Manager chooses Edit or Delete.
3. For Edit:
   - system opens Edit Shirt Set modal,
   - Group Manager updates sponsor/color,
   - system persists update and refreshes card.
4. For Delete:
   - system opens confirmation dialog,
   - Group Manager confirms,
   - system removes shirt set and refreshes list.

## Main Success Scenario - Manage Shirts In Set

1. Group Manager expands a shirt set card.
2. Group Manager chooses Add Shirt, Edit Shirt, or Remove Shirt.
3. System opens the corresponding modal/confirmation.
4. Group Manager confirms valid data.
5. System persists change by updating shirts in that shirt set.
6. System refreshes shirt list in the expanded card.

## Alternative Flows

### A1 - Invalid Shirt Number

1. Group Manager enters shirt number outside 1-99 or duplicate number in set.
2. System blocks submission with validation feedback.
3. No API request is sent for invalid add/edit.

### A2 - Missing Shirt Set Data

1. Group Manager submits shirt set without sponsor or color.
2. Browser/UI required-field validation blocks submission.
3. No persistence is performed.

### A3 - API Failure

1. Create/update/delete request fails.
2. System keeps current UI state unchanged.
3. Operation returns failure and modal remains open where applicable.

## Postconditions

Success:
- Shirt set and shirt inventory state reflect requested change.
- Updated list remains sorted by sponsor then color.

Failure:
- No successful mutation is applied to local store.
- Previous persisted state remains visible.

## Business Rules

- Shirt set sorting is alphabetical by sponsor, then color.
- Shirt numbers must be unique within one shirt set.
- Shirt size must be one of the supported domain values.
- Shirt status must be either `available` or `unavailable`.
- Shirts with status `unavailable` are not assignable to players in future events.
- A shirt set can contain zero or more shirts.

## Validation Rules

- `sponsor` is required.
- `color` is required.
- `shirts` is required in API create/update payloads (may be empty array).
- Shirt `number` must be integer from 1 to 99.
- Shirt `size` must match allowed enum.
- Shirt `status` must match allowed enum (`available`, `unavailable`).

## API Contract Alignment

Current API endpoints used by implementation:
- `GET /api/groups/{groupId}/shirtsets`
- `POST /api/groups/{groupId}/shirtsets`
- `GET /api/groups/{groupId}/shirtsets/{id}`
- `PUT /api/groups/{groupId}/shirtsets/{id}`
- `DELETE /api/groups/{groupId}/shirtsets/{id}`

Shirt add/edit/remove operations are implemented as shirt set updates by sending
the full `shirts` array through `PUT /shirtsets/{id}`.

## Acceptance Criteria

1. Given a valid shirt set input, when Group Manager creates a shirt set, then
   it is persisted and displayed in the list.
2. Given a shirt set exists, when Group Manager edits sponsor/color, then
   updated values are persisted and shown.
3. Given a shirt set exists, when Group Manager deletes it and confirms, then
   it is removed from list.
4. Given a shirt set exists, when Group Manager adds/edits/removes a shirt with
   valid data, then shirt inventory updates correctly.
5. Given duplicate shirt number in one set, when Group Manager tries to add it,
   then operation is rejected.
6. Given a shirt is marked as unavailable, when Group Manager later assigns
   shirts for a future tournament, then that shirt is not selectable.

## Notes

- Current implementation keeps mutation failures mostly console-based; a global
  page-level error banner is shown for load errors.
- Automatic shirt creation in Add New Shirt Set is a UI convenience that
  generates the `shirts` array client-side before create request.