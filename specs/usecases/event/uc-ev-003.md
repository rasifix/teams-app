# UC-EV-003 - Select Players For Teams

## Goal

Allow an authenticated user to select Players for an Event Team and review the
selected roster on Team Detail.

## Scope

This use case covers:
- opening player selection for a Team,
- adding and removing selected Players,
- enforcing the Event's maximum roster size,
- displaying the selected roster on Team Detail,
- sorting the displayed roster by Player name.

## Preconditions

- User is authenticated and may manage the Event.
- The Event and target Team exist.
- Players are available in the active group.

## Main Success Scenario

1. User opens Team Detail and chooses to add Players.
2. System displays the Players available for selection.
3. User selects Players without exceeding `maxPlayersPerTeam` and saves.
4. System persists the selected Player IDs on the Team.
5. Team Detail displays the selected Players sorted case-insensitively by first
   name and then last name.

## Alternative Flows

### A1 - Player Record Unavailable

1. A Player ID in `team.selectedPlayers` cannot be resolved from the current
   Player data.
2. Team Detail omits the unavailable Player record from the displayed roster.
3. The remaining resolved Players stay correctly sorted.

### A2 - Equal Names

1. Two selected Players have equal first and last names when compared
   case-insensitively.
2. System uses the Player ID as a stable final ordering key.

## Business Rules

- Roster display order does not change the persisted order of
  `team.selectedPlayers`.
- Team Detail sorts resolved Players by first name, then last name, without
  regard to letter casing or surrounding whitespace.
- Player ID is the deterministic fallback when both comparable names match.

## Acceptance Criteria

1. Given selected Players in any stored order, Team Detail shows them ordered
   by first name and then last name.
2. Given names with different capitalization, ordering remains
   case-insensitive.
3. Given missing or unselected Player records, they do not disrupt the order
   of the displayed selected roster.
