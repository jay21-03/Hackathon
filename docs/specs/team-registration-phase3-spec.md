# SEAL Hackathon — Phase 3: Team Registration (Specification)
**Context:** ASP.NET Core Web API · PostgreSQL · Clean Architecture · Repository + Service Pattern · JWT Auth · Google Login

---

## Overview

This document specifies Phase 3 — Team Registration for the SEAL Hackathon Management System. It translates business requirements and database entities into a technical, backend-oriented design covering flows, state machines, validations, DB review, API contracts, services, repositories, concurrency, security, and implementation roadmap.

Target readers: Backend engineers, architects, reviewers, and integration/test teams.

---

## 1. Business Flow

### 1.1 Actors
- Participant (authenticated via Google/JWT)
- Organizer (has `ORGANIZER` role)
- System (background/email)
- Admin (organizer-level actions)

### 1.2 Preconditions
- Event exists and has `registration_start_at` / `registration_end_at` configured.
- Event has `max_teams`, `min_team_size`, `max_team_size`.
- Users are authenticated for protected endpoints.

### 1.3 Team Registration Flow (Main)
- Trigger: Participant submits registration form containing team name and members (emails and profile data).
- Steps:
  1. Validate request schema (DTO validation annotations).
  2. Check event registration window and event status.
  3. Validate team size between `min_team_size` and `max_team_size` (1–5 by policy).
  4. Normalize and validate member emails; ensure no duplicates in the request.
  5. Enforce business rule BR-003: ensure none of the submitted emails (or authenticated user id) already belong to a team in this event.
  6. Create `teams` row with `status = PENDING`, `contact_user_id` set to requester and `contact_email`.
  7. Create `team_members` rows with `status = INVITED` for each member except the requester; requester -> `CONFIRMED`.
  8. Generate invite tokens for invited members and persist them.
  9. Send invitation emails with accept/decline links.
 10. Return `201 Created` with `TeamDetailDto`.

### 1.4 Invitation Flow
- Trigger: Registration or `resend` action.
- Steps:
  1. Token generation: cryptographically random UUID + HMAC if desired.
  2. Persist token, expiry (e.g. 48 hours) and single-use flag.
  3. Send email with accept/decline URLs referencing token.

### 1.5 Confirm Flow
- Trigger: Member clicks accept link (token) or calls Confirm API.
- Steps:
  1. Validate token existence and expiry.
  2. Verify team_member is `INVITED`.
  3. Set `team_members.status = CONFIRMED`, `confirmed_at = now`.
  4. Recompute team readiness: if confirmed member count >= configured min and <= max and (all members required are CONFIRMED), attempt to promote team to `CONFIRMED`.
  5. Quota check: atomically count existing CONFIRMED teams for event; if under `max_teams` then set `teams.status = CONFIRMED` and `confirmed_at`; otherwise set `teams.status = WAITLIST` or `REJECTED` based on policy.

### 1.6 Decline Flow
- Trigger: Member clicks decline link (token) or calls Decline API.
- Steps:
  1. Validate token.
  2. Set `team_members.status = DECLINED`, `declined_at = now`.
  3. If team falls below `min_team_size` or too many declines, set `teams.status = REJECTED` and populate `rejected_reason`.

### 1.7 Quota Flow (Edge & Race Conditions)
- Trigger: concurrent confirmations near quota boundary.
- Steps:
  1. Use transactional lock (see Section 9) to serialize quota check + team promotion.
  2. On conflict, retry a limited number of times; if still failing, set team `WAITLIST` or `REJECTED`.

### 1.8 Postconditions
- Team and member states set correctly and persisted.
- Invitation events published (optional domain events) for auditing and async tasks.

---

## 2. Team State Machine

### 2.1 Team States
- PENDING (initial)
- CONFIRMED
- WAITLIST
- REJECTED
- DISQUALIFIED

Transitions:
- PENDING -> CONFIRMED: All required members CONFIRMED + quota available
- PENDING -> WAITLIST: All members CONFIRMED but quota full
- PENDING -> REJECTED: Member declines causing team < min size or explicit admin reject
- WAITLIST -> CONFIRMED: Slot opens (admin increases quota or team removed)
- * -> DISQUALIFIED: Admin action

Invalid transitions must be rejected by service layer with 400/409.

### 2.2 Team Member States
- INVITED
- CONFIRMED
- DECLINED

