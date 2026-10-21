# UC-GR-012 - Synchronize Players And Guardians From Spond

## Goal

Allow an authorized Squad Manager to review and synchronize Players from the
Squad's linked Spond group while automatically importing their Guardians.

## Scope

This use case covers:

- starting Sync from Members > Players,
- reading members only from the Squad's linked Spond group,
- excluding Spond trainers from player candidates,
- matching, linking, creating, and updating Players,
- automatically including Guardians for selected new Players,
- selecting all or none of the player candidates,
- validating mandatory fields before apply,
- returning to Players with a completion message.

This use case does not cover choosing or changing the linked Spond group
(UC-GR-011), event synchronization (UC-EV-012), or writing to Spond.

## Primary Actor

Squad Manager (admin or trainer with restricted-management permission)

## Preconditions

- The actor is authenticated and may manage the selected Squad.
- The Squad has a non-empty `spondId`.
- The actor has Spond credentials for an account that can access that linked
  group.

## Trigger

The actor chooses the Spond-logo Sync action on Members > Players.

## Main Success Scenario

1. System shows Sync only when the Squad has an active Spond link and the actor
   has permission.
2. Actor starts Sync and enters Spond credentials.
3. System authenticates and verifies that the account can access the group in
   `Squad.spondId`; no group selector is shown.
4. System loads the linked group's members.
5. System includes members whose normalized role is Player and excludes
   explicit trainer-only members.
6. System matches each Spond Player as follows:
   - an existing identical `spondId` is already linked,
   - otherwise normalized first and last name plus a compatible birth date
     produce suggestions,
   - otherwise the default action is create.
7. System preselects actionable Players and offers Select all and Select none.
8. Actor may skip a Player, link it to an existing local Player, or create a
   new Player. Already linked Players may be updated when supported fields
   differ.
9. For every selected new Player, system automatically includes missing
   Guardians from Spond. No guardian-import checkbox is shown.
10. Guardian review shows each Guardian's name, email address, and child name
    or names, and indicates an existing Guardian match.
11. Actor supplies any missing mandatory Player fields, including complete
    birth date and level, and reviews the final summary.
12. Actor applies the synchronization.
13. System applies all decisions atomically, reloads local data, returns to
    Members > Players, and shows a one-time success message with created,
    updated, and linked counts.

## Alternative Flows

### A1 - Squad Is Not Linked

1. The Squad has no `spondId`.
2. System does not show the Spond Sync action on Players.
3. Direct navigation to the scoped sync route returns to Players.

### A2 - Linked Group Is Inaccessible

1. Credentials are valid, but the account cannot access `Squad.spondId`.
2. System reports that the linked group cannot be found and does not offer a
   different group selector.

### A3 - Trainer In Spond Member List

1. A Spond member has an explicit trainer role and no player role.
2. System excludes that member from player import candidates.

### A4 - Name Uses A Different Apostrophe Encoding

1. Spond and local records use straight, typographic, full-width, accent-like,
   or HTML-encoded apostrophe variants in the same name.
2. System normalizes both values before comparison.
3. The Player is not reported as changed solely because of that encoding.

### A5 - Required Field Missing

1. A selected new Player has no valid complete birth date, no valid level, or
   a link action has no local target.
2. System identifies the missing field and disables progression/apply until it
   is corrected or the Player is skipped.

### A6 - Nothing Selected

1. Actor uses Select none or skips every candidate.
2. Summary states that nothing is selected and Apply remains disabled.

### A7 - Apply Fails

1. Permission, validation, stale-preview, uniqueness, network, or persistence
   validation fails.
2. System shows a non-destructive error and remains in the wizard.
3. No partial import is committed.

## Business Rules

- The linked Spond group is immutable within this flow.
- Explicit trainer-only Spond members are never offered as Players.
- Existing `spondId` links take precedence over all fuzzy suggestions.
- Name matching uses Unicode compatibility normalization, case folding,
  whitespace normalization, HTML apostrophe decoding, and apostrophe variant
  normalization.
- A new Player requires first name, last name, complete `birthDate`, level 1-5,
  and an active status.
- Guardians are imported automatically with selected new Players.
- Guardian identity is deduplicated by Spond id first and normalized name as a
  fallback. One Guardian may be associated with multiple imported children.
- The operation never creates Trainer records.

## API Contract

- `POST /api/integrations/spond/groups` for authentication and linked-group
  access verification
- `POST /api/integrations/spond/snapshot`
- `POST /api/squads/{squadId}/spond/import`

The apply request contains Player decisions, automatic Guardian ids, and skip
decisions for Activities so this scoped flow changes only member data.

## Acceptance Criteria

1. Given an authorized actor and linked Squad, then Players shows a Sync action
   with the Spond logo.
2. Given player sync, then no Spond group selector is displayed and the request
   uses `Squad.spondId`.
3. Given an explicit trainer-only Spond member, then it is absent from the
   Player review.
4. Given equivalent apostrophe encodings in a linked Player name, then no name
   update is reported solely for that difference.
5. Given actionable Players, then Select all and Select none update all visible
   Player decisions.
6. Given a selected new Player with Guardians, then missing Guardians are
   imported automatically without a guardian checkbox.
7. Given a Guardian review row, then it shows the Guardian email and associated
   child name or names.
8. Given a selected new Player without a birth date, then Apply is blocked.
9. Given a successful apply, then the actor returns to Players and sees a
   one-time translated completion message.
