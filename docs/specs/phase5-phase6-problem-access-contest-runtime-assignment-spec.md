# SEAL Hackathon Backend Specification
## Phase 5 — Problem Access & Contest Runtime
## Phase 6 — Mentor / Judge Assignment

**Audience:** Backend architects, API implementers, reviewers, QA, and test automation engineers.  
**Scope:** Backend-only software specification and implementation plan.  
**Constraint:** Do not write source code in this document.

---

## 0. Document Purpose

This document defines the backend specification for:

- **Phase 5 — Problem Access & Contest Runtime**
  - BE-501 Participant can access problem when `current_time >= release_at`
  - BE-502 Return `ProblemNotReleasedException` when `current_time < release_at`
  - BE-504 Round countdown API based on `round.start_at` and `round.end_at`

- **Phase 6 — Mentor / Judge Assignment**
  - BE-601 Organizer assigns mentor to board
  - BE-602 Organizer assigns judge to board
  - BE-603 Validate assigned mentor has role `MENTOR`
  - BE-604 Validate assigned judge has role `JUDGE`
  - BE-605 Mentor views assigned boards
  - BE-606 Judge views assigned boards
  - BE-607 Prevent duplicate mentor/judge assignment in same board

The design follows the current repository conventions:

- Spring Boot backend
- PostgreSQL persistence
- Repository + service layering
- `ApiResponse<T>` response envelope
- Existing package roots:
  - `com.seal.hackathon.contest`
  - `com.seal.hackathon.assignment`
  - `com.seal.hackathon.authprofile`
  - `com.seal.hackathon.common`

This document also defines the required API catalog, DTOs, service behavior, repository contracts, exception model, security model, test plan, sequence diagrams, and sprint breakdown.

---

## 1. Executive Summary

The system already supports contests, rounds, boards, and problems. Phase 5 extends the contest runtime behavior so that participants can read a problem only after the configured release time, while organizers retain unrestricted access. It also adds a round countdown API driven by round start and end times.

Phase 6 formalizes mentor and judge assignment to boards. Organizers assign people to boards, the backend validates that the user has the required role, prevents duplicate assignments for the same board, and exposes assignment-view endpoints so mentors and judges can see only the boards assigned to them.

The key architectural principles are:

- Access control must be enforced at the service layer, not just by controller routing.
- Problem release must be time-based and deterministic.
- Board assignment must be idempotent per board-user-role pair.
- Mentor and judge read access must be scoped to assigned boards only.
- API contracts must be explicit about authorization and error semantics.

---

## 2. Feature Overview by Requirement

## 2.1 BE-501 Participant can access problem when `current_time >= release_at`

### Business Purpose
Ensure teams can only see the problem once the scheduled release time is reached.

### User Story
As a participant assigned to a board, I want to open the problem only when it is officially released, so that the contest remains fair.

### Acceptance Criteria
- Participant can retrieve a problem only if the problem belongs to their assigned board.
- If the current time is on or after `release_at`, the problem is returned.
- If the current time is before `release_at`, access is denied with a time-based exception.
- Organizers can bypass the release restriction.

---

## 2.2 BE-502 Return `ProblemNotReleasedException` when `current_time < release_at`

### Business Purpose
Provide a clear and deterministic error for premature problem access.

### User Story
As the system, I want to reject early access attempts with a specific exception so clients can show a precise message.

### Acceptance Criteria
- Access before release time returns a domain-specific error.
- The error payload includes a stable `error_code`.
- The HTTP status is appropriate for forbidden-by-business-rule access.

---

## 2.3 BE-504 Round countdown API based on `round.start_at` and `round.end_at`

### Business Purpose
Let contestants and organizers see the contest runtime state and remaining time.

### User Story
As a participant or organizer, I want to see whether a round is not started, running, or ended, and how much time remains.

### Acceptance Criteria
- API returns `NOT_STARTED`, `RUNNING`, or `ENDED`.
- Countdown is computed from `round.start_at` and `round.end_at`.
- Remaining seconds must never be negative.
- Time calculations use a consistent server time source.

---

## 2.4 BE-601 Organizer assigns mentor to board

### Business Purpose
Allow organizers to distribute mentoring responsibility by board.

### User Story
As an organizer, I want to assign a mentor to a board so mentors can monitor the teams in that board.

### Acceptance Criteria
- Only an organizer can create mentor assignments.
- The target user must have role `MENTOR`.
- The mentor may be assigned to multiple boards.
- Duplicate assignment of the same mentor to the same board is rejected.

---

## 2.5 BE-602 Organizer assigns judge to board

### Business Purpose
Allow organizers to distribute judging responsibility by board.

### User Story
As an organizer, I want to assign a judge to a board so the judge can evaluate the teams in that board.

### Acceptance Criteria
- Only an organizer can create judge assignments.
- The target user must have role `JUDGE`.
- The judge may be assigned to multiple boards.
- Duplicate assignment of the same judge to the same board is rejected.

---

## 2.6 BE-603 Validate assigned mentor has role `MENTOR`

### Business Purpose
Avoid invalid mentor assignment data.

### User Story
As the system, I want to block non-mentors from being assigned as mentors.

### Acceptance Criteria
- Assignment fails if the target user does not have role `MENTOR`.
- The error is explicit and maps to a role validation exception.

---

## 2.7 BE-604 Validate assigned judge has role `JUDGE`

### Business Purpose
Avoid invalid judge assignment data.

### User Story
As the system, I want to block non-judges from being assigned as judges.

### Acceptance Criteria
- Assignment fails if the target user does not have role `JUDGE`.
- The error is explicit and maps to a role validation exception.

---

## 2.8 BE-605 Mentor views assigned boards

### Business Purpose
Provide mentors with a scoped view of the boards they are responsible for.

### User Story
As a mentor, I want to see only my assigned boards so I can focus on the relevant teams.

### Acceptance Criteria
- Mentor can list only boards assigned to their user ID.
- Mentor cannot query another mentor’s assignments.
- Returned data includes board and round context.

---

## 2.9 BE-606 Judge views assigned boards

### Business Purpose
Provide judges with a scoped view of the boards they are responsible for.

### User Story
As a judge, I want to see only my assigned boards so I can prepare to score the correct teams.

### Acceptance Criteria
- Judge can list only boards assigned to their user ID.
- Judge cannot query another judge’s assignments.
- Returned data includes board and round context.

---

## 2.10 BE-607 Prevent duplicate mentor/judge assignment in same board

### Business Purpose
Keep assignment data consistent and avoid accidental duplicates.

### User Story
As the system, I want to prevent the same mentor or judge from being added to the same board twice.

### Acceptance Criteria
- Duplicate mentor-board rows are rejected.
- Duplicate judge-board rows are rejected.
- Duplicate prevention must exist in both service validation and database constraints.

---

## 3. Domain Analysis

## 3.1 Entities Involved

### Contest Runtime
- `Problem`
- `Board`
- `Round`
- `Team`
- `BoardSlot`
- `User`
- `UserRole`

### Assignment
- `MentorAssignment`
- `JudgeAssignment`
- `User`
- `UserRole`
- `Board`
- `Round`

### Supporting Common Infrastructure
- `ApiResponse<T>`
- `BusinessException`
- global exception handler
- current-user security context

---

## 3.2 Relationships

### Problem Access Relationships
- `Board` belongs to one `Round`.
- `Problem` belongs to one `Board`.
- `BoardSlot` maps a `Team` to a `Board`.
- A participant may access a problem only if their team is assigned to the board of that problem.
- An organizer can access any problem regardless of assignment or release time.

### Assignment Relationships
- `MentorAssignment` links one `Board` to one mentor user.
- `JudgeAssignment` links one `Board` to one judge user.
- One mentor can be linked to multiple boards.
- One judge can be linked to multiple boards.
- The same `(board_id, mentor_id)` or `(board_id, judge_id)` pair must be unique.

---

## 3.3 Business Rules

### Problem Access
- BR-001 Participant can access problem only when `now >= release_at`.
- BR-002 If `now < release_at`, throw `ProblemNotReleasedException`.
- BR-003 Participant only accesses problem belonging to their assigned board.
- BR-004 Organizer can access problem anytime.

### Countdown
- BR-005 Countdown comes from `round.start_at` and `round.end_at`.
- BR-006 API must return `NOT_STARTED`, `RUNNING`, `ENDED`.
- BR-007 Remaining seconds cannot be negative.