Transitions:
- INVITED -> CONFIRMED (member accepts)
- INVITED -> DECLINED (member declines)

Rules and side effects:
- On INVITED -> CONFIRMED: set `confirmed_at`, publish InvitationConfirmed event, attempt team promotion.
- On INVITED -> DECLINED: set `declined_at`, evaluate team viability.

---

## 3. Validation Matrix

Each rule: where validated, HTTP code, message.

1. Duplicate email in request
- Where: Controller + RegistrationService
- Code: 400
- Message: "Duplicate member email in request"

2. Invalid team size (outside 1–5)
- Where: DTO validation + Service
- Code: 400
- Message: "Team size must be between {min} and {max}"

3. Event closed / outside registration window
- Where: Service
- Code: 400
- Message: "Registration for this event is closed"

4. Quota full (on create or confirm)
- Where: Service (atomic quota check)
- Code: 409
- Message: "Event team quota reached"

5. User/email already in another team for the same event
- Where: Repository check in Service
- Code: 409
- Message: "User/email already registered in another team for this event"

6. Duplicate member inside same request
- Where: DTO validation
- Code: 400
- Message: "Duplicate member in payload"

7. Confirm token expired
- Where: InvitationService
- Code: 410
- Message: "Invitation token expired"

8. Confirm twice / already confirmed
- Where: InvitationService / Service
- Code: 409
- Message: "Invitation already accepted"

9. Decline after confirmed
- Where: InvitationService
- Code: 409
- Message: "Cannot decline after confirmation"

10. Creator not participant
- Where: Controller / Service
- Code: 400
- Message: "Creator must be included as a team member"

11. Invalid email format
- Where: DTO validation (EmailAnnotation)
- Code: 400
- Message: "Invalid email format"

12. Team not found
- Where: Repositories
- Code: 404
- Message: "Team not found"

13. Unauthorized access
- Where: Controller filters/attributes
- Code: 401/403
- Message: "Unauthorized" / "Forbidden"

---

## 4. Database Design Review

### 4.1 Existing tables (review)
- `events` (as provided)
- `teams` (provided)
- `team_members` (provided)

### 4.2 Recommended additions
- `teams`
  - `created_by` (uuid) — who created the team
  - `updated_by` (uuid)
  - `deleted_at` (timestamp) — soft delete
  - `version` (int) — optimistic locking
  - `status_changed_by` (uuid)
  - `status_changed_at` (timestamp)
- `team_members`
  - `created_by`, `updated_by`, `deleted_at`, `version`

### 4.3 Indexes & Unique Constraints
- Unique index: `UNIQUE (event_id, lower(name))` to avoid case duplicates
- Unique index: `UNIQUE (event_id, email)` in `team_members` to prevent same email in multiple teams for same event
- Composite unique: `UNIQUE (event_id, user_id)` on `team_members` for user-based constraint
- Index: `IDX teams (event_id, status)` for event-team queries
- Index: `IDX team_members (event_id, status)` for fast invitation queries

### 4.4 Foreign Keys
- `teams.event_id` → `events.id` (ON DELETE CASCADE or RESTRICT depending on retention policy)
- `team_members.team_id` → `teams.id` (ON DELETE CASCADE)
- `team_members.user_id` → `users.id` (nullable if invitee not registered yet)

### 4.5 Constraints
- Enforce email format at app-level; DB-level email regex constraints are optional (avoid complex regex at DB)
- Add CHECK constraint on `teams.status`/`team_members.status` enums if using text

### 4.6 Soft Delete & Auditing
- Use `deleted_at` for soft deletes and preserve historical relationships
- Add `created_by`/`updated_by` and `version` for optimistic locking and audit trail

### 4.7 Transactions
- Registration: single transaction creating team and members and tokens
- Confirmation: single transaction validating token, updating member and possibly team status and counting confirmed teams

---

## 5. API Specification

All endpoints under `/api/v1`. Use role-based authorization (JWT claims). Rate-limit invitation endpoints.

### 5.1 Register Team
- `POST /api/v1/events/{eventId}/teams`
- Auth: Participant (authenticated)
- Request DTO: `RegisterTeamRequest` (see Section 6)
- Response: `201 Created` with `TeamDetailDto`
- Validation: DTO checks, service checks (duplicate email, user in other team)
- Business: create team PENDING, create members, generate tokens, send invites
- Errors: 400, 409, 401
- Idempotency: Accept `Idempotency-Key` header optional — server should detect duplicate submissions by (eventId + contact_user_id + teamName) within a short window

