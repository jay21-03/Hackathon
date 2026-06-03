# FE UI va acceptance checklist

Tai lieu nay dung de review UI va test nghiep vu FE theo tung module. Thu tu uu tien sua UI: public -> participant -> organizer -> mentor/judge.

## 1. Public

### Header va dieu huong

- [ ] Hien thi trang thai dang nhap ro rang: avatar, ten nguoi dung, vai tro hien tai.
- [ ] Guest thay CTA "Dang nhap"; participant thay CTA "Dang ky doi" hoac "Vao khu vuc thi sinh".
- [ ] Co nut "Dang xuat" khi da co session.
- [ ] Header web khong tran khi viewport hep; menu co the gom vao dropdown neu thieu khong gian.

Acceptance criteria:
- Guest vao `/events` thay nut "Dang nhap" va bam vao dung `/login`.
- User da dang nhap thay ten/avatar va bam dung workspace theo role.
- Dang xuat xoa session FE va quay ve trang public.
- Header khong tao horizontal overflow o cac route public.

### Events list: `/events`

- [ ] Search theo ten cuoc thi/track hoat dong.
- [ ] Filter co: Tat ca, Dang mo dang ky, Sap dien ra, Dang dien ra, Da ket thuc.
- [ ] Card nhan manh trang thai bang badge, mau nen nhe va vien.
- [ ] Card hien nhanh: han dang ky, ngay bat dau, quota/team size.
- [ ] CTA theo trang thai: "Xem chi tiet", "Dang ky", hoac disabled "Da ket thuc".

Acceptance criteria:
- Search khong phan biet hoa thuong va empty state hien khi khong co ket qua.
- Event da ket thuc khong hien CTA dang ky.
- Event dang mo dang ky co CTA dang ky hoac xem chi tiet ro rang.
- Loading skeleton hien truoc khi co data; fallback data khong hien tu noi bo.

### Event detail: `/events/:eventId`

- [ ] Layout 2 cot: noi dung chinh ben trai, thong tin/CTA ben phai.
- [ ] Khoi "Dieu kien tham gia" gom team size, quota, han dang ky.
- [ ] CTA "Dang ky tham gia" noi bat, co mo ta "Chi danh cho thi sinh".
- [ ] Trang thai event, ngay dien ra va han dang ky de scan nhanh.

Acceptance criteria:
- Event khong ton tai co empty/error state than thien.
- Guest bam dang ky duoc dua den login hoac register dung luong.
- Participant bam dang ky vao dung `/register`.
- Event dong dang ky phai disabled CTA dang ky va giai thich ly do.

## 2. Auth va role guard

### Login: `/login`

- [ ] Login demo/email/Google co loading state tren button.
- [ ] Sau login dieu huong dung dashboard theo role.
- [ ] Loi login hien gan form, khong chi toast.

Acceptance criteria:
- Participant -> `/me`.
- Organizer -> `/organizer/dashboard`.
- Mentor -> `/mentor/dashboard`.
- Judge -> `/judge/dashboard`.
- Sai role vao route bi redirect ve dashboard dung role.

## 3. Participant

### Dang ky doi: `/register`

- [ ] Stepper 3 buoc: Thong tin doi -> Thanh vien -> Xac nhan.
- [ ] Loi validate hien duoi tung field: ten doi, email, so thanh vien.
- [ ] Badge so thanh vien doi mau theo rule 1-5.
- [ ] Nut "Lam lai" co confirm.

Acceptance criteria:
- Doi 0 thanh vien bi chan submit.
- Doi > 5 thanh vien bi chan submit.
- Email sai format hien loi gan input.
- Email trung trong cung cuoc thi bi chan va noi ro dang thuoc doi nao.
- Quota day thi ket qua la danh sach cho hoac tu choi theo rule.
- Submit thanh cong hien trang thai ho so va toast thanh cong.

### Loi moi thanh vien: `/team-invitation`, `/team-invitations/status`

- [ ] Bang trang thai co filter: Tat ca, Chua phan hoi, Da xac nhan, Tu choi, Het han.
- [ ] Hien countdown han phan hoi con lai.
- [ ] Confirm/reject cap nhat badge va toast.

Acceptance criteria:
- Xac nhan loi moi doi status thanh "Da xac nhan".
- Tu choi loi moi doi status thanh "Tu choi".
- Loi moi het han khong cho xac nhan.
- Bang status cap nhat dung so thanh vien da xac nhan.

