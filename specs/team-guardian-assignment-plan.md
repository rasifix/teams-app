# Plan: Team Assignment Without Trainer Role Escalation

## Context

Today a team can only reference trainerId. In some cases a guardian should lead
a specific team, but that must not grant the global Trainer role permissions
(selection management, player strength visibility, etc.).

## Goal

Allow assigning either:
- a Trainer, or
- a Guardian

as the team lead for a specific team, while keeping role-based permissions
unchanged.

## Recommended Approach

Use a dedicated team-level assignment model instead of mapping guardians to
Trainer role.

Keep trainerId for backward compatibility and add a new field, for example:
teamLeadAssignment:
- type: trainer | guardian
- trainerId (when type is trainer)
- playerId + guardianId (when type is guardian)
- displayName snapshot for audit/print stability

## Why This Is Safer

- Prevents privilege escalation from assignment to authorization.
- Preserves existing trainer workflows.
- Enables guardian assignment only in event scope.
- Keeps auditability after event completion.

## Required Change Set

1. Domain spec updates
- Update Team wording from assigned Trainer to team lead assignment
  (trainer or guardian).
- Update team lifecycle and invariants accordingly.

2. API contract updates
- Extend Team schema to include teamLeadAssignment.
- Keep trainerId temporarily for compatibility during migration.

3. Frontend type updates
- Extend Team type with teamLeadAssignment object.
- Maintain compatibility with existing trainerId reads until migration is done.

4. Team edit flow
- Add assignee type picker: Trainer or Guardian.
- Trainer options from trainers list.
- Guardian options from guardians linked to invited/selected players
  (preferred minimal scope).
- Save assignment into teamLeadAssignment.

5. Display/read model
- Replace direct trainerId lookups in UI with one resolver selector that
  returns assignee label and type.
- Apply in team cards, event cards, print summary, and team detail.

6. History behavior
- Trainer history remains based on trainer assignments only.
- Guardian-led teams are not added to trainer history.

7. Permissions
- Team assignment does not grant roles.
- Authorization remains role-based in backend/frontend checks.

## Product Decision Needed

Guardian option source:
- Option A: guardians of invited/selected players in this event (recommended)
- Option B: any guardian known in group

Option A keeps this as a small, low-risk change.

## Migration Notes

- Read path:
  - prefer teamLeadAssignment
  - fallback to trainerId for legacy data
- Write path:
  - write teamLeadAssignment
  - optionally keep trainerId in sync during transition
- After migration:
  - remove trainerId dependency in UI and API contracts
