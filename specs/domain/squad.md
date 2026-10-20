# Squad

A Squad is the stable, squad-scoped boundary for members, activities, planning,
statistics, periods, formats, formations, and shirt sets.

## Lifecycle

- `active` is required and defaults to `true`.
- Squads are deactivated rather than deleted through normal domain operations.
- Deactivated Squads are omitted from the API and their data is read-only.
- A future backend cleanup job may delete historical data.

## Membership and roles

Person records are not shared between Squads. The same human in two Squads is
represented by separate member records. Roles are `admin`, `trainer`,
`guardian`, and `player`; people may have multiple roles. Only Admins and
Trainers may log in. Admins manage membership and Squad-level configuration.

## SFV and match planning

Every Squad has an application-managed SFV category. `matchPlanningEnabled` is
required and defaults to `false`; Match Formats and Formations are usable only
when it is enabled.

When an official format exists, Squad creation copies it as an immutable,
undeletable official Match Format and makes it the default. Tournament-only
categories have no copied official format. Admins and Trainers may still
choose to enable match planning for those Squads.

There may be at most one default Match Format. User-defined formats and
Formations may be edited while unused and deleted only while unused.

## Spond

A Squad may link to one Spond group through `spondId`. Only Admins may link or
unlink it; Trainers may run synchronization. Spond-linked membership, activity
existence, schedule fields, and RSVP responses are controlled by Spond. Local
planning fields and planning records remain editable in this application.
