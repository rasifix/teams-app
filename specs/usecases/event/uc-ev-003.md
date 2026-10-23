# UC-EV-003 - Select Players for Activity Teams

## Goal

Allow an authenticated user to select Players for an Activity Team and review
the selected roster on Team Detail, while retaining an auditable history of
selection changes after the selection was marked as sent.

## Scope

This use case covers:
- opening player selection for a Team,
- adding and removing selected Players,
- enforcing the Activity's maximum roster size while drafting,
- marking the Activity selection as sent and recording the date and time,
- enforcing minimum and maximum roster sizes when the selection is sent,
- allowing justified changes after sending and until the Activity date has ended,
- recording why a Player was removed after sending,
- displaying the selected roster on Team Detail,
- displaying unselected and declined invitees on Activity Detail throughout
  the Activity lifecycle,
- sorting the displayed roster by Player name.

## Preconditions

- User is authenticated and may manage the Activity.
- The Activity and target Team exist.
- Players are available in the active squad.

## Main Success Scenario

1. User opens Team Detail and chooses to edit Players, regardless of whether
   the Team is already at `maxPlayersPerTeam`.
2. System displays the Players available for selection.
3. User selects accepted Players without exceeding `maxPlayersPerTeam` and
   saves. A Player may not be selected for another Team in the same Activity.
4. System persists the selected Player IDs on the Team.
5. Team Detail displays the selected Players sorted case-insensitively by first
   name and then last name.
6. Activity Detail displays the selected roster for every Team and retains a
   Player invitation overview for accepted-but-unselected, open, and declined
   Players.

## Mark Selection As Sent

1. Before the Activity date has ended, the user chooses **Mark selection as
   sent** on Activity Detail.
2. System records the server date and time in `activity.selectionSentAt`.
3. Activity Detail displays the recorded date and time.
4. The Player invitation overview remains visible but becomes read-only.
5. Marking the selection as sent is an internal planning record. It does not
   send a notification or publish the selection to Spond.

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

### A3 - Edit After Selection Was Sent

1. User opens Player selection after `selectionSentAt` was recorded and before
   the Activity date has ended.
2. System warns that the selection was already sent and displays the sent date
   and time.
3. User may add or replace Players without exceeding `maxPlayersPerTeam`.
4. If the user removes a previously selected Player, the system requires one
   reason: `sick`, `injured`, `noShow`, or `other`.
5. On save, the system updates `team.selectedPlayers` and appends a removal
   record containing `playerId`, `reason`, and `removedAt` to
   `team.selectionRemovals`.

### A4 - Edit After Activity Date

1. The local calendar date is later than the Activity date.
2. Team Detail disables the Player-selection edit action and explains that the
   selection can no longer be edited.
3. Direct navigation to Player selection presents the same warning and keeps
   all selection controls disabled.
4. Existing selected Players, unselected invitees, and declined invitees remain
   visible for review.

### A5 - Selection Sent Below Minimum

1. The user attempts to mark the selection as sent with fewer than
   `minPlayersPerTeam` Players on a Team.
2. System blocks the action and identifies the Team that is below the minimum.
3. The draft selection remains available for editing.

## Business Rules

- Roster display order does not change the persisted order of
  `team.selectedPlayers`.
- A full Team can still open selection editing so a Player can be removed or
  replaced.
- `maxPlayersPerTeam` limits the draft roster and the sent roster, not access to
  the editor.
- `minPlayersPerTeam` is enforced only when marking the selection as sent.
- A selection may be changed on the Activity date, but not on a later local
  calendar date.
- Removal reasons are mandatory only when a previously selected Player is
  removed after `selectionSentAt` exists.
- Every justified post-send removal is appended to `team.selectionRemovals`;
  existing removal history is preserved.
- Only accepted Players may be selected, and a Player may belong to at most one
  Team in an Activity.
- When a selected Player becomes declined, the Invitation is retained with its
  declined response, but the Player is removed from Team and Match planning
  data.
- Selection changes are rejected while the Activity is cancelled.
- The invitation overview remains visible in planning, selection-sent,
  started, and attendance-recorded phases. It is editable only during planning
  (and remains read-only for Spond-managed invitations).
- The invitation overview renders Players as a plain compact list. It does not
  use draggable cards or expose drag-and-drop affordances; Team selection is
  changed only through the Team's Player-selection editor.
- Selected Players inside Activity Detail Team cards use the same compact list
  presentation and row separators as the invitation overview, with Player
  levels aligned to the right edge of each row.
- Invitation and Team-card Player rows use the same fixed compact row height.
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
4. Given a Team at maximum capacity, the Player-selection editor can still be
   opened and permits a remove-or-replace change that respects the maximum.
5. Given an unsent selection, when the user marks it as sent, then
   `selectionSentAt` and its localized date/time are visible on Activity Detail.
6. Given a sent selection before or on the Activity date, opening the editor shows
   a warning and changes can still be saved.
7. Given a sent selection, removing a Player cannot be saved without a reason;
   saving with a reason records the Player, reason, and removal timestamp.
8. Given a date after the Activity date, selection changes cannot be initiated or
   saved.
9. Given a sent, started, or attendance-recorded Activity, Activity Detail still
   shows accepted-but-unselected Players and declined Players with their
   decline reasons in a read-only invitation overview.
10. Given any invitation status tab, its Players are displayed as plain list
    items and cannot be dragged onto Teams.
11. Given selected Players on an Activity Detail Team card, they use the same
    compact row spacing and separators as invitation list items, and their
    levels align at the right edge of the list.
12. Given invitation and selected-Player lists on Activity Detail, their Player
    rows have equal height.
