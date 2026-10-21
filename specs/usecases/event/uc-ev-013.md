# UC-EV-013 - Edit Activity

## Goal

Allow an admin or trainer to edit an Activity while respecting the ownership
boundary between an unlinked Squad and Spond.

## Main Success Scenario

1. Actor opens an active Activity in an unlinked Squad.
2. System allows editing its kind, name, `startsAt`, optional `endsAt`,
   location, Match-only `opponentName`, and player limits.
3. For Tournament Activities, system also allows editing each Team's optional
   `startTime` and `location` overrides.
4. System validates the kind-specific Team rules and persists the Activity.
5. Activity Detail reflects the saved values.

## Spond-Linked Activities

For a Spond-linked Squad, kind, name, schedule, location, opponent, cancellation
status, and Spond identity are synchronized fields and are not locally editable.
Local planning data remains editable through the relevant Activity use cases.

## Rules

- Cancelled Activities are read-only.
- A Match has exactly one Team; a Tournament has one or more Teams.
- Tournament Teams may override the Activity's start time and location.
- Match Teams use the Activity's start time and location.
- `opponentName` is valid only for Match Activities.
- Only admins and trainers may edit Activities.