### Mentor Assignment
- BR-008 Only Organizer can assign mentor.
- BR-009 User must have role `MENTOR`.
- BR-010 Same mentor cannot be assigned twice to same board.
- BR-011 One mentor may belong to multiple boards.

### Judge Assignment
- BR-012 Only Organizer can assign judge.
- BR-013 User must have role `JUDGE`.
- BR-014 Same judge cannot be assigned twice to same board.
- BR-015 One judge may belong to multiple boards.

### View Assignment
- BR-016 Mentor only sees boards assigned to them.
- BR-017 Judge only sees boards assigned to them.

---

## 3.4 Validation Matrix

| Rule | Layer | Validation Point | Expected Result |
|---|---|---|---|
| Problem exists | Service | `ProblemRepository.findById` | 404 `ProblemNotFoundException` |
| Board exists | Service | `BoardRepository.findById` | 404 `BoardNotFoundException` |
| Round exists | Service | `RoundRepository.findById` | 404 `RoundNotFoundException` if needed for countdown |
| Participant board ownership | Service | board/team lookup through `BoardSlotRepository` and team context | 403 `AccessDeniedException` |
| Release time reached | Service | `now >= release_at` | allow access |
| Release time not reached | Service | `now < release_at` | 403/409 `ProblemNotReleasedException` |
| Organizer access override | Service | current user role | allow access |
| Mentor role required | Service | `UserRoleRepository` | `MentorRoleRequiredException` |
| Judge role required | Service | `UserRoleRepository` | `JudgeRoleRequiredException` |
| Duplicate mentor-board pair | Service + DB | existing assignment lookup + unique constraint | `AssignmentAlreadyExistsException` |
| Duplicate judge-board pair | Service + DB | existing assignment lookup + unique constraint | `AssignmentAlreadyExistsException` |
| Mentor board list scope | Service | current user ID | only own assignments |
| Judge board list scope | Service | current user ID | only own assignments |

---

## 3.5 Permission Matrix

| Operation | Organizer | Participant | Mentor | Judge |
|---|---:|---:|---:|---:|
| View problem before release | Yes | No | No | No |
| View problem after release | Yes | Yes if assigned board | No | No |
| View round countdown | Yes | Yes | Yes | Yes |
| Assign mentor | Yes | No | No | No |
| Assign judge | Yes | No | No | No |
| View assigned boards | Yes | No | Yes | Yes |
| Create duplicate assignment | No | No | No | No |

---

## 4. Database Review

## 4.1 Existing Tables Used

- `users`
- `user_roles`
- `rounds`
- `boards`
- `problems`
- `board_slots`
- `mentor_assignments`
- `judge_assignments`

---

## 4.2 Need Schema Change?

### For BE-501 / BE-502 / BE-504
- No schema change is required if the existing columns are already present and typed correctly.
- The current model already contains `problems.release_at`, `rounds.start_at`, and `rounds.end_at`.

### For BE-601 to BE-607
- The assignment tables already exist.
- One small schema hardening step is recommended: add unique constraints for the board-user pair.

---

## 4.3 Need Unique Constraints?

Yes. The application should enforce uniqueness at the database level in addition to service checks.

### Recommended constraints
- `mentor_assignments`: `UNIQUE (board_id, mentor_id)`
- `judge_assignments`: `UNIQUE (board_id, judge_id)`

### Optional supporting constraints
- `mentor_assignments`: `NOT NULL` on `board_id`, `mentor_id`, `created_at`
- `judge_assignments`: `NOT NULL` on `board_id`, `judge_id`, `created_at`

---

## 4.4 Need Indexes?

Yes. Recommended indexes:

- `problems(board_id)` for fast problem lookup by board
- `problems(release_at)` if release-time queries are expected
- `boards(round_id)` for board-to-round navigation
- `rounds(start_at, end_at)` for runtime lookup and reporting
- `mentor_assignments(mentor_id)` for mentor dashboard queries
- `mentor_assignments(board_id)` for board assignment lookup
- `judge_assignments(judge_id)` for judge dashboard queries
- `judge_assignments(board_id)` for board assignment lookup
- `board_slots(board_id, team_id)` for assignment ownership validation

---

## 4.5 Need Migration Scripts?

Yes, if the unique constraints and indexes are not already present in the Flyway schema.

### Suggested Flyway migration examples

```sql
ALTER TABLE mentor_assignments
    ADD CONSTRAINT uq_mentor_assignments_board_mentor
    UNIQUE (board_id, mentor_id);

ALTER TABLE judge_assignments
    ADD CONSTRAINT uq_judge_assignments_board_judge
    UNIQUE (board_id, judge_id);

CREATE INDEX idx_problems_board_id ON problems(board_id);
CREATE INDEX idx_problems_release_at ON problems(release_at);
CREATE INDEX idx_rounds_start_end ON rounds(start_at, end_at);
CREATE INDEX idx_mentor_assignments_mentor_id ON mentor_assignments(mentor_id);
CREATE INDEX idx_mentor_assignments_board_id ON mentor_assignments(board_id);
CREATE INDEX idx_judge_assignments_judge_id ON judge_assignments(judge_id);
CREATE INDEX idx_judge_assignments_board_id ON judge_assignments(board_id);
CREATE INDEX idx_board_slots_board_team ON board_slots(board_id, team_id);
```

If the schema already contains these constraints, no new migration is required. Otherwise, they should be added in the next Flyway versioned migration.

---

## 4.6 SQL Review Notes

### Problem access query examples

```sql
SELECT p.*
FROM problems p
JOIN boards b ON b.id = p.board_id
JOIN board_slots bs ON bs.board_id = b.id
JOIN teams t ON t.id = bs.team_id
WHERE p.id = :problemId
  AND t.id = :teamId;
```

```sql
SELECT p.*
FROM problems p
WHERE p.board_id = :boardId
  AND p.release_at <= :now;
```

### Assignment uniqueness examples

```sql
SELECT 1
FROM mentor_assignments
WHERE board_id = :boardId
  AND mentor_id = :mentorId;
```

```sql
SELECT 1
FROM judge_assignments
WHERE board_id = :boardId
  AND judge_id = :judgeId;
```

### Assignment listing examples

```sql
SELECT ma.*
FROM mentor_assignments ma
WHERE ma.mentor_id = :currentUserId;
```

```sql
SELECT ja.*
FROM judge_assignments ja
WHERE ja.judge_id = :currentUserId;
```

---

## 5. API Specification

## 5.1 API Style Conventions

- Base path for runtime APIs should remain under `/api`.
- Response envelope should use `ApiResponse<T>`.
- Date/time values should use ISO-8601 strings.
- Authorization should rely on the authenticated user context.
- Public and protected routes should be separated by controller or endpoint group.

---

## 5.2 Complete Phase 5 API Catalog

### P5-1 Get problem by id for participant or organizer
- **Method:** `GET`
- **Endpoint:** `/api/v1/problems/{problemId}`
- **Authorization:** `AUTHENTICATED`
- **Purpose:** Return a problem if the user is allowed to access it.

#### Request JSON
No body.

#### Response JSON
```json
{
  "success": true,
  "data": {
    "id": 101,
    "boardId": 12,
    "title": "Build the Runtime Engine",
    "description": "...",
    "attachmentUrl": "https://...",
    "externalLink": null,
    "releaseAt": "2026-06-15T09:00:00Z",
    "createdBy": 5,
    "createdAt": "2026-06-01T10:00:00Z",
    "updatedAt": "2026-06-01T10:00:00Z"
  }
}
```

#### Status Codes
- `200 OK`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict` for business-rule access failure if the project standard uses conflict for timing violations

#### Error Responses
```json
{
  "success": false,
  "error": {
    "error_code": "PROBLEM_NOT_RELEASED",
    "message": "Problem is not released yet",
    "http_status": 403
  }
}
```

#### Swagger-style Example
- `GET /api/v1/problems/101`
- Returns a problem only when authorization and release rules pass.

---

### P5-2 Get problem by board id
- **Method:** `GET`
- **Endpoint:** `/api/v1/boards/{boardId}/problems`
- **Authorization:** `AUTHENTICATED`
- **Purpose:** List all problems for a board.

#### Response JSON
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "boardId": 12,
      "title": "Build the Runtime Engine",
      "description": "...",
      "attachmentUrl": null,
      "externalLink": null,
      "releaseAt": "2026-06-15T09:00:00Z",
      "createdBy": 5,
      "createdAt": "2026-06-01T10:00:00Z",
      "updatedAt": null
    }
  ]
}
```

