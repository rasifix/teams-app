# Player

A Player is a Squad-scoped participant profile used for Invitations, Team
selection, Match planning, attendance, and statistics.

- `birthDate` is a required full date.
- `level` is an integer from 1 through 5.
- `status` is `active`, `trial`, or `inactive`.
- Active and trial Players may be invited and selected; inactive Players are
  excluded from those workflows.
- `preferredShirtNumber` is optional.
- A Player may have multiple Guardian associations.

For Spond-linked Squads, identity fields are synchronized and read-only. Level,
preferred shirt number, and status remain locally editable planning fields.

A Player may have one Invitation and one Attendance record per activity. Only
an accepted Invitation permits Team selection, and a Player may belong to only
one Team in an activity.
