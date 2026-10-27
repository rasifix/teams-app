# Activity history improvement plan

<span style="display:inline-block;background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 10px;font-weight:600">PLANNED</span> &nbsp; <span style="display:inline-block;background:#fef3c7;color:#92400e;border-radius:999px;padding:2px 10px;font-weight:600">DECISION TO REVIEW</span> &nbsp; <span style="display:inline-block;background:#dcfce7;color:#166534;border-radius:999px;padding:2px 10px;font-weight:600">EXISTS</span>

**Scope:** Activity history and the activity-scoped writes used by this UI. This is a plan; no implementation is included. The companion backend plan is `../teams-api/backend-history-plan.md`.

## Outcome and boundaries

- Show the actual change, including old and new values when useful: “Meeting time changed from 08:30 to 08:45,” “Sam's invitation changed from open to accepted,” and “Sam was removed from Red (sick).” A save with multiple changes remains one history entry with multiple lines.
- Stored domain events retain only the new fact. The backend reconstructs the prior Activity state and returns an enriched history read model. Person names come from current member records; they are **not** claimed to be historical names.
- One command per UI save or intent. A multi-field modal, roster save, attendance save, or shirt assignment is one atomic command, not one HTTP call per keystroke or field.
- Backend command effects are limited to the Activity aggregate: invitations, teams, selection, lineup, and attendance within that Activity. The response is the complete updated Activity. Replacing that Activity in the store causes existing selectors to recompute their views. No member, player, or squad write is part of these commands.
- “Selection sent” is an internal Activity state. The WhatsApp link opens a prefilled message separately; neither action proves delivery. History copy must say “Selection marked as sent,” not “published” or “message sent.”

## Current state

<span style="display:inline-block;background:#dcfce7;color:#166534;border-radius:999px;padding:2px 10px;font-weight:600">EXISTS</span> `src/services/activityEventService.ts` calls the raw `GET /api/squads/{squadId}/activity-events?activityId=...` API. The backend's `specs/openapi-spec.yaml` documents it, but this repository's `specs/api/openapi-spec.yaml` does not. Synchronize these contracts; do not describe the backend endpoint as missing.

<span style="display:inline-block;background:#dcfce7;color:#166534;border-radius:999px;padding:2px 10px;font-weight:600">EXISTS</span> The backend accepts `If-Match: "activity-revision-N"` and `Idempotency-Key` for activity writes and returns Activity ETags. Revision conflicts currently use **409**, not 412. The frontend API client discards response headers, so it cannot use ETags yet. Verify that each write response carries the **new** revision ETag; some controller paths currently appear to set only the pre-write ETag.

<span style="display:inline-block;background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 10px;font-weight:600">PLANNED</span> `src/store/selectors/activityAuditSelectors.ts` currently displays `TeamChanged` and `LineupChanged` generically; `ActivityDetailsChanged` shows field names only. Many UI actions send whole arrays via `/teams`, `/selection`, `/invitations`, or `/attendance`.

## API contract to consume

All routes below are relative to `/api/squads/{squadId}/activities/{activityId}`. Every successful new write returns `200` or `201` with the **complete updated Activity** and `ETag: "activity-revision-N"`. The client sends the ETag from the latest Activity GET/write as `If-Match` and a stable `Idempotency-Key` on retryable commands. A stale revision returns `409` with `expectedRevision` and `actualRevision`; validation failures return `400`; unauthorized actions use the existing authorization pattern. PATCH bodies distinguish omission (leave unchanged) from `null` (clear an optional value). The backend generates authoritative timestamps.

| Status | UI intent | Method and path | Request payload |
| --- | --- | --- | --- |
| <span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 8px">ADD</span> | Edit activity modal | `PATCH /details` | Changed subset of `{ kind?, name?, startsAt?, endsAt?, location?, opponentName?, matchFormatId?, minPlayersPerTeam?, maxPlayersPerTeam? }`; nullable optional fields can be cleared. No teams or invitations. |
| <span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 8px">ADD</span> | Add team | `POST /teams` | `{ "id": "client-uuid", "name": "Team 2", "strength": 2, "startTime": "09:00" }`; server validates defaults and match/tournament rules. |
| <span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 8px">ADD</span> | Edit team modal | `PATCH /teams/{teamId}/details` | Changed subset of `{ name?, strength?, startTime?, location?, meetingTime?, meetingLocation? }`; `null` clears optional overrides. |
| <span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 8px">ADD</span> | Assign responsible person | `PUT /teams/{teamId}/responsible-person` | `{ "responsiblePersonId": "member-7" }` or `null` to clear. |
| <span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 8px">ADD</span> | Assign formation | `PUT /teams/{teamId}/formation` | `{ "formationId": "formation-3" }` or `null` to clear. |
| <span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 8px">ADD</span> | Save shirts dialog | `PUT /teams/{teamId}/shirts` | `{ "shirtSetId": "set-1", "assignments": [{ "playerId": "p1", "shirtNumber": 8 }] }`; one atomic save. |
| <span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 8px">ADD</span> | Save lineup | `PUT /teams/{teamId}/lineup` | `{ "periods": [{ "periodNumber": 1, "assignments": [{ "slotId": "GK", "playerId": "p1" }] }] }`; full lineup for this team only. |
| <span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 8px">ADD</span> | Save player selection | `POST /teams/{teamId}/selection-changes` | `{ "add": ["p2"], "remove": [{ "playerId": "p1", "reason": "sick" }] }`; reason omitted before selection is marked sent, required after. Empty/no-op changes rejected or return unchanged Activity, without a new event. |
| <span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 8px">ADD</span> | Invite players | `POST /invitations` | `{ "players": [{ "playerId": "p1", "response": "open" }] }`; batch corresponds to one invite-dialog save. Backend generates invitation IDs unless a client ID is required for idempotency. |
| <span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 8px">ADD</span> | Remove invitation | `DELETE /invitations/{playerId}` | No body. Any selection/lineup cleanup is part of the same Activity command. |
| <span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 8px">ADD</span> | Save attendance dialog | `PATCH /attendance` | `{ "changes": [{ "personId": "p1", "status": "excused", "reason": "sick" }] }`; only changed rows, applied atomically. A null status removes a record. |
| <span style="background:#dcfce7;color:#166534;border-radius:999px;padding:2px 8px">KEEP</span> | RSVP, status, selection sent | Existing `PUT /invitations/{playerId}`, `PUT /status`, `PUT /selection/sent` | Keep the narrow commands; make their successful responses complete updated Activity + new ETag. |