#### Status Codes
- `200 OK`
- `403 Forbidden`
- `404 Not Found`

---

### P5-3 Round countdown API
- **Method:** `GET`
- **Endpoint:** `/api/v1/rounds/{roundId}/countdown`
- **Authorization:** `AUTHENTICATED`
- **Purpose:** Return runtime state and remaining time.

#### Request JSON
No body.

#### Response JSON
```json
{
  "success": true,
  "data": {
    "roundId": 77,
    "roundName": "Group Stage",
    "startAt": "2026-06-15T08:00:00Z",
    "endAt": "2026-06-15T12:00:00Z",
    "status": "RUNNING",
    "remainingSeconds": 10800
  }
}
```

#### Status Codes
- `200 OK`
- `404 Not Found`

#### Error Responses
```json
{
  "success": false,
  "error": {
    "error_code": "ROUND_NOT_FOUND",
    "message": "Round not found",
    "http_status": 404
  }
}
```

---

## 5.3 Complete Phase 6 API Catalog

### P6-1 Assign mentor to board
- **Method:** `POST`
- **Endpoint:** `/api/v1/boards/{boardId}/mentors`
- **Authorization:** `ROLE_ORGANIZER`
- **Purpose:** Assign a mentor to a board.

#### Request JSON
```json
{
  "mentorId": 41
}
```

#### Response JSON
```json
{
  "success": true,
  "data": {
    "id": 5001,
    "boardId": 12,
    "mentorId": 41,
    "mentorName": "Nguyen Van A",
    "createdAt": "2026-06-01T11:00:00Z"
  }
}
```

#### Status Codes
- `200 OK` or `201 Created`
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict`

#### Error Responses
```json
{
  "success": false,
  "error": {
    "error_code": "MENTOR_ROLE_REQUIRED",
    "message": "Assigned user must have role MENTOR",
    "http_status": 400
  }
}
```

---

### P6-2 Assign judge to board
- **Method:** `POST`
- **Endpoint:** `/api/v1/boards/{boardId}/judges`
- **Authorization:** `ROLE_ORGANIZER`
- **Purpose:** Assign a judge to a board.

#### Request JSON
```json
{
  "judgeId": 52
}
```

#### Response JSON
```json
{
  "success": true,
  "data": {
    "id": 6001,
    "boardId": 12,
    "judgeId": 52,
    "judgeName": "Tran Thi B",
    "createdAt": "2026-06-01T11:05:00Z"
  }
}
```

#### Status Codes
- `200 OK` or `201 Created`
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict`

---

### P6-3 List boards assigned to mentor
- **Method:** `GET`
- **Endpoint:** `/api/v1/mentors/me/boards`
- **Authorization:** `ROLE_MENTOR`
- **Purpose:** Return boards assigned to the authenticated mentor.

#### Response JSON
```json
{
  "success": true,
  "data": [
    {
      "boardId": 12,
      "boardName": "Board A",
      "roundId": 77,
      "roundName": "Group Stage",
      "assignedAt": "2026-06-01T11:00:00Z"
    }
  ]
}
```

---

### P6-4 List boards assigned to judge
- **Method:** `GET`
- **Endpoint:** `/api/v1/judges/me/boards`
- **Authorization:** `ROLE_JUDGE`
- **Purpose:** Return boards assigned to the authenticated judge.

#### Response JSON
```json
{
  "success": true,
  "data": [
    {
      "boardId": 12,
      "boardName": "Board A",
      "roundId": 77,
      "roundName": "Group Stage",
      "assignedAt": "2026-06-01T11:05:00Z"
    }
  ]
}
```

---

### P6-5 List mentors assigned to a board
- **Method:** `GET`
- **Endpoint:** `/api/v1/boards/{boardId}/mentors`
- **Authorization:** `ROLE_ORGANIZER`, `ROLE_MENTOR` for self-view, `ROLE_JUDGE` optional if needed by policy
- **Purpose:** Show mentor assignments for a board.

#### Notes
- Organizer sees all assignments.
- Mentor sees the board only if assigned to it.

---

### P6-6 List judges assigned to a board
- **Method:** `GET`
- **Endpoint:** `/api/v1/boards/{boardId}/judges`
- **Authorization:** `ROLE_ORGANIZER`, `ROLE_JUDGE` for self-view, `ROLE_MENTOR` optional if needed by policy
- **Purpose:** Show judge assignments for a board.

#### Notes
- Organizer sees all assignments.
- Judge sees the board only if assigned to it.

---

## 5.4 Swagger-Style Endpoint Notes

### Problem access examples
- `GET /api/v1/problems/{problemId}`
- `GET /api/v1/boards/{boardId}/problems`

### Runtime examples
- `GET /api/v1/rounds/{roundId}/countdown`

### Assignment examples
- `POST /api/v1/boards/{boardId}/mentors`
- `POST /api/v1/boards/{boardId}/judges`
- `GET /api/v1/mentors/me/boards`
- `GET /api/v1/judges/me/boards`
- `GET /api/v1/boards/{boardId}/mentors`
- `GET /api/v1/boards/{boardId}/judges`

---

## 6. DTO Design

## 6.1 Problem Access DTOs

### ProblemResponse
**Purpose:** Read model for a problem.

| Field | Type | Description | Validation |
|---|---|---|---|
| id | Long | Problem ID | Required in response |
| boardId | Long | Owning board | Required in response |
| title | String | Problem title | Not blank in persistence |
| description | String | Problem description | Optional |
| attachmentUrl | String | File attachment URL | Optional |

---

## DELTA ADDENDUM (Append after Section 6)

### 1. Additional Business Rules

- BR-019: Mentor and Judge Event Consistency
  - A user assigned as a mentor or judge to a `board` must belong to the same `event` as the `board`.

- BR-020: Problem Ownership Strictness
  - A participant may access a `problem` only if their `team` is assigned via `board_slots` to the `board` owning that `problem`.

- BR-021: Round Time Integrity
  - `round.start_at` and `round.end_at` must be non-null and `start_at < end_at`.

### 2. Additional Validation Matrix Rows

| Rule | Layer | Validation Point | Expected Result |
|---|---|---|---|
| Mentor belongs to same event as board (BR-019) | Service + Repo | Query board -> round -> event and user's event mapping | 400 `AssignmentEventMismatchException` |
| Judge belongs to same event as board (BR-019) | Service + Repo | Query board -> round -> event and user's event mapping | 400 `AssignmentEventMismatchException` |
| Participant accesses problem only for team board (BR-020) | Service | Verify board_slots contains the requesting user's team_id | 403 `AccessDeniedException` |
| Round times presence and ordering (BR-021) | DB + Service | Create/update round request validation | 400 `InvalidRoundTimeException` |

### 3. Additional Security Matrix Rows

| Operation | Organizer | Participant | Mentor | Judge |
|---|---:|---:|---:|---:|
| Assign mentor (same-event) | Yes | No | No | No |
| Assign judge (same-event) | Yes | No | No | No |
| View problem (team-owned board) | Yes | Yes if team assigned | No | No |
| Create/Update round (validate times) | Yes | No | No | No |

### 4. Additional Database Constraints

1. Ensure unique constraints on assignment tables (confirmed):
   - `mentor_assignments (board_id, mentor_id)` unique
   - `judge_assignments (board_id, judge_id)` unique

2. Round time constraints (migration required):

```sql
ALTER TABLE rounds
  ALTER COLUMN start_at SET NOT NULL;

ALTER TABLE rounds
  ALTER COLUMN end_at SET NOT NULL;

ALTER TABLE rounds
  ADD CONSTRAINT chk_rounds_start_before_end CHECK (start_at < end_at);
```

3. Event-consistency enforcement: prefer application-level validation. If DB-level is required, consider adding `event_id` to assignment tables and a FK to `events(id)`.

### 5. Additional API Specifications

Add validation behavior to existing POST assignment APIs and two optional DELETE endpoints.

P6-1 (Assign mentor) - additional error responses
- `400 AssignmentEventMismatch` when mentor not in same event as board
- `409 AssignmentAlreadyExists` or 200 with existing assignment when idempotent

