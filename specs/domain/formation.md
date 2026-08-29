# Formation

## Purpose

A Formation defines the named on-field position slots a Team lines up in for
a match, so a per-period lineup can assign Players to slots instead of free
text.

In business terms, a Formation answers: "What positions exist on the field,
and which one is the goalkeeper?"

## Core Concept

A Formation belongs to exactly one Group and is a reusable shape (for example
"3-3", meaning three defenders and three midfielders/forwards in front of one
goalkeeper). It is a flat list of slots; there are no pitch coordinates, only
a **position code** per slot drawn from a fixed, language-neutral catalog
(the same abbreviations used in games like FIFA: `GK`, `LB`, `CB`, `RB`,
`LWB`, `RWB`, `CDM`, `CM`, `CAM`, `LM`, `RM`, `LW`, `RW`, `CF`, `ST`). The
backend stores and validates only the code; translating it into a
human-readable, localized label (for example English "LB" for "left back"
vs. German "LV" for "linker Verteidiger") is a frontend i18n concern.

## Relationships

- A Formation belongs to one Group and is never shared with other Groups.
- A Group may have many Formations.
- A Team may select one Formation from its own Group for a match; the
  Formation stays fixed for the whole match.
- A Team's per-period lineup assignments reference slots from the Team's
  selected Formation.

## Lifecycle

1. A Group Manager enables match planning for the Group.
2. The Group Manager creates one or more Formations, each with a name and a
   list of slots, each carrying a position code, exactly one of which is
   `GK`.
3. When planning a match, a Team selects one Formation from the Group.
4. For each period, the Team assigns selected Players to the Formation's
   slots (or leaves them on the implicit bench).
5. A Formation can be edited or deleted while unused; deleting one still
   referenced by a Team is restricted.

## Invariants And Rules

- A Formation always belongs to exactly one Group; it has no existence
  outside that Group and cannot be referenced by another Group's Teams.
- A Formation must have at least one goalkeeper slot and at least one
  outfield slot.
- Exactly one slot in a Formation must have `positionCode: 'GK'`.
- Every slot's `positionCode` must be one of the fixed catalog values; a
  Formation may contain multiple slots with the same non-GK code (for
  example two `CB` slots in a back three), distinguished only by their
  order in the slots array.
- Deleting a Formation that is referenced by any Team in the Group is
  restricted until that reference is removed.

## Scope Boundaries

The Formation does:

- name the set of positions a Team lines up in for a match,
- provide the slot catalog that per-period lineup assignments reference.

The Formation does not:

- store pitch coordinates or a visual diagram,
- track which Player occupies a slot (that is the Team's per-period lineup),
- store translated/localized position names — only the language-neutral
  position code (translation is a frontend i18n concern),
- apply to Groups that have not opted into match planning.

## Practical Example

Group "D7" defines Formation "3-3" with slots `GK`, `LB`, `CB`, `RB`, `LM`,
`CM`, `RM`. Team "A" selects "3-3" for a match and, each period, assigns six
selected Players to these slots; the seventh selected Player rotates onto the
bench. In the German-language UI, `LB` renders as "LV" (linker Verteidiger);
in the English UI it renders as "LB" (left back) — only the code `LB` is
stored.
