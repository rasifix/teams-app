# UI rebuild

This document is the source of truth for the presentation-layer rebuild. Business logic, routes, selectors, translations, services, and API contracts stay unchanged.

Status: `done`, `in progress`, `not started`, or `blocked`.

Current status (2026-10-19): phases 0–6 and 8–15 are complete. Phase 7 remains with the project owner for manual visual approval. Phase 16, Final verification, is the next implementation phase.

## Direction

- Evolve the existing orange/slate identity with clearer hierarchy and less decoration.
- Use balanced default density; tables and operational views may be compact.
- Follow the system colour scheme. Theme and density remain token-driven and can be overridden with `data-theme` and `data-density`.
- Meet WCAG 2.2 AA for contrast, keyboard interaction, naming, and visible focus.
- Pages compose UI components. Components own appearance. Feature CSS is limited to unique geometry or interaction.
- Tailwind has been removed; the style guard prevents its dependencies, directives, configuration, and utility markup from returning.
- Visual acceptance is manual; automated screenshot baselines are intentionally out of scope.

## Visual contract

### Colour

- Components use semantic roles only: canvas, surfaces, text levels, borders, focus, action, inverse, and status tones.
- Orange is reserved for primary action, focus, selection, and restrained brand accents.
- Success, warning, danger, and info colours communicate state, never decoration.
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

Compact density changes spacing and control dimensions, not readable text sizes. Heading levels must remain semantic.

### Spacing and layout

- Use the 4px spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, and 48px.
- Page gutters are 16px mobile, 24px tablet, and 32px desktop.
- Panel padding is 16px mobile and 24px desktop.
- Breakpoints are 640px, 768px, and 1024px; maximum content width is 1280px.
- Layout is mobile-first. Tables either scroll or provide an explicit mobile representation.
- Arbitrary dimensions are permitted only for documented feature geometry such as pitches, swipe trays, and sticky matrix columns.

### Shape, elevation, and controls

- Controls use a 12px radius, cards 16px, prominent containers 24px, and pills a full radius.
- Normal surfaces use borders and subtle elevation. Strong elevation is reserved for dialogs, docks, and drag state.
- Control heights are 32px small, 40px default, and 44px large.
- Interactive components define default, hover, active, focus-visible, disabled, loading, and selected states.
- Shared motion durations are used and reduced-motion preferences are respected.

## Component contract

The public UI barrel is the only import boundary. Pages may not import implementation files.

- Layout: `Page`, `Stack`, `Cluster`, `Split`, `ContentGrid`.
- Hierarchy: `PageHeader`, `SectionHeader`, titles, descriptions, and actions.
- Surfaces: `Panel`, `Card`, and `ActionCard` with controlled variants.
- Data: `EntityList`, `EntityRow`, `PropertyList`, `MetadataList`, `DataTable`, and `StickyMatrix`.
- Controls: buttons, fields, tabs, choice groups, switches, and modals.
- Feedback: badges, status markers, alerts, empty states, and loading states.
- Navigation: application navigation, adjacent navigation, and action docks.

Public props express semantic variants. A page-level `className` is allowed only for an approved feature exception.

## Migration status

| ID | Status | Work item | Evidence required |
| --- | --- | --- | --- |
| 0 | done | Inventory and direction | Decisions recorded above. |
| 1 | done | Tracking and enforceable baseline | Tracker, route inventory, and automated style rules established. |
| 2 | done | Tokens and CSS architecture | Theme/density overrides, cascade layers, and motion rules. |
| 3 | done | Foundational components | Layout, hierarchy, surfaces, controls, feedback, and overlays. |
| 4 | done | Data components | Entity/property lists, metadata, tables, matrices, legends, and status markers. |
| 5 | done | Development UI catalog | Representative component variants can be checked in both themes and densities at `/ui-kit` in development. |
| 6 | done | Reference screens | Squad Settings, Event Detail, Team Detail, Guardians, participation/selection statistics, and Team Lineup. |
| 7 | in progress | Manual approval gate | Manual visual review is owned by the project owner and intentionally runs independently of implementation. |
| 8 | done | Shell and public routes | Header, Home, Login, Reset Password, and Squad Selection. |
| 9 | done | Members workflow | Members, Players, Trainers, Guardians, detail pages, and member dialogs. |
| 10 | done | Events workflow | Event list, cards, attendance, invitations, and dialogs. |
| 11 | done | Team workflow | Team Detail, player selection, formation, lineup, and print. |
| 12 | done | Settings and integrations | Squad settings dialogs, shirts, and Spond import. |
| 13 | done | Statistics workflow | Statistics shell, player statistics, and matrices. |
| 14 | done | Residual components | Remaining dialogs, cards, errors, and feedback. |
| 15 | done | Tailwind and legacy removal | No dependency, directives, utility markup, or `features.css`. |
| 16 | not started | Final verification | Tests, lint, styles, build, responsive states, keyboard, themes, density, and print. |

## Route inventory

