# UC-EV-016 - View Activity Change History

## Goal

Allow an authorized user to review the human-readable history of one Activity:
who changed what and when.

## Scope

This use case covers the read-only change history for a single Activity. It
does not provide a squad-wide audit log, edit or delete history entries, or
expose event-sourcing identifiers and technical payloads to the user.

## Primary Actor

Authenticated admin or trainer

## Preconditions

- The actor is authenticated and may access the selected Squad.
- The Activity exists and belongs to the selected Squad.
- The Activity history feature flag is enabled.

## Main Success Scenario

1. Actor opens Activity Detail.
2. System shows a `View change history` action next to `Edit`.
3. Actor opens the dedicated Activity Change History view.
4. System loads only the selected Activity's audit events.
5. System resolves actor, Player, and Team identifiers to display names.
6. System presents each change with the authenticated user's name, a localized
   timestamp, and a human-readable description of the change.
7. If more history is available, the actor may load the next page.

## Examples

The history describes changes in terms of the domain rather than technical
event data:

- `Roman Varosic's invitation was declined by Zoltan Varosic.`
- `Alex Coach selected Nina Müller for team Team 1.`
- `Sam Trainer recorded Luca Meier as absent.`
- `Zoltan Varosic changed activity details (location, start time).`

## Business Rules

- The history is scoped to exactly one Activity.
- The history view is not shown, and its route is unavailable, while the
  feature flag is disabled.
- The history is opened on demand and is not rendered by default in Activity
  Detail.
- Each entry identifies the authenticated actor by name when the API provides
  a matching user or member identifier. System-generated changes are labeled
  as system changes.
- Technical IDs, correlation IDs, revisions, request hashes, and raw event
  envelopes are not displayed.
- Activity, Player, Team, invitation, selection, lineup, and attendance
  changes use localized domain language.
- History is read-only and does not change Activity data.
- Results are ordered newest first and may be paginated using the API cursor.
- Access follows the Squad-scoped authorization of the audit-events endpoint.

## Acceptance Criteria

1. Given the feature flag is disabled, when an actor opens Activity Detail,
   then no change-history action is shown and the history route is unavailable.
2. Given the feature flag is enabled, when an authorized actor opens Activity
   Detail, then `View change history` appears next to `Edit`.
3. Given an Activity with audit events, when the actor opens its history, then
   only events for that Activity are requested and displayed.
4. Given an event with `userId` or `memberId`, then the history displays the
   matching person's name instead of `user`, an ID, or a technical actor value.
5. Given a declined invitation for Player Roman Varosic performed by Zoltan
   Varosic, then the history displays that Roman's invitation was declined by
   Zoltan.
6. Given a change involving a Player or Team, then the displayed description
   uses the resolved Player or Team name and does not expose its identifier.
7. Given a timestamp, then it is formatted using the active application
   locale.
8. Given more than one page of history, when the actor selects `Load more`,
   then the next cursor page is appended without duplicating existing entries.
9. Given no history exists, then the dedicated view shows a localized empty
   state.
10. Given the audit endpoint fails, then the dedicated view shows a localized
    error state without exposing the raw API response.
