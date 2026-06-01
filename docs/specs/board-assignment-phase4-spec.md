# SEAL Hackathon — Board Assignment Technical Specification

Version: 2026-05-31
Authors: Technical Architect / Solution Architect

Summary: Detailed analysis and design for PHASE 4 — Board Assignment (BE-401..BE-407).

---

# 1. BUSINESS ANALYSIS

## Overview

This phase implements board assignment flows: Organizer views unassigned confirmed teams, random assignment, manual assignment (assign, replace, move, swap), validations to prevent duplicate team placement within the same round, and views by Participant/Mentor/Judge/Organizer.

### Problem statement

- Organizers need a reliable, auditable way to place confirmed teams into board slots for each round. Current manual processes (spreadsheets) are error-prone, allow duplicates, and make reporting difficult.
- Judges and mentors must see accurate per-board team lists. Participants must be able to see their assigned board.

### Business goals

- Guarantee each confirmed team is assigned to at most one slot per round.
- Allow both bulk (random) and fine-grained (manual) assignment with clear replace/override semantics.
- Provide efficient queries for UI (unassigned teams, teams by board, slot occupancy).
- Make assignment operations auditable and reversible.

### Actors

- Organizer (primary): create boards/slots, run random assignment, manually assign/replace/move/swap teams.
- Participant: view team board/slot assignment for their team.
- Mentor: view team lists for assigned boards.
- Judge: view team lists for assigned boards.
- System (background): enforce validations, persist assignments.

## Per-task analysis

For each BE task below: problem, goal, user stories, acceptance criteria, business rules.

### BE-401 — Organizer views confirmed teams not yet assigned to a board

- Problem: Organizer needs list of teams with status `CONFIRMED` that lack a `board_slot` for the target round.
- Goal: Provide paginated, filterable list including team metadata, contact email, registration time, and optional priority/waitlist flag.
- User stories:
  - As an Organizer I want to see all confirmed, unassigned teams for Round X so I can plan assignments.
  - As an Organizer I want to filter by school, team size, or registration timestamp.
- Acceptance criteria:
  - Endpoint returns only teams whose registration status is CONFIRMED and are not assigned to any slot in that round.
  - Supports sorting and pagination.
- Business rules:
  - A team with `status != CONFIRMED` must be excluded.
  - If a team has been previously assigned to a different round, it's not eligible here (round-specific query).

### BE-402 — Random assign confirmed teams into board slots

- Problem: Organizers want to quickly populate board slots without manual selection.
- Goal: Randomly map a set of confirmed, unassigned teams to available slots for a specified round/board(s), optionally seeded for reproducibility and respecting constraints (team size grouping, manual exclusions).
- User stories:
  - As an Organizer I want to randomly assign teams into selected boards for Round X using a seed I can reproduce.
  - As an Organizer I want to restrict randomization to certain boards or only unfilled slots.
- Acceptance criteria:
  - Assignments are deterministic when seed provided.
  - No team is assigned more than once in the round.
  - If there are more teams than slots, remainder teams are left unassigned and reported.
  - If there are more slots than teams, remaining slots remain empty and reported.
- Business rules:
  - Respect `CONFIRMED` status and per-round context.
  - Respect any per-team or per-board exclusion rules (e.g., manual lock or organizer-excluded teams).

### BE-403 — Manual assign team into board slot

- Problem: Organizer requires precise control to place, move, swap or replace teams across slots.
- Goal: Provide atomic operations for assign, replace (with optional confirmation), move, and swap with validations.
- User stories:
  - As an Organizer I can assign a team to an empty slot.
  - As an Organizer I can replace a team in a slot (explicit replace) and the replaced team becomes unassigned.
  - As an Organizer I can move a team from one slot to another.
  - As an Organizer I can swap teams between two slots.
- Acceptance criteria:
  - All operations enforce round-level uniqueness and slot occupancy rules.
  - Replace operations must be explicit and recorded in audit trail.
- Business rules:
  - Replace requires explicit flag `force=true` or user confirmation.
  - Move or swap operations should not create duplicate assignments in same round.

### BE-404 — Validate a team only exists in one slot per round

- Problem: Prevent duplicates which break fairness and reporting.
- Goal: Enforce and validate uniqueness of team assignment per round at DB and application levels.
- User stories:
  - As a system I must reject assignments that would place a team into more than one slot in the same round.
