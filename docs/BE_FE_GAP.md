# BE chưa có — cần bổ sung (đối chiếu FE)

Tài liệu này liệt kê những gì **Frontend đã sẵn sàng** nhưng **Backend phase 1–6 chưa đủ** hoặc **phase 7–10 chưa triển khai**.

## Đã nối API (phase 1–6)

| Luồng | API chính |
|--------|-----------|
| Đăng nhập Google + JWT | `POST /api/v1/auth/google`, `GET /api/v1/auth/me` |
| Sự kiện công khai | `GET /api/v1/events`, `GET /api/v1/events/{id}` |
| Đăng ký đội | `POST /api/v1/events/{id}/teams`, lời mời, resend |
| Duyệt đội (BTC) | `PATCH /api/v1/teams/{id}/status`, `GET .../teams` |
| Bang / slot / phân đội | `/api/v1/admin/rounds/...`, random assign |
| Mentor / judge assign | `POST /api/v1/admin/boards/{id}/mentors|judges` |
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

**Cần:**

- `GET /api/v1/admin/boards/{boardId}/mentors`
- `GET /api/v1/admin/boards/{boardId}/judges`

**Hiện tại:** Chỉ có `POST` assign; không có GET list → trang Assignment không hiển thị danh sách hiện có.

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
| Tạo sự kiện wizard end-to-end | Có `POST /api/v1/admin/events` nhưng FE wizard chỉ link từng bước, chưa form tạo mới |

---

## Kiểm tra nhanh sau khi BE bổ sung

1. Participant đăng nhập → đội CONFIRMED → sau random assign thấy bảng + đề (sau `releaseAt`).
2. BTC: Assignment page list mentor/judge từng bảng.
3. Judge: mở phieu cham, lưu điểm.
4. Docker từ `Hackathon/`: `docker compose up -d postgres backend`.

Tham chiếu test API: `Hackathon/docs/Tests/phase1-phase6-main-flow-api-test.md`.
