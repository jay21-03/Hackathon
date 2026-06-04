# FE Roadmap — trạng thái

## Đã làm (session gần nhất)

- Xóa mock: `hackathonDemoData`, `hackathonApi`, `apiFallback`, các service dead
- `authSession` thay `demoSession`
- Tạo cuộc thi: `CreateEventPage` + `POST /v1/admin/events`
- `RoundCountdown` trên tổng quan BTC / thí sinh / đề thi
- `getApiErrorMessage`, interceptor API
- Lời mời: tab Thành viên đội / Mentor–GK
- Gỡ E2E shim khỏi shell
- `.env.example`
- Light/dark theme (đã có từ trước)

## Chờ BE (FE đã có empty state / copy)

- `GET /my/board`, `GET /my/problem`
- `GET /admin/boards/{id}/mentors|judges`
- Phase 7–10 (chấm, xếp hạng, check-in, AI)

## Tiếp theo (chỉ FE)

- i18n `vi`/`en`
- Mở rộng invalidate React Query sau mutation (registrations, assignments)
- Bật lại E2E smoke trong CI (tùy chọn)

## Đã làm (bước FE tiếp theo)

- `@tanstack/react-query` + `QueryProvider`, `queryKeys`
- Hooks: `useActiveEvent`, `useMyTeam`, `useEventRound` dùng cache
- ESLint + Prettier (`npm run lint`, `npm run format`)
- Playwright: `helpers/auth.ts`, `helpers/mockApi.ts`, cập nhật spec theo UI mới

Chi tiết BE: [BE_FE_GAP.md](./BE_FE_GAP.md)
