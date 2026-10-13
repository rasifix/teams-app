# Invitation

## Purpose

An Invitation links one Player to one Event and stores that player's RSVP state
for planning and statistics. The decision itself is normally collected in
Spond.

In business terms, an Invitation answers: "Is this player available for this
Event, and can they be considered for team selection?"

## Core Concept

An Invitation is a per-event participation intent record. It is not membership
(Squad), not recorded attendance (Event, see Attendance) or participation statistics (Statistics), and not team assignment
(Team). It is the decision bridge between planned participation and actual
selection.

## Relationships

- An Invitation belongs to one Event.
- An Invitation belongs to one Player.
- An Invitation is scoped by the Event's Squad context.
- Invitation status influences team selection eligibility in the Event.

## Key Responsibilities

- represent invitation state for one Player in one Event,
- track the current response status,
- retain the Spond-synchronized value or a staff-entered fallback,
- provide filtering input for selection workflows,
- preserve historical response context for analytics and audits.

## Status Model

Supported statuses are:

- open,
- accepted,
- declined,
- injured,
- sick,
- unavailable.

Status semantics:

- open: invitation sent, no response yet,
- accepted: player available for potential selection,
- declined: player not available,
- injured: unavailable due to injury,
- sick: unavailable due to illness,
- unavailable: unavailable for other reasons.

## Lifecycle

1. Invitation data is created or updated by Spond synchronization.
2. When synchronization is unavailable, an admin or trainer may create or
   update the RSVP data manually.
3. Guardians and players respond in Spond, never in this application.
4. Event planners use current status during team formation.
5. Invitation remains stored as historical evidence after Event completion.

## Invariants And Rules

- Invitation uniqueness should be enforced per (eventId, playerId).
- Invitation must reference existing Event and Player records.
- Invitation should only be created for Players in scope of the Event's Squad,
  unless explicit guest rules are defined.
- Only accepted invitations should be considered selectable by default.
- Status changes near or after team finalization should trigger selection
  revalidation.
- Only admins and trainers may create or manually change RSVP data in this
  application.

## Scope Boundaries

On the Events page, staff can review invitation tabs. The `Available` tab
contains only Players whose invitation status is `accepted` and who are not
yet selected in any Team for that Event. Players already selected are excluded
from this tab; `Open` and `Declined` remain separate status views.

The Invitation does:

- model player response state for one Event,
- support operational selection decisions,
- provide historical response data.

The Invitation does not:

- assign the player to a Team,
- send an invitation or collect a guardian/player response,
- determine final attendance metrics on its own,
- alter Squad membership.

## Practical Example

Player "Alex" accepts the Spond invitation for Event "Saturday Training -
2026-04-11". Synchronization stores the accepted status locally, and Alex
appears in the selectable pool for team generation. If the synchronized status
later changes to sick, Alex is removed from selectable candidates and team
composition is revalidated.
