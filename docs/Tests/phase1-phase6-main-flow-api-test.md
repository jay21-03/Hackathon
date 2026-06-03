# Checklist Test Nhanh Swagger - Phase 1 Den Phase 6

Tuan tu luong chinh, dung cho Swagger UI / Postman.

## Header chung

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

## Phase 1 - Auth / Profile / Role

- [ ] `POST /api/v1/auth/google-login`
  - Lay `accessToken`.
- [ ] `GET /api/v1/me`
  - Kiem tra thong tin user hien tai.
- [ ] `PUT /api/v1/me/profile`
  - Cap nhat `fullName`, `studentId`, `university`, `avatarUrl`.
- [ ] `GET /api/v1/admin/users`
  - Chi Organizer moi duoc xem.
- [ ] `POST /api/v1/admin/users/{userId}/roles`
  - Gan role `MENTOR` hoac `JUDGE`.

## Phase 2 - Contest Management

- [ ] `POST /api/v1/admin/events`
  - Tao event.
- [ ] `POST /api/v1/admin/events/{eventId}/rounds`
  - Tao round.
- [ ] `POST /api/v1/admin/rounds/{roundId}/boards`
  - Tao board.
- [ ] `POST /api/v1/admin/boards/{boardId}/slots`
  - Tao slot.
- [ ] `POST /api/v1/admin/boards/{boardId}/problems`
  - Tao problem.
- [ ] `GET /api/v1/events`
  - Kiem tra public list.
- [ ] `GET /api/v1/events/{eventId}`
  - Kiem tra public detail.

## Phase 3 - Team Registration

- [ ] `POST /api/v1/events/{eventId}/teams`
  - Participant dang ky team.
- [ ] `POST /api/v1/team-invitations/confirm`
  - Confirm invite bang token.
- [ ] `POST /api/v1/team-invitations/decline`
  - Decline invite bang token.
- [ ] `GET /api/v1/my/teams?eventId={eventId}`
  - Kiem tra team cua minh.

## Phase 4 - Board Assignment

- [ ] `GET /api/v1/admin/events/{eventId}/teams?status=CONFIRMED`
  - Lay team da confirm.
- [ ] `POST /api/v1/admin/boards/{boardId}/assignments`
  - Gan team vao board/slot theo flow phase 4 hien tai.
- [ ] `GET /api/v1/admin/boards/{boardId}/teams`
  - Kiem tra danh sach team tren board.

## Phase 5 - Problem Access / Runtime

- [ ] `GET /api/v1/problems/{problemId}`
  - Truoc releaseAt phai ra `403 PROBLEM_NOT_RELEASED`.
- [ ] `GET /api/v1/boards/{boardId}/problems`
  - Kiem tra problem cua board.
- [ ] `GET /api/v1/rounds/{roundId}/countdown`
  - Kiem tra `NOT_STARTED` / `RUNNING` / `ENDED`.

## Phase 6 - Mentor / Judge Assignment

- [ ] `POST /api/v1/boards/{boardId}/mentors`
  - Body: `{ "userId": 41 }`.
  - Can Organizer + user target phai co role `MENTOR`.
- [ ] `GET /api/v1/mentors/assignments`
  - Mentor xem assignment cua minh.
- [ ] `DELETE /api/v1/boards/{boardId}/mentors/{mentorId}`
  - Xoa mentor assignment.
- [ ] `POST /api/v1/boards/{boardId}/judges`
  - Body: `{ "userId": 52 }`.
- [ ] `GET /api/v1/judges/assignments`
  - Judge xem assignment cua minh.
- [ ] `DELETE /api/v1/boards/{boardId}/judges/{judgeId}`
  - Xoa judge assignment.

## Test am can bat loi

- [ ] Goi protected API khong co token -> `401`.
- [ ] Goi assign mentor khong phai Organizer -> `403 ONLY_ORGANIZER`.
- [ ] Goi assign mentor cho user khong co role `MENTOR` -> `400 TARGET_NOT_MENTOR`.
- [ ] Goi problem truoc `releaseAt` -> `403 PROBLEM_NOT_RELEASED`.
- [ ] Goi confirm token het han -> loi token phu hop.
- [ ] Goi assign trung -> kiem tra idempotent / unique constraint.

## Thu tu test de nho

1. Phase 1: login lay JWT.
2. Phase 2: tao contest structure.
3. Phase 3: dang ky team va confirm invite.
4. Phase 4: gan board/slot.
5. Phase 5: kiem tra problem va countdown.
6. Phase 6: gan mentor/judge.

## Neu gap 401 tren Swagger

- Kiem tra da bam `Authorize` chua.
- Kiem tra da dán dung `Bearer <JWT_TOKEN>` chua.
- Kiem tra user trong token co ton tai va khong bi `DISABLED`.
- Neu token dung ma van 401, doc response body de xem message tu backend.