- Public: `/`, `/login`, `/reset-password`, `/squads`.
- Members: `/members/players`, `/members/trainers`, `/members/guardians`, `/players/:id`, `/trainers/:id`.
- Events: `/events`, `/events/:id`.
- Team workflow: team detail, player selection, and lineup routes below an event.
- Operations: `/shirts`, `/squad-settings`, `/spond-import`.
- Statistics: player statistics, event participation, and team selections.

## Verification log

### Reference checkpoint

- Affected routes: `/squad-settings`, `/events/:id`, `/events/:eventId/teams/:teamId`, `/members/guardians`, both matrix statistics views, and both Team Lineup tabs.
- Public additions: layout primitives, section hierarchy, entity/property/metadata display, data tables and sticky matrices, responsive views, choice groups, navigation, legends, markers, icon tiles, and action docks.
- Existing components: normalized card variants, button loading state, and accessible modal labelling, focus entry/return, Escape handling, and focus trapping.
- CSS architecture: named cascade layers, semantic light/dark theme tokens, density tokens, reduced motion, and feature CSS restricted to feature-specific layout and interaction geometry.
- Style baseline: 7 CSS files, 0 duplicate declaration groups, 1,653 JSX class tokens, 32 long class names, and 833 literal class names. The class-token budget was reduced from 1,748 to 1,653.
- Automated verification: TypeScript, style guard, ESLint, unit tests, and production build.
- Manual review: pending. Use `/ui-kit` in development, then inspect the affected routes at narrow and wide widths, light and dark system themes, default and compact density, keyboard-only interaction, and print views for Team Detail and Team Lineup.

### Public-route migration

- Fixed cascade ownership by placing legacy Tailwind in the lowest named layer; component recipes now reliably control buttons and fields.
- Visually checked `/ui-kit` in light, dark, compact, and narrow layouts. Standard buttons now use the 12px control radius, loading buttons preserve contrast and spinner spacing, and text fields render 14px inline and 10px block padding.
- Migrated Login and Reset Password to `Panel`, `Stack`, `Field`, shared loading buttons, and semantic auth recipes.
- Migrated Header, Home, and Squad Selection to semantic language controls, section hierarchy, content grids, panels, stacks, icon tiles, status markers, and the extended shared `ActionCard` selection API.
- Corrected the shell brand semantics so every route owns its single top-level heading.
- Style baseline after completing the shell/public phase: 1,538 JSX class tokens, 31 long class names, and 789 literal class names.

### Fixed action-dock clearance

- Added an explicit `Page actionDock` contract and width variants for `ActionDockContent`.
- Migrated Team Player Selection from a Tailwind-positioned footer to the shared action dock and applied the same page contract to Team Lineup.
- Pages now reserve a tokenized 8rem plus the device safe-area inset, preventing the dock from covering the final list row.
- Style baseline: 1,513 JSX class tokens, 30 long class names, and 786 literal class names.

### Members workflow

- Migrated the Members shell, tabs, Players, Trainers, Guardians, Player Detail, Trainer Detail, member cards, histories, and related dialogs.
- Reused section headers, clusters, choice groups, entity lists, metadata, content grids, stacks, action cards, fields, and shared modal actions.
- Added a shared anchor-style button and shared swipe-action tray recipe; player, trainer, and team swipe actions now use the same interaction geometry.
- Moved player filter/year derivation and generic period-history grouping into selectors. Tests cover combined filters, empty results, unique-year fallback, valid grouping, invalid periods, invalid dates, and empty history.
- Style baseline: 1,301 JSX class tokens, 21 long class names, and 735 literal class names, with zero duplicate declaration groups.
- Manual visual regression remains intentionally delegated to the project owner.

### Events workflow

- Migrated the Events page, event cards, home-page upcoming event cards, invitations, attendance, and add/edit/invite/attendance dialogs to shared layout, action-card, entity-list, field, and modal components.
- Added navigable action cards and a small select variant to the public UI kit instead of reproducing those recipes in feature markup.
- Kept feature CSS limited to the compound event-card layout and invitation-row interaction; the style guard reports zero duplicate declaration groups.
- Moved invite-player filtering, adjacent-event navigation, and invitation row composition into selectors. Tests cover normal selection, exclusions, empty results, navigation boundaries, missing activities and players, assignments, and managed/read-only fallbacks.
- Style baseline: 1,086 JSX class tokens, 12 long class names, and 685 literal class names.
- Automated verification: TypeScript, style guard, ESLint, 295 unit tests, and the production build pass. The existing bundle-size advisory remains unchanged.

### Team workflow

