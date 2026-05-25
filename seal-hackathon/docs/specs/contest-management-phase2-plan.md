# Contest Management Phase 2 Plan

## 1. Goal
- Let an Organizer create and update contest events.
- Let an Organizer create rounds, boards, board slots, and problems.
- Let guests and authenticated users view the public event list.
- Establish the structural foundation for Team Registration and Board Assignment in later phases.
- Do not implement Team Registration, Check-in, Scoring, Ranking, or AI Review in this phase.

## 2. Current Context
- Phase 1 auth/role work is already in place and should be reused, not rethought.
- Backend runs on port `8085`, PostgreSQL runs on host port `5433`, and Swagger is available at `http://localhost:8085/swagger-ui.html`.
- The contest module already has entity anchors for `Event`, `Round`, `Board`, and `Problem` under `backend/src/main/java/com/seal/hackathon/contest`.
- `Event` already carries the key business fields needed for this phase: `maxTeams`, `minTeamSize`, `maxTeamSize`, registration dates, status, and audit fields.
- `Round` already models `roundType`, `roundOrder`, time window, and status.
- `Board` already models `roundId`, `boardOrder`, description, and status.
- `Problem` already models `boardId` and `releaseAt`, which is the only release control required in this phase.
- `GET /api/events` currently exists as a skeleton public route and returns a placeholder `ApiResponse`.
- Phase 2 should align new admin endpoints with the existing `/api/v1/admin/**` security convention from Phase 1, not introduce a separate organizer prefix.
- `SecurityConfig` is the enforcement point for public access, JWT authentication, and role-based authorization.
- Contest APIs that mutate structure must be Organizer-only and must rely on Bearer JWT with role `ORGANIZER`.
- Database contract for Phase 2 already exists for `events`, `rounds`, `boards`, `board_slots`, and `problems`, so this phase should fit the current schema instead of reshaping it.
- Current schema rules to preserve in the spec: `events.max_teams > 0`, `events.min_team_size >= 1`, `events.max_team_size <= 5`, `events.min_team_size <= events.max_team_size`, `rounds(event_id, round_order)` unique, `boards(round_id, name)` unique, `boards(round_id, board_order)` unique, `board_slots(board_id, team_number)` unique, and `board_slots(round_id, team_id)` unique.
- Current schema defaults to preserve in the spec: `events.status = DRAFT`, `rounds.status = DRAFT`, `boards.status = DRAFT`, `events.created_at/updated_at` and `rounds.created_at/updated_at` and `boards.created_at/updated_at` and `problems.created_at/updated_at` are DB-managed timestamps.
- Because the current DB default for `rounds.status` is `DRAFT`, the Java `RoundStatus` enum must include `DRAFT` to avoid enum-mapping failures when Hibernate reads existing rows.
- Phase 2 must not change Flyway/schema just to replace the current `DRAFT` default with `UPCOMING`.

## 3. Scope

### Must
- `BE-201` Organizer creates event.
- `BE-202` Organizer updates event.
- `BE-203` Validate `max_teams > 0`.
- `BE-204` Validate `min_team_size >= 1`, `max_team_size <= 5`, and `min_team_size <= max_team_size`.
- `BE-205` Create round with type `GROUP_STAGE` or `FINAL` only.
- `BE-206` Create board under a round.
- `BE-207` Create board slot.
- `BE-208` Create problem under a board with `release_at`.
- `BE-209` Public API to view event list.

### Should
- Keep the public event list minimal and safe for guests.
- Add public event detail so later Team Registration can resolve contest context without auth.
- Keep `PUT /api/v1/admin/rounds/{roundId}`, `PUT /api/v1/admin/boards/{boardId}`, and `PUT /api/v1/admin/problems/{problemId}` out of Phase 2 scope unless the team explicitly expands scope later.
- Use the existing `ApiResponse` convention for success and error payloads.
- Return typed DTOs rather than raw strings for all contest endpoints.

## 4. Business Rules
- Event quota is controlled by `events.max_teams`.
- Team size is configured per event using `min_team_size` and `max_team_size`.
- `min_team_size` must be at least `1`.
- `max_team_size` must be at most `5`.
- `min_team_size` must not be greater than `max_team_size`.
- Event name must not be blank.
- `startDate` and `endDate` are required on create and `startDate` must be less than or equal to `endDate`.
- `registrationStartAt` and `registrationEndAt` are required on create if registration is part of the event creation flow, and `registrationStartAt` must be less than or equal to `registrationEndAt`.
- Round type must be limited to `GROUP_STAGE` and `FINAL`.
- Round name must not be blank.
- `roundOrder` must be greater than `0`.
- `round.startAt` and `round.endAt` should be required for the creation flow and `round.startAt` must be strictly before `round.endAt`.
- Problem visibility is controlled only by `problems.release_at`.
- Do not introduce `require_full_team_checkin` in this phase.
- Check-in must not block viewing a problem.
- Board and slot are structural entities only in Phase 2; random/manual assignment stays out of scope.
- Board name must not be blank.
- `boardOrder` must be greater than `0`.
- Board slot `teamNumber` maps to DB column `team_number` and must be greater than `0`.
- Team assignment is not part of Phase 2; `teamId` must remain null for board slot records.
- Problem title must not be blank.
- Problem `releaseAt` must be present for creation.
- Parent event, round, and board references must exist before child creation is accepted.
- Problem access runtime rules are out of scope in Phase 2; only create/manage metadata now.

