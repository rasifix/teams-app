# UC-EV-002 - Manually Add Player RSVP Data

## Goal

Allow an admin or trainer to enter initial player RSVP data for an existing
Event when it cannot be synchronized from Spond.

## Scope

This use case covers:
- opening the RSVP entry modal from an Event Detail page,
- selecting one or more players without local RSVP data,
- setting an initial RSVP status for those players,
- persisting the RSVP data to the Event,
- reflecting the players in the Event RSVP UI.

This use case does not cover:
- changing existing RSVP status (UC-EV-004),
- assigning players to teams,
- auto-selection logic,
- sending invitations or notifications,
- allowing guardians or players to submit responses in this application.

## Primary Actor

Admin or trainer

## Supporting Actors

- Event detail UI
- RSVP entry modal
- Zustand store event update action
- Events API endpoint used for event update

## Preconditions

- User is authenticated.
- A squad is selected in app state.
- Target event exists and is accessible in Event Detail view.
- At least one player exists in squad members if invitations should be created.

## Trigger

The user chooses Add RSVP Data in the Players section on the Event Detail page.

## Input Data

Required:
- playerIds (one or more selected players)
- initial RSVP status for selected players

Optional filtering input:
- level range (min level and max level)

UI defaults when opening modal:
- selected players = empty
- level range = [1, 5]
- invitation status = accepted

Allowed initial RSVP statuses:
- accepted
- open

## Main Success Scenario

1. User opens an existing event detail page.
2. User presses Add RSVP Data in the Players section.
3. System opens the RSVP entry modal.
4. System lists only players who do not already have RSVP data for the Event.
5. User optionally adjusts level range filter.
6. User selects players manually or with Select All.
7. User chooses default invitation status (accepted or open).
8. User submits the RSVP data.
9. System creates one invitation per selected player with:
   - generated invitation id,
   - playerId,
   - selected status.
10. System appends these invitations to existing event invitations.
11. System persists the updated invitations by updating the event.
12. Modal closes and RSVP lists/tabs reflect the new records.

## Alternative Flows

### A1 - No Players Selected

1. User opens modal but does not select players.
2. Save button remains disabled.
3. Submit handler also guards against zero selections.
4. No event update is sent.

### A2 - No Available Players To Invite

1. All players are already invited, or no players exist in squad.
2. Modal shows no players available message.
3. User cannot create more RSVP records until availability changes.

### A3 - Persistence Failure During Manual Entry

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
- Selected players receive one local RSVP record for this action.
- New records carry the chosen initial status (accepted or open).
- Event RSVP UI reflects updated counts and tabs.

Failure:
- No partial invitation set is persisted in frontend state.
- Existing invitations remain unchanged.

## Business Rules Reflected In Current Implementation

- A player who already has RSVP data cannot be added again via the modal.
- RSVP status for bulk entry is set once per action.
- Level range filter limits visible/selectable candidates in modal.
- Select All operates only on currently available and level-filtered players.
- Invitation records are stored inside event.invitations.

## Validation Rules Reflected In Current Implementation

- Save action requires at least one selected player.
- Eligible candidates are restricted to players without RSVP data.
- Level filter range is constrained to configured player levels 1..5.
- Bulk-entry status options are limited to accepted or open.

## Data Persistence Expectations

For each newly invited player, event contains an invitation object with:
- id
- playerId
- status

Event persistence is performed via full event update with updated invitations
array.

## API Contract Used By Current Frontend

Planned persistence path:
- PUT /api/squads/{squadId}/events/{id}
- Request includes updated invitations array in event payload.

Note:
- OpenAPI also defines invitation-specific endpoints under
  /api/squads/{squadId}/events/{id}/players and
  /api/squads/{squadId}/events/{id}/players/{player_id}/status.
- The manual RSVP entry flow does not call those invitation-specific
  endpoints.

## Acceptance Criteria

1. Given an existing event and available players, when user selects players and
   confirms entry, then RSVP records are added and visible in the Players
   section.
2. Given a chosen initial status of accepted or open, when entry is submitted,
   then all newly created invitations use that status.
3. Given players with RSVP data in the Event, when the modal opens, then those
   players are not available for selection.
4. Given zero selected players, when user attempts to save, then no update
   request is sent.
5. Given update failure, when RSVP data is submitted, then Event RSVP data remains
   unchanged.

## Notes

- This specification describes the intended staff-only fallback when Spond
  synchronization is unavailable.
- Frontend and backend authorization must both prevent guardian and player
  access to this mutation.