### 5.2 Confirm Invitation
- `POST /api/v1/team-invitations/confirm`
- Auth: none (token-based) or authenticated user (prefer auth optional)
- Request DTO: `{ token: string }`
- Response: `200 OK` with `TeamMemberStatusDto`
- Validation: token present, not expired, member in INVITED
- Business: set member CONFIRMED, attempt team promotion
- Errors: 400, 404, 410, 409

### 5.3 Decline Invitation
- `POST /api/v1/team-invitations/decline`
- Similar to confirm, sets member to DECLINED

### 5.4 Get My Teams
- `GET /api/v1/my/teams?eventId={eventId}`
- Auth: Participant
- Response: List of `TeamDetailDto` where current user is a member

### 5.5 Get Event Teams (Organizer)
- `GET /api/v1/events/{eventId}/teams`
- Auth: Organizer
- Response: list of teams with members, filters by status optional

### 5.6 Get Team Detail
- `GET /api/v1/teams/{teamId}`
- Auth: Organizer or team member

### 5.7 Resend Invitation
- `POST /api/v1/team-invitations/resend`
- Auth: Organizer or team contact
- Body: `{ teamMemberId }`
- Business: regenerate token, invalidate previous tokens, send email

### 5.8 Update Team Status (Admin)
- `PATCH /api/v1/teams/{teamId}/status`
- Auth: Organizer
- Body: `{ status: enum, reason?: string }`
- Business: Validate allowed transition, write audit fields

---

## 6. DTO Design

### Request DTOs (C# typical annotations)
- `RegisterTeamRequest`
  - `string Name` [Required, MinLength(3), MaxLength(100)]
  - `List<MemberRequest> Members` [Required, MinCount = event.min_team_size, MaxCount = event.max_team_size]
- `MemberRequest`
  - `string Email` [Required, EmailAddress]
  - `string FullName` [Required]
  - `string StudentId` [Optional]
  - `string University` [Optional]
- `ConfirmInvitationRequest` { `string Token` }
- `DeclineInvitationRequest` { `string Token` }
- `ResendInvitationRequest` { `Guid TeamMemberId` }
- `UpdateTeamStatusRequest` { `TeamStatus Status`, `string Reason` }

### 6.2 Response DTOs
- `TeamDetailDto`
  - `Guid Id`, `Guid EventId`, `string Name`, `TeamStatus Status`, `List<TeamMemberDto> Members`, `DateTime? ConfirmedAt`, `string RejectedReason`, `int? SequenceNo`
- `TeamMemberDto`
  - `Guid Id`, `string Email`, `string FullName`, `string StudentId`, `string University`, `MemberStatus Status`, `bool IsContactPerson`, `DateTime? InvitedAt`, `DateTime? ConfirmedAt`, `DateTime? DeclinedAt`

Use FluentValidation or data annotations for cross-field validations.

---

## 7. Service Layer Design

Services should be small, testable, and orchestrate repository calls and domain rules.

### 7.1 `TeamService`
- Responsibilities: create/update teams, status transitions, queries
- Methods:
  - `Task<TeamDetailDto> RegisterTeam(Guid eventId, RegisterTeamRequest request, Guid contactUserId)`
  - `Task<TeamDetailDto> UpdateTeamStatus(Guid teamId, TeamStatus status, Guid actorId, string reason)`
  - `Task<TeamDetailDto> GetTeam(Guid teamId, Guid? requesterId)`
  - `Task<IEnumerable<TeamDetailDto>> GetEventTeams(Guid eventId, TeamQueryOptions opts)`
- Transaction: registers team in single DB transaction

### 7.2 `TeamMemberService`
- Responsibilities: add members, confirm/decline, resend invites
- Methods:
  - `Task AddMembers(Guid teamId, IEnumerable<MemberRequest> members)`
  - `Task<TeamMemberDto> ConfirmMember(string token, Guid? authenticatedUserId)`
  - `Task<TeamMemberDto> DeclineMember(string token)`
  - `Task ResendInvitation(Guid teamMemberId, Guid actorId)`

