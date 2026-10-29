# UC-GR-015: Deactivate a squad

## Goal

A group manager can deactivate a squad without deleting its data. Deactivated
squads are retained by the backend for historical events, members, statistics,
and auditability, but are excluded from the active squad experience.

## Rules

- The squad has a persisted boolean `active` field. Existing records without
  the field are treated as active for backwards compatibility.
- A group manager (or administrator) may deactivate the currently selected
  squad from Group Settings after confirming the action.
- Deactivation is a soft state change: no members, events, invitations,
  periods, match-planning data, or external links are deleted.
- Inactive squads are excluded from all squad pickers, the home-page switcher,
  automatic squad restoration, and new squad-scoped navigation.
- After successful deactivation, the UI clears the selected squad and routes
  to the active squad picker. If no active squads remain, the normal empty
  state is shown and a new squad can be created.
- A failed update leaves the squad active in the UI and displays a translated
  error. The operation is idempotent from the UI perspective.

## API contract

`PUT /api/squads/{squadId}` accepts `{ "active": false }` and returns the complete
updated squad, including `active`. `GET /api/squads` may return inactive
squads; the client filters them from active UI collections.

## Acceptance criteria

1. A manager can open Group Settings, choose Deactivate group, confirm, and be
   returned to the squad picker.
2. The request persists `active: false` and does not issue a delete request.
3. An inactive squad is not rendered in the home switcher or squad picker.
4. Reloading the app does not restore an inactive squad from local storage.
5. Existing squad data remains available to backend history/reporting flows.
6. English and German translations exist for all new user-facing text.
