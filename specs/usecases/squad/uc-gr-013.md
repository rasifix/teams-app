# UC-GR-013 - Synchronize Trainers From Spond

## Goal

Allow an authorized Squad Manager to synchronize Trainers as part of a full
linked-group sync that also processes Players, Guardians, and Activities.

## Scope

This use case covers reading trainer-role members from the linked group,
matching existing Trainers, linking or creating Trainers, and updating names
for linked Trainers during the full Sync action available from Members,
Trainers, or Activities.

Player, Guardian, and Activity synchronization occur in the same run
(UC-GR-012 and UC-EV-012). The actor does not select data categories. This use
case does not cover changing the linked group (UC-GR-011) or writing to Spond.

## Primary Actor

Squad Manager (admin or trainer with restricted-management permission)

## Preconditions

- The actor is authenticated and may manage the selected Squad.
- The Squad has a non-empty `spondId`.
- The actor has Spond credentials for an account that can access the linked
  group.

## Main Success Scenario

1. Members, Trainers, and Activities show the same Sync action when the Squad
   is linked and the actor may manage it.
2. Actor starts Sync and enters Spond credentials.
3. System authenticates and reads only the group's trainer-role members from
   the linked Spond group. No group selector is shown.
4. System suggests a link for a unique normalized first and last name match;
   otherwise it selects Create Trainer by default. Existing Spond links take
   precedence over name matches.
5. Actor reviews the trainer candidates, selects Link or Create Trainer, and
   may skip any candidate. Select All and Select None apply to visible rows.
6. The same review includes Player, Guardian, and Activity changes. Actor
   applies all reviewed data together.
7. System applies all decisions, clears Spond credentials, reloads local data,
   and returns to the page that started Sync with translated result counts.

## Alternative Flows

### A1 - Squad Is Not Linked

The Sync action is hidden. Direct navigation returns to the page that started
Sync.

### A2 - Spond Authentication Or Access Fails

System shows the mapped error and leaves local Trainer records unchanged.

### A3 - Candidate Has No Safe Match

System offers Create Trainer by default. The actor may create it, choose an
existing Trainer explicitly, or skip the candidate.

### A4 - Conflicting Or Stale Link

If a Spond member is already linked to another local record, the API rejects
the conflicting decision and does not create a duplicate Spond link.

## Business Rules

- Members with a normalized Spond `coach` or `trainer` role are candidates;
  Spond administrators are excluded.
- One local member record may carry both player and trainer roles when the
  source member has both roles; this preserves the unique Spond member link.
- Matching uses the existing Unicode and whitespace-normalized name
  comparison. Ambiguous matches are not selected automatically.
- Trainer email is preserved for linked local records. For newly created
  Trainers, an email is imported only when Spond provides it.
- Credentials and Spond tokens are request/session scoped and are not
  persisted or logged.
- The integration is read-only toward Spond.

## API Contract

- `POST /api/integrations/spond/groups`
- `POST /api/integrations/spond/snapshot`
- `POST /api/squads/{squadId}/spond/import`, with Player, Trainer, and Activity
  decisions in one request.

## Acceptance Criteria

1. Given a linked Squad and authorized actor, Members > Trainers shows Sync.
2. Given trainer sync, the snapshot includes Spond trainer roles and excludes
   Spond administrators.
3. Given an exact unique name match, the candidate defaults to linking that
   Trainer; ambiguous matches default to creation.
4. Given a valid Create Trainer decision, the API creates a local Trainer with
   the Spond member id and source names.
5. Given a valid Link decision, the API links and updates the selected Trainer
   without overwriting its existing email.
6. Given successful synchronization, the actor returns to the page that started
   Sync and sees the result counts.
7. Given an invalid or conflicting decision, the API rejects it without
   creating a duplicate Spond member link.