## 5. Proposed API Surface

### Public
- `GET /api/v1/events` - list visible events.
- `GET /api/v1/events/{eventId}` - event detail for public consumption.

### Organizer-only
- `POST /api/v1/admin/events` - create event.
- `PUT /api/v1/admin/events/{eventId}` - update event.
- `POST /api/v1/admin/events/{eventId}/rounds` - create round.
- `POST /api/v1/admin/rounds/{roundId}/boards` - create board.
- `POST /api/v1/admin/boards/{boardId}/slots` - create board slot.
- `POST /api/v1/admin/boards/{boardId}/problems` - create problem.

> Exact path naming can be aligned to existing controller style during implementation, but the authorization boundary must stay the same. The `PUT` routes for round, board, and problem are intentionally left to a later phase unless the scope is expanded.

## 6. Data Model Notes
- Reuse the existing contest entities if their current mappings are already valid.
- Do not widen schema scope unless a concrete gap blocks the phase.
- Preserve `Event`, `Round`, `Board`, and `Problem` as the core aggregate chain.
- Preserve `board_slots` as the structural link between a round, a board, and the future team assignment flow.
- Keep `releaseAt` on `Problem` as the only release gate.
- Keep `roundType` and status values as enums, not free-text fields.
- Keep board slots as lightweight structural rows, not assignment logic.

## 7. Default Status Rules
- New event default status is `DRAFT`.
- New round default status is `DRAFT`.
- New board default status is `DRAFT`.
- `RoundStatus.DRAFT` represents a newly created round that is still being configured.
- A round may later move from `DRAFT` to `UPCOMING` once configuration is complete.
- `createdBy` comes from the current authenticated Organizer for `Event` and `Problem` only, because only those tables carry `created_by` in the current schema.
- Do not introduce `created_by` into `rounds`, `boards`, or `board_slots` in Phase 2.
- `createdAt` and `updatedAt` are DB-managed timestamps in the current schema; the service may set them only if ORM behavior requires it, but no schema change should be introduced.

## 7.1 Round Status Compatibility Note
- Because the current database schema defaults `rounds.status` to `DRAFT`, the Java `RoundStatus` enum must contain `DRAFT`.
- Do not change Flyway/schema in Phase 2 just to replace `DRAFT` with `UPCOMING`.
- If `RoundStatus.DRAFT` is missing during implementation, add it to the enum code.
- The intended lifecycle is `DRAFT -> UPCOMING -> PROBLEM_RELEASED -> SCORING -> COMPLETED`.

## 8. Validation Rules
- Event creation must require `name`, `startDate`, `endDate`, `maxTeams`, `minTeamSize`, and `maxTeamSize`.
- Event creation must validate `name` not blank, `maxTeams > 0`, `minTeamSize >= 1`, `maxTeamSize <= 5`, `minTeamSize <= maxTeamSize`, `startDate <= endDate`, and `registrationStartAt <= registrationEndAt`.
- Event update may make fields optional, but any supplied group of related fields must be validated after merge with the persisted event state.
- Round creation must require `name`, `roundType`, `roundOrder`, `startAt`, and `endAt`.
- Round creation must reject blank names, invalid `roundType`, non-positive `roundOrder`, and `startAt >= endAt`.
- Round creation must use `eventId` from the path.
- Duplicate `roundOrder` in the same event must fail with `409`.
- Board creation must require `name` and `boardOrder`.
- Board creation must use `roundId` from the path.
- Duplicate `board_order` or `name` within the same round must fail with `409`.
- Board slot creation must require `teamNumber` only, map it to DB column `team_number`, and reject `teamId` in the request.
- Board slot creation must validate the parent round and board exist.
- Board slot creation must fail with `409` if `team_number` already exists in the same board.
- Problem creation must require `title` and `releaseAt`.
- Problem creation must use `boardId` from the path and `createdBy` from the current Organizer.
- Public event listing and event detail must not require a JWT.
- Organizer-only endpoints must reject missing/invalid JWT with `401` and missing role with `403`.
- Parent event, round, and board must exist before child records are created.

## 9. Security And Auth Plan
- Public endpoints stay open.
- Mutating contest structure endpoints require `Authorization: Bearer <jwt>`.
- JWT must contain the authenticated user identity and role set.
- `ORGANIZER` is the required role for all contest structure mutations.
- Keep security enforcement in the existing `SecurityConfig` / current-user / role-check path rather than adding ad hoc checks inside controllers.
- Admin endpoints use Bearer JWT.
- Public event list and detail do not require a token.
- Do not add manual role checks inside controllers if the Phase 1 security layer already enforces `ORGANIZER` access for `/api/v1/admin/**`.
- Swagger must remain usable for public endpoints and should support Bearer authorization for protected ones.