### Participant dashboard: `/me`

- [ ] Co timeline tien do: dang ky -> check-in -> mo de -> nop bai -> ket qua.
- [ ] CTA theo trang thai: Check-in ngay, Xem de, Nop bai.
- [ ] Card KPI ro: bang thi, check-in, danh gia AI, phieu cham da chot.

Acceptance criteria:
- CTA dan dung route lien quan.
- Check-in khong lam khoa trang de thi.
- UI khong con thuat ngu noi bo/prototype.
- Khong overflow ngang tren web.

### Team: `/me/team`

- [ ] Hien thanh vien, email, vai tro, trang thai loi moi.
- [ ] Progress thanh vien da xac nhan.
- [ ] CTA cap nhat bai nop va xem loi moi.

Acceptance criteria:
- Doi hop le khi co 1-5 thanh vien.
- Thanh vien chua phan hoi hien badge rieng.
- Link cap nhat bai nop den dung `/me/submission`.

### Check-in: `/me/check-in`

- [ ] Tach buoc Upload anh va Xac nhan nop.
- [ ] Hien preview ten file/anh.
- [ ] Badge: Cho duyet, Da xac nhan, Bi tu choi.

Acceptance criteria:
- Chua chon anh thi submit bi chan hoac hien huong dan.
- Sau submit hien "Cho duyet".
- Check-in bi tu choi hien ly do va cho nop lai neu rule cho phep.

### Problem: `/me/problem`

- [ ] Truoc gio mo de hien banner khoa de + countdown lon.
- [ ] Sau gio mo de hien noi dung de, yeu cau, thong tin bang thi va CTA nop bai.
- [ ] Giai thich ro check-in khong chan quyen xem de.

Acceptance criteria:
- `now < release_at` khong hien noi dung de.
- `now >= release_at` hien noi dung de.
- Release time doi thi UI cap nhat dung.

### Submission: `/me/submission`

- [ ] Hien trang thai: Ban nhap, Da nop, Can cap nhat.
- [ ] Validate GitHub/GitLab URL khi blur va khi submit.
- [ ] Luu ban nhap va Nop chinh thuc tach nut ro rang.
- [ ] Nop chinh thuc co confirm.

Acceptance criteria:
- URL khong phai GitHub/GitLab bi chan.
- Luu ban nhap khong doi trang thai thanh da nop.
- Nop chinh thuc doi status thanh "Da nop".
- Disabled/loading state hien khi dang submit.

### Danh gia AI: `/me/ai-review`

- [ ] Badge "Chi tham khao" noi bat.
- [ ] Moi lan danh gia la card rieng: thoi gian, diem, tom tat, van de.
- [ ] Noi ro khong anh huong xep hang.

Acceptance criteria:
- Khong co review thi hien empty state va huong dan nop repository.
- Co review thi hien day du severity/status.
- Khong hien diem AI trong cong thuc xep hang.

### Results: `/me/results`

- [ ] Chi hien ket qua sau khi ban to chuc cong bo.
- [ ] Neu chua cong bo hien empty state co giai thich.

Acceptance criteria:
- `published=false` khong hien bang xep hang.
- `published=true` hien hang, doi, bang, diem trung binh, phieu da chot.

## 4. Organizer

### Dashboard: `/organizer/dashboard`

- [ ] KPI: tong doi, da xac nhan, cho duyet, danh sach cho, check-in cho duyet.
- [ ] Canh bao can xu ly: dang ky cho duyet, check-in cho duyet, phieu cham nhap.
- [ ] Timeline luong BTC: thiet lap -> dang ky -> phan cong -> cham diem -> cong bo.

Acceptance criteria:
- Moi card/step click duoc den route lien quan.
- So lieu dashboard khop voi bang chi tiet.
- Khong co copy noi bo/prototype.

### Events/config: `/organizer/events`, `/organizer/events/new`, `/organizer/events/basic-info`

- [ ] Form cau hinh event co validation gan field.
- [ ] Quota, min/max team size, release time hien ro.
- [ ] Breadcrumb quan tri: Cuoc thi -> Cau hinh.

Acceptance criteria:
- Min team size > max team size bi chan.
- Quota <= 0 bi chan.
- Luu co loading/disabled state va toast.

### Registrations: `/organizer/registrations`

