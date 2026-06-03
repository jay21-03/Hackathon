# Project improvement checklist

Trang thai sau dot nang cap FE hien tai.

## Da hoan thanh

- [x] Dong bo route theo vai tro: participant, organizer, mentor, judge.
- [x] Them role guard demo de chan vao sai dashboard.
- [x] Them role switcher de test nhanh tung nhom nguoi dung.
- [x] Chuan hoa badge trang thai nghiep vu: PENDING, CONFIRMED, WAITLIST, REJECTED, DISQUALIFIED, DRAFT, SUBMITTED, PUBLISHED.
- [x] Them lop du lieu mau co cau truc cho event, team, rubric, score sheet, ranking.
- [x] Chuyen luong dang ky doi tu prototype sang React component co validation.
- [x] Chuyen luong nop repository tu prototype sang React component co validation va trang thai nop bai.
- [x] Chuyen phieu cham diem judge sang React component co validate min/max rubric.
- [x] Chuyen ranking organizer sang React component, chi tinh score sheet da submit va finalist chon thu cong.
- [x] Chuyen quan ly dang ky organizer sang React component co approve/waitlist/reject.
- [x] Chuyen check-in participant va organizer sang React component co approve/reject.
- [x] Chuyen cau hinh de va man xem de sang React component co thoi gian mo de.
- [x] Chuyen scoring progress sang React component chi ro draft/submitted.
- [x] Chuyen public results va participant results sang React component.
- [x] Them toast va confirm modal cho thao tac quan trong.
- [x] Them Playwright E2E cho cac route web.
- [x] Them Playwright E2E cho luong dang ky, nop bai, cham diem, ranking.
- [x] Tach chunk man hinh prototype de giam bundle chinh.
- [x] Chuyen cac man organizer users, boards, invitations, finals, disqualifications, announcements sang React component that.
- [x] Chuyen cac man participant status, board, AI review sang React component that.
- [x] Them skeleton loading theo module cho public event, event detail va dashboard.
- [x] Them table density mode cho cac bang organizer.
- [x] Them visual smoke test cho cac man dashboard web.
- [x] Them API fallback layer: uu tien API that, tu dong dung du lieu mau khi API he thong chua chay.
- [x] Chuyen rubric, assignments, ai-auditor, ai-insights, notifications, publish-results, export-success sang React component that.
- [x] Hoan thien mentor dashboard, mentor AI review va judge dashboard bang React component rieng.
- [x] Them service API cho cac module moi de doc du lieu tu API that va du phong bang du lieu mau khi API he thong chua san sang.
- [x] Bo hoan toan cac route con dung prototype cu va xoa file prototype khoi bundle.
- [x] Them Zod schema validation cho repository, ho so, cau hinh event va dang ky doi.
- [x] Them service rieng cho registration, team, check-in, scoring, ranking va result.
- [x] Them hooks dung chung cho tai du lieu async va role guard.
- [x] Them Playwright full-flow tu dang ky doi den cong bo ket qua.
- [x] Mo rong visual regression cho scoring, ranking va public results.
- [x] Them component dung chung cho table toolbar, data table va form field.
- [x] Them test API success/fallback khi API he thong chua chay hoac tra du lieu that.
- [x] Them test confirm modal cho thao tac loai doi va cong bo ket qua.
- [x] Chuyen page doc du lieu mau qua service layer, khong import truc tiep mock data.
- [x] Lazy-load cac route de toi uu bundle chinh.
- [x] Them script lint/typecheck/test:ci va workflow FE CI.
- [x] Kiem tra audit: production dependencies sach loi; advisory con lai nam o dev dependency Vite/esbuild.
- [x] Nang cap UI extra high: palette sang/trung tinh, sidebar workspace, primitive UI giam glow/template.
- [x] Chuan hoa copy nguoi dung: thay cac tu noi bo bang ngon ngu nghiep vu.
- [x] Xoa legacy page khong dung: HomePage, EventsPage cu, dashboard prototype cu va PlaceholderPage.
- [x] Doi service fallback thanh read model service de page khong import demo/mocks truc tiep.
- [x] Them architecture E2E test chan page import mock/demo va chan cau hinh thiet bi app quay lai.
- [x] Nhom sidebar theo dung luong nghiep vu: thiet lap, dang ky/phan cong, van hanh, cham diem, ket qua.
- [x] Them workflow steps cho dashboard participant va organizer de cac man lien quan duoc sap theo thu tu thuc hien.
- [x] Dong bo action button/link qua primitive dung chung va bo class nut cu trong page.
- [x] Them confirm cho cong bo de, chot chung ket, tu choi dang ky va lam lai form dang ky.
- [x] Siết quota khi duyet dang ky: khong cho confirmed vuot gioi han doi.
- [x] Chuan hoa copy hien thi: thay AI Review/score sheet/public portal/ranking bang ngon ngu nghiep vu.
- [x] Them E2E chan cac thuat ngu prototype/ky thuat noi bo hien lai tren route trong yeu.

## Nen lam tiep khi noi dich vu he thong

- [ ] Noi endpoint ghi thuc cho dang ky doi, loi moi, check-in, repository, AI review, scoring va publish results.
- [ ] Them refresh token/session thuc thay cho demo localStorage.
- [ ] Luu draft score sheet va submission len server.
- [ ] Them audit log cho publish, disqualify, reject, delete.
- [ ] Them upload anh check-in that va duyet check-in theo trang thai.
- [ ] Them optimistic update va retry khi API loi.
- [ ] Them export CSV/PDF that cho ranking va ket qua.
- [ ] Nang major Vite/esbuild khi moi truong Node du dap ung va co thoi gian regression test breaking change.
