# Plan: Clear Component Boundaries

## Goal

Make the UI easier to understand and test by separating application coordination
from presentation, keeping components small and focused, and sharing genuinely
common patterns without erasing meaningful differences.

This plan is based on a static review. It records opportunities and sequencing;
it does not prescribe a single large rewrite.

## Status Badges

Use these badges when updating progress:

- <span style="color:#fff;background:#2563eb;padding:2px 8px;border-radius:999px">PLANNED</span> Not started
- <span style="color:#111;background:#facc15;padding:2px 8px;border-radius:999px">IN PROGRESS</span> Active work
- <span style="color:#fff;background:#16a34a;padding:2px 8px;border-radius:999px">DONE</span> Completed and checked
- <span style="color:#fff;background:#dc2626;padding:2px 8px;border-radius:999px">BLOCKED</span> Waiting on a decision or dependency
- <span style="color:#fff;background:#6b7280;padding:2px 8px;border-radius:999px">WON'T DO</span> Reviewed and intentionally excluded

> Some Markdown renderers remove inline colors. The badge text remains useful
> if that happens.

## Working Principles

- Pages and containers own routing, store/service access, and application actions.
- Presentational components receive the data they display and callbacks for
  actions; keep only local display state inside them.
- Extract pure domain transitions and non-trivial derived view data into
  selectors/utilities, with tests for selectors as required by `AGENTS.md`.
- Extract components around cohesive behavior, not merely to reduce line count.
- Preserve meaningful variants such as compact versus detailed cards.
- Keep user-visible text translated and use shared styling recipes.

## Work Plan

### 1. Break up the largest workflow pages

<span style="color:#fff;background:#2563eb;padding:2px 8px;border-radius:999px">PLANNED</span>

Review and split these pages in small, independently reviewable changes:

- [x] [SquadSettingsPage](../src/pages/SquadSettingsPage.tsx): separate settings
  sections for Spond, periods, category, match planning, formats, formations,
  and squad deactivation.
- [x] [TeamLineupPage](../src/pages/TeamLineupPage.tsx): separate lineup editor,
  bench, and summary views from draft persistence and navigation protection.
- [ ] <span style="color:#fff;background:#6b7280;padding:2px 8px;border-radius:999px">WON'T DO</span> [SpondImportPage](../src/pages/SpondImportPage.tsx): separate wizard-step
  presentation from client lifecycle, snapshot loading, and import orchestration.
- [x] [PlayerDetailPage](../src/pages/PlayerDetailPage.tsx): isolate guardian
  management and history/upcoming-event sections from player page coordination.
- [x] [TeamDetailPage](../src/pages/TeamDetailPage.tsx): isolate roster and
  property sections from team updates and dialog coordination.

**Done when:** each page primarily coordinates data/actions and composes focused
views; extracted behavior can be checked independently; relevant existing
behavior remains intact.

### 2. Make lineup transitions independently testable

<span style="color:#fff;background:#16a34a;padding:2px 8px;border-radius:999px">DONE</span>

- [x] Move assignment, slot replacement, bench movement, and period replacement
  rules out of `TeamLineupPage` handlers into pure transitions in
  [lineupTransitions](../src/store/selectors/lineupTransitions.ts).
- [x] Cover movement between slots, moving to/from the bench, keeping other
  periods unchanged, clearing a slot, and copying a prior period in
  [lineupTransitions.test](../src/store/selectors/lineupTransitions.test.ts).
- [x] Keep page handlers responsible for invoking transitions and setting state;
  cancelled/read-only guards remain at the page boundary.

**Done when:** the lineup rules can be tested without rendering the page, and
the page no longer duplicates period reconstruction logic.

### 3. Consolidate repeated create/edit forms

<span style="color:#fff;background:#16a34a;padding:2px 8px;border-radius:999px">DONE</span>

- [x] Compare [AddShirtModal](../src/components/AddShirtModal.tsx) and
  [EditShirtModal](../src/components/EditShirtModal.tsx); share fields in
  [ShirtDetailsFields](../src/components/ShirtDetailsFields.tsx) and number
  validation in [shirtNumberValidation](../src/store/selectors/shirtNumberValidation.ts),
  preserving the edit rule for the existing number.
- [x] Compare [AddEventModal](../src/components/AddEventModal.tsx) and
  [EditEventModal](../src/components/EditEventModal.tsx); share activity fields
  and player limits in [ActivityCoreFields](../src/components/ActivityCoreFields.tsx)
  and [ActivityPlayerLimitFields](../src/components/ActivityPlayerLimitFields.tsx),
  with schedule validation in
  [activityFormValidation](../src/store/selectors/activityFormValidation.ts).
  Creation, invitation, roster, and Spond rules remain in their coordinating flows.
- [x] Compare [AddShirtSetModal](../src/components/AddShirtSetModal.tsx) and
  [EditShirtSetModal](../src/components/EditShirtSetModal.tsx); share sponsor
  and color fields in [ShirtSetDetailsFields](../src/components/ShirtSetDetailsFields.tsx)
  while keeping automatic shirt generation creation-only.