### 7.3 `InvitationService`
- Responsibilities: token generation, persistence, validation, email send
- Methods:
  - `Task<string> GenerateInviteToken(Guid teamMemberId, TimeSpan ttl)`
  - `Task<InviteRecord> ValidateToken(string token)`
  - `Task SendInvitationEmail(Guid teamMemberId, string token)`

### 7.4 `RegistrationService` (orchestrator)
- Responsibilities: coordinates RegisterTeam flow
- Methods:
  - `Task<TeamDetailDto> RegisterTeam(RegisterTeamRequest request, Guid creatorId)`

Dependency graph: Controller -> RegistrationService -> TeamService + TeamMemberService + InvitationService -> Repositories -> Postgres

Transaction scope: each high-level operation (register, confirm, decline) is atomic.

---

## 8. Repository Design

Core repository methods:

- `ITeamRepository`
  - `Task<bool> ExistsByNameAsync(Guid eventId, string name)`
  - `Task<int> CountConfirmedTeamsAsync(Guid eventId)`
  - `Task<Team> GetByIdAsync(Guid teamId)`
  - `Task<IEnumerable<Team>> GetByEventAsync(Guid eventId, TeamQueryOptions opts)`
  - `Task<Team> AddAsync(Team team)`
  - `Task UpdateAsync(Team team)`

- `ITeamMemberRepository`
  - `Task<bool> ExistsByEmailAndEventAsync(string email, Guid eventId)`
  - `Task<bool> ExistsByUserIdAndEventAsync(Guid userId, Guid eventId)`
  - `Task<TeamMember> GetByInviteTokenAsync(string token)`
  - `Task<IEnumerable<TeamMember>> GetByTeamAsync(Guid teamId)`
  - `Task AddRangeAsync(IEnumerable<TeamMember> members)`
  - `Task UpdateAsync(TeamMember member)`

- `IEventRepository`
  - `Task<Event> GetByIdAsync(Guid eventId)`
  - `Task<bool> IsRegistrationOpenAsync(Guid eventId)`

- `IInvitationRepository`
  - `Task SaveTokenAsync(Guid teamMemberId, string token, DateTime expiry)`
  - `Task<InvitationRecord> GetByTokenAsync(string token)`

Implementations should use Dapper or EF Core with explicit SQL for critical queries (counts, unique checks).

---

## 9. Transaction & Concurrency

### 9.1 Problems
- Race conditions on quota when multiple teams confirm concurrently.
- Duplicate registrations by same user if requests processed concurrently.

### 9.2 Solutions
- Use DB-level uniqueness constraints (event_id,email) to abort duplicates.
- For quota: in confirmation flow, acquire a row-level lock on a single event row or on a dedicated `event_counters` table row using `SELECT ... FOR UPDATE` inside a transaction. Steps:
  1. Begin transaction
  2. Lock event row
  3. Count confirmed teams
  4. If slot, update team -> CONFIRMED
  5. Commit
- Prefer `REPEATABLE READ` or `SERIALIZABLE` semantics depending on DB load; `SERIALIZABLE` safest but may cause serialization failures and retries.
- Use optimistic locking (`version` column) when updating frequently-read rows.
- Implement exponential backoff with limited retries on serialization failure.

---

## 10. Email Invitation Flow

### Token
- 128-bit UUID v4, stored hashed (HMAC) in DB optional; or store as-is with TTL.
- TTL: default 48 hours; configurable per event.
- Single-use: mark token consumed when used.

### Resend
- Invalidate prior token(s) for that member and persist new token; send email.

### Templates
- Variables: `{teamName}`, `{eventName}`, `{contactName}`, `{acceptUrl}`, `{declineUrl}`, `{expiresAt}`

### Verification
- Token lookup → check expiry → check `team_member.status == INVITED` → proceed

---

## 11. Security Analysis

- Token abuse: long random tokens, store hashed token if leakage is a concern.
- Brute-force: rate-limit confirm/decline endpoints and captcha where necessary.
- Privilege: endpoints must verify authenticated user's membership or organizer role.
- IDOR: never return team data by guessing id; verify access rights.
- Audit: record who changed statuses and when.

---

## 12. Clean Architecture Structure

