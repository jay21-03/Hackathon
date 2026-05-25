# Backend Foundation Phase 0 Plan

## 1. Goal
Align JPA entities, repositories, and enum/status modeling with the Flyway schema so the backend compiles cleanly and `ddl-auto=validate` passes without schema drift. This phase is mapping and verification only; it must not change business logic.

## 2. Current Context
- Backend runs on port 8085.
- PostgreSQL Docker runs on host port 5433.
- Flyway has already migrated the foundation schema.
- Swagger is available at `http://localhost:8085/swagger-ui.html`.
- Frontend runs separately at `http://localhost:5173` and is out of scope for this phase.
- Phase 0 does not implement new business behavior.

## 3. Database Tables Covered
- users
- user_roles
- events
- rounds
- boards
- board_slots
- problems
- teams
- team_members
- check_ins
- mentor_assignments
- judge_assignments
- score_criteria
- score_sheets
- score_items
- ranking_results
- advancements
- team_repositories
- repo_commits
- ai_reviews
- announcements
- notifications

## 4. Entity Verification Checklist

| Table | Entity | Package | Columns mapped? | FK mapped? | Enum/status mapped? | Risk/Note |
|---|---|---|---|---|---|---|
| users | User | com.seal.hackathon.authprofile.entity | Yes, to verify | Partial; verify user references are modeled | No; `status` is still String | Unique email and timestamps must match schema |
| user_roles | UserRole | com.seal.hackathon.authprofile.entity | Yes, to verify | Yes, `userId` should match users | No; `role` is String | Repository is present but methods are minimal |
| events | Event | com.seal.hackathon.contest.entity | Yes, to verify | Yes, `createdBy` should match users | No; `status` is still String | Must keep `max_teams`, `min_team_size`, `max_team_size` constraints intact |
| rounds | Round | com.seal.hackathon.contest.entity | Yes, to verify | Yes, `eventId` should match events | No; `roundType` and `status` are Strings | Unique `(event_id, round_order)` needs to remain valid |
| boards | Board | com.seal.hackathon.contest.entity | Yes, to verify | Yes, `roundId` should match rounds | No; `status` is String | Unique board constraints must be preserved |
| board_slots | BoardSlot | com.seal.hackathon.contest.entity | Yes, to verify | Yes, `roundId`, `boardId`, `teamId` should match parents | Not applicable | Unique board/team constraints need validation |
| problems | Problem | com.seal.hackathon.contest.entity | Yes, to verify | Yes, `boardId`, `createdBy` should match parents | Not applicable | `release_at` must drive access behavior |
| teams | Team | com.seal.hackathon.registration.entity | Yes, to verify | Yes, `eventId`, `contactUserId` should match parents | No; `status` is String | Team size rule remains 1-5 and event quota remains `events.max_teams` |
| team_members | TeamMember | com.seal.hackathon.registration.entity | Yes, to verify | Yes, `eventId`, `teamId`, `userId` should match parents | No; `status` is String | Must not add `require_full_team_checkin` behavior |
| check_ins | CheckIn | com.seal.hackathon.checkin.entity | Yes, to verify | Yes, `eventId`, `teamId`, `teamMemberId`, `userId`, `verifiedBy` should match parents | No; `status` is String | Check-in must not block problem viewing |
| mentor_assignments | MentorAssignment | com.seal.hackathon.assignment.entity | Yes, to verify | Yes, `boardId`, `mentorId` should match parents | Not applicable | Repository exists but is bare |
| judge_assignments | JudgeAssignment | com.seal.hackathon.assignment.entity | Yes, to verify | Yes, `boardId`, `judgeId` should match parents | Not applicable | Repository exists but is bare |
| score_criteria | ScoreCriteria | com.seal.hackathon.scoring.entity | Yes, to verify | Yes, `roundId` should match rounds | Not applicable | Numeric precision must match schema |
| score_sheets | ScoreSheet | com.seal.hackathon.scoring.entity | Yes, to verify | Yes, `judgeAssignmentId`, `boardId`, `teamId`, `judgeId` should match parents | No; `status` is String | Unique board/team/judge constraint must remain valid |
| score_items | ScoreItem | com.seal.hackathon.scoring.entity | Yes, to verify | Yes, `scoreSheetId`, `criteriaId` should match parents | Not applicable | ON DELETE CASCADE from score_sheets should be respected |
| ranking_results | RankingResult | com.seal.hackathon.ranking.entity | Yes, to verify | Yes, `roundId`, `boardId`, `teamId` should match parents | Not applicable | Ranking uses `average_score` |
| advancements | Advancement | com.seal.hackathon.ranking.entity | Yes, to verify | Yes, `fromRoundId`, `fromBoardId`, `toRoundId`, `toBoardId`, `teamId`, `createdBy` should match parents | Not applicable | Advancement remains manually selected by Organizer |
| team_repositories | TeamRepository | com.seal.hackathon.aireview.entity | Yes, to verify | Yes, `teamId`, `createdBy` should match parents | Not applicable | Repository name in code is `TeamRepositoryEntityRepository` |
| repo_commits | RepoCommit | com.seal.hackathon.aireview.entity | Yes, to verify | Yes, `teamRepositoryId` should match team_repositories | Not applicable | Review scheduling depends on repo commit history |
| ai_reviews | AiReview | com.seal.hackathon.aireview.entity | Yes, to verify | Yes, `teamId`, `roundId`, `repoCommitId` should match parents | No; `status` is String | Must preserve `last_reviewed_at`, `next_review_at`, and `review_interval_minutes` on team_repositories |
| announcements | Announcement | com.seal.hackathon.notification.entity | Yes, to verify | Yes, `eventId`, `createdBy` should match parents | Not applicable | Notification-like model but distinct from notifications |
| notifications | Notification | com.seal.hackathon.notification.entity | Yes, to verify | Yes, `userId`, `eventId` should match parents | Not applicable | `is_read` default and timestamps must remain intact |

