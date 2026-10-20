# Person and roles

A Person is a member record owned by exactly one Squad. A Person has a first
name, last name, optional email and phone, roles, and may have an independent
LoginAccount.

Roles are:

- **Player** — selectable participant with a birth date, level, status, and
  optional preferred shirt number.
- **Guardian** — responsible adult reference; Guardians do not log in or
  respond to Invitations in this application.
- **Trainer** — may log in, synchronize Spond data, and manage activity
  planning.
- **Admin** — may log in and additionally manage membership, Squad
  configuration, and Spond linking.

There is no Assistant Coach role. Only Admins and Trainers may have a login.
