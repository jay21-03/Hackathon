# GitHub Repo Provisioning & Commit Access Control Plan

## 1. Goal

- Add a post-MVP module that provisions one private GitHub repository for each competing team scope.
- Create repositories from an organizer-configured template when the problem is released.
- Grant team members push/write access during the competition window.
- Lock commit/push access when the round ends.
- Store repository URL and lifecycle status in the application database.
- Let AI Review read the team repository and commit history.
- Do not implement code in this task.

## 2. Current Project Context

CodeGraph review of the current branch shows these relevant backend domains:

- Contest model:
  - `Event` has `id`, `name`, registration window fields, team size limits, `status`, and audit timestamps.
  - `Round` belongs to an event through `eventId` and already has `startAt`, `endAt`, `roundType`, `roundOrder`, and `status`.
  - `Board` belongs to a round through `roundId` and has `status`.
  - `Problem` belongs to a board through `boardId` and already has `releaseAt`, which is the natural provisioning trigger.
- Registration model:
  - `Team` belongs to an event through `eventId` and has `status`, including `CONFIRMED`.
  - `TeamMember` stores `teamId`, `userId`, `email`, `fullName`, contact-person flag, invite fields, and member status.
  - There is no `githubUsername` field visible on `TeamMember` in the current branch.
- AI Review and repository model:
  - `aireview.entity.TeamRepository` already exists with `teamId`, `repositoryUrl`, `repositoryName`, review timestamps, `reviewIntervalMinutes`, `createdBy`, and audit timestamps.
  - `RepoCommit` already exists with `teamRepositoryId`, commit SHA, author name/email, message, and `committedAt`.
  - `AiReview` already exists with `teamId`, `roundId`, `repoCommitId`, `status`, score, summary, issues, suggestions, model, and review timestamp.
  - Existing `TeamRepository` is enough for basic AI Review linking, but not enough for provisioning access control because it lacks `roundId`, `boardId`, `problemId`, GitHub owner/repo identifiers, provision status, access status, open/close timestamps, and error fields.
- Repositories and services:
  - Existing repositories include contest lookups by event/round/board, registration lookups by event/status/team, and AI Review lookups by team and next review time.
  - `TeamRegistrationService` is currently skeleton-like.
  - `AiReviewService` and `AiReviewScheduler` exist, which gives a scheduler precedent, but AI Review implementation should not be disturbed by this spec task.
- Config/schema reality in this branch:
  - This spec task does not edit schema/config files.
  - Before implementation, the agent must re-check V1/Flyway schema, `application.yml`, and `.env.example` on the target implementation branch.
  - Do not assume schema/config absence from this spec branch.
  - `.env` exists; only key names were inspected. Current config patterns include DB, JWT, CORS, mail, `AI_REVIEW_INTERVAL_MINUTES`, file storage, and AI API key variables.

This spec does not modify Phase 7 work. AI Review is treated as an integration consumer of `team_repositories` and `repo_commits`, not as a module to rewrite.

## 3. Architecture Decision

Use many private repositories, not one repository with many branches.

Chosen model:

- One team plus one problem equals one private repository, when a round has separate problems per board.
- If the product later treats a round as the submission unit, the same design can map one team plus one round to one private repository.

Reasons:

- Permissions are isolated per team.
- Teams cannot see other teams' code.
- Commit access can be opened and closed per repository.
- Commit audit is simpler.
- AI Review can target one repository without branch filtering ambiguity.
- Retries and GitHub API failures are isolated to one team/problem repository.

## 4. GitHub Auth Strategy

Option A - GitHub App, recommended:

- Install a GitHub App into the organization that owns template and team repositories.
- Backend signs a JWT for the app and exchanges it for an installation access token through `POST /app/installations/{installation_id}/access_tokens`.
- Installation access tokens are short-lived; GitHub docs state they expire after 1 hour.
- Use minimal repository permissions, especially Administration write for repository creation/collaborator changes and Contents read for template access.
- This is the long-term production path.

Option B - PAT dev/demo:

- Use a fine-grained PAT or classic PAT only for local/demo speed.
- Easier to configure for Swagger/manual testing.
- Not recommended for production because token ownership, rotation, and blast radius are weaker.

