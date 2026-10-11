# UC-EV-011 - Manage Helper Tasks and Sign-ups

## Goal

Let a trainer define helper tasks for an Event and see whether enough people
have signed up, and let adult members sign up for them.

## Preconditions

- User is authenticated and belongs to the active squad.

## Main Success Scenario

1. Admin or trainer opens Event Detail and chooses Add task.
2. User enters a name, an optional description and the number of people needed.
3. System persists the task through `POST /activities/{id}/tasks` and lists it.
4. An adult member (admin, trainer or guardian) opens the Event and chooses
   Sign up on a task.
5. System persists the sign-up and updates the task state; when the number of
   sign-ups reaches the people needed, the task shows as fulfilled.

## Alternative Flows

- Withdraw: a signed-up member chooses Withdraw and the sign-up is removed.
- Edit or delete: admin or trainer edits a task or deletes it after confirming;
  deleting removes its sign-ups.
- No tasks: users without manage rights see no Tasks section; managers see an
  empty state.

## Business Rules

- Tasks are available on every Event kind.
- Only admins and trainers manage tasks and see sign-up counts.
- Only adult members sign up, always for themselves; players cannot sign up.
- Over-subscription is allowed and indicated to managers.

## Acceptance Criteria

1. Given a trainer, when a task "Kiosk" for 2 people is added, then it is listed
   as helpers needed with 0 of 2 signed up.
2. Given two sign-ups, then the task shows as fulfilled.
3. Given a guardian, then Sign up / Withdraw is offered but management actions
   and counts are not.
