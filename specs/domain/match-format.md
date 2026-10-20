# Match Format

A Match Format defines the timed period structure and player limits used by a
Match. It belongs to exactly one Squad and is usable only when match planning
is enabled.

## Data and rules

- `playersOnField`, `minPlayersPerTeam`, `maxPlayersPerTeam`,
  `numberOfPeriods`, and `periodLengthMinutes` are positive integers.
- `minPlayersPerTeam` must not exceed `maxPlayersPerTeam`.
- A Squad has at most one default Match Format.
- Selecting a format pre-fills activity player limits, which remain overridable
  per activity.

## Official and user-defined formats

SFV categories and official formats are backend-managed reference data. When a
Squad category has an official format, Squad creation copies it into the
Squad, marks it official, and makes it the default. Official copies are
immutable and cannot be deleted.

Tournament-only categories have no copied official format. Admins and Trainers
may still enable match planning and create user-defined formats if needed.

User-defined formats may be edited while unused and deleted only while unused.