Suggested folder layout (C#):

```
src/
  Application/
    DTOs/
    Interfaces/
    Services/
    Validators/
  Domain/
    Entities/
    Enums/
    Events/
  Infrastructure/
    Persistence/
      Migrations/
      Repositories/
    Email/
    Auth/
  Api/
    Controllers/
    Models/
    Filters/
    Mappings
```

Key classes:
- Entities: `Team`, `TeamMember`, `Event` (light)
- Repositories: EF Core / Dapper implementations
- Services: `RegistrationService`, `TeamService`, `InvitationService`
- Controllers: `TeamsController`, `InvitationsController`, `MyController`

---

## 13. Domain Events (Optional)

- `TeamRegistered { TeamId, EventId }`
- `InvitationSent { TeamMemberId, Token }`
- `InvitationConfirmed { TeamMemberId }`
- `TeamConfirmed { TeamId }`
- `TeamWaitlisted { TeamId }`
- `TeamRejected { TeamId, Reason }`

Use events for audit logs, metrics, notification center, async promotions from waitlist.

---

## 14. Sequence Diagrams (Text)

### 14.1 Team Registration
```
Participant -> Api: POST /events/{id}/teams
Api -> RegistrationService: Validate + Register
RegistrationService -> TeamRepository: Insert Team (PENDING)
RegistrationService -> TeamMemberRepository: Insert Members (INVITED/CONFIRMED)
RegistrationService -> InvitationService: Generate tokens
InvitationService -> EmailService: Send invites
Api -> Participant: 201 Created (TeamDetailDto)
```

### 14.2 Invitation Confirm
```
Member -> Api: POST /team-invitations/confirm { token }
Api -> InvitationService: Validate token
InvitationService -> TeamMemberRepository: Update status CONFIRMED
Api -> TeamService: AttemptPromotion
TeamService -> TeamRepository: Lock event row; Count confirmed teams
TeamService -> TeamRepository: Update team to CONFIRMED or WAITLIST
Api -> Member: 200 OK
```

### 14.3 Quota Full Scenario (concurrent)
```
MemberA -> Api: Confirm(tokenA)
MemberB -> Api: Confirm(tokenB)
Api(Confirm A) -> Begin Tx -> Lock Event Row
Api(Confirm B) -> Begin Tx -> Wait for lock
Confirm A -> Count confirmed (n), n < max -> promote TeamA -> Commit
Confirm B -> Acquire lock -> Count confirmed (n+1), n+1 == max -> promote TeamB or waitlist depending order -> Commit
```

---

## 15. Implementation Roadmap

Phase order (priority):
1. DB migration: add fields, unique indexes, constraints
2. Domain entities and enums
3. Repositories with critical methods and tests
4. InvitationService + EmailService and template
5. RegistrationService and TeamService
6. Controllers (Register, Confirm, Decline, GetMyTeams)
7. Admin endpoints (GetEventTeams, UpdateStatus)
8. Validation, DTO mapping, FluentValidation rules
9. Integration tests for happy+edge paths
10. Concurrency tests (quota)

---

## 16. Testing Strategy

Unit tests
- Service unit tests: register, confirm, decline, status transitions, validation failures
- Token generation and validation tests

Integration tests (DB-backed)
- Full flow: register -> invites -> confirm -> promote
- Quota boundary concurrency tests using parallel confirmation

Edge cases
- Token expiry, resend flows, duplicate registration, illegal transitions

Performance
- Simulate registration spike, bulk invites

---

## 17. Final Architect Review

Risks & mitigations
- Race conditions at quota: solved via DB locking + retries
- Email delivery failures: retry policy and background queue
- Partial failures: ensure compensating transactions and visibility into failed registrations

Improvements
- Add waitlist promotion job that auto-promotes when slots open
- Add admin dashboard for manual promotion/rejection with audit
- Consider event-scope caching for read-heavy lists with invalidation on changes

---

### Appendix: Quick DB DDL snippets (recommended)
```sql
-- Unique member email per event
CREATE UNIQUE INDEX ux_team_members_event_email ON team_members (event_id, lower(email));

-- Lock row candidate: event counters row
CREATE TABLE event_counters (
  event_id uuid PRIMARY KEY,
  confirmed_count int NOT NULL DEFAULT 0
);
```

---

File generated from the Phase 3 architecture & spec conversation. Review and request edits if you want tighter API shapes, DTO types, or extra sequences.

---

## Principal Architect Review & Production Hardenings

This section supplements the Phase 3 specification with an enterprise-grade review, concrete hardening recommendations, and prioritized next steps required for production readiness. It consolidates the architecture critique performed by the principal architect and maps the high-risk findings to actionable mitigations.

### A. Summary
- The current aggregate model (Team aggregate owning TeamMember) is appropriate for in-team invariants. Cross-aggregate invariants (event quota) require an explicit reservation or saga pattern to avoid transactional coupling and race conditions under load.
- Move heavy external interactions (email delivery, waitlist promotion) out of synchronous API flows into asynchronous, durable workers using the Outbox pattern and a message broker.

### B. High-risk areas (quick list)
- Quota oversubscription under concurrent confirms.
- Token replay and multi-device simultaneous confirmation.
- Lost invitations or partial state when email delivery fails synchronously.
- Lack of immutable domain events and audit trail for forensic and GDPR needs.
- No idempotency enforcement for mutating endpoints.

### C. Missing production components
1. Transactional Outbox table and worker to reliably publish domain events and drive external side effects (emails, webhooks).
2. Slot reservation table (`slot_reservations`) to model quota reservations with TTL and deterministic allocation.
3. Saga / orchestration support for confirm → reserve → promote flows, with compensating actions.
4. Immutable `domain_events` append-only table for replay and audits.
5. Idempotency store for POST endpoints keyed by `Idempotency-Key`.
6. Email delivery pipeline with provider webhooks, bounce handling, and DLQ.
7. Waitlist queue and promotion worker with explicit priorities and TTL.
8. Audit logs (immutable) and data retention/anonymization pipeline for PII compliance.

### D. Recommended redesigns (detailed)

1) Quota & reservation redesign
- Implement explicit `slot_reservations` as the canonical mechanism for reserving a team slot. Reservation is created by the Saga after the final member confirms.
- Reservation table columns: reservation_id, event_id, team_id, reserved_at, expires_at, status (RESERVED/CONFIRMED/RELEASED), metadata.
- Reservation creation is an atomic DB operation (insert) guarded by a unique constraint that prevents exceeding `max_teams`. Use `INSERT ... SELECT` semantics or Postgres advisory locks to implement atomicity without long transactions on `events`.