Recommendation:

- MVP may support PAT mode first if speed is necessary.
- Long-term should use GitHub App mode.

Proposed environment variables:

- `GITHUB_MODE=app|pat`
- `GITHUB_ORG=...`
- `GITHUB_APP_ID=...`
- `GITHUB_APP_INSTALLATION_ID=...`
- `GITHUB_APP_PRIVATE_KEY_PATH=...`
- `GITHUB_APP_PRIVATE_KEY=...`
- `GITHUB_PAT=...`
- `GITHUB_TEMPLATE_OWNER=...`
- `GITHUB_TEMPLATE_REPO=...`
- `GITHUB_DEFAULT_BRANCH=main`

Never store GitHub tokens, private keys, or PATs in the database.

Official GitHub docs checked:

- GitHub App installation authentication: https://docs.github.com/en/enterprise-server@3.19/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation
- Create repository from template: https://docs.github.com/en/rest/repos/repos#create-a-repository-using-a-template
- Collaborator permissions: https://docs.github.com/en/rest/collaborators/collaborators#add-a-repository-collaborator
- Branch protection lock option: https://docs.github.com/en/rest/branches/branch-protection

## 5. Repository Provisioning Flow

1. Organizer configures a template repository for a problem.
2. System selects eligible teams:
   - Team status is `CONFIRMED`.
   - Team belongs to the event/board/problem scope.
   - Current time is greater than or equal to `problem.releaseAt`.
   - No repository already exists for the same team/problem.
3. Backend creates a private repository from the template with `POST /repos/{template_owner}/{template_repo}/generate`.
4. Backend adds team members as collaborators with push/write access.
5. Backend stores the repository row in `team_repositories`.
6. Backend sets `access_status = OPEN`.
7. Participant endpoints expose the repository link to members of that team.
8. AI Review reads the repository URL and commit records through the existing AI Review domain.

## 6. Lock Commit Flow

1. Scheduler checks rounds whose `endAt` has passed.
2. For each open repository in the expired round:
   - Downgrade collaborators from push/write to pull/read, or
   - Remove collaborators, or
   - Lock the default branch through branch protection.
3. Set `access_status = CLOSED`.
4. Store `closedAt`.
5. After closure, team members may still see the repository link, but they cannot push.

MVP decision:

- Downgrade collaborator permission to pull/read because it is the easiest path to demonstrate and reverse.
- Branch protection with `lock_branch=true` is a later hardening layer, especially if organization-level grants could still allow push.

## 7. DB Plan

Use existing `team_repositories` concept where possible. The current entity has:

- `id`
- `teamId`
- `repositoryUrl`
- `repositoryName`
- `lastReviewedAt`
- `nextReviewAt`
- `reviewIntervalMinutes`
- `createdBy`
- `createdAt`
- `updatedAt`

For provisioning and access control, it should eventually support:

- `id`
- `team_id`
- `round_id`
- `board_id`
- `problem_id`
- `repository_url`
- `repository_name`
- `github_owner`
- `github_repo_name`
- `github_repo_id`
- `access_status`: `PENDING`, `OPEN`, `CLOSED`, `FAILED`
- `provision_status`: `PENDING`, `CREATED`, `FAILED`
- `opened_at`
- `closed_at`
- `provisioned_at`
- `last_error`
- `last_reviewed_at`
- `next_review_at`
- `review_interval_minutes`
- `created_at`
- `updated_at`

If the existing table should stay focused on AI Review, add a separate job table:

`github_repo_provisioning_jobs`

- `id`
- `team_id`
- `problem_id`
- `action_type`: `CREATE`, `OPEN_ACCESS`, `CLOSE_ACCESS`
- `status`: `PENDING`, `RUNNING`, `SUCCESS`, `FAILED`
- `attempt_count`
- `last_error`
- `scheduled_at`
- `executed_at`
- `created_at`

Problem/template config options:

Option A - add fields to `problems`:

- `template_repo_owner`
- `template_repo_name`
- `repo_provisioning_enabled`

Option B - add table `problem_repository_templates`:

