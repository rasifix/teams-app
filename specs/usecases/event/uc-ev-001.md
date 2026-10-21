# UC-EV-001 - Create Activity

## Goal

Allow an authenticated user with a selected squad context to create a new
Match or Tournament Activity from the Activities page.

## Scope

This use case covers:
- opening the create-activity modal from the Activities page,
- entering Activity setup data,
- creating the required default Teams for the Activity,
- persisting the Activity through the squad activities API,
- updating in-memory store state so the Activity appears in the Activities UI.

Availability: only for Squads without a Spond link. For Spond-linked Squads,
Activities are created in Spond and synchronized (UC-EV-012).

This use case does not cover:
- inviting Players,
- changing invitation status,
- assigning players to teams,
- assigning responsible people or shirt sets.

## Primary Actor

Authenticated User with Role admin or trainer

## Supporting Actors

- Frontend UI (Activities page and create-activity modal)
- Zustand store (Activity mutation and sorting)
- Activities API endpoint

## Preconditions

- User is authenticated.
- A squad is selected in app state.
- Activities page is reachable.

## Trigger

The user presses Add in the Future Activities section on the Activities page.

## Input Data

Required modal inputs:
- kind (`match` or `tournament`)
- name (text)
- startsAt (date-time)
- maxPlayersPerTeam (number)
- minPlayersPerTeam (number)

Optional modal inputs:
- endsAt (date-time)
- location (text)
- opponentName (text, Match only)
- Tournament Team schedule overrides: per-Team `startTime` and `location`

Default values when modal opens:
- kind = `match`
- maxPlayersPerTeam = 9
- minPlayersPerTeam = 6
- location = empty

## Main Success Scenario

1. User opens Activities page and presses Add.
2. System opens Create New Activity modal.
3. User enters required values and submits.
4. System trims name, location, and opponentName, then builds an Activity
   payload.
5. System generates exactly one Team for a Match, or one or more Teams for a
   Tournament.
6. Each generated Team is initialized with:
   - a localized/default Team name,
   - strength = 2,
   - selectedPlayers as empty list,
   - for Tournament Teams, optional `startTime` and `location` overrides.
7. System sends POST request to the squad activities endpoint with kind, name,
   startsAt, optional endsAt/location/opponentName, player limits, teams, and
   an empty invitations array.
8. On success, returned Activity is appended to store and the Activity list is
   sorted by startsAt ascending.
9. Modal resets fields and closes.
10. Created Activity is visible in the Activities UI (Future or Past section
    based on startsAt).

## Alternative Flows

### A1 - Required Data Missing

1. User submits with missing required fields.
2. Browser required constraints prevent normal submit.
3. Modal submit handler also short-circuits if kind, name, or startsAt is
   missing.
4. No API request is sent.

### A2 - API Or Network Failure During Create

1. API request fails (for example network issue, 4xx, or 5xx).
2. Store addActivity operation returns false (or throws if no selected squad).
3. Failure is logged to console.
4. Current implementation closes and resets the modal regardless.
5. No new Activity is added to store.

### A3 - Authentication Expired

1. Activities API responds 401.
2. API client clears token and redirects to login.
3. Activity is not created.

## Postconditions

Success:
- Activity is persisted in backend for current squad.
- Activity exists in frontend store and is sorted by startsAt with existing
  Activities.
- Activity has zero invitations initially.
- Activity has exactly one Team when it is a Match and at least one Team when
  it is a Tournament.

Failure:
- No Activity is added to frontend store.
- Existing Activities remain unchanged.
- User-visible inline error feedback in the modal is not currently provided.

## Business Rules Reflected In Current Implementation

- Activity kind, name, and startsAt are mandatory at UI level.
- Teams are created automatically during Activity creation.
- Tournament Teams may have different start times and locations; Match Teams
  use the Activity schedule and location.
- Team default strength is 2.
- minPlayersPerTeam is captured and persisted on create.
- Activities are stored and displayed in chronological order by startsAt.

## Validation Rules Reflected In Current Implementation

- maxPlayersPerTeam input allows range 1..20.
- minPlayersPerTeam input allows range 1..maxPlayersPerTeam.
- Empty location is omitted from payload.
- name and location are trimmed before payload creation.

## API Contract Used

- Endpoint: POST /api/squads/{squadId}/activities
- Request body fields used by UI:
  - kind
  - name
  - startsAt
  - endsAt (optional)
  - opponentName (optional for Match)
  - maxPlayersPerTeam
  - minPlayersPerTeam
  - location (optional)
  - teams (generated according to kind)
  - invitations (empty array on create)
- Success response: created Activity object.

## Acceptance Criteria

1. Given an authenticated user with selected squad, when valid Activity data is
   submitted, then an Activity is created and appears in Activities UI.
2. Given a Match, exactly one default Team is created.
3. Given a Tournament, at least one default Team is created.
4. Given missing required fields, when user attempts submit, then create request
   is not sent.
5. Given create request failure, when submit occurs, then no new Activity is
   persisted and no new Activity appears in list.
6. Given a 401 API response, when submit occurs, then user is redirected to
   login by API client behavior.

## Notes

- This spec intentionally documents current behavior, including the lack of
  inline modal error feedback on create failure.
- Role-based restriction for Activity creation is enforced for admins and
  trainers.
