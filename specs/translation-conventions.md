# Translation conventions

Use these conventions for all new and changed translations.

## Namespaces

- `common.*`: genuinely global UI actions, validation, errors, and states.
- `domain.<entity>.*`: reusable domain concepts and entity fields. Group fields under the entity, for example `domain.member.fields.firstName`.
- `page.<screen>.*`: page, screen, modal, and screen-specific presentation copy.
- Keep integration-specific namespaces such as `spondSync.*` separate from domain and page copy.

Do not add new page-specific keys at the locale root. Prefer the existing domain key when the text names or describes a domain concept.

## Domain naming

- Use one canonical entity and field name everywhere: `Activity`, `Team`, `Squad`, `Player`, `Trainer`, `Guardian`, `Shirt`, and `Shirt set`.
- Put singular/plural labels with the entity, for example `domain.player.label`, `domain.player.plural`, and `domain.activity.plural`.
- Keep statuses and enumerations with their entity, for example `domain.player.status`, `domain.invitation.status`, `domain.attendance.reasons`, and `domain.formation.positions`.
- Follow inheritance/shared-member structure for common fields: `domain.member.fields.firstName`, `lastName`, and `email`.
- Preserve language-neutral codes in keys; translate their values in both locales.

## Reuse boundaries

- Reuse domain/common keys for ordinary labels, placeholders, statuses, and values.
- Keep page keys for contextual copy, required-label variants (`Name *`), modal titles, empty states, and page-specific errors.
- Do not duplicate a domain label in a page namespace unless the wording or context is intentionally different.
- Remove unused keys only after checking literal, conditional, plural, and dynamic references.

## Locale and verification requirements

- Every key must exist in both `public/locales/en/translation.json` and `public/locales/de/translation.json`.
- Keep interpolation placeholders identical across locales.
- All user-facing text must use `react-i18next`; do not hardcode display text.
- After translation changes, validate JSON, locale key parity, stale references, and TypeScript compilation.