- `id`
- `problem_id`
- `template_owner`
- `template_repo`
- `default_branch`
- `enabled`
- `created_by`
- `created_at`
- `updated_at`

Recommendation:

- Prefer `problem_repository_templates` to keep GitHub integration config separate from the core contest/problem table.
- If a later branch already added matching fields to `problems`, reuse them instead.
- Do not create Flyway/schema changes in this task.

## 8. API Plan

Admin/Organizer APIs:

- `POST /api/v1/admin/problems/{problemId}/repo-template`
- `PUT /api/v1/admin/problems/{problemId}/repo-template`
- `GET /api/v1/admin/problems/{problemId}/repo-template`
- `POST /api/v1/admin/problems/{problemId}/repositories/provision`
- `POST /api/v1/admin/rounds/{roundId}/repositories/lock`
- `POST /api/v1/admin/team-repositories/{repositoryId}/retry`
- `GET /api/v1/admin/events/{eventId}/repositories`
- `GET /api/v1/admin/teams/{teamId}/repository`

Participant APIs:

- `GET /api/v1/me/repositories`
- `GET /api/v1/me/teams/{teamId}/repository`

Scheduler/internal service methods:

- `provisionDueRepositories()`
- `closeExpiredRepositories()`

No frontend changes are required for this spec.

## 9. Service Design

Create layered services so controllers do not call GitHub APIs directly.

`GitHubAuthService`

- `getInstallationToken()`
- `getPatTokenForDev()`

`GitHubRepositoryClient`

- `createRepoFromTemplate()`
- `addCollaborator()`
- `updateCollaboratorPermission()`
- `removeCollaborator()`
- `getRepository()`
- `listCommits()`

`RepositoryProvisioningService`

- `provisionForProblem(problemId)`
- `provisionForTeamProblem(teamId, problemId)`
- `openAccess(repositoryId)`
- `closeAccess(repositoryId)`
- `retryFailed(repositoryId)`

`RepositoryAccessScheduler`

- `provisionDueRepositories()`
- `closeExpiredRepositories()`

Controllers should validate auth/role and delegate to services. GitHub API request signing, retry, and response mapping should stay in infrastructure/client code.

## 10. Access Control Rules

- Only Organizer/Admin can configure templates, provision repositories, lock repositories, and retry failed jobs.
- Participant can only view repositories for teams they belong to.
- Do not create repositories for teams that are not `CONFIRMED`.
- Do not open repository access before `problem.releaseAt`.
- Do not allow push after `round.endAt`.
- Do not create duplicate repositories for the same team/problem.
- Repository names must be deterministic and unique.

Suggested repository name format:

`seal-{eventSlug}-team-{teamId}-problem-{problemId}`

If slugs are not available yet, use:

`seal-event-{eventId}-team-{teamId}-problem-{problemId}`

## 11. GitHub Username Requirement

GitHub collaborators require GitHub usernames, not email addresses.

Current `TeamMember` does not expose a `githubUsername` field. A later implementation should add or reuse one of these:

- `users.github_username`
- `team_members.github_username`

Validation:

- If a team member is missing a GitHub username, the repository can technically be created but collaborator access cannot be granted.
- MVP recommendation: mark provisioning as `FAILED` and show an Organizer-safe error so the organizer can fix the member profile before retrying.
- Do not expose raw GitHub error payloads to participants.

## 12. Failure/Retry Plan

Handle at least these failures:

- GitHub API rate limit.
- Template repository not found or not marked as a template.
- Repository name collision.
- Collaborator username not found.
- Collaborator invitation restricted by organization policy.
- Token expired.
- Network timeout or transient GitHub API error.

Rules:

- Do not fail all teams when one team fails.
- Persist status and `last_error` per repository/job.
- Provide a retry endpoint.
- Make provisioning idempotent. Re-running should reuse an existing repository row or GitHub repository instead of creating duplicates.
- Store sanitized errors for UI/admin diagnostics.

## 13. Security Plan

- Never log GitHub PATs, app private keys, JWTs, or installation access tokens.
- Never store PATs or private keys in the database.
- Keep secrets in environment/config only.
- Request the minimum GitHub permissions needed.
- Create team repositories as private by default.
- Do not expose internal GitHub error payloads directly to participants.
- Audit organizer/admin actions if an audit pattern exists or is added later.
- Treat collaborator invitations as external access and document organization policy requirements.