## 4.1 Mapping Strategy
- Do not change the Flyway schema in Phase 0.
- Do not create a V2 migration in Phase 0.
- Do not rename tables or columns.
- Prefer making entities match `V1__init_schema.sql` exactly before considering any mapping refactor.
- If an entity currently uses Long foreign keys such as `eventId`, `teamId`, or `userId`, and `ddl-auto=validate` passes, keep that shape for Phase 0.
- Do not automatically convert all foreign keys to `@ManyToOne` if it is not required to satisfy validation.
- Do not add bidirectional `@OneToMany` relationships because they increase the risk of JSON recursion.
- Use `@ManyToOne` and `@JoinColumn` only when the entity already follows that direction or when a mapping error is clearly wrong and needs correction.

## 4.2 Critical Columns to Preserve
- `events.max_teams`
- `events.min_team_size`
- `events.max_team_size`
- `problems.release_at`
- `ranking_results.average_score`
- `team_repositories.last_reviewed_at`
- `team_repositories.next_review_at`
- `team_repositories.review_interval_minutes`
- `team_members.email`
- `board_slots.round_id`
- `board_slots.team_id`
- `score_sheets.status`
- `ai_reviews.status`

## 5. Enum Standardization Plan
Target enums to introduce or align:
- UserStatus
- SystemRole
- EventStatus
- RoundStatus
- RoundType
- BoardStatus
- TeamStatus
- TeamMemberStatus
- CheckInStatus
- ScoreSheetStatus
- AiReviewStatus

Rules:
- Enum conversion must be safe and must not change DB values.
- Use `@Enumerated(EnumType.STRING)` only when the entity is already ready for enum mapping.
- If a field is still used widely as a `String` in code, keep it as TODO instead of forcing a conversion in Phase 0.
- Repository query methods must use the current type: `enum` if the entity has been converted, `String` if it has not.
- Do not change the API JSON contract in Phase 0.

Proposed enum values:

UserStatus:
- ACTIVE
- DISABLED

SystemRole:
- ORGANIZER
- MENTOR
- JUDGE

EventStatus:
- DRAFT
- REGISTRATION_OPEN
- REGISTRATION_CLOSED
- IN_PROGRESS
- COMPLETED
- CANCELLED

RoundType:
- GROUP_STAGE
- FINAL

RoundStatus:
- UPCOMING
- PROBLEM_RELEASED
- SCORING
- COMPLETED

BoardStatus:
- DRAFT
- READY
- SCORING
- RANKED
- COMPLETED

TeamStatus:
- PENDING
- CONFIRMED
- WAITLIST
- REJECTED
- DISQUALIFIED

TeamMemberStatus:
- INVITED
- CONFIRMED
- DECLINED

CheckInStatus:
- PENDING
- APPROVED
- REJECTED

ScoreSheetStatus:
- DRAFT
- SUBMITTED

AiReviewStatus:
- PENDING
- COMPLETED
- FAILED

## 6. Repository Verification Plan
Repositories expected to exist or be verified:
- UserRepository
- UserRoleRepository
- EventRepository
- RoundRepository
- BoardRepository
- BoardSlotRepository
- ProblemRepository
- TeamRepository in `registration`
- TeamMemberRepository
- CheckInRepository
- MentorAssignmentRepository
- JudgeAssignmentRepository
- ScoreCriteriaRepository
- ScoreSheetRepository
- ScoreItemRepository
- RankingResultRepository
- AdvancementRepository
- TeamRepositoryEntityRepository for `team_repositories`
- RepoCommitRepository
- AiReviewRepository
- AnnouncementRepository
- NotificationRepository

