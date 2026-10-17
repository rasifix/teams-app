# App

## Core Responsibilities
* do not generate more code than asked; ask instead of implementing random stuff.
* **Always verify code compiles after modifications**: After making any code changes, use the `get_errors` tool to check for compilation errors. If errors are found, fix them immediately before considering the task complete.
* **All user-facing text must be translated**: Every component must use react-i18next for all text displayed to users. Never hardcode English or any language strings directly in components. Always use `t('key')` from `useTranslation()` hook and add corresponding keys to both `public/locales/en/translation.json` and `public/locales/de/translation.json`.
* **Derived data must come from selectors**: Any non-trivial derived or computed view data (filtering, sorting, grouping, fallback composition, stats, history rows) must be extracted into a selector (store selector or dedicated selector utility). Do not keep this logic inline in page/component render code unless it is truly trivial.
* **All selectors require tests**: Every new or changed selector must have automated tests that cover happy path, edge cases, and fallback behavior. If selector behavior changes, update tests in the same change.
* **Use the shared styling system**: Put design decisions in `src/styles/tokens.css` and reusable patterns in shared UI components or `src/styles/recipes.css`. CSS Modules are only for feature-specific styling and must not duplicate shared recipes. Tailwind may be used for one-off structural layout during migration, but do not add Tailwind colour, typography, radius, shadow, or control recipes in JSX. Run `npm run check:styles` after styling changes.
