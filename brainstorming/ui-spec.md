# UI Spec Approach (Brainstorming)

Goal: specify UI layout and behavior reliably, so that spec, code and tests stay
in sync. Existing foundation: use-case specs (`specs/usecases/`), domain specs
(`specs/domain/`), OpenAPI spec, and Playwright e2e tests named after use cases.
The missing piece is the UI layer.

Status: idea only. General UI issues after the refactoring are fixed first.

## 1. Structure: screen specs (one markdown file per page)

Location: `specs/ui/<page>.md`, using a fixed template:

- Purpose and the use cases served (link e.g. `UC-EV-001`).
- Layout regions (header, list, actions, modals) in mobile-first order, with a
  note for the 375px minimum width.
- Data sources (store selectors) and the exact fields displayed.
- States: loading, empty, error, populated.
- Actions and the resulting behavior, including validation and confirmations.
- i18n keys used.

Every element gets a stable ID (e.g. `EV-LIST-ADD-BTN`) mapped to a
`data-testid`. This links spec, code and tests.

## 2. Layout: low-fidelity wireframes as text

- ASCII or Mermaid wireframes inside the markdown, or Excalidraw/Figma exports
  stored next to the spec. Text is diffable, reviewable in PRs and readable by
  agents.
- Reusable components (Card, Modal, Tabs, ListRow) are described once in
  `specs/ui/components.md`; page specs only compose them.

## 3. Behavior: executable specs

- Behavior is written as Given/When/Then scenarios with IDs in the screen spec.
  Each scenario maps 1:1 to a Playwright test. CI fails if a scenario has no
  test.
- `toHaveScreenshot()` visual regression at 375px and desktop widths for layout.
- ARIA snapshots (`toMatchAriaSnapshot`) to lock structure and accessibility
  with less flakiness than pixels.

## 4. Interaction flows and states

- Complex pages (e.g. EventDetailPage) get a Mermaid state machine or sequence
  diagram of modes (selecting, replacing, switching players).
- Component-level states are verified in Storybook or Vitest + Testing Library.

## 5. Guardrails

- Selector tests (existing rule) cover derived data; specs list displayed
  fields against selector outputs.
- A script checks that i18n keys named in specs exist in both locale files and
  that referenced `data-testid`s exist in the code.

## Suggested rollout

1. Pick one page (EventDetailPage, the most complex).
2. Write its screen spec using the template, with wireframe and scenarios.
3. Derive Playwright tests and an ARIA snapshot from it.
4. If the template works, roll out to the other pages.
