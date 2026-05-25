# Contest Management Phase 2 - Swagger & Docker Test Guide

## 1. Start backend + database with Docker

```bash
cd D:\Bin\SWP391\Hackathon\seal-hackathon
docker compose up -d --build postgres backend
docker compose logs --tail=150 backend
```

Expected:
- Flyway migrations run successfully.
- Hibernate schema validation passes.
- Spring Boot starts on port `8085`.

## 2. Get JWT tokens (Phase 1 auth flow)

1. Login with Google token:
```bash
curl -X POST http://localhost:8085/api/v1/auth/google-login ^
  -H "Content-Type: application/json" ^
  -d "{\"idToken\":\"<google_id_token>\"}"
```
2. Use returned `accessToken` as Participant token (default role includes `PARTICIPANT`).
3. Promote user to Organizer (using an Organizer/admin account from Phase 1):
```bash
curl -X POST http://localhost:8085/api/v1/admin/users/{userId}/roles ^
  -H "Authorization: Bearer <organizer_token>" ^
  -H "Content-Type: application/json" ^
  -d "{\"role\":\"ORGANIZER\"}"
```
4. Login again for that account to get an Organizer JWT that contains `ORGANIZER`.

## 3. Authorize in Swagger

- Open: `http://localhost:8085/swagger-ui.html`
- Click `Authorize`.
- Paste: `Bearer <organizer_jwt>` for admin endpoints.
- Public endpoints under `/api/v1/events` do not require token.

## 4. Public API tests

1. `GET /api/v1/events` without token -> `200`
2. `GET /api/v1/events/{eventId}` without token -> `200` (exists) or `404` (missing)

## 5. Admin API tests

### 5.1 Create Event

`POST /api/v1/admin/events`

Valid body:
```json
{
  "name": "SEAL Hackathon 2026",
  "description": "Phase 2 contest management test",
  "startDate": "2026-06-10",
  "endDate": "2026-06-12",
  "registrationStartAt": "2026-05-30T08:00:00Z",
  "registrationEndAt": "2026-06-08T17:00:00Z",
  "maxTeams": 40,
  "minTeamSize": 2,
  "maxTeamSize": 5
}
```

Expected:
- No token -> `401`
- Participant token -> `403`
- Organizer token + valid body -> `200`
- `maxTeams <= 0` -> `400`
- `maxTeamSize > 5` -> `400`
- `minTeamSize > maxTeamSize` -> `400`
- `registrationStartAt > registrationEndAt` -> `400`

### 5.2 Update Event

`PUT /api/v1/admin/events/{eventId}`

Partial update example:
```json
{
  "description": "Updated event description",
  "maxTeams": 60
}
```

Expected:
- Missing event -> `404`
- Invalid merged constraints -> `400`
- Valid update -> `200`

### 5.3 Create Round

`POST /api/v1/admin/events/{eventId}/rounds`

Valid body:
```json
{
  "name": "Group Stage Round 1",
  "roundType": "GROUP_STAGE",
  "roundOrder": 1,
  "startAt": "2026-06-10T09:00:00Z",
  "endAt": "2026-06-10T12:00:00Z"
}
```

Expected:
- Invalid `roundType` -> `400`
- Duplicate `roundOrder` in same event -> `409`
- Valid request -> `200`

### 5.4 Create Board

`POST /api/v1/admin/rounds/{roundId}/boards`

Valid body:
```json
{
  "name": "Board A",
  "boardOrder": 1,
  "description": "Main board for group stage"
}
```

Expected:
- Duplicate `boardOrder` in same round -> `409`
- Duplicate `name` in same round -> `409`
- Valid request -> `200`

### 5.5 Create Board Slot

`POST /api/v1/admin/boards/{boardId}/slots`

Valid body:
```json
{
  "teamNumber": 1
}
```

Invalid body (teamId not allowed in Phase 2):
```json
{
  "teamNumber": 2,
  "teamId": 99
}
```

Expected:
- Duplicate `teamNumber` in same board -> `409`
- Request contains `teamId` -> `400`
- Valid request -> `200`

### 5.6 Create Problem

`POST /api/v1/admin/boards/{boardId}/problems`

Valid body:
```json
{
  "title": "Build API for Team Registration",
  "description": "Implement registration flow",
  "attachmentUrl": "https://example.com/spec.pdf",
  "externalLink": "https://github.com/org/repo",
  "releaseAt": "2026-06-10T10:00:00Z"
}
```

Expected:
- Missing `releaseAt` -> `400`
- Valid request -> `200`

## 6. SQL checks

Open PostgreSQL shell:
```bash
docker compose exec postgres psql -U postgres -d seal_hackathon
```

Check event/round/board defaults:
```sql
SELECT id, name, status, created_by FROM events ORDER BY id DESC LIMIT 5;
SELECT id, event_id, round_order, status FROM rounds ORDER BY id DESC LIMIT 5;
SELECT id, round_id, board_order, status FROM boards ORDER BY id DESC LIMIT 5;
```

Check board slot and problem creation:
```sql
SELECT id, board_id, round_id, team_number, team_id FROM board_slots ORDER BY id DESC LIMIT 10;
SELECT id, board_id, title, release_at, created_by FROM problems ORDER BY id DESC LIMIT 10;
```

Expected:
- `events.status = DRAFT` for newly created events.
- `rounds.status = DRAFT` for newly created rounds.
- `boards.status = DRAFT` for newly created boards.
- `board_slots.team_id IS NULL` for Phase 2 create flow.
- `problems.created_by` equals organizer user id from JWT subject.

## 7. Pass criteria before commit

- Compile command succeeds:
```bash
cd D:\Bin\SWP391\Hackathon\seal-hackathon\backend
mvn -DskipTests compile
```
- Docker backend starts without Flyway/Hibernate errors.
- Public endpoints work without token.
- Admin endpoints enforce `401/403` correctly.
- Structural conflict checks return `409`.
- Required validation checks return `400`.