## 14. Scheduler Plan

- Run scheduler every 1 to 5 minutes.
- `provisionDueRepositories()`:
  - Find released problems.
  - Find confirmed teams in scope.
  - Skip team/problem pairs with existing repositories.
  - Queue or execute provisioning idempotently.
- `closeExpiredRepositories()`:
  - Find rounds whose `endAt` has passed.
  - Find repositories still `OPEN`.
  - Downgrade collaborator access or lock the branch.
- Scheduler must be idempotent and safe to run concurrently.
- Existing `AiReviewScheduler` shows scheduler infrastructure can fit the project, but this spec does not change it.

## 15. Swagger Test Plan

- Organizer configures template repo successfully.
- Participant attempts to configure template repo and receives `403`.
- Organizer provisions problem repositories before `releaseAt` and receives `400` or `409`.
- Organizer provisions after `releaseAt` and receives success; repository rows become `CREATED` and `OPEN`.
- Provisioning is retried and does not create duplicates.
- Missing `githubUsername` marks repository/job `FAILED` or returns `400`, depending on selected MVP rule.
- Participant views own team repository and receives `200`.
- Participant views another team's repository and receives `403` or `404`.
- Organizer locks repositories before `round.endAt` and receives `400` or `409`.
- Organizer locks repositories after `round.endAt` and repositories become `CLOSED`.
- Organizer retries a failed repository and receives `200` or queued status.
- Missing/invalid GitHub token in admin provisioning receives an admin-visible auth/config error, without printing the token.

## 16. Non-goals

- Do not implement code in this spec task.
- Do not modify frontend.
- Do not modify Flyway/schema in this task.
- Do not use one repository with many branches.
- Do not integrate GitHub Classroom directly.
- Do not build a full CI runner or automatic grading system in this phase.
- Do not add new AI Review logic while Phase 7 is being implemented separately.

## 17. Implementation Order Suggestion

1. Finalize DB migration plan.
2. Add GitHub config environment keys.
3. Add GitHub auth/client abstraction.
4. Add repository template config API.
5. Add manual provision/lock APIs.
6. Add scheduler for automatic release/lock.
7. Add participant repository view API.
8. Connect AI Review to `team_repositories` if needed.
9. Add Swagger tests.
10. Add retry and failure handling.

## 17.1 Implementation Slices

Slice 1 - DB/config foundation:

- Add/extend DB fields/tables for repository template and provisioning status.
- Add env config for GitHub App/PAT.
- No GitHub API calls yet.

Slice 2 - Template config API:

- Organizer configures template owner/repo per problem.
- Validate repo template config shape.
- No repo provisioning yet.

Slice 3 - Manual provisioning API:

- Organizer manually provisions repos for a released problem.
- Create one private repo per confirmed team/problem.
- Save team_repositories rows.
- Add collaborators if githubUsername exists.

Slice 4 - Manual lock API:

- Organizer manually locks repositories after round end.
- Downgrade write to read or remove collaborators.
- Mark access_status CLOSED.

Slice 5 - Scheduler:

- Auto provision after problem.releaseAt.
- Auto close after round.endAt.
- Idempotent and retry-safe.

Slice 6 - Participant/AI Review integration:

- Participant can view own repo links.
- AI Review reads from team_repositories/repo_commits.
- Do not rewrite AI Review module unless necessary.

## 18. Acceptance Criteria

- Spec clearly chooses many private repositories.
- Spec rejects one repository with many branches.
- Spec includes DB, API, service, security, scheduler, and Swagger test plans.
- Spec identifies current reusable entities and missing fields.
- Spec avoids conflict with Phase 7 AI Review work.
- Spec is enough to implement in small later slices.
- Spec is implementable in small slices.
- Implementation must re-check actual schema/config on the target branch before coding.
- No assumptions from missing files in the spec branch should drive schema decisions.
- This task changes only markdown documentation.
- This task does not change Java code.
- This task does not change frontend code.
- This task does not change Flyway/schema.
