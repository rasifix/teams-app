# Styling architecture

The UI uses three layers. Dependencies flow down this list and never sideways between feature styles.

1. `src/styles/tokens.css` owns design decisions: semantic colours, type sizes, spacing, radii, shadows, control dimensions, and motion. Theme and density overrides belong here.
2. `src/styles/base.css` owns element defaults. `src/styles/recipes.css` owns reusable UI and layout recipes such as panels, form controls, page shells, feedback, stacks, and clusters.
3. `src/styles/compositions.css` and feature CSS Modules own geometry and interaction that are genuinely unique to a feature. They reference tokens and do not copy shared recipes.

React UI components are the application-facing API for patterns that carry structure or behaviour. Their shared CSS recipes are implementation details; feature code consumes the components instead of applying recipe classes directly.

Use `Button` for ordinary actions, `ButtonLink` for link navigation styled as an action, `IconButton` for icon-only actions, `Switch` for boolean settings, and the tab components for mode or route selection. A native `<button>` is appropriate only when the element is a larger composite control such as a clickable card, disclosure row, menu item, pitch position, or matrix cell. Mark that intentional exception with `data-ui-control="composite"` or `data-ui-control="menu-item"`; the style check rejects unmarked component bypasses.

The component layer is exported from `src/components/ui`:

- `Page` with its header, title, description, and actions composes screen shells.
- `Panel` with its header, title, description, and actions composes grouped content.
- `NavigationTabs`/`NavigationTab` are for routes; `TabList`/`Tab` are for in-page state.
- `Badge` owns status and metadata pills.
- `Field` with `Input`, `Select`, or `Textarea` owns form structure and control styling.
- `Alert` and `EmptyState` own feedback states; `ButtonLink` gives internal links the button variants.
- `PageToolbar`, `ActionCard`, `ListFrame`/`ListRow`/`ListAction`, and the filter components own repeated feature-level composition.
- `SummaryCard` owns compact dashboard metrics and their semantic accent tones.

Use component props for supported variants. `className` is reserved for layout at the call site, not for restyling a component's colour, spacing, radius, type, or shadow. The public UI barrel is the import boundary; pages do not import component implementation files.

Tailwind has been removed. Do not reintroduce its dependencies, directives, configuration, or utility markup.

## Themes and density

Tokens are scoped custom properties. The application follows the system colour scheme unless an ancestor sets `data-theme="light"` or `data-theme="dark"`. An ancestor may set `data-density="compact"` for operational views. Shared controls and surfaces respond without component changes.

Compact density changes spacing and control dimensions, not readable text sizes. Shared motion uses the duration tokens and respects reduced-motion preferences.

## Quality gate

Run `npm run check:styles`. It rejects duplicated multi-declaration CSS rules, unmarked control bypasses, Tailwind infrastructure and utility markup, and other violations of the shared styling boundary.