Repository method shape to add or verify:
- Optional<User> findByEmail(String email)
- List<UserRole> findByUserId(Long userId)
- List<Event> findByStatus(EventStatus status) or `String status` if the entity has not been converted yet
- List<Round> findByEventId(Long eventId)
- List<Board> findByRoundId(Long roundId)
- List<BoardSlot> findByBoardId(Long boardId)
- List<BoardSlot> findByRoundId(Long roundId)
- List<Team> findByEventId(Long eventId)
- List<Team> findByEventIdAndStatus(Long eventId, TeamStatus status) or `String status` if the entity has not been converted yet
- List<TeamMember> findByTeamId(Long teamId)
- Optional<TeamMember> findByEventIdAndEmail(Long eventId, String email)
- List<CheckIn> findByEventId(Long eventId)
- Optional<CheckIn> findByTeamMemberId(Long teamMemberId)
- List<MentorAssignment> findByBoardId(Long boardId)
- List<JudgeAssignment> findByBoardId(Long boardId)
- List<ScoreCriteria> findByRoundId(Long roundId)
- List<ScoreSheet> findByBoardIdAndTeamId(Long boardId, Long teamId)
- List<ScoreSheet> findByJudgeId(Long judgeId)
- List<RankingResult> findByBoardId(Long boardId)
- List<Advancement> findByToRoundId(Long toRoundId)
- List<TeamRepository> findByNextReviewAtLessThanEqual(LocalDateTime now) for the AI review repository if the current repository name remains unchanged
- List<AiReview> findByTeamId(Long teamId)
- List<Announcement> findByEventId(Long eventId)
- List<Notification> findByUserId(Long userId)

## 7. Validation Commands
Run these after the mapping and repository changes are implemented:
- `cd seal-hackathon/backend`
- `mvn -DskipTests compile`
- `.\run-dev.ps1`
- `docker compose exec postgres psql -U postgres -d seal_hackathon -c "\dt"`

## 8. Acceptance Criteria
Phase 0 is done when:
- All entities match the main tables and columns in `V1__init_schema.sql`.
- Flyway schema remains unchanged in Phase 0.
- There are no entity fields mapped to the wrong column names.
- Mapping strategy is documented for Long foreign keys versus `@ManyToOne`.
- Repositories exist for the 22 domain tables and key query methods have explicit return types.
- Enum/status fields are standardized or explicitly tracked with a migration plan, without changing API JSON contract.
- Critical columns listed in Section 4.2 are preserved.
- `mvn -DskipTests compile` passes.
- `backend/run-dev.ps1` starts successfully.
- Hibernate `ddl-auto=validate` does not fail.
- No business logic is changed.

## 8.1 Non-goals for Phase 0
- Do not implement Auth/Profile logic.
- Do not implement Team Registration.
- Do not implement Board Assignment.
- Do not implement Problem Access.
- Do not implement Check-in logic.
- Do not implement Scoring/Ranking.
- Do not call any AI API.
- Do not modify the UI.
- Do not change the database schema.

## 9. Risks
- Converting `String` statuses to enums can affect JSON payloads and API compatibility.
- Bidirectional associations may introduce JSON recursion if they are added later without care.
- `TeamRepository` in the registration package and `TeamRepositoryEntityRepository` in the aireview package can be confused during maintenance.
- `ddl-auto=validate` can fail on precision, nullability, or naming mismatches even if the schema is otherwise correct.
- Column renames should not be done automatically because Flyway already owns the schema history.

## 10. Implementation Order Proposal
1. Entity and table mapping verification.
2. Enum standardization.
3. Repository query method additions.
4. Compile validation.
5. Backend runtime validation.
6. Commit after review.

## 11. Findings
- Many current status fields are still modeled as `String` instead of enums, including `User`, `Event`, `Round`, `Board`, `Team`, `TeamMember`, `CheckIn`, `ScoreSheet`, and `AiReview`.
- No enum classes were found under `backend/src/main/java` during inspection.
- `UserRepository` already has `findByEmail`; most other repositories inspected are still bare `JpaRepository` declarations.
- The team repository for AI review scheduling is named `TeamRepositoryEntityRepository`, which is functionally clear but naming-inconsistent with the rest of the codebase.
- The Flyway file inspected defines the required foundation tables and supporting indexes; no business logic should be changed in this phase.