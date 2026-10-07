# UC-EV-009 - Assign Team Trainer

## Goal

Allow an authenticated user to assign or clear a Team's Trainer from Team
Detail using the same row-and-modal interaction as shirt assignment.

## Preconditions

- User is authenticated and may manage the Event.
- The Event and target Team exist.
- The active group contains an eligible Trainer or guardian assignee when an
  assignment should be made.

## Main Success Scenario

1. User opens Team Detail and selects the Trainer row.
2. System opens a focused assignment modal with the current assignee
   preselected.
3. System lists eligible Trainers and guardian assignees.
4. User selects an assignee and saves.
5. System persists `trainerId` on the Team, closes the modal, and displays the
   selected name in the Trainer row.

## Alternative Flow - Clear Assignment

1. User opens the Trainer assignment modal.
2. User selects the unassigned option and saves.
3. System clears `trainerId` and displays the unassigned state.

## Business Rules

- On Team Detail, Trainer assignment is not part of the general Edit Team
  dialog.
- Trainer, Shirt Set, and Formation assignment use a consistent clickable-row
  and focused-modal interaction.
- Assignee options retain the existing name ordering and distinguish guardian
  assignees from Trainers.

## Acceptance Criteria

1. Selecting the Trainer row opens the assignment modal.
2. Saving a selection updates the Team and visible row value.
3. Saving the unassigned option clears the assignment.
4. Opening the general Edit Team dialog on Team Detail does not show Trainer
   assignment.
