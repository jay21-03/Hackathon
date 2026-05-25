# Contest Management Phase 2 Plan

## 1. Goal
- Keep the current Phase 2 create flow for event, round, board, board slot, and problem.
- Expand Phase 2 into a read/update cleanup pass for round, board, board slot, and problem.
- Keep public event list/detail open to guests and authenticated users.
- Keep ISO datetime in the API/backend and improve Swagger examples for readability.
- Fix team size as an MVP rule: `minTeamSize = 1`, `maxTeamSize = 5`.
- Do not introduce delete endpoints in Phase 2.
- Do not implement Team Registration, Check-in, Scoring, Ranking, or AI Review in this phase.

## 2. Current Context
- Phase 1 auth/role work is already in place and should be reused.
- Backend runs on port `8085`, PostgreSQL runs on host port `5433`, and Swagger is available at `http://localhost:8085/swagger-ui.html`.
- The contest module already has entity anchors for `Event`, `Round`, `Board`, `BoardSlot`, and `Problem` under `backend/src/main/java/com/seal/hackathon/contest`.
- Current implementation already has create flows for event, round, board, board slot, and problem, plus public event list/detail.
- Current implementation still lacks basic read/update endpoints for round, board, board slot, and problem.
- `SecurityConfig` is the enforcement point for public access, JWT authentication, and role-based authorization.
- Admin contest structure endpoints must stay under `/api/v1/admin/**` and remain `ORGANIZER` only.
- Database and Flyway/schema must not change for this cleanup phase.
- Existing DB columns for `min_team_size` and `max_team_size` stay in place even though the client no longer provides them.
- Existing DB defaults and timestamps should continue to be used as-is.

## 3. Scope

### Must
- Organizer creates and updates events.
- Organizer creates rounds, boards, board slots, and problems.
- Organizer can read rounds, boards, board slots, and problems back by parent or by id.
- Organizer can update rounds, boards, board slots, and problems with basic validation.
- Public users can list events and view event detail.
- Event create no longer requires `minTeamSize` and `maxTeamSize` from the client.
- Backend always persists event team size as `1` to `5` in Phase 2.
- Swagger request examples should use readable ISO datetime values.

### Should
- Keep public event APIs minimal and safe for guests.
- Keep all mutating contest APIs typed and under the existing `/api/v1/admin/**` boundary.
- Use `ApiResponse` as the outer response wrapper.
- Return typed DTOs rather than raw strings.

## 4. Business Rules
- Event quota is controlled by `maxTeams`.
- Team size is fixed for the Phase 2 MVP: `minTeamSize = 1` and `maxTeamSize = 5`.
- `minTeamSize` and `maxTeamSize` are response fields, not client input fields in Phase 2.
- Event name must not be blank.
- `startDate` and `endDate` are required on create, and `startDate <= endDate`.
- `registrationStartAt` and `registrationEndAt` are required on create, and `registrationStartAt <= registrationEndAt`.
- Round type is limited to `GROUP_STAGE` and `FINAL`.
- Round name must not be blank.
- `roundOrder` must be greater than `0`.
- `round.startAt < round.endAt`.
- Board name must not be blank.
- `boardOrder` must be greater than `0`.
- Board slot `teamNumber` must be greater than `0`.
- Board slot update only allows `teamNumber`; `teamId` is not accepted in Phase 2.
- Problem title must not be blank.
- Problem `releaseAt` must be present.
- Parent event, round, and board must exist before child read/create/update operations succeed.

## 5. Proposed API Surface

### Public
- `GET /api/v1/events` - list visible events.
- `GET /api/v1/events/{eventId}` - event detail for public consumption.

### Organizer-only event
- `POST /api/v1/admin/events` - create event.
- `PUT /api/v1/admin/events/{eventId}` - update event.

### Organizer-only round
- `GET /api/v1/admin/events/{eventId}/rounds` - list rounds by event.
- `GET /api/v1/admin/rounds/{roundId}` - round detail.
- `POST /api/v1/admin/events/{eventId}/rounds` - create round.
- `PUT /api/v1/admin/rounds/{roundId}` - update round.

### Organizer-only board
- `GET /api/v1/admin/rounds/{roundId}/boards` - list boards by round.
- `GET /api/v1/admin/boards/{boardId}` - board detail.
- `POST /api/v1/admin/rounds/{roundId}/boards` - create board.
- `PUT /api/v1/admin/boards/{boardId}` - update board.

### Organizer-only board slot
- `GET /api/v1/admin/boards/{boardId}/slots` - list slots by board.
- `GET /api/v1/admin/board-slots/{slotId}` - slot detail.
- `POST /api/v1/admin/boards/{boardId}/slots` - create slot.
- `PUT /api/v1/admin/board-slots/{slotId}` - update slot team number.

### Organizer-only problem
- `GET /api/v1/admin/boards/{boardId}/problems` - list problems by board.
- `GET /api/v1/admin/problems/{problemId}` - problem detail.
- `POST /api/v1/admin/boards/{boardId}/problems` - create problem.
- `PUT /api/v1/admin/problems/{problemId}` - update problem.

### Not included
- No `DELETE` endpoints for event, round, board, board slot, or problem.

## 6. Datetime Format Policy
- API and backend stay on standard ISO datetime handling.
- Do not convert backend datetime fields into custom display strings just to make Swagger prettier.
- Swagger examples should use readable ISO values such as:
	- `2026-06-01T08:00:00`
	- `2026-06-01T17:00:00`
	- `2026-05-25T08:00:00`
	- `2026-05-31T23:59:00`