- [ ] Table toolbar: search, filter status, density, export, bulk action.
- [ ] Moi row co action: Xem chi tiet, Duyet, Danh sach cho, Tu choi.
- [ ] Tu choi co confirm; duyet vuot quota bi chan.
- [ ] Slide-over chi tiet hien thanh vien, email, lich su.

Acceptance criteria:
- Duyet pending -> confirmed neu quota con.
- Quota day -> khong cho confirmed, hien warning.
- Waitlist -> status danh sach cho.
- Reject -> confirm -> status tu choi.
- Bulk action chi ap dung row duoc chon va co confirm neu nguy hiem.

### Check-ins: `/organizer/check-ins`

- [ ] Filter theo status: Cho duyet, Da xac nhan, Tu choi.
- [ ] Preview anh ro, co ten doi va thoi gian nop.
- [ ] Approve/reject co toast; reject co ly do.

Acceptance criteria:
- Approve doi status thanh da xac nhan.
- Reject doi status thanh bi tu choi va hien ly do.
- Check-in khong anh huong quyen xem de.

### Problems: `/organizer/problems`

- [ ] Form cau hinh de: ten de, thoi gian mo de, tom tat, file/link de.
- [ ] Cong bo de co confirm.
- [ ] Badge draft/published ro.

Acceptance criteria:
- Draft khong hien cho participant truoc release.
- Published + chua den release_at van chua hien noi dung.
- Published + den release_at hien noi dung.

### Rubric: `/organizer/rubric`

- [ ] Moi criterion co min/max/weight ro.
- [ ] Row bi to mau neu min/max sai.
- [ ] Tong trong so neu co weight phai bang 100%.

Acceptance criteria:
- Max < min bi chan.
- Diem ngoai range bi chan o scoring.
- Save rubric co disabled/loading state.

### Boards/assignments: `/organizer/boards`, `/organizer/assignments`

- [ ] Tao bang theo round, hien team/mentor/judge duoc gan.
- [ ] Canh bao khi team nam nhieu bang trong cung round.
- [ ] Canh bao khi judge/mentor chua duoc gan.

Acceptance criteria:
- Mot team khong nam trong nhieu bang cung round.
- Mentor chi thay team thuoc bang duoc phan cong.
- Judge chi cham team thuoc bang duoc phan cong.

### Scoring progress: `/organizer/scoring`

- [ ] Hien phieu da chot/tong phieu.
- [ ] Highlight team chua cham du.
- [ ] Draft khong tinh vao diem trung binh.

Acceptance criteria:
- So phieu da chot khop judge submissions.
- Team thieu phieu cham hien warning.
- Diem trung binh chi tinh phieu da chot.

### Ranking/finals: `/organizer/ranking`, `/organizer/finals`

- [ ] Hien so phieu da chot/tong theo team.
- [ ] Team bi loai khong tinh ket qua hop le.
- [ ] Chon finalist bang toggle ro + summary.
- [ ] Chot finalist co confirm.

Acceptance criteria:
- Average score tinh dung tu phieu da chot.
- Draft score khong anh huong xep hang.
- Danh gia AI khong anh huong xep hang.
- Finalist do organizer chon thu cong, khong auto top N.

### Disqualifications: `/organizer/disqualifications`

- [ ] Action loai doi dung variant danger.
- [ ] Confirm modal noi ro anh huong den xep hang/ket qua.
- [ ] Hien ly do va muc do vi pham.

Acceptance criteria:
- Loai doi -> status DISQUALIFIED.
- Team DISQUALIFIED khong hien trong ket qua hop le.
- Co audit log khi backend san sang.

### Publish results/export: `/organizer/publish-results`, `/organizer/export-success`

- [ ] Cong bo co confirm dialog.
- [ ] Preview ket qua truoc khi cong bo.
- [ ] Export CSV/PDF co loading va toast.

Acceptance criteria:
- Chua publish -> public/participant khong xem bang xep hang.
- Publish -> public/participant xem ket qua.
- Export lay dung ket qua da publish hoac preview hien tai theo rule.

### Announcements/notifications

- [ ] Editor co preview markdown/rich text.
- [ ] Lich su gui theo thoi gian.
- [ ] Status draft/scheduled/sent ro.

Acceptance criteria:
- Draft khong gui.
- Scheduled hien lich gui.
- Sent hien trong notification history.

## 5. Mentor

### Mentor dashboard: `/mentor/dashboard`

