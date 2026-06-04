# BE chưa có — cần bổ sung (đối chiếu FE)

Tài liệu này liệt kê những gì **Frontend đã sẵn sàng** nhưng **Backend phase 1–6 chưa đủ** hoặc **phase 7–10 chưa triển khai**.

## Đã nối API (phase 1–6)

| Luồng | API chính |
|--------|-----------|
| Đăng nhập Google + JWT | `POST /api/v1/auth/google-login`, `GET /api/v1/auth/me` |
| Sự kiện công khai | `GET /api/v1/events`, `GET /api/v1/events/{id}` |
| Đăng ký đội | `POST /api/v1/events/{id}/teams`, lời mời, resend |
| Duyệt đội (BTC) | `PATCH /api/v1/teams/{id}/status`, `GET .../teams` |
| Bang / slot / phân đội | `/api/v1/admin/rounds/...`, random assign |
| Mentor / judge assign | `POST/DELETE /api/v1/boards/{id}/mentors|judges` |
| Đếm ngược vòng | `GET /api/v1/rounds/{id}/countdown` |
| Đề thi (admin) | CRUD `/api/v1/admin/boards/{id}/problems` |
| Cập nhật sự kiện | `PUT /api/v1/admin/events/{id}` |

## Ưu tiên cao — chặn participant & một phần BTC

### 1. Thí sinh xem bảng thi

**Cần:** `GET /api/v1/my/board?eventId={id}` (hoặc tương đương)

**Trả về gợi ý:** `boardId`, `boardName`, `slotNumber`, danh sách đội cùng bảng (đã assign), `roundId`.

**Hiện tại:** Logic gán slot có trong admin API; participant không gọi được `/api/v1/admin/**`.

**FE:** `/me/board` — empty state, chờ API.

---

### 2. Thí sinh xem đề thi

**Cần:**

- `GET /api/v1/my/problem?eventId={id}` hoặc
- `GET /api/v1/problems/{id}` **không** yêu cầu role admin

**Rule (đã có trong service):** Chỉ trả nội dung khi `now >= releaseAt` và đội user thuộc board có đề đó.

**Hiện tại:** `getProblem` chỉ expose qua `AdminContestController`.

**FE:** `/me/problem` — empty state.

---

### 3. BTC liệt kê mentor/judge đã gán theo bảng

**Đã có (BE + FE):** `GET /api/v1/boards/{boardId}/mentors`, `GET /api/v1/boards/{boardId}/judges` — trang **Phân công** list + nút Gỡ.

---

### 4. Lời mời mentor/judge (khác lời mời thành viên đội)

**Cần:** API list + resend theo `boardId` + email + role `MENTOR` | `JUDGE`.

**Hiện tại:** FE trang **Lời mời** dùng `fetchEventTeams` + resend **thành viên đội** (`POST /api/v1/team-invitations/resend`). Lời mời mentor/judge chưa có.

---

## Phase 7 — Chấm điểm & bài nộp

| API đề xuất | Mô tả |
|-------------|--------|
| Rubric CRUD | Tạo/sửa tiêu chí theo round |
| Score sheets | Judge GET/PUT điểm theo đội |
| Submissions | Participant upload/link, deadline |
| Scoring progress | BTC xem % đã chấm |

**FE:** Rubric, Scoring progress, Judge scoring, Submission — `FeatureUnavailable`.

---

## Phase 8 — Xếp hạng & công bố

| API đề xuất | Mô tả |
|-------------|--------|
| Rankings | Tính điểm, bảng xếp hạng theo round/board |
| Publish results | Trạng thái DRAFT → PUBLISHED |
| Public results | Cổng công khai sau publish |
| Export | CSV/Excel |

**FE:** Ranking, Publish, Export, Results portal — placeholder.

---

## Phase 9 — Check-in & thông báo

| API đề xuất | Mô tả |
|-------------|--------|
| Check-in | Theo đội/user, không khóa xem đề |
| Announcements / notifications | Gửi + lịch sử |

**FE:** Check-in BTC + participant, Announcements, Notification center — placeholder.

**Lưu ý nghiệp vụ:** Check-in **không** được dùng để chặn quyền xem đề (đã ghi trong UI đề thi).

---

## Phase 10 — AI review

| API đề xuất | Mô tả |
|-------------|--------|
| Queue / insights | BTC duyệt hàng đợi AI |
| Mentor / participant view | Xem kết quả theo đội |

**FE:** AI auditor, AI insights, mentor/participant AI pages — placeholder.

---

## Tính năng mới (ngoài phase 1–10 gốc)

| Tính năng | Ghi chú |
|-----------|---------|
| Import đội từ Google Form | Chưa có endpoint import |
| Vòng chung kết / advancement | `FinalsPage` chờ API |
| Vi phạm / disqualification | Chưa có domain API |
| Tạo sự kiện wizard end-to-end | Đã có `CreateEventPage` + `POST /api/v1/admin/events`; wizard các bước còn thiếu API tạo round/board trên FE |

---

## Đối chiếu FE ↔ BE (audit `Hackathon/FE/src/services`)

`apiClient` baseURL = `VITE_API_BASE_URL` (mặc định `/api`) → path FE `/v1/...` = BE `/api/v1/...`.

### Khớp endpoint (đang dùng trên UI)

