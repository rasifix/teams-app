# Formation

A Formation defines the named on-field position slots used by a Match Team's
per-period Match Plan. It belongs to exactly one Squad and is usable only when
match planning is enabled.

## Rules

- Every Formation has exactly one `GK` slot.
- Every Formation has at least one non-`GK` slot.
- Position codes come from the fixed language-neutral catalog.
- A Formation is selected by a Match Team and remains fixed for the Match.
- For each period, selected Players may be assigned to slots; unassigned
  selected Players are implicitly on the bench.
- A Player and a Formation Slot may each be used at most once per period.
- Period numbers cannot exceed the Match Format's number of periods.

Formations may be edited while unused and deleted only while unused. Tournament
Teams do not use Formations.
