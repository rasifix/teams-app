# UC-EV-005 - Assign Shirt Set And Shirts

## Goal

Allow an authenticated user to assign a shirt set to a team and assign concrete
shirts to selected players, while guaranteeing event-wide uniqueness of each
shirt.

## Scope

This use case covers:
- opening shirt assignment from Event Detail,
- assigning one shirt set to one team,
- assigning shirt numbers from that set to players in the team,
- persisting shirt set and shirt assignments to the event,
- validating that one shirt is not assigned to multiple players in the same
  event.

This use case does not cover:
- creating or editing shirt sets and shirt inventory (UC-GR-006),
- assigning players to teams,
- invitation workflow,
- automatic shirt size optimization.

## Primary Actor

Authenticated User with Role trainer

## Supporting Actors

- Event detail UI
- Assign shirts modal
- Zustand store event update action
- Events API endpoint used for event update

## Preconditions

- User is authenticated.
- A group is selected in app state.
- Target event exists and is open in Event Detail view.
- At least one team exists in the event.
- At least one shirt set exists in the group if shirt assignment should be
  possible.

## Trigger

The user chooses Assign Shirts for a team on the Event Detail page.

## Input Data

Required:
- target team id
- shirtSetId
- player-to-shirt assignments as list of:
  - playerId
  - shirtNumber

Optional:
- no-shirt assignment for individual players (unassigned)

## Main Success Scenario

1. User opens Event Detail and chooses Assign Shirts on Team A.
2. System opens Assign Shirts modal for Team A.
3. User selects a shirt set.
4. System loads team players and available shirt numbers for that set.
5. User assigns shirt numbers to one or more players.
6. System validates that each assigned shirt number is unique within Team A.
7. System validates that each assigned shirt (shirtSetId + shirtNumber) is not
   already assigned to a different player in any other team of the same event.
8. If validation passes, system updates Team A with:
   - shirtSetId,
   - shirtAssignments.
9. System persists updated event teams.
10. Modal closes and Event Detail reflects saved assignments.

## Alternative Flows

### A1 - No Shirt Set Selected

1. User submits modal without selecting a shirt set.
2. System blocks submission and requests shirt set selection.
3. No event update is sent.

### A2 - Duplicate Shirt In Same Team

1. User assigns the same shirt number to multiple players in the same team.
2. System blocks submit and indicates duplicate shirt usage.
3. No event update is sent.

### A3 - Duplicate Shirt Across Teams In Same Event

1. Shirt set X is used by multiple teams in the same event.
2. User assigns shirt number N from shirt set X to a player in Team A.
3. Shirt (X, N) is already assigned to a different player in Team B.
4. System blocks submit and indicates cross-team shirt conflict.
5. No event update is sent.

### A4 - Persistence Failure

1. Event update request fails.
2. System keeps previous persisted team shirt assignments.
3. Modal stays open or closes based on UI decision, but conflict-free state is
   not persisted.

### A5 - Authentication Expired

1. Events API responds 401 during update.
2. API client clears token and redirects to login.
3. Shirt assignment changes are not persisted.

## Postconditions

Success:
- Team has assigned shirtSetId and shirtAssignments.
- Event-wide uniqueness holds for all assigned shirts:
  - one (shirtSetId, shirtNumber) pair belongs to at most one player in the
    event.
- The same shirt set may be assigned to multiple teams.

Failure:
- Event data remains unchanged.
- Existing valid shirt assignments remain intact.

## Business Rules

- A team can have at most one assigned shirt set.
- A shirt set can be assigned to multiple teams in the same event.
- Shirt assignment uniqueness is enforced at event scope.
- Uniqueness key is the tuple (shirtSetId, shirtNumber).
- The same shirt cannot be worn by two different players in one event,
  regardless of team.
- Unassigned players are allowed (no shirt selected).

## Validation Rules

- `shirtSetId` is required to save shirt assignments.
- `shirtNumber` must exist in the selected shirt set.
- Within the edited team, no two players may share the same shirt number.
- Across all teams in the same event, no two players may share the same
  (shirtSetId, shirtNumber).

## Data Persistence Expectations

- Shirt assignments are persisted as part of event team updates.
- For each team assignment:
  - team.shirtSetId identifies the referenced shirt set,
  - team.shirtAssignments stores playerId and shirtNumber mappings.
- Event update must be rejected if it would violate event-wide shirt uniqueness.

## API Contract Used By Current Frontend

Current frontend persistence path:
- `PUT /api/groups/{groupId}/events/{id}`
- Request includes updated `teams` array with `shirtSetId` and
  `shirtAssignments` on affected team.

## Acceptance Criteria

1. Given a team with selected players, when user assigns a shirt set and unique
   shirt numbers, then assignments are saved.
2. Given the same shirt set is used by multiple teams, when users assign shirts,
   then cross-team duplicates of the same shirt number are prevented.
3. Given duplicate assignment inside one team, when user submits, then save is
   rejected.
4. Given duplicate assignment across teams in the same event, when user
   submits, then save is rejected.
5. Given no shirt set selected, when user submits, then save is rejected.
6. Given persistence fails, when user submits valid assignments, then event data
   remains unchanged.

## Notes

- This use case extends current shirt assignment behavior with explicit
  event-wide shirt uniqueness.
- Existing behavior that only enforces uniqueness inside the currently edited
  team is insufficient for shared shirt sets and is superseded by this rule.
