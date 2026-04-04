# User

Users have first name and last name and can have different roles.
Not all users must be able to login to the app (e.g. minors). A user
has the following properties:

* firstname
* lastname
* email

## Roles

A user can have more than one role in a group. For instance he can be
the group manager, trainer, as well as the guardian of his child.

### Player

A player is a member of the group. He is actively participating in the
matches. See [player](player.md) for details.

### Guardian

A guardian is for example the father or mother of a player. He can answer
invitations in the name of his child.

### Coach

A coach is organizing events, inviting and selecting players.
See [trainer](trainer.md) for details.

### Assistant Coach

An assistant coach cannot create events on his own, but he can view
information about the teams he is assigned to.

### Group Manager

The group manager has permissions to manage the whole group. He
manages members (players, guardians, ...) of the group, defines
periods, shirt sets... 