2) Outbox and event-driven flow
- All side-effects (invite email sends, waitlist notifications, metrics emit) must be written to `outbox` in the same transaction that mutates aggregates. An outbox processor reliably publishes messages to the broker and updates outbox row on success.

3) Token architecture
- Tokens are random (>=128-bit), but the database stores only HMAC_SHA256(token, secret) or PBKDF2-derived hash to avoid plaintext leakage.
- Tokens carry a version/nonce so resends can invalidate older tokens. Store `invite_nonce` and check equality with incoming token metadata.
- Single-use enforcement: update `invite_consumed_at` in an atomic SELECT ... FOR UPDATE transaction when validating tokens; subsequent uses detect consumed state and return a consistent, idempotent response.

4) Waitlist policy
- Implement explicit waitlist queue with `position` and optional `priority` fields. Promotion worker polls when confirmed_count < max_teams and attempts promotion by creating a reservation for the waitlisted team. Promotions must be idempotent and observable.

5) Audit & domain events
- Persist domain events (`domain_events`) alongside state mutations. Use events to rebuild read projections and to provide an auditable timeline for each team membership lifecycle.

### E. Improved database design (concrete additions)
- Tables to add:
  - `outbox (id, aggregate_type, aggregate_id, event_type, payload jsonb, attempts int, last_error text, processed boolean, processed_at, created_at)`
  - `slot_reservations (reservation_id uuid PK, event_id, team_id, reserved_at, expires_at, status)`
  - `domain_events (id serial, aggregate_type, aggregate_id, event_type, payload jsonb, created_at)`
  - `audit_logs (id, actor_id, actor_email, action, entity_type, entity_id, before jsonb, after jsonb, created_at)`

- Token handling:
  - `team_members.invite_token_hash` (varchar), `invite_nonce`, `invite_sent_at`, `invite_expires_at`, `invite_consumed_at`, `invite_consumed_by`
  - Persist only hashes; accept token from user, compute HMAC and compare.

- Index and constraints:
  - `UNIQUE(event_id, lower(email))` on `team_members`
  - `UNIQUE(event_id, team_id)` in `slot_reservations` as needed
  - `FK` constraints for referential integrity

### F. Improved API design (concrete)

1) Idempotency
- All mutating endpoints must support `Idempotency-Key` header for POSTs (persist key → response mapping for TTL). On duplicate key, return stored response.

