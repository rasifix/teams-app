# Styling architecture

The UI uses three layers. Keep dependencies flowing down this list, never sideways between feature styles.

1. `src/styles/tokens.css` owns design decisions: semantic colours, type sizes, spacing, radii, shadows, control dimensions, and motion. Theme and density overrides belong here.
2. `src/styles/base.css` owns element defaults. `src/styles/recipes.css` owns reusable UI and layout recipes such as panels, form controls, page shells, feedback, stacks, and clusters.
3. A feature may use a CSS Module for styling that is genuinely unique to that feature. It should reference tokens and must not copy a shared recipe.

React UI components are the application-facing API for patterns that carry structure or behaviour. Their shared CSS recipes are implementation details; feature code should consume the components instead of applying recipe classes directly.

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

Use component props for supported variants. `className` is reserved for layout at the call site, not for restyling a component's colour, spacing, radius, type, or shadow.

Tailwind remains available for structural layout. Its typography, radius, and standard shadow scales resolve through the design tokens, and colours must use semantic roles such as `content`, `surface`, `edge`, `brand`, or a feedback role. Raw palette names and arbitrary visual values are rejected by `npm run check:styles`. A long utility list is a signal that the markup needs a component or a named feature style.

## Themes and density

Tokens are scoped custom properties. A future preference can set `data-theme="dark"` or `data-density="compact"` on any application ancestor. Shared controls and surfaces respond without component changes. The included dark values are a development foundation, not an exposed user preference yet.

## Quality gate

Run `npm run check:styles`. It rejects duplicated multi-declaration CSS rules and prevents the existing Tailwind debt from increasing. The utility budgets are ratchets: migrations should lower them, never raise them.