| FE service | Method + path FE | BE controller | Trang / hook dùng |
|------------|------------------|-----------------|-------------------|
| `authService` | `POST /v1/auth/google-login` body `{ idToken }` | `AuthProfileController` | `LoginPage` |
| `userService` | `GET /v1/me` | `AuthProfileController` | `LoginPage` |
| `profileService` | `GET /v1/me`, `PUT /v1/me/profile` | `AuthProfileController` | `ProfilePage` |
| `userService` | `GET /v1/admin/users`, `POST /v1/admin/users/{id}/roles` body `{ role }` | `AuthProfileController` | `UserManagementPage` |
| `eventsApi` | `GET /v1/events`, `GET /v1/events/{id}` | `EventController` | Discovery, detail, đăng ký |
| `eventsApi` | `POST /v1/admin/events`, `PUT /v1/admin/events/{id}` | `AdminContestController` | `CreateEventPage`, `EventBasicInfoPage` |
| `registrationService` | `POST /v1/events/{id}/teams` body `{ name, members[] }` | `RegistrationController` | `TeamRegistrationPage` |
| `registrationService` | `GET /v1/my/teams?eventId=` | `TeamQueryController` | `useMyTeam`, overview, đội |
| `registrationService` | `GET /v1/events/{id}/teams` (ORGANIZER) | `TeamQueryController` | BTC: duyệt đội, lời mời, bảng |
| `registrationService` | `PATCH /v1/teams/{id}/status` body `{ status, reason? }` | `TeamQueryController` | `RegistrationManagementPage` |
| `registrationService` | `POST /v1/team-invitations/confirm\|decline` body `{ token }` | `InvitationController` | `TeamInvitationActionPage` (link email) |
| `registrationService` | `POST /v1/team-invitations/resend` body `{ teamMemberId }` | `InvitationController` | `InvitationManagementPage` |
| `contestApi` | `GET /v1/admin/events/{id}/rounds` | `AdminContestController` | Wizard, bảng, đề, phân công |
| `contestApi` | `GET /v1/admin/rounds/{id}/boards` | `AdminContestController` | `BoardManagementPage`, … |
| `contestApi` | `GET /v1/admin/boards/{id}/slots` | `AdminContestController` | `BoardManagementPage` |
| `contestApi` | `POST .../assign/random`, `POST .../slots/{slotId}/assign` | `AdminContestController` | `BoardManagementPage` (random; assign thủ công chưa gắn UI) |
| `contestApi` | `GET/POST/PUT` problems admin | `AdminContestController` | `ProblemManagementPage` |
| `contestApi` | `GET /v1/rounds/{id}/countdown` | `RoundController` | `useEventRound`, `RoundCountdown` |
| `assignmentService` | `GET /v1/mentors\|judges/assignments` | `AssignmentController` | Mentor/Judge dashboard |
| `assignmentService` | `POST/DELETE /v1/boards/{id}/mentors\|judges` body `{ userId }` | `AssignmentController` | `AssignmentManagementPage` |

### Body / quyền — lưu ý khi test

| Luồng | Ghi chú |
|--------|---------|
| Lời mời email | URL `/team-invitations/accept?token=` → FE gọi `confirm` sau login; email login **phải trùng** email trong lời mời (BE `403` nếu sai). |
| `GET /events/{id}/teams` | Chỉ role **ORGANIZER**; participant dùng `GET /my/teams`. |
| `PUT /admin/events/{id}` | FE chỉ gửi `name`, `maxTeams`; `minTeamSize`/`maxTeamSize` trên form **không** gửi BE (BE cấm field này trên create/update). |
| `POST /admin/events` | FE gửi đủ `name`, dates, `registrationStartAt/EndAt` ISO, `maxTeams`. |
| Đăng ký đội | `members[].email`, `fullName` khớp `MemberRequest`; contact = user đăng nhập (BE tự thêm). |
| Phase 7–10 | Trang `FeatureUnavailable` — **không** gọi API (đúng, BE chỉ `/health`). |

### FE admin — đã gắn UI (2026)

| Tính năng | Trang |
|-----------|--------|
| Tạo vòng / bảng / slot, gán đội slot, move/swap, random assign | `BoardManagementPage` |
| List mentor/judge theo bảng, gán, gỡ | `AssignmentManagementPage` |
| `GET /v1/teams/{teamId}` | `RegistrationManagementPage` (Chi tiết) |

### Còn chưa gắn / chờ BE participant

| Hàm | Ghi chú |
|-----|---------|
| `fetchProblem` (admin) | Dùng được trên BTC; participant cần `GET /my/problem`. |
| `PUT` round/board, `GET /v1/admin/rounds/{id}` | Đã có form trên `BoardManagementPage`; sửa slot chưa có UI. |

### Participant — chưa gọi API (chờ BE)

| Trang | API cần | Hiện trạng FE |
|-------|---------|----------------|
| `/me/board` | `GET /my/board?eventId=` | Empty state, không gọi API |
| `/me/problem` | `GET /my/problem?eventId=` | Empty state; có team + countdown nhưng không `GET /admin/problems` |

---

## Kiểm tra nhanh sau khi BE bổ sung

1. Participant đăng nhập → đội CONFIRMED → sau random assign thấy bảng + đề (sau `releaseAt`).
2. BTC: Assignment page list mentor/judge từng bảng.
3. Judge: mở phieu cham, lưu điểm.
4. Docker từ `Hackathon/`: `docker compose up -d postgres backend`.

Tham chiếu test API: `Hackathon/docs/Tests/phase1-phase6-main-flow-api-test.md`.