- Frontend formatting remains a UI concern later, for example `25/05/2026 20:43`.

## 7. Validation Rules
- Event create requires `name`, `startDate`, `endDate`, `registrationStartAt`, `registrationEndAt`, and `maxTeams`.
- Event create rejects any client-supplied `minTeamSize` or `maxTeamSize`; backend sets them to `1` and `5`.
- Event update allows optional fields, but `minTeamSize` and `maxTeamSize` are not updatable in Phase 2.
- If `minTeamSize` or `maxTeamSize` is sent to event update in Phase 2, return `400`.
- Validate event state after merge with persisted data.
- Round update validates name if present, `roundOrder` if present, and merged `startAt < endAt`.
- Duplicate `roundOrder` within the same event returns `409`.
- Board update validates name if present, `boardOrder` if present, and duplicate name/order within the same round returns `409`.
- Board slot update only accepts `teamNumber`.
- Board slot update rejects `teamId` with `400`.
- Board slot duplicate `teamNumber` within the same board returns `409`.
- Problem update validates title if present and merged `releaseAt` is not null.
- Problem update does not accept changing `createdBy` or parent `boardId` in Phase 2.
- Missing parent entities return `404`.
- Invalid create/update payloads return `400`.

## 8. Security And Auth Plan
- Public endpoints stay open.
- Mutating and admin read endpoints require `Authorization: Bearer <jwt>` and role `ORGANIZER`.
- Keep enforcement in the existing security layer rather than adding ad hoc controller checks.
- Public event list and detail do not require a token.
- Swagger must stay usable for public endpoints and should support Bearer authorization for protected ones.

## 9. DTO Plan

### Event DTOs
- `CreateEventRequest`
- `UpdateEventRequest`
- `EventResponse`
- `EventListItemResponse`
- `EventDetailResponse`

### Round / Board / Slot / Problem DTOs
- `CreateRoundRequest`
- `UpdateRoundRequest`
- `CreateBoardRequest`
- `UpdateBoardRequest`
- `CreateBoardSlotRequest`
- `UpdateBoardSlotRequest`
- `CreateProblemRequest`
- `UpdateProblemRequest`
- `RoundResponse`
- `BoardResponse`
- `BoardSlotResponse`
- `ProblemResponse`

### Suggested fields
`CreateEventRequest`:
- `name`
- `description`
- `startDate`
- `endDate`
- `registrationStartAt`
- `registrationEndAt`
- `maxTeams`

`UpdateEventRequest`:
- `name`
- `description`
- `startDate`
- `endDate`
- `registrationStartAt`
- `registrationEndAt`
- `maxTeams`
- no `minTeamSize`
- no `maxTeamSize`

`CreateRoundRequest`:
- `name`
- `roundType`
- `roundOrder`
- `startAt`
- `endAt`

`UpdateRoundRequest`:
- `name`
- `roundType`
- `roundOrder`
- `startAt`
- `endAt`

`CreateBoardRequest`:
- `name`
- `boardOrder`
- `description`

`UpdateBoardRequest`:
- `name`
- `boardOrder`
- `description`

`CreateBoardSlotRequest`:
- `teamNumber`
- no `teamId`

`UpdateBoardSlotRequest`:
- `teamNumber`
- no `teamId`

`CreateProblemRequest`:
- `title`
- `description`
- `attachmentUrl`
- `externalLink`
- `releaseAt`

`UpdateProblemRequest`:
- `title`
- `description`
- `attachmentUrl`
- `externalLink`
- `releaseAt`

## 10. Response Format
- Keep using `ApiResponse` as the outer wrapper.
- Success responses should carry typed DTO payloads.
- Event and problem responses should include `createdBy`, `createdAt`, and `updatedAt` when available.
- Event responses should still expose `minTeamSize` and `maxTeamSize` so the frontend can render the fixed rule.
- Public event list should remain compact.

## 11. Error Handling Plan
- Validation failures return `400` with field-level messages.
- Unauthorized requests return `401`.
- Forbidden Organizer-only requests return `403`.
- Missing parent or entity records return `404`.
- Duplicate structural data returns `409`.
- Stack traces must not be exposed in API responses.

## 12. Swagger Test Plan
- See `contest-management-phase2-swagger-test.md` for concrete request/response coverage.

## 13. Non-Goals
- No delete endpoints.
- No soft delete or archive status.
- No team registration.
- No check-in enforcement.
- No board assignment randomization or manual assignment.
- No scoring.
- No ranking.
- No AI review.
- No contest result publication.
- No schema or Flyway changes.
- No custom backend datetime string formatting for Swagger cosmetics.

## 14. Implementation Order Suggestion
1. Keep event create/update aligned with fixed team size `1` to `5`.
2. Add read/update DTOs for round, board, board slot, and problem.
3. Add read/update routes under `/api/v1/admin/**`.
4. Keep public event list/detail stable.
5. Add Swagger examples using readable ISO datetime values.
6. Add focused tests for validation and authorization boundaries.

## 15. Acceptance Criteria
- Event creation no longer requires `minTeamSize` and `maxTeamSize` from the client.
- Backend always persists event team size as `1` and `5` for Phase 2.
- Organizer can read and update round, board, board slot, and problem resources.
- No delete endpoints are introduced.
- Swagger examples use readable ISO datetime values.
- Public event list and detail remain available without a token.
- Protected contest endpoints reject non-Organizer access.
- `createdBy` remains sourced from the authenticated Organizer where the schema supports it.
- No schema or Flyway change is introduced.