2) Confirm endpoint semantics
- Prefer synchronous token validation + persist member CONFIRMED + outbox write (202 Accepted) and run slot reservation via Saga asynchronously. Return a projection of current team status and a saga ticket id for the client to poll if needed.

3) Pagination & filtering
- Implement keyset pagination for `GET /events/{eventId}/teams` with `limit` and `cursor`. Support filters: `status`, `memberEmail`, `searchName`.

4) Error contract
- Use RFC7807 Problem Details JSON with `error_code`, `detail`, `instance` and hints for retry/idempotency.

### G. Infrastructure & operational recommendations
- Broker: Kafka for durable, replayable streams; RabbitMQ/SQS acceptable for task queues.
- Outbox worker: autoscaled container, DLQ and alerting.
- Waitlist worker: scheduled/triggered worker that attempts promotions when slots open.
- Email pipeline: provider webhooks mapped into `email_events` table; bounce handling and blacklist.
- Observability: OpenTelemetry, Prometheus, Grafana, structured logs.

### H. Transaction boundaries and concurrency
- Keep each aggregate mutation + outbox insertion in a single DB transaction. Prefer reservation-insert for quota allocation rather than long SELECT FOR UPDATE locks.

### I. Idempotency & retry strategy
- Implement exponential backoff with jitter in workers; move permanent failures to DLQ with alerting. Saga handles bounded retries for reservation failures.

### J. PII & GDPR
- Encrypt raw PII fields at rest or store only deterministic hashes for dedupe. Provide an anonymization pipeline to remove PII on retention expiry while keeping audit traces.

### K. Security & abuse prevention
- Rate-limit per IP/user, CAPTCHA escalation, limit resends per member, rotate HMAC secrets with versioning.

### L. Observability & SLOs
- SLOs: Outbox processing latency < 60s, invite delivery 99% < 2min, confirm success rate 99.9% under nominal load.
- Alerts: outbox backlog, reservation failure spike, bounce rate.

### M. Final checklist (must implement before production)
- Outbox table and worker
- Token hashing and single-use enforcement
- Slot reservation table + Saga orchestration
- Idempotency middleware and persistence
- Email provider webhook handlers and bounce processing
- Waitlist promotion worker and admin override APIs
- Audit log and domain-events retention strategy
- OpenTelemetry instrumentation
- GDPR PII anonymization job

### N. Prioritized coding order (practical)
1. DB migrations: outbox, slot_reservations, domain_events, token fields, unique indexes
2. Idempotency middleware and store
3. Team + TeamMember repositories and unit tests
4. RegistrationService with outbox writes
5. Outbox worker and broker integration
6. InvitationService with token hash & single-use semantics
7. Confirm flow as Saga and slot_reservation logic
8. Waitlist promotion worker
9. Observability and monitoring
10. GDPR & retention jobs

---

If you'd like, I can now generate:
- DDL migration snippets for the new tables (`outbox`, `slot_reservations`, `domain_events`, `audit_logs`),
- A detailed Saga sequence diagram for confirm → reserve → promote, or
- An `Idempotency-Key` middleware specification and DB schema.

---

## 18. Run Guide

### 18.1 What is included
- Team registration: `POST /api/v1/events/{eventId}/teams`
- Invitation confirmation: `POST /api/v1/team-invitations/confirm`
- Invitation decline: `POST /api/v1/team-invitations/decline`
- My teams: `GET /api/v1/my/teams?eventId=...`
- Organizer teams: `GET /api/v1/events/{eventId}/teams`

### 18.2 How to run
1. Start PostgreSQL and the backend.
2. Run Flyway migrations on startup.
3. Ensure the backend is started from `BE/`.

```powershell
Set-Location E:\Hackathon\BE
mvn spring-boot:run
```

### 18.3 Flow notes
- `Idempotency-Key` is supported on team registration requests.
- Invitation tokens are stored hashed in `team_members.invite_token_hash`.
- Confirmation and decline endpoints accept the raw invitation token.
- Invitation delivery is written to the outbox table and processed by the scheduled outbox worker.

### 18.4 Validation tips
- Use a bearer token for registration and `GET /api/v1/my/teams`.
- Use an organizer JWT role for `GET /api/v1/events/{eventId}/teams`.
- Check the `outbox` table to verify invitation messages were created.