## 10. DTO Plan

### Event DTOs
- `CreateEventRequest`
- `UpdateEventRequest`
- `EventResponse`
- `EventListItemResponse`
- `EventDetailResponse`

### Round / Board / Slot / Problem DTOs
- `CreateRoundRequest`
- `CreateBoardRequest`
- `CreateBoardSlotRequest`
- `CreateProblemRequest`
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
- `minTeamSize`
- `maxTeamSize`

`UpdateEventRequest`:
- same as create, all updatable fields optional except business-required constraints when present

`CreateRoundRequest`:
- `name`
- `roundType`
- `roundOrder`
- `startAt`
- `endAt`

`CreateBoardRequest`:
- `name`
- `boardOrder`
- `description`

`CreateBoardSlotRequest`:
- `teamNumber` mapped to `team_number`
- no `teamId` in Phase 2

`CreateProblemRequest`:
- `title`
- `description`
- `attachmentUrl`
- `externalLink`
- `releaseAt`
- `createdBy` is not client input; it comes from the authenticated Organizer context.

## 11. Response Format
- Keep using `ApiResponse` as the outer wrapper if the project already standardizes on it.
- Success responses should carry typed DTO payloads.
- Error responses should surface validation details clearly enough for Swagger and frontend consumers.
- Public event list should return a compact response shape, not full internal contest structure.

## 12. Error Handling Plan
- Validation failures should be returned as 400 with field-level messages.
- Unauthorized requests should return 401.
- Forbidden Organizer-only requests should return 403.
- Missing parent entities should return 404.
- Duplicate structural data such as conflicting round order, board order, board name, or board slot `teamNumber` should return 409.
- Stack traces must not be exposed in API responses.

## 13. Swagger Test Plan
- GET `/api/v1/events` without token returns `200`.
- GET `/api/v1/events/{eventId}` without token returns `200` or `404` if not found.
- POST `/api/v1/admin/events` without token returns `401`.
- POST `/api/v1/admin/events` with participant token returns `403`.
- POST `/api/v1/admin/events` with organizer token and valid body returns `200` or `201`.
- Create event missing `startDate` or `endDate` returns `400`.
- Create event with `registrationStartAt > registrationEndAt` returns `400`.
- Create event with `maxTeams <= 0` returns `400`.
- Create event with `maxTeamSize > 5` returns `400`.
- Create round with invalid type returns `400`.
- Create round with duplicate `roundOrder` in the same event returns `409`.
- Create round with valid `GROUP_STAGE` returns `200` or `201`.
- Create board with valid body returns `200` or `201`.
- Create board with duplicate `boardOrder` or duplicate name in the same round returns `409`.
- Create board slot with valid body returns `200` or `201`.
- Create board slot with duplicate `teamNumber` in the same board returns `409`.
- Create board slot request containing `teamId` returns `400`.
- Create problem without `releaseAt` returns `400`.
- Create problem with valid `releaseAt` returns `200` or `201`, and persisted `createdBy` matches the current Organizer id.

## 14. Non-Goals
- Team Registration.
- Check-in enforcement.
- Board assignment randomization.
- Board assignment manual workflow.
- Scoring.
- Ranking.
- AI Review.
- Contest result publication.
- Problem access runtime logic beyond create/manage metadata.

## 15. Implementation Order Suggestion
1. Verify enum compatibility with DB defaults: `EventStatus.DRAFT`, `RoundStatus.DRAFT`, `BoardStatus.DRAFT`.
2. Normalize event public/list and Organizer-only route boundaries.
3. Add event create/update request validation.
4. Add round, board, slot, and problem create flows.
5. Wire role checks into the existing security layer.
6. Add Swagger annotations and DTO examples.
7. Add focused tests for validation and authorization boundaries.

## 16. Acceptance Criteria
- Organizer can create and update events with the required size constraints enforced.
- Organizer can create rounds only as `GROUP_STAGE` or `FINAL`.
- Organizer can create boards, slots, and problems under the correct parent entity.
- Public users can list events without a token.
- Public users can view event detail without a token.
- Protected contest mutation endpoints reject non-Organizer access.
- Problem release is controlled only by `releaseAt`.
- No team registration, scoring, ranking, or AI review behavior is introduced in this phase.
- API paths align to `/api/v1/admin/**` for protected contest mutation endpoints.
- Participant JWT is rejected with `403` on admin endpoints.
- `teamNumber` is used consistently with DB column `team_number`.
- `createdBy` is required only where the current schema supports it: event and problem.
- No schema change is introduced.
- `RoundStatus` supports `DRAFT` to match the DB default.
- New rounds created in Phase 2 use `DRAFT` status unless changed later by a future phase.
- No schema/Flyway change is introduced for round status.
- Update round, board, and problem endpoints remain out-of-scope unless Phase 2 scope is later expanded.
- No Flyway/schema changes are introduced in this phase.