For `POST /selection-changes`, a removal after “selection sent” stores a backend-generated removal time and the supplied reason in `selectionRemovals`. The client does not send a timestamp. A replacement or bulk selection remains atomic, with uniqueness, capacity, accepted-invitation, and timing validation on the backend.

### Enriched history read API

<span style="display:inline-block;background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 10px;font-weight:600">ADD</span> `GET /api/squads/{squadId}/activities/{activityId}/history` (same admin authorization as the raw audit endpoint). Return the full ordered Activity history. The UI may reveal it in portions; no server pagination is planned for this Activity-scoped view. Keep the existing raw `/activity-events` API for diagnostics and compatibility.

```json
{
  "items": [
    {
      "id": "commit-42",
      "revision": 42,
      "recordedAt": "2026-10-27T10:15:00.000Z",
      "actor": { "type": "user", "memberId": "member-7", "displayName": "Alex Coach" },
      "changes": [
        {
          "type": "invitation.responseChanged",
          "subject": { "type": "player", "id": "p1", "displayName": "Sam Player" },
          "field": "response",
          "previous": "open",
          "current": "declined"
        },
        {
          "type": "selection.playerRemoved",
          "subject": { "type": "player", "id": "p1", "displayName": "Sam Player" },
          "context": { "teamId": "team-3", "teamName": "Red", "reason": "sick" }
        },
        {
          "type": "lineup.changed",
          "subject": { "type": "team", "id": "team-3", "displayName": "Red" },
          "context": { "periods": [1], "assignmentChanges": 1 }
        }
      ]
    }
  ]
}
```

`type` and `field` are stable, language-neutral codes. `previous`/`current` are JSON values (string, number, boolean, object, array, or `null`), included only when meaningful; `null` means an explicit empty value. For created/deleted entities, use a typed change with subject and relevant details rather than inventing a previous value. `context` has a documented per-type schema, not arbitrary display prose. The API returns current person names and may return names from the replayed Activity state for teams. If a person is unresolved, return `displayName: null`; the UI translates a fallback. Actor display names may be retained from existing actor metadata, but that does not establish historical member names. Preserve commit/revision/ordinal ordering and keep all changes from one command in the same item.

## Frontend work sequence

1. <span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 8px">PLANNED</span> Sync this repository's OpenAPI contract with the backend source and add schemas for the new write/read APIs. Introduce typed service methods and a response helper that exposes `ETag` alongside the body. Keep existing methods during migration.
2. <span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 8px">PLANNED</span> Store the latest revision ETag per Activity. Send `If-Match` on edits, preserve an idempotency key across retries, and on `409` reload the Activity and show a translated conflict message. Do not silently replay a stale edit.
3. <span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 8px">PLANNED</span> Replace one Activity in the store from every successful write response. This is sufficient for effects confined to that Activity; selectors recompute derived views. Do not add client-side copies of backend side-effect rules.
4. <span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 8px">PLANNED</span> Migrate each UI save to its intent-specific service call. Compute changed fields/rows in selectors or dedicated selector utilities, with happy-path, edge-case, and fallback tests. Keep modal saves atomic.
5. <span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 8px">PLANNED</span> Consume enriched history in `ActivityHistoryPage`. Move history-row composition and display-value formatting into tested selectors. Add translation keys to both English and German. Format dates/times in the UI locale. Show field-specific values and reasons; provide a translated fallback for unknown change types and unresolved people.
6. <span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 8px">PLANNED</span> Test representative single-field edits, multi-field saves, invitation decline with selection/lineup cleanup, post-send removal reasons, roster/lineup/attendance changes, no-ops, stale revision recovery, and old history data. Verify compile errors with `get_errors` after code changes, run selector tests, and run `npm run check:styles` if styling changes.

## Decisions to review before implementing side effects

<span style="display:inline-block;background:#fef3c7;color:#92400e;border-radius:999px;padding:2px 10px;font-weight:600">DECISION TO REVIEW</span> Declining an invitation already triggers backend `removeUnacceptedPlayersFromTeams` and returns an updated Activity, while the UI also issues a follow-up selection write. The target is one atomic backend command and one complete Activity response, with the redundant UI write removed. Confirm exactly which team/lineup/attendance cleanup rules belong to this command and that each produces history changes in the same commit. The initial boundary is the Activity aggregate only; any future cross-entity effect needs its own explicit response/invalidation contract.

<span style="display:inline-block;background:#fef3c7;color:#92400e;border-radius:999px;padding:2px 10px;font-weight:600">DECISION TO REVIEW</span> Decide how much lineup detail is useful in history: changed periods and assignment count as the minimum; individual player/slot moves only if the UI needs that level of audit detail. The read model can calculate both from replay without storing before values.