- Migrated Team Detail, player selection, formation assignment, shirt assignment, responsible-person assignment, lineup navigation, lineup dialogs, and team print content to shared page, layout, action-card, entity-list, field, choice, and modal components.
- Preserved the tokenized action-dock clearance and the lineup's feature-specific pitch, drag, print, and swipe geometry.
- Moved selection capacity, roster resolution, benched-player resolution, shirt-assignment initialization/rows, and print summaries into selectors. Tests cover capacity boundaries, pending removals, missing players, empty rosters, shirt availability and preference fallbacks, locations, responsible people, and print ordering.
- Style baseline: 979 JSX class tokens, 11 long class names, and 634 literal class names, with zero duplicate declaration groups.
- Automated verification: TypeScript, style guard, ESLint, 307 unit tests, and the production build pass. The existing bundle-size advisory remains unchanged.

### Settings and integrations

- Migrated Squad Settings, its format/formation/statistics dialogs, shirt-set management, and the complete Spond import wizard to shared page, layout, field, choice-card, entity-list, panel, badge, and modal components.
- Added `ChoiceCard` to the public UI layer so selectable options share one accessible, token-driven treatment instead of repeating feature recipes.
- Consolidated member and shirt grids, metadata, hover, selection, and danger states; the style guard reports zero duplicate declaration groups.
- Moved shirt sorting/generation and Spond review, guardian selection, decision construction, and fallback behavior into selectors with automated coverage.
- Style baseline: 693 JSX class tokens, 7 long class names, and 551 literal class names. The enforceable token budget was reduced from 979 to 693.
- Automated verification: TypeScript, style guard, ESLint, all 314 unit tests, and the production build pass. The existing bundle-size advisory remains unchanged.
- Manual visual regression remains intentionally delegated to the project owner.

### Statistics workflow

- Migrated the statistics shell, period and level controls, player-statistics table, event-participation matrix, and team-selection matrix to the public UI component layer.
- Added shared panel-body, menu, sortable-table-header, and metric-grid primitives instead of retaining feature-specific utility recipes.
- Preserved the mobile player-statistics representation and horizontally scrollable sticky matrices while making player, event, and sort actions keyboard-accessible controls.
- Moved statistics-view composition, summary calculations, player filtering/sorting, and upcoming-event lookup into selectors. Tests cover periods, trial-player exclusion, zero-data fallbacks, level ranges, sort directions and tie-breaking, invalid dates, and missing upcoming events.
- Style baseline: 584 JSX class tokens, 3 long class names, and 503 literal class names, with zero duplicate declaration groups. The enforceable token budget was reduced from 693 to 584.
- Automated verification: TypeScript, style guard, ESLint, all 318 unit tests, and the production build pass. The existing bundle-size advisory remains unchanged.
- Manual visual regression remains intentionally delegated to the project owner.

### Residual components

- Migrated Team Card, confirmation and squad dialogs, application/API error states, API status, and the shared date tile away from legacy utility markup.
- Added public page-state, state-detail, floating-status, modal-size, button-width, and semantic date-tile recipes. DateColumn retains its 48px square geometry and tokenized month/day hierarchy.
- Rebuilt Team Card with shared card, layout, entity, metadata, badge, button, and icon-button primitives while preserving drag/drop, player replacement, shirt, responsibility, and capacity behavior.
- Moved Team Card summaries and roster rows, newest-squad resolution, and initialization-error composition into selectors. Tests cover populated, empty, missing-data, timestamp, and fallback behavior.
- Style baseline: 432 JSX class tokens, 0 long class names, and 455 literal class names, with zero duplicate declaration groups. The enforceable token budget was reduced from 584 to 432.
- Automated verification: TypeScript, style guard, ESLint, all 324 unit tests, and the production build pass. The existing bundle-size advisory remains unchanged.
- Manual visual regression remains intentionally delegated to the project owner.

### Tailwind and legacy removal

- Removed the direct `tailwindcss`, `postcss`, and `autoprefixer` development dependencies and their lockfile entries.
- Removed the Tailwind and PostCSS configuration files, Tailwind directive stylesheet, unused `App.css`, and the obsolete `legacy-tailwind` cascade layer.
- Added the small standards reset previously supplied by Tailwind preflight so element margins, controls, media, lists, links, and tables remain predictable without framework CSS.
- Renamed `features.css` to `compositions.css`; it now explicitly owns only feature geometry and interaction such as pitch, swipe, drag/drop, sticky operational views, and print layouts.
- Removed dead compatibility recipes for old layout utilities, tables, danger links, headings, and feature aliases.
- Extended the style guard to reject Tailwind infrastructure, Tailwind/PostCSS directives, and Tailwind-style utility markup.
- CSS output decreased from 89.38 kB to 80.57 kB. The style baseline remains 432 JSX class tokens, 0 long class names, and 455 literal class names across 5 CSS files, with zero duplicate declaration groups.
- Automated verification: TypeScript, style guard, ESLint, all 324 unit tests, and the production build pass. The existing JavaScript bundle-size advisory remains unchanged.
- Manual visual regression remains intentionally delegated to the project owner.

## Next phase

Phase 16 is final verification: reconcile the implementation against the component and visual contracts, run the complete automated suite, audit responsive, keyboard, theme, density, and print contracts, and record any owner-managed manual checks without reintroducing screenshot baselines.