P6-3 Delete mentor assignment (optional)
- **Method:** `DELETE`
- **Endpoint:** `/api/v1/boards/{boardId}/mentors/{mentorId}`
- **Authorization:** `ROLE_ORGANIZER`
- **Responses:**
  - `204 No Content` — deleted or idempotent success
  - `404 Not Found` — board or mentor not found
  - `403 Forbidden` — unauthorized

P6-4 Delete judge assignment (optional)
- **Method:** `DELETE`
- **Endpoint:** `/api/v1/boards/{boardId}/judges/{judgeId}`
- **Authorization:** `ROLE_ORGANIZER`

### 6. Concurrency & Race Condition Analysis

Risk summary:
- Concurrent assignment requests can lead to duplicate inserts or integrity errors.

Mitigation:
1. DB-level unique constraints as last-resort guard.
2. Prefer atomic `INSERT ... ON CONFLICT DO NOTHING` with returning clause in SQL.
3. If using JPA, wrap save in try/catch for `DataIntegrityViolationException` and map to `AssignmentAlreadyExistsException`.
4. Return idempotent success (200) for repeated assignment attempts, or 409 if strict create-only semantics are required.

Exception mapping:

| DB exception | Mapped to | HTTP status | error_code |
|---|---|---:|---|
| `DataIntegrityViolationException` (unique violation) | `AssignmentAlreadyExistsException` | 409 or 200 (policy) | `ASSIGNMENT_ALREADY_EXISTS` |

### 7. Audit Logging Design

Events to emit:
- `MENTOR_ASSIGNED`, `JUDGE_ASSIGNED`, `MENTOR_ASSIGNMENT_REMOVED`, `JUDGE_ASSIGNMENT_REMOVED`, `PROBLEM_VIEWED`.

Event payloads (examples):

MENTOR_ASSIGNED
```json
{
  "event":"MENTOR_ASSIGNED",
  "timestamp":"2026-06-01T10:15:30Z",
  "performed_by":10,
  "board_id":42,
  "mentor_id":77,
  "event_id":5,
  "assignment_id":123
}
```

PROBLEM_VIEWED
```json
{
  "event":"PROBLEM_VIEWED",
  "timestamp":"2026-06-01T10:45:00Z",
  "performed_by":201,
  "team_id":88,
  "board_id":42,
  "problem_id":101,
  "release_at":"2026-06-01T10:00:00Z",
  "was_released":true
}
```

Retention recommendation:
- Store audit events in both application logs and a dedicated `assignment_audit` table for 90 days (hot), archive to cold storage for 2 years.

Optional audit table SQL:

```sql
CREATE TABLE assignment_audit (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_by BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 8. Additional Test Cases

1. Event consistency
   - Assign mentor from different event -> expect 400 `AssignmentEventMismatchException`.
   - Assign judge from same event -> success.

2. Problem ownership
   - Participant from team assigned to board can GET problem after release -> 200.
   - Participant not assigned -> 403.

3. Round time validation
   - Create round with null start_at -> 400 `InvalidRoundTimeException`.
   - Create round with start_at >= end_at -> 400.

4. Concurrency
   - Parallel assign calls: assert no duplicate rows, second call maps DB uniqueness error to `AssignmentAlreadyExistsException`.

5. Audit
   - After assignment, `assignment_audit` has an entry with event_type `MENTOR_ASSIGNED`.

### 9. Specification Amendments

- Add BR-019, BR-020, BR-021 to Business Rules section.
- Update Validation Matrix and Security Matrix with the rows above.
- Update API catalog to include error codes `ASSIGNMENT_EVENT_MISMATCH` and `ASSIGNMENT_ALREADY_EXISTS` and optional DELETE endpoints.
- Add DB migration script for round time constraints and optional `created_by` column on assignment tables.

---


---

## DELTA: Additional Items to Append

The following sections are a delta specification to be appended to the existing Phase 5/6 document. They contain only new business rules, validations, DB constraints, API additions, concurrency analysis, audit logging and test cases.

### 1. Additional Business Rules

- BR-019 (Assignment Event Consistency): Any `mentor` or `judge` assigned to a `board` MUST be associated with the same `event` as the `board`. Assignments that violate this rule are rejected.

- BR-020 (Problem Ownership Enforcement): A participant may access a `problem` only if the participant's `team` is assigned to the `board` that owns the `problem`. Organizer role remains exempted.

- BR-021 (Round Time Integrity): For every `round`, `start_at` and `end_at` MUST be non-null and `start_at < end_at`. Creation or update failing this rule must be rejected.

### 2. Additional Validation Matrix Rows

| Rule | Layer | Validation Point | Expected Result |
|---|---|---|---|
| BR-019: Mentor event consistency | Service + Repo | Compare `boards.round_id -> rounds.event_id` with mentor's `event membership` or user scope | 400 `AssignmentEventMismatchException` (error_code: ASSIGNMENT_EVENT_MISMATCH) |
| BR-019: Judge event consistency | Service + Repo | Compare `boards.round_id -> rounds.event_id` with judge's `event membership` or user scope | 400 `AssignmentEventMismatchException` |
| BR-020: Problem ownership enforcement | Service | Query `board_slots` for current user's `team_id` against `problem.board_id` | 403 `AccessDeniedException` (or PROBLEM_NOT_OWNED) |
| BR-021: Round time integrity | DB + Service | Create/update round: `start_at IS NOT NULL`, `end_at IS NOT NULL`, `start_at < end_at` | 400 `InvalidRoundTimeException` |

### 3. Additional Security Matrix Rows

| Operation | Organizer | Participant | Mentor | Judge |
|---|---:|---:|---:|---:|
| Assign mentor (must be same event) | Yes | No | No | No |
| Assign judge (must be same event) | Yes | No | No | No |
| View problem (team's board only) | Yes | Yes if team assigned | No | No |
| Create/Update round (validate times) | Yes | No | No | No |

Notes: Event membership may be implicit (organizer-created event) or explicit if user-event mapping exists. If user-event membership is not modeled, the service validates assignment by checking that user is part of the same `event` context (e.g., user created by organizer of that event or assigned role within event scope).

### 4. Additional Database Constraints

1. Reinforce unique assignment constraints (if not already present):

```sql
ALTER TABLE mentor_assignments
  ADD CONSTRAINT uq_mentor_assignments_board_mentor UNIQUE (board_id, mentor_id);

ALTER TABLE judge_assignments
  ADD CONSTRAINT uq_judge_assignments_board_judge UNIQUE (board_id, judge_id);
```

2. Round time integrity (enforceable in DB):

```sql
ALTER TABLE rounds
  ALTER COLUMN start_at SET NOT NULL;
ALTER TABLE rounds
  ALTER COLUMN end_at SET NOT NULL;
ALTER TABLE rounds
  ADD CONSTRAINT chk_rounds_start_before_end CHECK (start_at < end_at);