- Acceptance criteria:
  - DB-level unique constraint prevents duplicates.
  - API returns clear error codes when attempted.
- Business rules:
  - A team may be assigned to multiple rounds (different rounds are independent).

### BE-405 — Validate slot occupancy / handle replace semantics

- Problem: Avoid accidental overwrites of occupied slots.
- Goal: Explicit handling for attempts to assign into occupied slots: reject, replace with confirmation, or swap.
- User stories:
  - As an Organizer I attempt to assign into an occupied slot and the UI prompts: reject/replace/swap.
- Acceptance criteria:
  - Default assign into an occupied slot returns `SLOT_OCCUPIED` error unless `force_replace` set.
  - Replace results in prior occupant being unassigned and audit logged.
- Business rules:
  - Force replace allowed only for Organizer role.
  - System logs previous occupant and timestamp.

### BE-406 — Participant view team board/slot

- Problem: Team members need to know where to show up.
- Goal: Participant can see their assigned board, slot number, scheduled time, and relevant metadata.
- User stories:
  - As a Participant I want to see my team’s assigned board and seat/slot for Round X.
- Acceptance criteria:
  - Participant can only view slot info for their own team.
  - If unassigned, return a clear `UNASSIGNED` status.

### BE-407 — Organizer/Mentor/Judge view teams by board

- Problem: These roles need to view lists of teams per board for scoring and mentoring.
- Goal: Provide paginated team lists per board with optional filters and export-friendly output.
- User stories:
  - As a Judge I want to fetch the list of teams assigned to Board A so I can open score sheets.
  - As a Mentor I want to view code links and AI Review for teams in my boards.
- Acceptance criteria:
  - Response includes team metadata and live assignment state.
  - Enforced role-based access control.

---

# 2. DATABASE IMPACT ANALYSIS

Current relevant tables: `boards`, `board_slots`, `rounds`, `teams`.

Assumptions (based on conventions in repo):
- `rounds` has primary key `id`, fields `contest_id`, `name`, `start_at`, `end_at`, `status`.
- `boards` has primary key `id`, `round_id`, `name`, `capacity`, `locked`.
- `board_slots` has primary key `id`, `board_id`, `slot_number`, possibly `team_id` (nullable).
- `teams` has `id`, `name`, `status` (PENDING/CONFIRMED/REJECTED/etc), `registration_at`, contact info.

If actual schema differs, adapt accordingly.

## Changes required

1) Ensure `board_slots` has a nullable `team_id` column referencing `teams(id)`.
  - If missing, add it.
2) Add/ensure `assigned_at` and `assigned_by` metadata on `board_slots` for auditability (or a separate `board_slot_assignments` audit table).
3) Add unique constraint to prevent a team occupying multiple slots in the same round.
4) Add indexes to support queries: unassigned confirmed teams, teams by board, slot lookup by team.

## Suggested DDL

-- 1. Add team_id to board_slots (if not present)

ALTER TABLE board_slots
  ADD COLUMN team_id bigint NULL;

-- 2. Audit fields on board_slots

ALTER TABLE board_slots
  ADD COLUMN assigned_at timestamptz NULL,
  ADD COLUMN assigned_by bigint NULL; -- FK to users.id if available

-- 3. FK constraint from board_slots.team_id -> teams.id

ALTER TABLE board_slots
  ADD CONSTRAINT fk_board_slots_team
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- 4. Unique constraint: a team cannot be assigned to more than one slot within the same round
-- Implementation uses a partial unique index joining through board->round

-- If `boards` table has `round_id`, create a unique index using expression join supported by DB (Postgres recommended approach):

CREATE UNIQUE INDEX ux_team_per_round ON board_slots ((team_id), (board_id))
  WHERE team_id IS NOT NULL;

-- Above alone prevents multiple slots on the same board; to enforce per-round uniqueness, create a more robust approach:

-- Option A: Add `round_id` denormalized on board_slots and then unique(team_id, round_id)
ALTER TABLE board_slots ADD COLUMN round_id bigint NULL;
UPDATE board_slots SET round_id = b.round_id FROM boards b WHERE board_slots.board_id = b.id;
ALTER TABLE board_slots ALTER COLUMN round_id SET NOT NULL;
ALTER TABLE board_slots
  ADD CONSTRAINT fk_board_slots_round FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX ux_team_per_round ON board_slots(team_id, round_id) WHERE team_id IS NOT NULL;

