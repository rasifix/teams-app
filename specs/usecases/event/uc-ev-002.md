# UC-EV-002 - Invite Players

## Goal

Allow an authenticated user with selected group context to invite players to an
existing event.

## Scope

This use case covers:
- opening the invite modal from an event detail page,
- selecting one or more not-yet-invited players,
- setting a default invitation status for newly invited players,
- persisting updated invitations to the event,
- reflecting invited players in the event invitations UI.

This use case does not cover:
- changing invitation status after invite (UC-EV-004),
- assigning players to teams,
- auto-selection logic,
- notification delivery (email/push/sms).

## Primary Actor

Authenticated User with Role trainer

## Supporting Actors

- Event detail UI
- Invite players modal
- Zustand store event update action
- Events API endpoint used for event update

## Preconditions

- User is authenticated.
- A group is selected in app state.
- Target event exists and is accessible in Event Detail view.
- At least one player exists in group members if invitations should be created.

## Trigger

The user presses Invite in the Players section on the Event Detail page.

## Input Data

Required:
- playerIds (one or more selected players)
- default invitation status for selected players

Optional filtering input:
- level range (min level and max level)

UI defaults when opening modal:
- selected players = empty
- level range = [1, 5]
- invitation status = accepted

Allowed default invitation statuses in invite modal:
- accepted
- open

## Main Success Scenario

1. User opens an existing event detail page.
2. User presses Invite in the Players section.
3. System opens Invite Players modal.
4. System lists only players who are not already invited to the event.
5. User optionally adjusts level range filter.
6. User selects players manually or with Select All.
7. User chooses default invitation status (accepted or open).
8. User submits Invite.
9. System creates one invitation per selected player with:
   - generated invitation id,
   - playerId,
   - selected status.
10. System appends these invitations to existing event invitations.
11. System persists the updated invitations by updating the event.
12. Modal closes and invitation lists/tabs reflect the new invitations.

## Alternative Flows

### A1 - No Players Selected

1. User opens modal but does not select players.
2. Invite button remains disabled.
3. Submit handler also guards against zero selections.
4. No event update is sent.

### A2 - No Available Players To Invite

1. All players are already invited, or no players exist in group.
2. Modal shows no players available message.
3. User cannot create invitations until availability changes.

### A3 - Persistence Failure During Invite

1. Event update request fails (network/API/server issue).
2. Store update action returns failure.
3. Current implementation does not show inline invite error in modal.
4. Event invitations remain unchanged in store.

### A4 - Authentication Expired

1. Events API responds 401 during update.
2. API client clears token and redirects to login.
3. New invitations are not persisted.

## Postconditions

Success:
- Selected players are added to event invitations exactly once for this action.
- New invitations carry the chosen default status (accepted or open).
- Event invitation UI reflects updated invitation counts and tabs.

Failure:
- No partial invitation set is persisted in frontend state.
- Existing invitations remain unchanged.

## Business Rules Reflected In Current Implementation

- A player already invited to the event cannot be invited again via invite modal.
- Invitation status for bulk invite is set once per invite action.
- Level range filter limits visible/selectable candidates in modal.
- Select All operates only on currently available and level-filtered players.
- Invitation records are stored inside event.invitations.

## Validation Rules Reflected In Current Implementation

- Invite action requires at least one selected player.
- Eligible candidates are restricted to not-yet-invited players.
- Level filter range is constrained to configured player levels 1..5.
- Bulk invite status options are limited to accepted or open.

## Data Persistence Expectations

For each newly invited player, event contains an invitation object with:
- id
- playerId
- status

Event persistence is performed via full event update with updated invitations
array.

## API Contract Used By Current Frontend

Current frontend persistence path:
- PUT /api/groups/{groupId}/events/{id}
- Request includes updated invitations array in event payload.

Note:
- OpenAPI also defines invitation-specific endpoints under
  /api/groups/{groupId}/events/{id}/players and
  /api/groups/{groupId}/events/{id}/players/{player_id}/status.
- The current frontend invite flow does not call those invitation-specific
  endpoints.

## Acceptance Criteria

1. Given an existing event and available players, when user selects players and
   confirms invite, then invitations are added and visible in the Players
   section.
2. Given a chosen default status of accepted or open, when invite is submitted,
   then all newly created invitations use that status.
3. Given players already invited in the event, when modal opens, then those
   players are not available for selection.
4. Given zero selected players, when user attempts invite, then no update
   request is sent.
5. Given update failure, when invite is submitted, then event invitations remain
   unchanged.

## Notes

- This spec captures current implemented behavior in Event Detail and
  Invite Players modal.
- Role-based authorization beyond authentication/group access is enforced by
  backend policies, not by dedicated frontend role checks in this flow.