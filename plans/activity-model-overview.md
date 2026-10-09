# Activity domain model migration: overview

Status legend: `[ ]` not started, `[~]` in progress, `[x]` done, `[!]` blocked.

- Target model: `brainstorming/typespec/main.tsp` (diagrams: `brainstorming/event-domain-model.puml`)
- Backend plan: `teams-api/plans/activity-model-backend.md` (sibling repo; written)
- Frontend plan: `plans/activity-model-frontend.md` (to be written after the backend plan is accepted)

## Approach

Expand, then contract. The backend is extended compatibly first (aliases, new optional fields,
new `/activities` view over the existing events store); the frontend migrates afterwards; legacy
paths and fields are removed only in the final contract phase.

## Decisions

- Renames Group → Squad, PlayingMode → MatchFormat are API aliases first; DB and legacy names change only in the contract phase.
- Persons are squad-scoped; only the login account is global. No Person/Membership split.
- API/DB payloads stay ID-based DTOs; the TypeSpec model is the domain model.
- Out of scope: SessionPlan/exercise catalog, event sourcing, cancellation, invitation send time, tournament fixtures.

## Phases

| Phase | Scope | Backend | Frontend |
|---|---|---|---|
| 0 | Safety net: characterization tests (backend); model alignment docs | [ ] | [ ] |
| 1 | Aliases, `birthDate` canonical (no behavior change) | [ ] | [ ] |
| 2 | SFV catalog + extended MatchFormat | [ ] | [ ] |
| 3 | Activities (match/tournament) as new view over events; invitation split | [ ] | [ ] |
| 4 | Attendance | [ ] | [ ] |
| 5 | Tasks + signups | [ ] | [ ] |
| 6 | Training + social | [ ] | [ ] |
| C | Contract: remove legacy paths/fields, rename collections, update specs | [ ] | [ ] |

## Open questions

| # | Question | Status |
|---|---|---|
| Q1 | Kind derivation for legacy events with zero teams | [ ] |
| Q2 | Source/versioning of SFV official match formats | [ ] |
| Q3 | Task permissions | [ ] |
| Q4 | German wording for Squad/MatchFormat | [ ] |
| Q5 | Attendance edit rights | [ ] |

## Change log

| Date | Change |
|---|---|
| 2026-10-09 | Overview created |