-- Option B (if denormalization not desired): enforce with trigger or materialized view; but denormalizing round_id is simpler and performant.

-- 5. Indexes for queries
CREATE INDEX idx_board_slots_team_id ON board_slots(team_id);
CREATE INDEX idx_board_slots_board_id_slot ON board_slots(board_id, slot_number);
CREATE INDEX idx_teams_status_registration ON teams(status, registration_at);

## Notes

- Prefer Postgres `timestamptz` for timestamps.
- If your DB does not support expression indexes, implement `round_id` denormalization on `board_slots` and the unique constraint.
- Consider a separate `board_slot_assignments` audit table if historical retention of assignments is required rather than single current occupant.

---

# 3. DOMAIN MODEL

## Entities

- Board
  - id
  - round_id
  - name
  - capacity
  - locked (bool) — prevents changes when true

- BoardSlot
  - id
  - board_id
  - slot_number (int)
  - team_id (nullable)
  - round_id (denormalized)
  - assigned_at
  - assigned_by

- Round
  - id
  - contest_id
  - name
  - start_at, end_at
  - status (PLANNED / ONGOING / FINISHED / LOCKED)

- Team
  - id
  - name
  - status (PENDING / CONFIRMED / REJECTED)
  - registration_at
  - captain_contact

## Relationships

- Round 1..* Boards
- Board 1..* BoardSlots
- BoardSlot 0..1 Team
- Team 0..* BoardSlot (across rounds); but constrained to 0..1 per round via unique index

## Invariants

- A BoardSlot belongs to exactly one Board and one Round (via denormalized round_id).
- A Team can be assigned to at most one BoardSlot per Round.
- A BoardSlot can have at most one Team assigned (team_id either null or points to single team).
- If Board.locked = true or Round.status != PLANNED, assignment operations are restricted.

## Validation rules

- Team.status must be `CONFIRMED` to be eligible for assignment.
- Assignments only for Board.round_id == target Round.id.
- For swap/move operations, ensure atomicity: either both sides updated or none.

## Aggregate Root

- Proposed aggregate root: `Round`.
  - Rationale: Assignment operations are scoped per round, and constraints (unique team per round) are easiest to reason about inside the Round aggregate. Transactions and business invariants (no duplicate assignment, slot occupancy) are enforced within round-scoped service operations.

---

# 4. API SPECIFICATION

Common notes:
- Use REST endpoints under `/api/v1/rounds/{roundId}/...` to keep operations round-scoped.
- Use HTTP 409 for conflict/validation errors that block operation, 400 for invalid input, 403 for forbidden, 404 for not found, 200/201 for success.
- Authorization via JWT + role claims: `roles: [ORGANIZER, MENTOR, JUDGE, PARTICIPANT]`.

## BE-401 — List confirmed unassigned teams

- Endpoint: `GET /api/v1/rounds/{roundId}/unassigned-teams`
- HTTP Method: GET
- Authorization: Organizer only (or Organizer+admins). Read-only for organizers.
- Query parameters: `page`, `size`, `sort`, `school`, `minSize`, `maxSize`, `search`

Request DTO: none (path/query params)

Response DTO (200):
{
  "page": 1,
  "size": 20,
  "total": 123,
  "teams": [
    {
      "teamId": 1001,
      "name": "Team A",
      "status": "CONFIRMED",
      "registrationAt": "2026-05-01T09:00:00Z",
      "captainEmail": "captain@example.com",
      "membersCount": 4
    }
  ]
}

Validation:
- `roundId` must exist and be accessible to the Organizer.

Error cases:
- 404 if round does not exist.
- 403 if user lacks Organizer role.

Success cases:
- 200 with paginated list.

Example request:
GET /api/v1/rounds/10/unassigned-teams?page=1&size=25

Example response: see Response DTO above.

---

## BE-402 — Random assign teams into slots

- Endpoint: `POST /api/v1/rounds/{roundId}/boards/assign/random`
- HTTP Method: POST
- Authorization: Organizer only

Request DTO:
{
  "boardIds": [101, 102],           // optional - if absent assign across all boards in round
  "slotIds": [1001,1002],           // optional - restrict to specific slots
  "seed": "optional-seed-string", // optional reproducible seed
  "shuffleStrategy": "default"    // optional: roundRobin | random | groupBySize
}

