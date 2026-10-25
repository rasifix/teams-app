# UC-EV-017 - Share Match Selection via WhatsApp

## Goal

Allow a trainer to prepare a readable match selection message in WhatsApp and
send it to a group they choose.

## Scope

This use case covers opening WhatsApp with a prefilled message for one team's
match selection. The trainer chooses the recipient group and sends the message
in WhatsApp. The application does not connect to WhatsApp accounts or send the
message itself.

## Primary Actor

Authenticated trainer

## Preconditions

- The actor is authenticated and may access the selected Squad.
- The Activity exists, belongs to the selected Squad, and is a match.
- The selected team belongs to the match and has at least one selected player.

## Main Success Scenario

1. Trainer opens the match Activity Detail and reviews its teams and
   selections.
2. Trainer chooses `Share to WhatsApp` for the team whose selection they want
   to share.
3. System builds a localized, readable message from that team's match details
   and selected players.
4. System opens WhatsApp using its share link with the message prefilled.
5. Trainer selects the intended WhatsApp group.
6. Trainer reviews and sends the message in WhatsApp.

## Message Content

The message includes:

- Match name and opponent when available.
- Match date and start time.
- Location when available.
- The selected team's name and selected player names, preserving the displayed
  player order.
- That team's responsible person when available.

Optional details with no value are omitted. The message is localized using the
application language and contains plain text with clear line breaks so it is
readable in WhatsApp.

## Business Rules

- WhatsApp is opened with a URL-encoded message; the app does not select a
  recipient or send on the trainer's behalf.
- The trainer can edit the prefilled message in WhatsApp before sending.
- Sharing is available separately for each team in an active match when that
  team has a non-empty selection.
- Sharing does not modify the Activity or mark the selection as sent. The
  existing `Mark selection sent` action remains the app's explicit record that
  the trainer has sent the selection.
- If WhatsApp cannot be opened or is unavailable, the trainer receives a
  localized error and can still use the existing print or other sharing
  options.
- Player names and other message details are taken from the selection shown at
  the time the share action is chosen.
- All user-facing labels, message text, and errors are localized.

## Acceptance Criteria

1. Given an active match with a team that has selected players, then that
   team's `Share to WhatsApp` action is available.
2. Given a team with no selected players, then that team's share action is
   unavailable.
3. Given a non-match Activity, then the WhatsApp selection share action is not
   shown.
4. Given the trainer chooses `Share to WhatsApp` for a team, then WhatsApp
   opens with a prefilled message containing the match date, that team's name,
   and only that team's selected player names.
5. Given match location, opponent, team name, or responsible person is absent,
   then the message omits that detail without leaving empty labels or lines.
6. Given multiple teams, when the trainer shares one team's selection, then
   the message contains no other team's name or players.
7. Given the trainer returns without sending in WhatsApp, then the Activity is
   not marked as sent.
8. Given the trainer sends the message from WhatsApp, then the app does not
   claim delivery or update `selectionSentAt` automatically.
9. Given WhatsApp cannot be opened, then the app presents a localized error
   and the existing selection remains unchanged.
10. Given the application language is German, then the action label and
    generated message use German; given English, they use English.
