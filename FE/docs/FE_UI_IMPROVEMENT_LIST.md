# FE UI improvement list

Tap trung vao giao dien demo, tinh dung nghiep vu va kha nang test.

## Hoan thanh trong dot nay

- [x] Thay participant dashboard prototype bang React dashboard that.
- [x] Thay organizer dashboard prototype bang React dashboard that.
- [x] Thay trang doi thi prototype bang React page that.
- [x] Thay trang organizer registrations prototype bang React page that.
- [x] Thay trang participant check-in prototype bang React page that.
- [x] Thay trang organizer check-ins prototype bang React page that.
- [x] Thay trang organizer problems prototype bang React page that.
- [x] Thay trang participant problem prototype bang React page that co thoi gian mo de.
- [x] Thay trang organizer scoring progress prototype bang React page that.
- [x] Thay trang public/participant results prototype bang React page that.
- [x] Them UI component dung chung: page header, stat card, progress bar, empty state.
- [x] Chuan hoa workspace navigation cho giao dien web, khong dung bottom nav kieu app.
- [x] Dung cung lop du lieu mau cho dashboard, team, ranking, scoring, submission.
- [x] Bo sung E2E kiem tra UI dashboard va workspace navigation.
- [x] Build va E2E web sau khi nang cap UI.
- [x] Chuyen cac man organizer con lai tu prototype sang React that: users, boards, invitations, finals, disqualifications, announcements.
- [x] Chuyen cac man participant con lai tu prototype sang React that: status, board, AI review.
- [x] Them skeleton loading theo tung module thay vi loading text.
- [x] Them visual smoke test cho dashboard web.
- [x] Them table density mode cho organizer.
- [x] Noi API co du lieu mau du phong khi API he thong chua chay.
- [x] Chuyen tiep cac route phu con dang dung prototype: rubric, assignments, ai-auditor, ai-insights, notifications, publish-results, export-success.
- [x] Hoan thien dashboard mentor va judge thanh React component rieng.
- [x] Them service API cho cac module moi: uu tien API he thong, du phong bang du lieu mau khi API loi hoac chua chay.
- [x] Bo hoan toan cac route con dung prototype: event configuration, create event wizard, user profile, team invitation.
- [x] Xoa file prototype cu de giam bundle va tranh copy ky thuat noi bo.
- [x] Them Zod schema cho repository, ho so, cau hinh event va dang ky doi.
- [x] Them service rieng cho registration, team, check-in, scoring, ranking va results.
- [x] Them hooks dung chung cho tai du lieu async va role guard.
- [x] Mo rong Playwright route, full-flow va visual regression cho scoring, ranking, results.
- [x] Them component design system dung chung: table toolbar, data table, form field.
- [x] Ap dung toolbar search/filter/density/export cho cac bang organizer quan trong.
- [x] Chuyen page khong import truc tiep du lieu mau; page doc qua service layer.
- [x] Lazy-load route theo page/role, bundle chinh giam manh sau khi bo prototype cu.
- [x] Them test API success/fallback va test confirm modal cho thao tac nguy hiem.
- [x] Them script lint/typecheck/test:ci va GitHub Actions FE CI.
- [x] Kiem tra audit: production dependencies sach loi; advisory con lai la dev-only cua Vite/esbuild va can major upgrade.
- [x] Doi palette sang giao dien quan tri sang/trung tinh, giam neon/glow va icon trang tri lon.
- [x] Doi app shell sang workspace shell, sidebar ro vai tro va it chat prototype hon.
- [x] Chuan hoa primitive UI: button, badge, stat card, page header, table toolbar va data table.
- [x] Viet hoa copy hien thi con sot, thay cac cum noi bo bang ngon ngu nghiep vu.
- [x] Lam lai event card va login de bot cam giac giao dien sinh tu template.
- [x] Xoa cac legacy page khong con route/import de giam no ky thuat va tranh UI cu bi dung lai.
- [x] Doi service du lieu minh hoa thanh read model service va them test kien truc de page khong import mock/demo truc tiep.

## Nen lam tiep

- [ ] Noi cac thao tac ghi voi endpoint he thong that khi co contract: publish, export, save rubric, run AI review, score draft.
- [ ] Thay role/session thu nghiem bang session that khi auth san sang.
- [ ] Nang major Vite/esbuild sau khi chot Node version va regression test.
