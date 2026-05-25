# Contest Management Phase 2 Swagger Test Guide

## 1. Start services
```bash
cd D:\Bin\SWP391\Hackathon\seal-hackathon
docker compose up -d --build postgres backend
docker compose logs --tail=150 backend
```

Expected:
- Flyway schema is up to date.
- Hibernate validation passes.
- Tomcat starts on port `8085`.

## 2. Datetime examples for Swagger
Use these values in request samples:
- `registrationStartAt`: `2026-05-25T08:00:00`
- `registrationEndAt`: `2026-05-31T23:59:00`
- `startDate`: `2026-06-01`
- `endDate`: `2026-06-02`
- `startAt`: `2026-06-01T08:00:00`
- `endAt`: `2026-06-01T17:00:00`
- `releaseAt`: `2026-06-01T08:00:00`

## 3. Event tests
- `GET /api/v1/events` without token returns `200`.
- `GET /api/v1/events/{eventId}` without token returns `200` (existing) or `404` (missing).
- `POST /api/v1/admin/events` without token returns `401`.
- `POST /api/v1/admin/events` with non-Organizer token returns `403`.
- `POST /api/v1/admin/events` without `minTeamSize/maxTeamSize` returns `200` or `201`.
- Event response must show `minTeamSize = 1`, `maxTeamSize = 5`.
- `POST /api/v1/admin/events` with `minTeamSize` or `maxTeamSize` returns `400`.
- `PUT /api/v1/admin/events/{eventId}` with `minTeamSize` or `maxTeamSize` returns `400`.
- `PUT /api/v1/admin/events/{eventId}` valid optional update returns `200`.

## 4. Round tests
- `GET /api/v1/admin/events/{eventId}/rounds` returns `200`.
- `GET /api/v1/admin/rounds/{roundId}` returns `200`.
- `POST /api/v1/admin/events/{eventId}/rounds` valid returns `200` or `201`.
- `POST /api/v1/admin/events/{eventId}/rounds` duplicate `roundOrder` returns `409`.
- `PUT /api/v1/admin/rounds/{roundId}` valid returns `200`.
- `PUT /api/v1/admin/rounds/{roundId}` duplicate `roundOrder` in same event returns `409`.

## 5. Board tests
- `GET /api/v1/admin/rounds/{roundId}/boards` returns `200`.
- `GET /api/v1/admin/boards/{boardId}` returns `200`.
- `POST /api/v1/admin/rounds/{roundId}/boards` valid returns `200` or `201`.
- `POST` or `PUT` board with duplicate `name` or `boardOrder` in same round returns `409`.
- `PUT /api/v1/admin/boards/{boardId}` valid returns `200`.

## 6. Board slot tests
- `GET /api/v1/admin/boards/{boardId}/slots` returns `200`.
- `GET /api/v1/admin/board-slots/{slotId}` returns `200`.
- `POST /api/v1/admin/boards/{boardId}/slots` valid (`teamNumber` only) returns `200` or `201`.
- `POST /api/v1/admin/boards/{boardId}/slots` with `teamId` returns `400`.
- `PUT /api/v1/admin/board-slots/{slotId}` valid `teamNumber` returns `200`.
- `PUT /api/v1/admin/board-slots/{slotId}` duplicate `teamNumber` in same board returns `409`.
- `PUT /api/v1/admin/board-slots/{slotId}` with `teamId` returns `400`.

## 7. Problem tests
- `GET /api/v1/admin/boards/{boardId}/problems` returns `200`.
- `GET /api/v1/admin/problems/{problemId}` returns `200`.
- `POST /api/v1/admin/boards/{boardId}/problems` valid returns `200` or `201`.
- `POST /api/v1/admin/boards/{boardId}/problems` missing `releaseAt` returns `400`.
- `PUT /api/v1/admin/problems/{problemId}` valid returns `200`.
- `PUT /api/v1/admin/problems/{problemId}` with `boardId` or `createdBy` returns `400`.

## 8. No delete endpoint check
Verify no endpoint below exists in Swagger:
- `DELETE /api/v1/admin/events/{eventId}`
- `DELETE /api/v1/admin/rounds/{roundId}`
- `DELETE /api/v1/admin/boards/{boardId}`
- `DELETE /api/v1/admin/board-slots/{slotId}`
- `DELETE /api/v1/admin/problems/{problemId}`

## 9. Compile check
```bash
cd D:\Bin\SWP391\Hackathon\seal-hackathon\backend
mvn -DskipTests compile
```
