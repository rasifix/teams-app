# UC-EV-002 - Manually Add Player Invitation Data

## Goal

Allow an admin or trainer to enter initial Player invitation data for an
existing Activity in a Squad without a Spond link.

## Scope

For Spond-linked Squads, the response is changed in Spond only. Local decline
reasons remain editable by staff.

This use case covers:
- opening the invitation entry modal from an Activity Detail page,
- selecting one or more Players without a local Invitation,
- setting an initial invitation response for those Players,
- persisting the invitation data to the Activity,
- reflecting the Players in the Activity invitation UI.

This use case does not cover:
- changing an existing invitation response or decline reason (UC-EV-004),
- assigning players to teams,
- auto-selection logic,
- sending invitations or notifications,
- allowing guardians or players to submit responses in this application.

## Primary Actor

Admin or trainer

## Supporting Actors

- Activity detail UI
- Invitation entry modal
- Zustand store Activity update action
- Activities API endpoint used for Activity update

## Preconditions

- User is authenticated.
- A squad is selected in app state.
- Target Activity exists and is accessible in Activity Detail view.
- At least one player exists in squad members if invitations should be created.

## Trigger

The user chooses Add Invitation Data in the Players section on the Activity
Detail page.

## Input Data

Required:
- playerIds (one or more selected players)
- initial invitation response for selected Players

Optional filtering input:
- level range (min level and max level)

UI defaults when opening modal:
- selected players = empty
- level range = [1, 5]
- invitation response = accepted

Allowed initial invitation responses:
- accepted
- open

`declined` is not selectable during bulk invitation entry because a decline is
only known after the invitation has been sent. A decline reason is set through
UC-EV-004 when an existing invitation is declined or its local reason changes.

Changes are rejected while the Activity is cancelled.

## Main Success Scenario

1. User opens an existing Activity Detail page.
2. User presses Add Invitation Data in the Players section.
3. System opens the Invitation entry modal.
4. System lists only Players who do not already have an Invitation for the
   Activity.
5. User optionally adjusts level range filter.
6. User selects players manually or with Select All.
7. User chooses `accepted` or `open` as the initial invitation response.
8. User submits the invitation data.
9. System creates one invitation per selected player with:
   - generated invitation id,
   - playerId,
   - selected response and optional declineReason.
10. System appends these Invitations to the Activity's existing invitations.
11. System persists the updated invitations by updating the Activity.
12. Modal closes and invitation lists/tabs reflect the new records.

## Alternative Flows

### A1 - No Players Selected

1. User opens modal but does not select players.
2. Save button remains disabled.
3. Submit handler also guards against zero selections.
4. No Activity update is sent.

### A2 - No Available Players To Invite

1. All players are already invited, or no players exist in squad.
2. Modal shows no players available message.
3. User cannot create more Invitations until availability changes.

### A3 - Persistence Failure During Manual Entry

1. Activity update request fails (network/API/server issue).
2. Store update action returns failure.
3. Current implementation does not show inline invite error in modal.
4. Activity invitations remain unchanged in store.

### A4 - Authentication Expired

1. Activities API responds 401 during update.
2. API client clears token and redirects to login.
3. New invitations are not persisted.

## Postconditions

Success:
- Selected Players receive one local Invitation for this action.
- New records carry the chosen response and optional decline reason.
- Activity invitation UI reflects updated counts and tabs.

Failure:
- No partial invitation set is persisted in frontend state.
- Existing invitations remain unchanged.

## Business Rules Reflected In Current Implementation

- A Player who already has an Invitation cannot be added again via the modal.
- Invitation response for bulk entry is set once per action.
- Level range filter limits visible/selectable candidates in modal.
- Select All operates only on currently available and level-filtered players.
- Invitation records are stored inside Activity `invitations`.

## Validation Rules Reflected In Current Implementation

- Save action requires at least one selected player.
- Eligible candidates are restricted to Players without an Invitation.
- Level filter range is constrained to configured player levels 1..5.
- Bulk-entry response options are accepted, open, or declined; a declined
  response may include a decline reason.

## Data Persistence Expectations

For each newly invited Player, the Activity contains an Invitation object with:
- id
- playerId
- response
- declineReason (optional)

Activity persistence is performed via full Activity update with updated invitations
array.

## API Contract Used By Current Frontend

Planned persistence path:
- PUT /api/squads/{squadId}/activities/{id}
- Request includes updated invitations array in Activity payload.

Note:
- OpenAPI also defines invitation-specific endpoints under
  /api/squads/{squadId}/activities/{id}/players and
  /api/squads/{squadId}/activities/{id}/players/{player_id}/response.
- The manual Invitation entry flow does not call those invitation-specific
  endpoints.

## Acceptance Criteria

1. Given an existing Activity and available Players, when user selects Players
   and confirms entry, then Invitations are added and visible in the Players
   section.
2. Given a chosen initial response, when entry is submitted, then all newly
   created Invitations use that response and any selected decline reason.
3. Given Players with an Invitation in the Activity, when the modal opens, then those
   players are not available for selection.
4. Given zero selected players, when user attempts to save, then no update
   request is sent.
5. Given update failure, when invitation data is submitted, then Activity
   invitation data remains unchanged.

## Notes

- This specification describes the intended staff-only fallback when Spond
  synchronization is unavailable.
- Frontend and backend authorization must both prevent guardian and player
  access to this mutation.
