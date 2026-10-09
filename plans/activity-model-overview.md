# Activity domain model migration: overview

Status legend: `[ ]` not started, `[~]` in progress, `[x]` done, `[!]` blocked.

- Target model: `brainstorming/typespec/main.tsp` (diagrams: `brainstorming/event-domain-model.puml`)
- Backend plan: `teams-api/plans/activity-model-backend.md` (sibling repo)
- Frontend plan: [activity-model-frontend.md](./activity-model-frontend.md)

## Approach

Expand, then contract. The backend is expanded compatibly (aliases, new optional fields, `/activities` as a
new view over the existing events store). The frontend migrates afterwards in small shippable slices.
Legacy paths and fields are removed only in the contract phase, after the frontend no longer uses them.

## Decisions

- Renames Group → Squad, PlayingMode → MatchFormat: API aliases first (done); frontend identifier renames are mechanical and last; DB renames only in the backend contract phase.
- Persons are squad-scoped; only the login account is global. No Person/Membership split.
- API/DB payloads stay ID-based DTOs; the TypeSpec model is the domain model.
- Out of scope: SessionPlan/exercise catalog, event sourcing, cancellation, invitation send time, tournament fixtures.

## Status

| Phase | Scope | Backend | Frontend |
|---|---|---|---|
| 0 | Safety net and alignment | [x] | [ ] |
| 1 | Aliases / transport switch, `birthDate` canonical | [x] | [ ] |
| 2 | SFV catalog + extended MatchFormat | [x] | [ ] |
| 3 | Activities (match/tournament), invitation split | [x] | [ ] |
| 4 | Attendance | [x] | [ ] |
| 5 | Tasks + signups | [x] | [ ] |
| 6 | Training + social | [x] | [ ] |
| 7 / C | Contract: renames, remove legacy paths and fields, specs | [ ] | [ ] |

## Decisions taken in the backend

- SFV catalog: values supplied by the user (not verified against an SFV publication); one format per category plus `activityType`; tournament-only categories (E, F, G) have no format.
- Attendance edits: admin/trainer only.
- Tasks: admin/trainer manage; adult squad members sign themselves up; guardians cannot sign up children; over-subscription allowed.
- Backend task B3.8 (optional backfill) intentionally not implemented.

## Open questions

| # | Question | Status |
|---|---|---|
| Q4 | German wording for Squad/MatchFormat | [ ] |
| Q6 | Which role may create each activity kind | [ ] |
| Q7 | UI handling of zero-team legacy events | [ ] |
| Q8 | Do training/social count in fairness statistics | [ ] |
| Q1, Q2, Q3, Q5 | Resolved in the backend (see its plan) | [x] |

## Change log

| Date | Change |
|---|---|
| 2026-10-09 | Overview created |
| 2026-10-09 | Backend phases 0–6 marked done; frontend plan written |
