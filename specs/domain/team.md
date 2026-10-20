# Team

A Team is an activity-scoped selection of Players, not a permanent club team.

- A Match owns exactly one Team.
- A Tournament owns one or more Teams.
- A Team has selected Players and exactly one responsible person.
- The responsible person must have the Trainer or Guardian role.
- A Team may reference one Shirt Set and its Shirt Assignments.
- Only a Match Team may carry a Formation and Match Plan.

Invariants:

- Selected Players must have accepted Invitations.
- A Player may belong to only one Team in an activity.
- Selected-player counts must satisfy the activity's minimum and maximum
  limits.
- A Match lineup may assign only selected Players.
- A Player and Formation Slot may each be assigned at most once per period.
- A period number may not exceed the Match Format's period count.
- A Team Player may use only a Shirt from the Team's Shirt Set and may have at
  most one Shirt.
- A Shirt cannot be assigned to another Team in the same activity.

Only Matches support Match Plans. Every Formation has exactly one `GK` slot and
at least one non-`GK` slot. Tournament Teams do not use formations or
per-period lineups.