- [ ] "Doi duoc phu trach" hien status bai nop, check-in, danh gia AI.
- [ ] Quick link den repository va danh gia AI.

Acceptance criteria:
- Mentor chi thay team duoc phan cong.
- Link repository chi hien khi team da nop.
- Team co rui ro AI cao hien warning.

### Mentor AI review: `/mentor/ai-review`

- [ ] Group theo team, severity va issue.
- [ ] Badge "Chi tham khao".

Acceptance criteria:
- Review khong anh huong diem chinh thuc.
- Empty state hien khi chua co repository/review.

## 6. Judge

### Judge dashboard: `/judge/dashboard`

- [ ] "My assigned teams" hien status: chua cham, dang nhap, da chot.
- [ ] Quick link "Mo phieu cham".

Acceptance criteria:
- Judge chi thay team duoc phan cong.
- Team khong thuoc bang phan cong khong hien.

### Score sheet: `/judge/scoring`

- [ ] Score input hien min/max ro.
- [ ] Row to mau khi diem vuot range.
- [ ] Luu nhap va Chot diem la hai action rieng.
- [ ] Chot diem co confirm.

Acceptance criteria:
- Diem ngoai min/max bi chan.
- Luu nhap khong tinh xep hang.
- Chot diem doi status thanh da chot va tinh vao tien do cham.

## 7. Cross-role regression checklist

- [ ] Tat ca route co loading/empty/error state.
- [ ] Tat ca action ghi co disabled/loading state.
- [ ] Tat ca action nguy hiem co confirm.
- [ ] Tat ca form co validation gan field.
- [ ] Bang du lieu khong vo layout web.
- [ ] Khong con wording noi bo/prototype tren UI hien thi.
- [ ] Role guard dung cho public, participant, organizer, mentor, judge.
- [ ] API fallback chi nam o service layer.

Acceptance criteria:
- Playwright route test pass toan bo route public/participant/organizer/mentor/judge.
- Full-flow pass: dang ky -> duyet -> check-in -> mo de -> nop bai -> danh gia AI -> cham diem -> xep hang -> chon chung ket -> cong bo.
- Visual smoke pass cho dashboard, scoring, ranking, results.
- Khong co skipped test trong web-only suite.

## 8. Luong test thu API

### Thu tu test

1. Chay backend va frontend, dam bao FE dang goi dung base URL API.
2. Test public API truoc: danh sach cuoc thi, chi tiet cuoc thi, ket qua cong khai.
3. Test auth: dang nhap participant/organizer/mentor/judge, kiem tra token duoc luu va header Authorization duoc gan.
4. Test participant flow: dang ky doi, xac nhan loi moi, xem dashboard, check-in, xem de, nop bai, xem ket qua.
5. Test organizer flow: cap nhat event, duyet dang ky, duyet check-in, cau hinh de, xem scoring/ranking, chon finalist, cong bo ket qua.
6. Test mentor/judge flow: xem dashboard, xem man duoc phan cong, test scoring/review neu backend da co contract.
7. Test negative cases: token thieu/het han, role sai, payload sai schema, event khong ton tai, action vuot quota/ngoai range.

### Mau test nhanh

- GET `/events` -> tra ve danh sach cong khai, 200.
- GET `/events/:id` -> tra ve chi tiet event, 200 hoac 404 neu khong ton tai.
- POST `/login` hoac endpoint auth tuong ung -> tra ve access token, role, thong tin nguoi dung.
- POST `/register` -> tao ho so dang ky, validate email/team size/quota.
- POST/PUT `/team-invitations` hoac `/team-invitations/:id/confirm` -> cap nhat trang thai loi moi.
- POST/PATCH `/check-ins` hoac `/check-ins/:id` -> cap nhat trang thai check-in.
- PUT `/admin/events/:id` -> cap nhat thong tin event.
- GET `/events/:id/results` va POST `/events/:id/results/publish` -> test preview va cong bo ket qua.

### Checklist khi test API bang Postman/curl

- [ ] Co base URL dung cho moi moi truong.
- [ ] Co header `Authorization: Bearer <token>` voi endpoint can auth.
- [ ] Co test voi user dung role va sai role.
- [ ] Co test success va fail cho moi endpoint ghi du lieu.
- [ ] Co test response schema va HTTP status.
- [ ] Co test fallback neu API that chua san sang.