Response DTO (200):
{
  "assignedCount": 24,
  "unassignedTeams": [ { "teamId": 2003, "reason": "no_slot" } ],
  "details": [
    { "slotId": 1001, "boardId":101, "teamId":2001 },
    { "slotId": 1002, "boardId":101, "teamId":2002 }
  ]
}

Validation:
- Round must exist and be in PLANNED status.
- Boards/Slots specified must belong to the round.
- Only `CONFIRMED` teams without existing slot in this round are eligible.

Error cases:
- 400 when no eligible teams or no available slots.
- 409 if request would violate uniqueness (shouldn't happen if pre-check done) — return failures with details.

Success cases:
- 200 with assignment details and any leftovers.

Notes:
- The operation must be atomic per slot assignment batch (partial success allowed depending on strategy) — see Random Assignment design for rollback.

Example request:
POST /api/v1/rounds/10/boards/assign/random
{
  "seed": "20260531-01",
  "boardIds": [101,102]
}

Example response: see Response DTO above.

---

## BE-403 — Manual assign / move / replace / swap

- Endpoint: `POST /api/v1/rounds/{roundId}/boards/slots/{slotId}/assign`
- HTTP Method: POST
- Authorization: Organizer only

Request DTO (assign):
{
  "teamId": 2001,
  "forceReplace": false    // if true will replace existing occupant
}

Response DTO (200):
{
  "slotId": 1001,
  "boardId": 101,
  "teamId": 2001,
  "previousTeamId": 1999,   // null if was empty
  "assignedAt": "2026-05-31T12:00:00Z"
}

Move endpoint (atomic move):
- POST `/api/v1/rounds/{roundId}/boards/slots/move`
Request:
{
  "fromSlotId": 1001,
  "toSlotId": 1002
}

Swap endpoint:
- POST `/api/v1/rounds/{roundId}/boards/slots/swap`
Request:
{
  "slotAId": 1001,
  "slotBId": 1002
}

Validation:
- Team status `CONFIRMED`.
- Slot and target round coherence.
- If `forceReplace=false` and slot occupied -> 409 `SLOT_OCCUPIED` with occupant details.
- If assigning a team that is already assigned in same round -> 409 `TEAM_ALREADY_ASSIGNED`.

Error cases (examples):
- 404 slot not found
- 403 forbidden
- 409 SLOT_OCCUPIED / TEAM_ALREADY_ASSIGNED

Success cases:
- 200 assignment result

Examples:
Assign request: see Request DTO above.

---

## BE-406 — Participant view own team assignment

- Endpoint: `GET /api/v1/teams/{teamId}/assignment?roundId={roundId}`
- HTTP Method: GET
- Authorization: Participant who is member of `teamId` (must be owner/member) or Organizer view allowed.

Response DTO (200):
{
  "teamId": 2001,
  "roundId": 10,
  "assigned": true,
  "boardId": 101,
  "slotId": 1001,
  "slotNumber": 3,
  "boardName": "Board A",
  "assignedAt": "2026-05-31T12:00:00Z"
}

If unassigned:
{
  "teamId": 2001,
  "roundId": 10,
  "assigned": false,
  "reason": "not_assigned"
}

Validation:
- Caller must be member of the team or Organizer.

Errors:
- 404 team not found
- 403 not a team member

---

## BE-407 — Organizer/Mentor/Judge view teams by board

- Endpoint: `GET /api/v1/rounds/{roundId}/boards/{boardId}/teams`
- HTTP Method: GET
- Authorization: Organizer, Mentor (if assigned to that board), Judge (if assigned)

Query params: `page`, `size`, `sort`, `includeAIReview` (bool)

Response DTO (200):
{
  "boardId": 101,
  "roundId": 10,
  "teams": [
    { "teamId":2001, "name":"Team A", "slotNumber":1, "captainEmail":"x" }
  ],
  "total": 8
}

Validation/Authorization:
- Organizer can view any board.
- Mentor/Judge must be explicitly assigned to board/round; otherwise 403.

Errors:
- 404 board not found
- 403 not authorized

---

# 5. RANDOM ASSIGNMENT DESIGN

## Input

- `roundId` (required)
- `boardIds` list or null to include all boards in round
- optional `slotIds` to restrict slots
- optional `seed` for deterministic shuffle
- `strategy` (random, roundRobin, groupBySize)

## Process (high level)

1. Validate the round exists and its status allows assignment.
2. Fetch eligible teams:
   - status = CONFIRMED
   - not already assigned in this round (query board_slots where round_id = :roundId and team_id IS NOT NULL)
3. Fetch target slots:
   - all slots for selected boards/slotIds where slot.team_id IS NULL AND board.locked = false
4. If `seed` provided, initialize PRNG deterministic shuffle; else use secure randomness.
5. Optionally apply strategy transforms (grouping, size balancing).
6. Map teams -> slots by index order up to min(len(teams), len(slots)).
7. Start DB transaction:
   - Apply assignment updates (update board_slots set team_id = X, assigned_at, assigned_by, round_id)
   - For each update validate uniqueness constraint (should be enforced by unique index)
8. Commit transaction.
9. Return assigned mappings and lists of leftover teams / slots.

## Pseudo flow

Step 1: SELECT teams WHERE status='CONFIRMED' AND id NOT IN (SELECT team_id FROM board_slots WHERE round_id=:roundId AND team_id IS NOT NULL)
Step 2: SELECT slots WHERE round_id=:roundId AND (IF boardIds then board_id IN boardIds) AND team_id IS NULL AND board.locked = false ORDER BY board_id, slot_number
Step 3: Shuffle teams (deterministic if seed)
Step 4: For i in 0..min(teams.size, slots.size)-1: assignments.add( slots[i] -> teams[i] )
Step 5: Begin transaction; bulk update; commit

## Time complexity

- Fetch eligible teams: O(T)
- Fetch slots: O(S)
- Shuffle teams: O(T)
- Mapping: O(min(T,S))
- DB updates: O(min(T,S))

Total worst-case: O(max(T,S)) in memory; dominated by I/O for DB updates.

## Edge cases & handling

- More teams than slots: leave surplus teams unassigned; return list.
- More slots than teams: leave empty slots unfilled; return list.
- Concurrent runs: use DB transaction + unique index on (team_id, round_id) to avoid races. If conflict occurs, rollback and retry or surface `CONFLICT` to user with details.
- Locked boards: skip slots in locked boards and include skipped slot count in report.

## Rollback strategy

- Single transaction for the full requested assignment set is simplest; but for very large operations lock time is long. Alternatives:
  - Chunked assignment: assign in batches with retries; if a conflict occurs in a batch, record partial successes and return partial result with conflict details.
  - Preferred: attempt single transaction if total updates < configurable threshold (e.g., 500 rows), else chunk with optimistic concurrency and retry conflicts.

## Determinism

- If `seed` provided, algorithm must use a deterministic shuffle implementation (Fisher-Yates seeded PRNG) so results can be reproduced.

---

# 6. MANUAL ASSIGNMENT DESIGN

Operations supported: Assign to empty slot, Replace occupant (force), Move team A -> slot B, Swap team between two slots.

## Principles

- All operations are atomic and validated against round-level uniqueness.
- Replace requires explicit `forceReplace=true` flag.
- Move is implemented as atomic transaction: set fromSlot.team_id = NULL, set toSlot.team_id = teamId; validate no conflicts.
- Swap is implemented as atomic transaction swapping two slot.team_id values.

## Flow diagrams (text)

Assign to empty slot:
1. Caller sends assign(teamId, slotId, forceReplace=false)
2. Verify caller has Organizer role and round/board unlocked
3. Verify team.status == CONFIRMED
4. Check team not already assigned in round -> if yes return TEAM_ALREADY_ASSIGNED
5. Check slot exists and slot.team_id IS NULL -> if not null return SLOT_OCCUPIED
6. Update slot.team_id = teamId, set assigned_at and assigned_by in a transaction
7. Commit and return success

Replace occupied slot (forceReplace=true):
1. Steps 1-3 same
2. Check slot exists and slot.team_id != NULL -> capture previousTeam
3. If previousTeam == teamId => no-op return success
4. Check team not already assigned in round (unless previousTeam == teamId)
5. Update slot.team_id = teamId; if previousTeam != null set previousTeam slot to NULL (or mark previousTeam unassigned)
6. Insert audit record capturing previousTeam, user, timestamp
7. Commit

Move team A (fromSlot) -> slot B (toSlot):
1. Validate fromSlot.team_id == A
2. Validate toSlot.team_id IS NULL or handle replace flag
3. Ensure A is not assigned elsewhere in round (should be only in fromSlot)
4. In transaction set fromSlot.team_id = NULL; toSlot.team_id = A; update assigned_at/assigned_by
5. Commit

Swap between slot X and Y:
1. Validate both slots belong to same round
2. Begin transaction; temp = slotX.team_id; slotX.team_id = slotY.team_id; slotY.team_id = temp; update timestamps; commit

## Replace allowed vs not allowed

- Replace allowed only for Organizer role and only if board.locked = false and round.status == PLANNED.
- If the prior occupant is already confirmed in another slot for the same round (shouldn't happen if DB invariant holds) the operation must fail and require operator resolution.

## Audit & History

- Every manual operation must append an entry to `board_slot_assignments_audit` with fields: id, round_id, board_id, slot_id, team_id_before, team_id_after, action (assign/replace/move/swap), performed_by, performed_at, reason (optional).

---

# 7. VALIDATION MATRIX

| Rule ID | Description | Error Code | Error Message | Applies to |
|---|---|---|---|---|
| BA-001 | Team already assigned in same round | TEAM_ALREADY_ASSIGNED | Team has already been assigned to another slot in this round | BE-404 |
| BA-002 | Slot already occupied | SLOT_OCCUPIED | Slot is already occupied by team {teamId} | BE-405 |
| BA-003 | Round not found | ROUND_NOT_FOUND | Specified round does not exist | All |
| BA-004 | Board not found | BOARD_NOT_FOUND | Specified board does not exist | BE-402, BE-407 |
| BA-005 | Slot not found | SLOT_NOT_FOUND | Specified slot does not exist | BE-403 |
| BA-006 | Team not found | TEAM_NOT_FOUND | Team does not exist | BE-403, BE-406 |
| BA-007 | Team not CONFIRMED | TEAM_NOT_CONFIRMED | Team must be CONFIRMED to be eligible for assignment | BE-402, BE-403 |
| BA-008 | Board locked | BOARD_LOCKED | Board is locked; assignment prohibited | BE-402, BE-403 |
| BA-009 | Round not in PLANNED status | ROUND_NOT_PLANNED | Round status does not allow assignments | BE-402, BE-403 |
| BA-010 | Unauthorized | FORBIDDEN | Caller lacks required role or board assignment | Access control |

---

# 8. EDGE CASE ANALYSIS

List of edge cases (20+):
1. Round does not exist.
2. Board does not exist for given round.
3. Slot id not found.
4. Team id not found.
5. Team status != CONFIRMED.
6. Slot already occupied and `forceReplace=false`.
7. Slot already occupied and `forceReplace=true`, but previous occupant was also assigned elsewhere (DB inconsistent).
8. Team already assigned in another slot in same round (attempted duplicate).
9. Round status is `ONGOING` or `FINISHED` and assignment attempted.
10. Board.locked = true and assignment attempted.
11. Random assign with more teams than slots.
12. Random assign with more slots than teams.
13. Random assign concurrent run causing race conflicts.
14. Random assign with invalid seed value.
15. Manual move where `fromSlot` does not contain the expected team.
16. Swap where one of the slots belongs to a different round.
17. Replace operation interrupted mid-transaction (partial update) — recovery.
18. Assignment audit table unavailable (DB outage) — should still apply current assignment or fail safely.
19. Participant requests assignment for a team they are not a member of.
20. Mentor/Judge trying to view a board they aren't assigned to.
21. Team assigned to a slot but then deleted (soft-delete) — orphaned slot.
22. Teams with same captain email (duplication in registration) — filtering.
23. Board capacity changed (reduced) after assignment causing overbook.
24. Time-zone mismatches for `assigned_at` timestamps.
25. Partial failures in chunked random assignment causing inconsistent state.

For each above, the system must return clear error codes and provide remediation guidance to Organizer UI.

---

# 9. SECURITY & PERMISSION

Principles:
- Principle of least privilege. Role-checks apply per endpoint with optional board-level assignment checks for Mentor/Judge.

Role matrix for endpoints:

- `GET /rounds/{roundId}/unassigned-teams`:
  - Allowed: Organizer
  - Forbidden: Participant, Mentor, Judge

- `POST /rounds/{roundId}/boards/assign/random`:
  - Allowed: Organizer
  - Forbidden: Participant, Mentor, Judge

- `POST /rounds/{roundId}/boards/slots/{slotId}/assign` and move/swap endpoints:
  - Allowed: Organizer
  - Forbidden: Participant, Mentor, Judge

- `GET /teams/{teamId}/assignment`:
  - Allowed: Team members (owner) and Organizer
  - Forbidden: other Participants (unless Organizer), Mentor/Judge unless they are assigned to that board and Organizer allows (safety: restrict to owner/organizer)

- `GET /rounds/{roundId}/boards/{boardId}/teams`:
  - Allowed: Organizer, Mentor (if assigned to board), Judge (if assigned to board)
  - Forbidden: other Participants unless in team

Authorization details:
- JWT tokens should contain `userId`, `roles[]`, and optionally `assignedBoardIds[]` for Mentor/Judge to allow quick checks. Alternatively fetch assignment in middleware.
- All mutating endpoints must verify the caller is Organizer and include `performed_by` set to `userId`.

Audit:
- All assignment operations write to audit log with performed_by, timestamp, action, and previous/new team ids.

---

# 10. TEST SCENARIOS

Below are 32 test cases across functional, validation and integration categories. IDs are prefixed by T.

Functional Test Cases

T-001
Precondition: Round 10 exists and status PLANNED; 10 confirmed teams; 8 empty slots in boards
Action: Organizer POST random assign with seed
Expected: 8 teams assigned, 2 teams returned as unassigned, response details contain 8 mappings

T-002
Precondition: Slot 1001 empty
Action: Organizer assign team 2001 to slot 1001
Expected: slot.team_id == 2001; assigned_at recorded

T-003
Precondition: Slot 1002 occupied by 2002
Action: Organizer assign team 2003 to slot 1002 without forceReplace
Expected: 409 SLOT_OCCUPIED with occupant details

T-004
Precondition: Slot 1002 occupied by 2002
Action: Organizer assign team 2003 to slot 1002 with forceReplace=true
Expected: slot.team_id == 2003, 2002 unassigned, audit record created

T-005
Precondition: fromSlot 1003 contains 2004; toSlot 1004 empty
Action: Organizer move 2004 from 1003 to 1004
Expected: 1003 null; 1004 contains 2004

T-006
Precondition: slotA contains 2005; slotB contains 2006
Action: Organizer swap slotA and slotB
Expected: slotA contains 2006; slotB contains 2005; audit recorded

T-007
Precondition: Team 2007 assigned to slot 1005
Action: Organizer attempts to assign 2007 to slot 1006
Expected: 409 TEAM_ALREADY_ASSIGNED

Validation Test Cases

T-008
Precondition: Team 2010 has status PENDING
Action: Organizer assigns 2010 to slot
Expected: 400 TEAM_NOT_CONFIRMED

T-009
Precondition: Round 99 does not exist
Action: Call any assignment endpoint
Expected: 404 ROUND_NOT_FOUND

T-010
Precondition: Board 55 locked
Action: Organizer attempts random assign including Board 55
Expected: Board 55 slots skipped; response notes skipped boards; no change to locked board

T-011
Precondition: Caller is Mentor but not assigned to board
Action: GET /boards/{boardId}/teams
Expected: 403 FORBIDDEN

Integration Test Cases

T-012
Precondition: Two concurrent random assign requests for same round
Action: Run both requests concurrently
Expected: One completes, second fails gracefully with conflict details or retry mechanism handles it (no duplicate assignments)

T-013
Precondition: DB unique index on (team_id, round_id) active
Action: Attempt programmatic duplicate insertion via parallel operations
Expected: DB enforces uniqueness with constraint violation; operation handled and surfaced

T-014
Precondition: After assignment, participant queries own team assignment
Action: GET /teams/{teamId}/assignment
Expected: Returns assigned slot

More tests to reach 30+ (grouped summaries):

T-015: Assign to non-existent slot -> 404 SLOT_NOT_FOUND
T-016: Assign by non-Organizer -> 403 FORBIDDEN
T-017: Random assign with invalid seed format -> 400 BAD_REQUEST
T-018: Random assign with fewer teams than slots -> success with empty slots reported
T-019: Random assign with more teams than slots -> success with remaining teams reported
T-020: Replace where previous occupant equals new team -> idempotent no-op success
T-021: Move where fromSlot does not contain expected team -> 409 CONFLICT
T-022: Swap across different rounds -> 400 INVALID_OPERATION
T-023: Assign when DB connectivity fails during commit -> 500 and retry guidance
T-024: Audit table entry created upon assignment -> verify audit contents
T-025: Deleting a team (soft delete) leaves slot orphaned -> verify slot cleared or admin flagged
T-026: Board capacity reduced below assigned count -> validation fails and admin notified
T-027: Timezone check for assigned_at -> assigned_at stored in UTC
T-028: Mentor assigned to board can view teams -> 200 success
T-029: Judge assigned to board can view teams -> 200 success
T-030: Participant tries to view another team assignment -> 403 forbidden
T-031: Chunked random assign partial conflict handling -> verify partial success and returned conflicts
T-032: Repeating random assign with same seed produces same mapping (determinism)

---

# 11. IMPLEMENTATION PLAN

Priorities: Must Have, Should Have, Nice To Have. Estimates are rough; refine with dev team.

Must Have

1. Database Migration: add `team_id`, `round_id` denormalization, FKs, unique index, audit table
   - Description: Add columns, constraints, indexes, and optional audit table
   - Estimate: 8h (2 dev), 2 SP

2. API endpoints (BE-401, BE-402, BE-403 (assign/move/swap), BE-406, BE-407)
   - Description: Implement server-side handlers, validation, RBAC checks
   - Estimate: 40h (1 backend dev), 8 SP

3. Random assignment service + deterministic shuffle
   - Description: Implement service with transaction management, seed support
   - Estimate: 16h, 4 SP

4. Manual assignment service with audit logging
   - Description: assign, replace, move, swap, audit table writes
   - Estimate: 16h, 4 SP

5. Unit + integration tests (30+ cases)
   - Estimate: 24h, 5 SP

6. RBAC middleware and authorization checks
   - Estimate: 8h, 2 SP

Should Have

7. UI-ready endpoints (filters, pagination, export)
   - Estimate: 12h, 3 SP

8. Background job or async chunked assignment support for very large data sets
   - Estimate: 16h, 4 SP

Nice To Have

9. Assignment preview (dry-run) API
   - Estimate: 8h, 2 SP

10. Admin tool to rollback assignment batch
   - Estimate: 12h, 3 SP

Total Must Have Hours: ~112h (rough)

Sprint plan suggestion (2-week sprint):
- Sprint 1: DB migration + RBAC + BE-401 + basic BE-403 assign -> finish basic manual flows and tests
- Sprint 2: Random assign service + chunked logic, BE-406/BE-407, tests + audit
- Sprint 3: Integrations, UI enhancements, export, rollback tooling

---

# 12. FINAL REVIEW

## Consistency checks

- Business rules: Document enforces that only CONFIRMED teams are assignable — DB unique constraint and validation cover this.
- Database: Proposed denormalization `round_id` on `board_slots` gives efficient uniqueness enforcement per round and easier queries for unassigned teams.
- API: Endpoints are round-scoped and follow REST conventions; error codes and RBAC are specified.

## Potential Risks

- Race conditions for concurrent random assignment or simultaneous manual assignments; mitigated by DB unique constraints and transactions, but large batches require chunking and retry logic.
- DB migration risk: adding `round_id` denormalized column requires backfill and careful downtime planning for large datasets.
- Audit volume growth: frequent assignments and reassignments will create many audit rows; retention policy needed.
- UI confusion: replace/force semantics must be explicit to avoid accidental displacement of teams.

## Technical Risks

- Lock contention on `board_slots` table for large-scale batch updates.
- Deterministic shuffle must be implemented carefully to avoid PRNG vulnerabilities or platform-specific differences.
- Cross-database portability: Some index/constraint expressions are DB-specific (use Postgres-friendly DDL by default).

## Recommended improvements

1. Create `board_slot_assignments_audit` table and use it for complete history instead of overwriting `board_slots` only.
2. Add `assignment_batch_id` to group assignment operations, aiding rollback and UI tracing.
3. Provide dry-run APIs for random assignment so organizers preview before committing.
4. Add retention and archival policies for audit entries.
5. Implement optimistic retry strategy for chunked random assignment.

---

File: specs/board-assignment-spec.md

End of specification.
