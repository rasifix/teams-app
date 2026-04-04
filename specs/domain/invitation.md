# Invitation

## Purpose

An Invitation links one Player to one Event and captures that player's
availability decision for that specific date.

In business terms, an Invitation answers: "Is this player available for this
Event, and can they be considered for team selection?"

## Core Concept

An Invitation is a per-event participation intent record. It is not membership
(Group), not final attendance outcome (Statistics), and not team assignment
(Team). It is the decision bridge between planned participation and actual
selection.

## Relationships

- An Invitation belongs to one Event.
- An Invitation belongs to one Player.
- An Invitation is scoped by the Event's Group context.
- Invitation status influences team selection eligibility in the Event.

## Key Responsibilities

- represent invitation state for one Player in one Event,
- track the current response status,
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

1. Invitation is created when an Event invites an eligible Player.
2. Initial status is open.
3. Player (or admin flow) updates status.
4. Event planners use current status during team formation.
5. Invitation remains stored as historical evidence after Event completion.

## Invariants And Rules

- Invitation uniqueness should be enforced per (eventId, playerId).
- Invitation must reference existing Event and Player records.
- Invitation should only be created for Players in scope of the Event's Group,
  unless explicit guest rules are defined.
- Only accepted invitations should be considered selectable by default.
- Status changes near or after team finalization should trigger selection
  revalidation.

## Scope Boundaries

The Invitation does:

- model player response state for one Event,
- support operational selection decisions,
- provide historical response data.

The Invitation does not:

- assign the player to a Team,
- determine final attendance metrics on its own,
- alter Group membership.

## Practical Example

Player "Alex" receives an Invitation for Event "Saturday Training -
2026-04-11". The status starts as open, then changes to accepted. Alex appears
in the selectable pool for team generation. If status later changes to sick,
Alex is removed from selectable candidates and team composition is revalidated.
