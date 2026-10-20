# UI specification

This specification defines the durable presentation-layer requirements. Business logic, routes, selectors, translations, services, and API contracts remain independent of presentation changes.

## Direction

- Evolve the orange/slate identity with clear hierarchy and restrained decoration.
- Use balanced default density; tables and operational views may use compact density.
- Follow the system colour scheme, with token-driven theme and density overrides.
- Meet WCAG 2.2 AA for contrast, keyboard interaction, accessible names, and visible focus.
- Pages compose public UI components. Components own appearance. Feature CSS is limited to unique geometry or interaction.
- Visual acceptance is manual; automated screenshot baselines are out of scope.

## Visual contract

### Colour

- Components use semantic roles only: canvas, surfaces, text levels, borders, focus, action, inverse, and status tones.
- Orange is reserved for primary actions, focus, selection, and restrained brand accents.
- Success, warning, danger, and info colours communicate state rather than decoration.
- Palette values are private to the token layer.

### Typography

| Role | Size | Weight |
| --- | --- | --- |
| Page title | 30px | 700 |
| Section title | 20px | 600 |
| Card/entity title | 16–18px | 600 |
| Body | 16px | 400 |
| Supporting text | 14px | 400 |
| Label/metadata | 12px | 600 |
| Eyebrow/table heading | 11px | 700 |

Heading levels remain semantic. Compact density does not reduce readable text sizes.

### Spacing and layout

- Use the 4px spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, and 48px.
- Page gutters are 16px on mobile, 24px on tablet, and 32px on desktop.
- Panel padding is 16px on mobile and 24px on desktop.
- Breakpoints are 640px, 768px, and 1024px; maximum content width is 1280px.
- Layout is mobile-first. Tables either scroll or provide an explicit mobile representation.
- Arbitrary dimensions are allowed only for documented feature geometry such as pitches, swipe trays, and sticky matrix columns.

### Shape, elevation, and controls

- Controls use a 12px radius, cards 16px, prominent containers 24px, and pills a full radius.
- Normal surfaces use borders and subtle elevation. Strong elevation is reserved for dialogs, docks, and drag state.
- Control heights are 32px small, 40px default, and 44px large.
- Interactive components define default, hover, active, focus-visible, disabled, loading, and selected states as applicable.
- Shared motion durations are used and reduced-motion preferences are respected.

## Component contract

The public barrel at `src/components/ui` is the only component import boundary for pages.

- Layout: `Page`, `Stack`, `Cluster`, `Split`, and `ContentGrid`.
- Hierarchy: `PageHeader`, `SectionHeader`, titles, descriptions, and actions.
- Surfaces: `Panel`, `Card`, and `ActionCard` with controlled variants.
- Data: entity and property lists, metadata, tables, responsive views, and sticky matrices.
- Controls: buttons, fields, tabs, choice groups, switches, and modals.
- Feedback: badges, status markers, alerts, empty states, and loading states.
- Navigation: application navigation, adjacent navigation, and action docks.

Public props express semantic variants. A page-level `className` is limited to layout or an approved feature exception.

## Verification

Before accepting presentation changes:

- Run the TypeScript/build, lint, test, and style checks.
- Inspect affected routes at narrow and wide widths.
- Check light and dark system themes plus default and compact density where applicable.
- Exercise keyboard-only interaction, including focus entry and return for dialogs.
- Inspect Team Detail and Team Lineup print views when those surfaces change.
- Use `/ui-kit` in development to review representative component variants.
