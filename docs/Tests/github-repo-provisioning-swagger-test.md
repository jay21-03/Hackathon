# GitHub Repo Provisioning Swagger Test

## 1. Create a GitHub template repo

1. Create a repository under the GitHub organization or account that your PAT can access.
2. Add starter code or a README.
3. In GitHub repository settings, enable **Template repository**.
4. Note the `templateOwner` and `templateRepo` values.

## 2. Create a PAT for dev

Use a dev-only GitHub token with permission to create private repositories from templates and manage collaborators in the target organization. Do not commit or paste the token into Swagger responses, logs, or tickets.

## 3. Set env

Set these values in `Hackathon/.env` or your local backend run environment:

```env
GITHUB_MODE=pat
GITHUB_ORG=your-org
GITHUB_PAT=your-dev-token
GITHUB_DEFAULT_BRANCH=main
GITHUB_API_BASE_URL=https://api.github.com
GITHUB_API_VERSION=2026-03-10
```

## 4. Run BE and DB

Run your usual Docker BE + DB flow for this project. This guide does not require Docker build/up from the agent.

Swagger is available at:

```text
http://localhost:8085/swagger-ui.html
```

## 5. Seed/check data

Before provisioning, verify you have:

- An event.
- A round with `endAt`.
- A board in that round.
- A problem on that board with `releaseAt`.
- Confirmed teams assigned to the board through board slots.
- Confirmed team members with linked `users.id`.
- `users.github_username` set for every confirmed member.

Temporary SQL shape for dev:

```sql
UPDATE users SET github_username = 'github-login' WHERE email = 'member@example.com';
```

## 6. Authorize Swagger

Log in as an organizer, copy the JWT, click **Authorize**, and enter:

```text
Bearer <organizer-jwt>
```

## 7. Save/get template

Call:

- `POST /api/v1/admin/problems/{problemId}/repo-template`
- `GET /api/v1/admin/problems/{problemId}/repo-template`

Example body:

```json
{
  "templateOwner": "your-org",
  "templateRepo": "template-repo",
  "defaultBranch": "main",
  "enabled": true
}
```

## 8. Provision before releaseAt

If `problem.releaseAt` is in the future, call:

```text
POST /api/v1/admin/problems/{problemId}/repositories/provision
```

Expected: `409` with `Problem is not released yet`.

For dev-only override:

```text
POST /api/v1/admin/problems/{problemId}/repositories/provision?force=true
```

## 9. Provision after releaseAt

Set `releaseAt` in the past or use `force=true`, then provision again.

Expected:

- One result per confirmed team assigned to the board.
- Repository name like `seal-event-{eventId}-team-{teamId}-problem-{problemId}`.
- Successful rows have `provisionStatus=CREATED` and `accessStatus=OPEN`.

## 10. Check GitHub repo

In GitHub, verify the private repository exists under `GITHUB_ORG`.

## 11. Check collaborator push access

Open the repository collaborators page and verify confirmed team members have write/push access or pending invitations.

## 12. Participant views own repo

Authorize as a participant JWT and call:

- `GET /api/v1/me/repositories`
- `GET /api/v1/me/teams/{teamId}/repository`

Expected: participant sees only repositories for teams they belong to. `lastError` is hidden from participant responses.

## 13. Lock repositories

After `round.endAt`, call as organizer:

```text
POST /api/v1/admin/rounds/{roundId}/repositories/lock
```

Expected: open repositories are downgraded and rows become `accessStatus=CLOSED`.

## 14. Check collaborator pull access

In GitHub, verify collaborators no longer have push/write access and have pull/read access.

## 15. Idempotency

Call provision for the same problem again.

Expected: existing team/problem repository rows are returned and no duplicate GitHub repositories are created.

For a failed row, use:

```text
POST /api/v1/admin/team-repositories/{repositoryId}/retry
```

## 16. Check DB

Useful queries:

```sql
SELECT * FROM problem_repository_templates WHERE problem_id = <problem_id>;
SELECT id, team_id, problem_id, github_repo_name, provision_status, access_status, last_error
FROM team_repositories
WHERE problem_id = <problem_id>;
SELECT id, email, github_username FROM users WHERE github_username IS NOT NULL;
```