**Done when:** shared form behavior has one implementation, mode-specific
behavior remains explicit, and fields/validation are straightforward to test.

### 4. Unify member and swipe presentation

<span style="color:#fff;background:#16a34a;padding:2px 8px;border-radius:999px">DONE</span>

- [x] Extract the shared member-card shell used by
  [PlayerCard](../src/components/PlayerCard.tsx) and the trainer rendering in
  [MembersList](../src/components/MembersList.tsx), allowing player-specific
  metadata to remain optional in [MemberCardShell](../src/components/MemberCardShell.tsx).
- [x] Converge swipe thresholds and touch handling in
  [useSwipeGesture](../src/hooks/useSwipeGesture.ts), used by the member list,
  team roster, and [SwipeableEntityRow](../src/components/ui/SwipeableEntityRow.tsx).
- [x] Test navigation suppression and single-active-row behavior in
  [swipeGesture.test](../src/hooks/swipeGesture.test.ts).

**Done when:** gesture thresholds and dismissal behavior have one source, while
member card variants remain clear and accessible.

### 5. Clarify data and action boundaries in shared components

<span style="color:#fff;background:#2563eb;padding:2px 8px;border-radius:999px">PLANNED</span>

- [x] Refactor [ActivityCard](../src/components/ActivityCard.tsx) to receive its
  summary data and navigation callbacks instead of reading the store and
  navigating internally. Keep the simplified upcoming event card on
  [HomePage](../src/pages/HomePage.tsx) separate from the detailed activity
  card; upcoming events do not show team details.
- [x] Move store writes from [StatisticsPeriodModal](../src/components/StatisticsPeriodModal.tsx)
  into [SquadSettingsPage](../src/pages/SquadSettingsPage.tsx); let the modal
  edit values and report submit/cancel.
- [x] Separate service, clipboard, and confirmation coordination from
  [BirthdayCalendarModal](../src/components/BirthdayCalendarModal.tsx)'s view;
  coordinate these actions in [MembersPage](../src/pages/MembersPage.tsx).
- [ ] Review router dependencies in `MembersList`, `PlayerStatisticsTable`, and
  the statistics matrices; pass route actions where that improves reuse and
  isolated testing.

**Done when:** reusable presentation components have explicit inputs and
outputs, and their tests do not need application store/service setup unless
that integration is the behavior under test.

### 6. Narrow TeamCard's responsibilities

<span style="color:#fff;background:#2563eb;padding:2px 8px;border-radius:999px">PLANNED</span>

- [ ] Use the existing `selectTeamCardView` boundary to supply a view model from
  a container where practical.
- [ ] Separate roster/header presentation from drag-and-drop payload handling.
- [ ] Keep capacity and player swap/replace decisions in the coordinating layer
  or pure tested helpers, not in presentational markup.

**Done when:** a TeamCard view can be rendered from a focused view model and
callbacks without assembling the entire activity/store data graph.

### 7. Extract and test guardian form decisions

<span style="color:#fff;background:#2563eb;padding:2px 8px;border-radius:999px">PLANNED</span>

- [ ] Move existing-user eligibility filtering from
  [ManageGuardiansModal](../src/components/ManageGuardiansModal.tsx) into a
  selector and add tests for normal, duplicate, and editing-self cases.
- [ ] Separate existing-user and documented-guardian form sections.
- [ ] Isolate validation and guardian payload construction from modal rendering.

**Done when:** derived choices and submission decisions are independently
testable, with the modal focused on form interaction and presentation.

### 8. Add focused component interaction coverage

<span style="color:#fff;background:#2563eb;padding:2px 8px;border-radius:999px">PLANNED</span>

- [ ] Establish a component-test setup appropriate to the existing Vitest
  configuration.
- [ ] Add targeted tests alongside extracted boundaries, prioritizing modal
  submit/reset behavior, callback wiring, read-only controls, swipe/navigation
  behavior, and lineup edits.
- [ ] Keep selector tests for derived data and pure transition tests for domain
  changes; do not duplicate those tests through shallow render assertions.

**Done when:** critical user interactions have isolated regression coverage and
tests remain focused on observable behavior.

## Suggested Sequence

1. Lineup transitions and `TeamLineupPage` views.
2. Shirt form reuse and shared member/swipe behavior.
3. `SquadSettingsPage` sections.
4. `PlayerDetailPage`, `TeamDetailPage`, and guardian management.
5. `SpondImportPage` and remaining store/router boundaries.
6. Component interaction coverage across the extracted pieces.

Reorder the sequence as feature work makes a section timely. Update a task's
badge as it starts, and mark it `DONE` after its relevant checks pass. Each code
change should also follow `AGENTS.md`: translated UI text, tested selectors,
shared styling, style checks after styling changes, and compilation verification
after modifications.
