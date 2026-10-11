# UC-GR-013 - Export Members For Spond

## Goal

Allow an authorized Squad Manager to download the current Players and up to two
Guardians per Player as a CSV that can be opened in spreadsheet software and
used for Spond member import.

## Primary Actor

Squad Manager

## Preconditions

- The actor is authenticated and may manage members in the selected Squad.
- Player data for the Squad is loaded.

## Trigger

The actor chooses Export for Spond on Members > Players.

## Main Success Scenario

1. System reads all Players in the selected Squad, independent of active list
   filters.
2. System produces one row per Player.
3. System maps the first two Guardians, when present, into Guardian 1 and
   Guardian 2 columns.
4. System formats canonical `YYYY-MM-DD` birth dates as `dd.MM.yyyy`.
5. System leaves unavailable values and the address columns empty.
6. System escapes commas, quotes, and line breaks according to CSV rules.
7. System downloads `spond-members.csv` as UTF-8 with a byte-order mark, comma
   separators, and CRLF row endings.

## CSV Contract

Columns appear in this exact order:

1. `vorname`
2. `nachname`
3. `birth date`
4. `street`
5. `plz`
6. `city`
7. `vorname guardian 1`
8. `nachname guardian 1`
9. `email guardian 1`
10. `phone guardian 1`
11. `vorname guardian 2`
12. `nachname guardian 2`
13. `e-mail guardian 2`
14. `phone guardian 2`

## Alternative Flows

### A1 - Missing Optional Data

1. A Player has fewer than two Guardians or a Guardian lacks email or phone.
2. System writes empty cells for the missing values and preserves all columns.

### A2 - More Than Two Guardians

1. A Player has more than two Guardians.
2. System exports only the first two Guardians because the target layout has
   exactly two Guardian slots.

### A3 - Non-Canonical Birth Date

1. A stored birth date does not match `YYYY-MM-DD`.
2. System exports the original value instead of guessing a conversion.

### A4 - No Players

1. The Squad has no Players.
2. System downloads a valid CSV containing only the header row.

## Business Rules

- The export is local and does not authenticate with or write to Spond.
- Street, postal code, and city are always empty because those fields are not
  part of the current Player model.
- Missing data never shifts later columns.
- Values containing a comma, quote, carriage return, or newline are quoted;
  embedded quotes are doubled.
- The locale date format is `dd.MM.yyyy`.

## Acceptance Criteria

1. Given Players with Guardians, when export is requested, then the downloaded
   file contains the exact 14-column header and one row per Player.
2. Given birth date `2014-01-02`, then the CSV contains `02.01.2014`.
3. Given missing address and Guardian data, then the corresponding cells are
   empty without changing column positions.
4. Given a comma or quote in a value, then the generated CSV remains parseable.
5. Given more than two Guardians, then only the first two are exported.
6. Given no Players, then the CSV contains the header and no data rows.