```

3. Event-consistency strategy (recommendation):

- Preferred: application-level validation that ensures `user` and `board` refer to the same `event` by traversing `boards -> rounds -> events` and validating against known user-event relationships.
- Optional (not recommended due to complexity): add `event_id` column to `mentor_assignments` and `judge_assignments` with FK and application-populated value and a trigger to validate equality against the board's event. This increases denormalization and maintenance complexity.

4. Audit fields for assignment tables (recommended):

```sql
ALTER TABLE mentor_assignments
  ADD COLUMN created_by bigint NOT NULL,
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE judge_assignments
  ADD COLUMN created_by bigint NOT NULL,
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
```

Migration notes: When adding `NOT NULL` fields to existing tables, add them with NULLABLE default, backfill from application or admin, then set NOT NULL if required.

### 5. Additional API Specifications

The existing POST assign endpoints must be extended with event-consistency validations and new error codes. Additionally provide optional DELETE endpoints for housekeeping.

5.1 Assign mentor to board — extended behavior
- Endpoint: `POST /api/v1/boards/{boardId}/mentors`
- Validations (service-level, ordered):
  1. `boardId` exists (404 `BoardNotFoundException`).
  2. Caller has `ROLE_ORGANIZER` and (if event-scoped) organizer is authorized for this event.
  3. `mentorId` exists (404 `UserNotFoundException`).
  4. `mentorId` has role `MENTOR` (400 `MentorRoleRequiredException`).
  5. `mentor` belongs to same `event` as `board` (BR-019) (400 `AssignmentEventMismatchException`).
  6. Attempt insert: use `INSERT ... ON CONFLICT DO NOTHING` or save and translate `DataIntegrityViolationException` to `AssignmentAlreadyExistsException` (409 or 200 per idempotency policy).

Error codes (add to catalog):
- `ASSIGNMENT_EVENT_MISMATCH` — 400
- `ASSIGNMENT_ALREADY_EXISTS` — 409 (or 200 with existing resource)

5.2 Assign judge to board — extended behavior
- Endpoint: `POST /api/v1/boards/{boardId}/judges`
- Same validations as mentor assignment but role is `JUDGE`.

5.3 DELETE mentor assignment (optional)
- Endpoint: `DELETE /api/v1/boards/{boardId}/mentors/{mentorId}`
- Authorization: `ROLE_ORGANIZER`
- Behavior: idempotent deletion; recommended response `204 No Content` if the row existed and was removed, `204 No Content` if the row did not exist (preferred for idempotency). If strict, return `404` when board or user not found.

5.4 DELETE judge assignment (optional)
- Endpoint: `DELETE /api/v1/boards/{boardId}/judges/{judgeId}`
- Authorization: `ROLE_ORGANIZER`

### 6. Concurrency & Race Condition Analysis

Risk summary:

- Concurrent requests to assign the same `mentorId` to the same `boardId` may create duplicates or raise integrity errors if not protected.
- Identical risk for judge assignments.

Mitigation strategy (multi-layer):

1. Database Constraints (defensive): Unique constraints on `(board_id, mentor_id)` and `(board_id, judge_id)` ensure single source of truth.

2. Application-level idempotent write pattern (preferred):
   - Use `INSERT ... ON CONFLICT DO NOTHING RETURNING id` (native SQL) when possible to avoid race conditions without separate existence check.
   - If using JPA/Hibernate, perform save in a try/catch translating `DataIntegrityViolationException` to `AssignmentAlreadyExistsException`.

3. Transaction isolation: a short SERIALIZABLE transaction is safe but can cause retries; prefer single-statement upsert.

4. Exception mapping: map `DataIntegrityViolationException` or DB unique constraint violation codes (Postgres `23505`) to domain `AssignmentAlreadyExistsException` with stable `error_code=ASSIGNMENT_ALREADY_EXISTS` and `http_status=409` (or 200 if chosen idempotent behavior).

5. Client contract: Clients should retry on transient DB serialization errors; idempotency is ensured by unique constraint and upsert semantics.

Example pseudo-JDBC upsert (safe):

```sql
INSERT INTO mentor_assignments(board_id, mentor_id, created_by, created_at)
VALUES(:boardId, :mentorId, :currentUserId, now())
ON CONFLICT (board_id, mentor_id) DO UPDATE SET created_at = mentor_assignments.created_at
RETURNING id;
```

If returned `id` existed, return 200 with existing resource; if new, return 201 Created.

### 7. Audit Logging Design

Events to log (minimum):

- `MENTOR_ASSIGNED` — payload includes assignment id, board_id, mentor_id, event_id, performed_by, timestamp.
- `JUDGE_ASSIGNED` — similar structure.
- `MENTOR_ASSIGNMENT_REMOVED` / `JUDGE_ASSIGNMENT_REMOVED` — on deletes.
- `PROBLEM_VIEWED` — when problem is served; payload includes user_id, team_id, board_id, problem_id, release_at, was_released.

Delivery and storage:

1. Emit structured logs to the application log (JSON), and asynchronously publish to an audit sink (Kafka topic `audit.events` or direct DB table `assignment_audit`).
2. Persist critical assignment events to a compact `assignment_audit` table for fast queries and compliance reporting.

Suggested `assignment_audit` table schema:

```sql
CREATE TABLE assignment_audit (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor_id BIGINT NOT NULL,
  target_board_id BIGINT,
  target_user_id BIGINT,
  event_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_assignment_audit_event_type ON assignment_audit(event_type);
CREATE INDEX idx_assignment_audit_actor_id ON assignment_audit(actor_id);
```

Retention policy:

- Keep recent audit rows (90 days) in hot DB; archive older entries to cold storage or object storage.
- Provide a configurable retention and purge job.

Privacy note: Ensure payload does not leak sensitive PII; redact if necessary.

### 8. Additional Test Cases

8.1 Event consistency
- TC-EC-1: Assign mentor where mentor belongs to same event: expect 201 Created.
- TC-EC-2: Assign mentor where mentor belongs to different event: expect 400 `ASSIGNMENT_EVENT_MISMATCH`.
- TC-EC-3: Assign judge where judge belongs to same event: expect 201 Created.
- TC-EC-4: Assign judge where judge belongs to different event: expect 400.

8.2 Problem ownership
- TC-PO-1: Participant with team assigned to board requests problem after release_at: 200 OK.
- TC-PO-2: Participant with team not assigned to board requests problem after release_at: 403 Forbidden.
- TC-PO-3: Organizer requests any problem before release_at: 200 OK.

8.3 Round time validation
- TC-RT-1: Create round with null start_at: 400 InvalidRoundTimeException.
- TC-RT-2: Create round with null end_at: 400.
- TC-RT-3: Create round with start_at >= end_at: 400.

8.4 Concurrency
- TC-CN-1: Two concurrent assign requests for same board/mentor: exactly one assignment created; second request returns existing resource or `ASSIGNMENT_ALREADY_EXISTS`.
- TC-CN-2: Verify no duplicate rows exist by querying DB after concurrent requests.

8.5 Audit
- TC-AU-1: After successful assignment, an audit event with `MENTOR_ASSIGNED` is persisted to `assignment_audit` and logged to the audit sink.
- TC-AU-2: After problem view, `PROBLEM_VIEWED` audit row exists with correct `was_released` flag.

### 9. Specification Amendments

- Append BR-019, BR-020, BR-021 to the Business Rules section.
- Add the validation matrix rows above into Section 3.4.
- Add the security matrix rows above into Section 3.5.
- Add DB migration SQL snippets into Section 4.5 as new numbered migration steps.
- Expand API error catalog with `ASSIGNMENT_EVENT_MISMATCH` and `ASSIGNMENT_ALREADY_EXISTS` and document idempotent POST semantics.
- Insert audit logging design and `assignment_audit` schema into Section 7 or the DB section as appropriate.

---

| externalLink | String | External problem link | Optional |
| releaseAt | OffsetDateTime | Release timestamp | Not null |
| createdBy | Long | Creator user ID | Optional |
| createdAt | OffsetDateTime | Creation time | Optional |
| updatedAt | OffsetDateTime | Update time | Optional |

### RoundCountdownResponse
**Purpose:** Return runtime state and time remaining.

| Field | Type | Description | Validation |
|---|---|---|---|
| roundId | Long | Round ID | Required |
| roundName | String | Round display name | Required |
| startAt | OffsetDateTime | Round start time | Not null |
| endAt | OffsetDateTime | Round end time | Not null |
| status | String | `NOT_STARTED`, `RUNNING`, `ENDED` | Enum-like value |
| remainingSeconds | long | Seconds remaining, never negative | `>= 0` |

### ProblemAccessDto, if a separate wrapper is introduced
- Not required if `ProblemResponse` is reused.
- Recommended only if the access decision must be carried separately from the entity data.

---

## 6.2 Assignment DTOs

### AssignMentorRequest
| Field | Type | Description | Validation |
|---|---|---|---|
| mentorId | Long | Target mentor user ID | `@NotNull` |

### AssignJudgeRequest
| Field | Type | Description | Validation |
|---|---|---|---|
| judgeId | Long | Target judge user ID | `@NotNull` |

### BoardAssignmentResponse
| Field | Type | Description |
|---|---|---|
| id | Long | Assignment ID |
| boardId | Long | Board ID |
| mentorId / judgeId | Long | User ID of assignee |
| mentorName / judgeName | String | Display name |
| createdAt | OffsetDateTime | Assignment timestamp |

### BoardSummaryResponse
| Field | Type | Description |
|---|---|---|
| boardId | Long | Board ID |
| boardName | String | Board name |
| roundId | Long | Round ID |
| roundName | String | Round name |
| assignedAt | OffsetDateTime | Time of assignment |

---

## 6.3 Validation Annotations

### AssignMentorRequest
- `@NotNull(message = "mentorId must not be null")`

### AssignJudgeRequest
- `@NotNull(message = "judgeId must not be null")`

### Countdown request DTO
- No request body required
- Path parameter `roundId` must be positive

### Problem lookup DTOs
- `problemId`, `boardId`, `roundId` path values should be constrained using controller validation or service-level validation

---

## 7. Service Design

## 7.1 Service Split

### Contest Runtime Service
Suggested service ownership:
- `ProblemAccessService`
- `RoundCountdownService`

### Assignment Service
Suggested service ownership:
- `AssignmentService`
- `MentorAssignmentService`
- `JudgeAssignmentService`

The current codebase already contains a service boundary under `contest` and `assignment`, so the implementation should preserve that shape.

---

## 7.2 Detailed Service Flow — Problem Access

### Main flow
1. Controller receives `problemId` and authenticated principal.
2. Service loads the problem by ID.
3. Service loads the board and round context if required for ownership validation.
4. Service resolves current user role.
5. If user is organizer, bypass release restriction.
6. If user is participant, verify that the problem’s board is assigned to the participant’s team.
7. Compare `now` with `problem.releaseAt`.
8. If `now < releaseAt`, throw `ProblemNotReleasedException`.
9. Map entity to response DTO.
10. Return response.

### Validation order
1. Authenticate user.
2. Load problem.
3. Load board assignment context.
4. Verify participant ownership.
5. Verify role / access rule.
6. Verify release time.
7. Return DTO.

### Transaction boundary
- Read-only transaction is sufficient for problem access.
- No write operations are needed.

### Pseudo code
```text
function getProblem(problemId, currentUser):
    problem = problemRepository.findById(problemId)
    if problem not found:
        throw ProblemNotFoundException

    if currentUser has role ORGANIZER:
        return map(problem)

    if currentUser is not participant:
        throw AccessDeniedException

    if not isProblemInParticipantAssignedBoard(problemId, currentUser.userId):
        throw AccessDeniedException

    now = clock.now()
    if now < problem.releaseAt:
        throw ProblemNotReleasedException

    return map(problem)
```

---

## 7.3 Detailed Service Flow — Round Countdown

### Main flow
1. Controller receives `roundId`.
2. Service loads round.
3. Determine `now`.
4. Compute state:
   - if `now < startAt` -> `NOT_STARTED`
   - else if `startAt <= now <= endAt` -> `RUNNING`
   - else -> `ENDED`
5. Compute remaining seconds:
   - `NOT_STARTED` -> `startAt - now`
   - `RUNNING` -> `endAt - now`
   - `ENDED` -> `0`
6. Clamp negative values to zero.
7. Return response DTO.

### Validation order
1. Validate round exists.
2. Validate time values are not null.
3. Compute state.
4. Return response.

### Transaction boundary
- Read-only transaction.

### Pseudo code
```text
function getRoundCountdown(roundId):
    round = roundRepository.findById(roundId)
    if round not found:
        throw RoundNotFoundException

    now = clock.now()
    if now < round.startAt:
        status = NOT_STARTED
        remaining = secondsBetween(now, round.startAt)
    else if now <= round.endAt:
        status = RUNNING
        remaining = secondsBetween(now, round.endAt)
    else:
        status = ENDED
        remaining = 0

    remaining = max(remaining, 0)
    return response(status, remaining)
```

---

## 7.4 Detailed Service Flow — Assign Mentor

### Main flow
1. Organizer calls assignment endpoint.
2. Service validates organizer privilege.
3. Service validates `boardId` exists.
4. Service validates `mentorId` exists.
5. Service checks that mentor user has role `MENTOR`.
6. Service checks for existing mentor assignment with the same `(boardId, mentorId)`.
7. Service inserts assignment record.
8. Service returns assignment response.

### Validation order
1. Authorization check.
2. Board existence.
3. User existence.
4. Role validation.
5. Duplicate assignment check.
6. Save.

### Transaction boundary
- Single transactional write.
- Unique constraint violation must be translated into a domain exception.

### Pseudo code
```text
function assignMentor(boardId, mentorId, currentUser):
    assert currentUser has ORGANIZER role
    board = boardRepository.findById(boardId)
    mentor = userRepository.findById(mentorId)

    if not mentor has role MENTOR:
        throw MentorRoleRequiredException

    if mentorAssignmentRepository.existsByBoardIdAndMentorId(boardId, mentorId):
        throw AssignmentAlreadyExistsException

    save mentor assignment
    return response
```

---

## 7.5 Detailed Service Flow — Assign Judge

Same as mentor assignment, with `judgeId` and role `JUDGE`.

### Pseudo code
```text
function assignJudge(boardId, judgeId, currentUser):
    assert currentUser has ORGANIZER role
    board = boardRepository.findById(boardId)
    judge = userRepository.findById(judgeId)

    if not judge has role JUDGE:
        throw JudgeRoleRequiredException

    if judgeAssignmentRepository.existsByBoardIdAndJudgeId(boardId, judgeId):
        throw AssignmentAlreadyExistsException

    save judge assignment
    return response
```

---

## 7.6 Detailed Service Flow — List Assigned Boards

### Mentor flow
1. Authenticate current user.
2. Confirm role includes `MENTOR`.
3. Load mentor assignments by `mentorId = currentUser.id`.
4. Join board and round data.
5. Return board summaries.

### Judge flow
1. Authenticate current user.
2. Confirm role includes `JUDGE`.
3. Load judge assignments by `judgeId = currentUser.id`.
4. Join board and round data.
5. Return board summaries.

### Transaction boundary
- Read-only transaction.

---

## 8. Repository Design

## 8.1 Repository Interfaces

### Contest runtime repositories
- `ProblemRepository`
- `BoardRepository`
- `RoundRepository`
- `BoardSlotRepository`
- `UserRepository`
- `UserRoleRepository`

### Assignment repositories
- `MentorAssignmentRepository`
- `JudgeAssignmentRepository`

---

## 8.2 Custom Queries

### ProblemRepository
Suggested methods:
- `Optional<Problem> findById(Long problemId)`
- `List<Problem> findByBoardId(Long boardId)`
- `Optional<Problem> findTopByBoardIdAndReleaseAtLessThanEqualOrderByReleaseAtDesc(Long boardId, OffsetDateTime now)` if a time-filtered query is needed

### RoundRepository
Suggested methods:
- `Optional<Round> findById(Long roundId)`
- `List<Round> findByEventId(Long eventId)`

### BoardSlotRepository
Suggested methods:
- `List<BoardSlot> findByBoardId(Long boardId)`
- `Optional<BoardSlot> findByBoardIdAndTeamId(Long boardId, Long teamId)`
- `List<BoardSlot> findByTeamId(Long teamId)`

### MentorAssignmentRepository
Suggested methods:
- `List<MentorAssignment> findByBoardId(Long boardId)`
- `List<MentorAssignment> findByMentorId(Long mentorId)`
- `boolean existsByBoardIdAndMentorId(Long boardId, Long mentorId)`

### JudgeAssignmentRepository
Suggested methods:
- `List<JudgeAssignment> findByBoardId(Long boardId)`
- `List<JudgeAssignment> findByJudgeId(Long judgeId)`
- `boolean existsByBoardIdAndJudgeId(Long boardId, Long judgeId)`

---

## 8.3 JPQL Examples

### Mentor assignments by current user
```text
select ma
from MentorAssignment ma
where ma.mentorId = :mentorId
```

### Judge assignments by current user
```text
select ja
from JudgeAssignment ja
where ja.judgeId = :judgeId
```

### Problems by board and release time
```text
select p
from Problem p
where p.boardId = :boardId
  and p.releaseAt <= :now
order by p.releaseAt desc, p.id desc
```

---

## 8.4 SQL Examples

### Check duplicate mentor assignment
```sql
SELECT 1
FROM mentor_assignments
WHERE board_id = :boardId
  AND mentor_id = :mentorId
LIMIT 1;
```

### Check duplicate judge assignment
```sql
SELECT 1
FROM judge_assignments
WHERE board_id = :boardId
  AND judge_id = :judgeId
LIMIT 1;
```

### List assigned boards for mentor
```sql
SELECT b.id, b.name, r.id AS round_id, r.name AS round_name
FROM mentor_assignments ma
JOIN boards b ON b.id = ma.board_id
JOIN rounds r ON r.id = b.round_id
WHERE ma.mentor_id = :currentUserId;
```

### List assigned boards for judge
```sql
SELECT b.id, b.name, r.id AS round_id, r.name AS round_name
FROM judge_assignments ja
JOIN boards b ON b.id = ja.board_id
JOIN rounds r ON r.id = b.round_id
WHERE ja.judge_id = :currentUserId;
```

---

## 9. Exception Design

## 9.1 Custom Exceptions

### ProblemNotReleasedException
- **error_code:** `PROBLEM_NOT_RELEASED`
- **message:** `Problem is not released yet`
- **http_status:** `403 Forbidden`

### ProblemNotFoundException
- **error_code:** `PROBLEM_NOT_FOUND`
- **message:** `Problem not found`
- **http_status:** `404 Not Found`

### BoardNotFoundException
- **error_code:** `BOARD_NOT_FOUND`
- **message:** `Board not found`
- **http_status:** `404 Not Found`

### RoundNotFoundException
- **error_code:** `ROUND_NOT_FOUND`
- **message:** `Round not found`
- **http_status:** `404 Not Found`

### MentorRoleRequiredException
- **error_code:** `MENTOR_ROLE_REQUIRED`
- **message:** `Assigned user must have role MENTOR`
- **http_status:** `400 Bad Request`

### JudgeRoleRequiredException
- **error_code:** `JUDGE_ROLE_REQUIRED`
- **message:** `Assigned user must have role JUDGE`
- **http_status:** `400 Bad Request`

### AssignmentAlreadyExistsException
- **error_code:** `ASSIGNMENT_ALREADY_EXISTS`
- **message:** `Assignment already exists for this board and user`
- **http_status:** `409 Conflict`

### AccessDeniedException
- **error_code:** `ACCESS_DENIED`
- **message:** `Access denied`
- **http_status:** `403 Forbidden`

### BoardOwnershipException, if needed
- **error_code:** `BOARD_OWNERSHIP_REQUIRED`
- **message:** `User is not assigned to this board`
- **http_status:** `403 Forbidden`

---

## 9.2 Error Mapping Matrix

| Exception | HTTP Status | Typical Trigger |
|---|---|---|
| ProblemNotReleasedException | 403 | Participant opens problem too early |
| ProblemNotFoundException | 404 | Invalid problem ID |
| RoundNotFoundException | 404 | Invalid round ID |
| BoardNotFoundException | 404 | Invalid board ID |
| MentorRoleRequiredException | 400 | Non-mentor selected |
| JudgeRoleRequiredException | 400 | Non-journal/judge role mismatch |
| AssignmentAlreadyExistsException | 409 | Duplicate board assignment |
| AccessDeniedException | 403 | Unauthorized access to board/problem |

---

## 10. Security Design

## 10.1 Authentication

- All protected endpoints require an authenticated principal.
- Security should reuse the existing JWT / Google login setup already present in the backend.
- The service layer must inspect the current user identity and role claims.

---

## 10.2 Authorization

### Organizer-only operations
- Assign mentor to board
- Assign judge to board
- Potentially view all board assignments

### Mentor-only operations
- View assigned boards
- View board-specific mentor data if needed

### Judge-only operations
- View assigned boards
- View board-specific judge data if needed

### Participant operations
- View assigned-board problems after release
- View round countdown

---

## 10.3 Ownership Validation

Ownership validation is mandatory for problem access:

1. Load the authenticated user.
2. Resolve their team membership for the contest.
3. Resolve the team’s board assignment.
4. Compare with the problem’s `board_id`.
5. Deny access when the board does not match.

This is a backend service-level rule and should not rely solely on front-end filtering.

---

## 10.4 Board Access Validation

- Mentor and judge board lists must be scoped to the authenticated user ID.
- No query should accept arbitrary mentor/judge IDs from the client for self-view endpoints.
- Organizer may query all assignments if the endpoint is designed for admin operations.

---

## 10.5 Problem Access Validation

- Organizer can bypass release time, but should still see the correct problem for a board.
- Participant access requires both board ownership and release-time validation.
- The release check must use server time, not client time.

---

## 10.6 Security Matrix

| Operation | Auth Required | Role Required | Ownership Check | Time Check |
|---|---|---|---|---|
| View problem | Yes | Organizer or Participant | Yes for participant | Yes for participant |
| View countdown | Yes | Any authenticated user | No | No |
| Assign mentor | Yes | Organizer | No | No |
| Assign judge | Yes | Organizer | No | No |
| View mentor boards | Yes | Mentor | Yes, by current user | No |
| View judge boards | Yes | Judge | Yes, by current user | No |

---

## 11. Test Plan

## 11.1 Happy Path

### BE-501 / BE-502
- Participant opens problem after release time and receives the problem payload.
- Organizer opens the same problem before release time and receives the problem payload.
- Participant assigned to the board sees the released problem.

### BE-504
- Round is not started and countdown returns `NOT_STARTED` with positive remaining seconds.
- Round is running and countdown returns `RUNNING`.
- Round is ended and countdown returns `ENDED` with zero remaining seconds.

### BE-601 / BE-602
- Organizer assigns a valid mentor to a board.
- Organizer assigns a valid judge to a board.
- Assignment response returns correct IDs and timestamps.

### BE-605 / BE-606
- Mentor sees only their assigned boards.
- Judge sees only their assigned boards.

---

## 11.2 Validation Fail Cases

### Problem Access
- Problem ID does not exist.
- Release time is in the future.
- Problem belongs to another board.
- Round or board context is missing.

### Assignment
- Non-organizer attempts to assign mentor/judge.
- Target user has no matching role.
- Request body omits `mentorId` or `judgeId`.
- Board ID does not exist.
- User ID does not exist.

---

## 11.3 Permission Fail Cases

- Participant attempts to access a problem before release.
- Participant attempts to access a problem from an unassigned board.
- Mentor attempts to assign another mentor.
- Judge attempts to assign another judge.
- Mentor queries another mentor’s boards.
- Judge queries another judge’s boards.

---

## 11.4 Boundary Cases

- `now == release_at` must allow access.
- `now == start_at` must return `RUNNING` if the round starts immediately.
- `now == end_at` must return `RUNNING` or `ENDED` according to the chosen inclusive policy; the recommended policy is `now <= end_at` means `RUNNING`.
- Remaining seconds at zero must not become negative.
- A mentor assigned to multiple boards must appear in all assignments.
- A judge assigned to multiple boards must appear in all assignments.

---

## 11.5 Edge Cases

- Timezone mismatch between stored timestamps and application clock.
- Duplicate assignment request retried due to network failure.
- Assignment inserted concurrently from two requests.
- Participant has a valid team assignment but the problem board has no problem row.
- Round exists but `start_at` or `end_at` is null in bad data; service should fail fast.
- A board contains multiple problems with different release times.
- Multiple assignments exist for a board and one of them is duplicate due to legacy data.

---

## 11.6 Detailed Test Matrix

### Problem Access
| Test ID | Scenario | Input | Expected |
|---|---|---|---|
| T-PROB-01 | Participant accesses after release | `now > release_at` | 200 with problem data |
| T-PROB-02 | Participant accesses exactly at release | `now == release_at` | 200 with problem data |
| T-PROB-03 | Participant accesses before release | `now < release_at` | 403 `ProblemNotReleasedException` |
| T-PROB-04 | Organizer accesses before release | organizer role | 200 with problem data |
| T-PROB-05 | Participant accesses wrong board | unassigned board | 403 `AccessDeniedException` |
| T-PROB-06 | Problem not found | invalid ID | 404 |

### Countdown
| Test ID | Scenario | Input | Expected |
|---|---|---|---|
| T-RND-01 | Before start | `now < start_at` | `NOT_STARTED`, positive seconds |
| T-RND-02 | At start | `now == start_at` | `RUNNING` |
| T-RND-03 | During round | `start_at < now < end_at` | `RUNNING` |
| T-RND-04 | At end | `now == end_at` | `RUNNING` or `ENDED` by chosen policy |
| T-RND-05 | After end | `now > end_at` | `ENDED`, `remainingSeconds = 0` |

### Mentor Assignment
| Test ID | Scenario | Input | Expected |
|---|---|---|---|
| T-MNT-01 | Organizer assigns mentor | valid mentorId | 201/200 |
| T-MNT-02 | Non-organizer assigns mentor | participant/mentor/judge | 403 |
| T-MNT-03 | Wrong role user | user lacks MENTOR role | 400 `MentorRoleRequiredException` |
| T-MNT-04 | Duplicate assignment | same mentor-board pair | 409 |
| T-MNT-05 | Multiple board assignment | same mentor different boards | 200 |

### Judge Assignment
| Test ID | Scenario | Input | Expected |
|---|---|---|---|
| T-JDG-01 | Organizer assigns judge | valid judgeId | 201/200 |
| T-JDG-02 | Non-organizer assigns judge | participant/mentor/judge | 403 |
| T-JDG-03 | Wrong role user | user lacks JUDGE role | 400 `JudgeRoleRequiredException` |
| T-JDG-04 | Duplicate assignment | same judge-board pair | 409 |
| T-JDG-05 | Multiple board assignment | same judge different boards | 200 |

### View Assignment
| Test ID | Scenario | Input | Expected |
|---|---|---|---|
| T-VIEW-01 | Mentor sees own boards | current mentor | list of assigned boards |
| T-VIEW-02 | Mentor sees another mentor’s boards | current mentor | only own data |
| T-VIEW-03 | Judge sees own boards | current judge | list of assigned boards |
| T-VIEW-04 | Judge sees another judge’s boards | current judge | only own data |

---

## 12. Sequence Diagrams

## 12.1 Problem Access Sequence

```text
Actor -> Controller -> Service -> Repository -> Database

Participant
  -> ProblemController.getProblem(problemId)
  -> ProblemAccessService.getProblem(problemId, currentUser)
  -> ProblemRepository.findById(problemId)
  -> BoardSlotRepository.findByBoardId(boardId)
  -> TeamRepository / ownership lookup
  -> Database
  <- problem row / board context
  <- access decision
  <- ProblemResponse or ProblemNotReleasedException
```

### Text sequence with decision points
```text
Actor: Participant
Controller: GET /api/v1/problems/{problemId}
Service: load problem
Repository: find problem row
Database: return problem with release_at
Service: compare now with release_at
Service: validate board ownership
Service: return DTO or throw exception
```

---

## 12.2 Round Countdown Sequence

```text
Actor -> Controller -> Service -> Repository -> Database

Participant/Organizer
  -> RoundController.getCountdown(roundId)
  -> RoundCountdownService.getCountdown(roundId)
  -> RoundRepository.findById(roundId)
  -> Database
  <- round row
  <- status and remaining seconds
  <- CountdownResponse
```

---

## 12.3 Assign Mentor Sequence

```text
Actor -> Controller -> Service -> Repository -> Database

Organizer
  -> AssignmentController.assignMentor(boardId, mentorId)
  -> MentorAssignmentService.assignMentor(boardId, mentorId, currentUser)
  -> BoardRepository.findById(boardId)
  -> UserRepository.findById(mentorId)
  -> UserRoleRepository.findByUserId(mentorId)
  -> MentorAssignmentRepository.existsByBoardIdAndMentorId(boardId, mentorId)
  -> MentorAssignmentRepository.save(assignment)
  -> Database
  <- assignment row
  <- AssignmentResponse
```

---

## 12.4 Assign Judge Sequence

```text
Actor -> Controller -> Service -> Repository -> Database

Organizer
  -> AssignmentController.assignJudge(boardId, judgeId)
  -> JudgeAssignmentService.assignJudge(boardId, judgeId, currentUser)
  -> BoardRepository.findById(boardId)
  -> UserRepository.findById(judgeId)
  -> UserRoleRepository.findByUserId(judgeId)
  -> JudgeAssignmentRepository.existsByBoardIdAndJudgeId(boardId, judgeId)
  -> JudgeAssignmentRepository.save(assignment)
  -> Database
  <- assignment row
  <- AssignmentResponse
```

---

## 13. Implementation Plan

## 13.1 Development Order

1. Add or verify database constraints and indexes for assignment uniqueness.
2. Implement exception classes and global error mapping for new business errors.
3. Implement problem access service and controller endpoint.
4. Implement round countdown service and controller endpoint.
5. Implement mentor assignment service and controller endpoints.
6. Implement judge assignment service and controller endpoints.
7. Implement mentor/judge self-view listing endpoints.
8. Add unit tests for validation and service rules.
9. Add integration tests for database uniqueness and authorization boundaries.
10. Document Swagger examples and verify API catalog consistency.

---

## 13.2 Estimated Complexity

| Item | Complexity | Notes |
|---|---|---|
| Problem access control | Medium | Requires ownership plus time validation |
| Round countdown API | Low | Deterministic read-only computation |
| Mentor assignment | Medium | Requires role validation and duplicate protection |
| Judge assignment | Medium | Same pattern as mentor assignment |
| Assigned-board listing | Low | Read-only filtered query |
| Exception and security wiring | Medium | Cross-cutting concern |

---

## 13.3 Dependencies

- Existing authentication and current-user infrastructure
- Existing `User`, `UserRole`, `Board`, `Round`, `Problem`, `BoardSlot` entities
- Existing `ApiResponse` wrapper
- Existing `GlobalExceptionHandler`
- PostgreSQL schema and Flyway migration baseline

---

## 13.4 Story Points

| Feature | Story Points |
|---|---:|
| BE-501 / BE-502 problem access | 5 |
| BE-504 round countdown API | 3 |
| BE-601 / BE-603 mentor assignment | 5 |
| BE-602 / BE-604 judge assignment | 5 |
| BE-605 mentor view assigned boards | 3 |
| BE-606 judge view assigned boards | 3 |
| BE-607 duplicate assignment prevention | 3 |
| Tests, docs, and hardening | 5 |
| **Total** | **32** |

---

## 14. Package Structure

## 14.1 Problem Package

```text
problem/
├── controller
├── service
├── repository
├── dto
└── exception
```

### Suggested classes
- `ProblemController`
- `ProblemAccessService`
- `RoundCountdownController`
- `RoundCountdownService`
- `ProblemResponse`
- `RoundCountdownResponse`
- `ProblemNotFoundException`
- `ProblemNotReleasedException`
- `RoundNotFoundException`

### Current repository alignment
- Problem-related logic may remain under `com.seal.hackathon.contest` if the team prefers to preserve the existing package structure.
- The important requirement is separation of concerns, not a forced rename.

---

## 14.2 Assignment Package

```text
assignment/
├── controller
├── service
├── repository
├── dto
└── exception
```

### Suggested classes
- `AssignmentController`
- `MentorAssignmentService`
- `JudgeAssignmentService`
- `MentorAssignmentRepository`
- `JudgeAssignmentRepository`
- `AssignMentorRequest`
- `AssignJudgeRequest`
- `BoardAssignmentResponse`
- `MentorRoleRequiredException`
- `JudgeRoleRequiredException`
- `AssignmentAlreadyExistsException`
- `BoardNotFoundException`

### Current repository alignment
- The codebase already contains `com.seal.hackathon.assignment.controller`, `service`, `repository`, and `entity` packages.
- The specification intentionally maps to that existing structure.

---

## 15. Definition of Done

The feature is done only when all of the following are true:

- Problem access respects release time and board ownership.
- The correct exception is returned for early access.
- Round countdown API returns accurate runtime state and non-negative remaining seconds.
- Mentor assignment validates organizer role, mentor role, and duplicate assignment.
- Judge assignment validates organizer role, judge role, and duplicate assignment.
- Mentor self-view returns only assigned boards.
- Judge self-view returns only assigned boards.
- Database uniqueness constraints exist or are explicitly accepted as deferred with a documented risk.
- Unit and integration tests cover happy path, validation failure, permission failure, and edge cases.
- API documentation is consistent with controller paths and response envelopes.
- No source code is written in this document.

---

## 16. Risks and Recommendations

- **Timezone risk:** Use a single server-side clock source and store timestamps consistently in UTC.
- **Duplicate assignment race condition:** Enforce uniqueness both in service and database.
- **Ownership ambiguity:** Define participant-board resolution clearly through team slot lookup.
- **API drift risk:** Keep the spec and controller routes aligned; do not leave endpoints undocumented.
- **Legacy data risk:** If duplicate assignment rows already exist, clean them before adding unique constraints.

---

## 17. Final Notes

This specification is intentionally detailed enough to guide implementation, code review, and testing for the two backend phases without writing source code. It aligns with the repository’s existing contest and assignment structure and keeps the design focused on the contest runtime workflow:

- register team
- confirm members
- board assignment
- problem release
- contest runtime
- scoring
- ranking
- advancement

For Phase 5 and Phase 6, the core guarantee is simple:

- problems are released only at the right time,
- countdown is consistent and safe,
- mentors and judges are assigned cleanly,
- and board visibility is tightly scoped.
