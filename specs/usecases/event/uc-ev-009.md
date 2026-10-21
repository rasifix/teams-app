# UC-EV-009 - Assign Team Responsible Person

## Goal

Allow an authenticated user to assign or clear a Team's responsible person
from Team Detail using the same row-and-modal interaction as shirt assignment.

## Preconditions

- User is authenticated and may manage the Activity.
- The Activity and target Team exist and are not cancelled.
- The active squad contains an eligible Trainer or guardian assignee when an
  assignment should be made.

## Main Success Scenario

1. User opens Team Detail and selects the Responsible Person row.
2. System opens a focused assignment modal with the current assignee
   preselected.
3. System lists eligible Trainers and Guardians.
4. User selects an assignee and saves.
5. System persists `responsiblePersonId` on the Team, closes the modal, and
   displays the selected name in the Responsible Person row.

## Alternative Flow - Clear Assignment

1. User opens the Responsible Person assignment modal.
2. User selects the unassigned option and saves.
3. System clears `responsiblePersonId` and displays the unassigned state.

## Business Rules

- Changes are rejected while the Activity is cancelled.

- On Team Detail, Responsible Person assignment is not part of the general Edit Team
  dialog.
- Responsible Person, Shirt Set, and Formation assignment use a consistent
  clickable-row
  and focused-modal interaction.
- Assignee options retain the existing name ordering and distinguish guardian
  assignees from Trainers.

## Acceptance Criteria

1. Selecting the Responsible Person row opens the assignment modal.
2. Saving a selection updates the Team and visible row value.
3. Saving the unassigned option clears the assignment.
4. Opening the general Edit Team dialog on Team Detail does not show
   Responsible Person assignment.
