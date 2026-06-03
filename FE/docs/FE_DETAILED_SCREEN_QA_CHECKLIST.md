# FE detailed screen QA checklist

Tai lieu nay chi dung cho review/test FE, khong phai task code. Thu tu uu tien cai thien UI: Public -> Participant -> Organizer -> Mentor -> Judge. Moi man hinh gom 4 phan: muc tieu UI, expected UI/UX, test cases, acceptance criteria.

## Nguyen tac chung

- [ ] Moi man co loading skeleton rieng, empty state co huong dan hanh dong tiep theo, error state noi ro cach xu ly.
- [ ] Moi form co validation gan field, khong chi dung toast.
- [ ] Moi action nguy hiem co confirm modal: reject, disqualify, publish, reset, submit final.
- [ ] Moi action goi API co disabled/loading state.
- [ ] Table quan tri co search, filter, density, export neu co du lieu lon.
- [ ] Copy UI dung ngon ngu nghiep vu: khong hien backend, mock, pipeline, gateway, operator, telemetry, public portal, score sheet, ranking neu dang hien cho nguoi dung.
- [ ] Mau trang thai thong nhat: success cho da xac nhan/hoan tat, warning cho cho xu ly, danger cho tu choi/loai, neutral cho ban nhap.
- [ ] Layout web khong co horizontal overflow.

Acceptance criteria chung:
- Tat ca route trong app render duoc.
- Khong co skipped E2E trong web-only suite.
- Role guard chay dung cho participant, organizer, mentor, judge.
- Khong co text prototype/noi bo tren cac route core.

## Public module

### `/events` - Danh sach cuoc thi

Muc tieu UI:
- La man dau tien de guest/participant tim cuoc thi.
- Card phai scan nhanh trang thai, thoi gian dang ky, thoi gian bat dau va CTA.

Expected UI/UX:
- Header hien ro trang thai dang nhap: guest thay "Dang nhap"; user da login thay avatar/ten/vai tro va "Dang xuat".
- Search dat tren dau danh sach.
- Filter gom: Tat ca, Dang mo dang ky, Sap dien ra, Dang dien ra, Da ket thuc.
- Card event co badge trang thai, mau nen/duong vien theo status.
- Card hien: ten, mo ta ngan, track, quota, team size, han dang ky, ngay bat dau.
- CTA theo status: Dang ky/Xem chi tiet khi con mo; Da ket thuc khi event da dong.

Test cases:
- [ ] Load `/events` khi API thanh cong.
- [ ] Load `/events` khi API loi va dung fallback data.
- [ ] Search theo ten event.
- [ ] Search theo track.
- [ ] Filter "Dang mo dang ky".
- [ ] Filter "Da ket thuc".
- [ ] Guest bam "Dang nhap" -> `/login`.
- [ ] Bam card/CTA "Xem chi tiet" -> `/events/:eventId`.
- [ ] Event da ket thuc khong cho dang ky.

Acceptance criteria:
- Search/filter khong phan biet hoa thuong.
- Empty state hien khi khong co event khop filter.
- Header khong tran tren viewport hep.
- Khong hien text ky thuat noi bo.

### `/events/:eventId` - Chi tiet cuoc thi

Muc tieu UI:
- Giai thich du dieu kien tham gia va dua participant den dang ky.

Expected UI/UX:
- Layout 2 cot tren desktop: trai la noi dung, phai la panel thong tin va CTA.
- Panel phai sticky neu noi dung dai.
- Khoi "Dieu kien tham gia" gom: team size, quota, han dang ky, role duoc dang ky.
- CTA "Dang ky tham gia" noi bat, co helper "Chi danh cho thi sinh".
- Neu event dong dang ky, CTA disabled va co ly do.

Test cases:
- [ ] Event detail load dung ten/mo ta/thoi gian.
- [ ] CTA dang ky cho event dang mo -> `/register`.
- [ ] Event het han dang ky -> CTA disabled.
- [ ] Event khong ton tai -> error/empty state.
- [ ] Guest bam dang ky neu can auth -> login hoac register flow dung rule hien tai.

Acceptance criteria:
- Dieu kien tham gia doc duoc trong 5 giay dau.
- Quota/team size khop voi data.
- CTA khong gay hieu nham cho mentor/judge/organizer.

### `/events/:eventId/results` - Ket qua cong khai

Muc tieu UI:
- Hien ket qua chi khi da cong bo.

Expected UI/UX:
- Neu chua cong bo: empty state "Ket qua chua duoc cong bo".
- Neu da cong bo: bang xep hang gom hang, doi, bang, diem trung binh, phieu da chot.
- Badge "Da cong bo" ro rang.
- Giai thich "Danh gia AI chi tham khao, khong tinh diem".

Test cases:
- [ ] `published=false` khong hien bang ket qua.
- [ ] `published=true` hien bang ket qua.
- [ ] Team bi loai khong xuat hien trong ket qua hop le.
- [ ] Diem AI khong dung lam cot diem chinh.

Acceptance criteria:
- Public khong thay du lieu truoc cong bo.
- Diem trung binh chi tinh phieu da chot.

## Auth module

### `/login` - Dang nhap

Muc tieu UI:
- Cho user vao dung workspace theo role.

Expected UI/UX:
- Form dang nhap ro field email/role demo.
- Button co loading state.
- Loi hien gan form.
- Sau login co toast hoac state thanh cong ngan gon.

Test cases:
- [ ] Login participant -> `/me`.
- [ ] Login organizer -> `/organizer/dashboard`.
- [ ] Login mentor -> `/mentor/dashboard`.
- [ ] Login judge -> `/judge/dashboard`.
- [ ] Email sai format hien loi.
- [ ] Dang nhap fail hien error state.

Acceptance criteria:
- Session duoc luu dung noi quy uoc hien tai.
- Header public cap nhat thanh da dang nhap sau login.
- Dang xuat xoa session va quay ve public.

## Participant module

### `/register` - Dang ky doi

Muc tieu UI:
- Tao doi hop le 1-5 thanh vien, chan trung email trong cung event.

Expected UI/UX:
- Stepper 3 buoc: Thong tin doi -> Thanh vien -> Xac nhan.
- Moi input co label ro.
- Loi email hien ngay duoi input.
- Badge so thanh vien doi mau: warning khi chua hop le, success khi hop le.
- Panel quy tac dang ky nam ben phai tren desktop.
- Nut "Lam lai" co confirm.

Test cases:
- [ ] Ten doi rong -> error gan field.
- [ ] 0 thanh vien -> bi chan.
- [ ] 1 thanh vien -> hop le neu email dung.
- [ ] 6 thanh vien -> bi chan.
- [ ] Email sai format -> error gan field.
- [ ] Email trung trong cung event -> error noi ro thuoc doi nao.
- [ ] Quota con slot -> status cho xac nhan/duyet theo rule hien tai.
- [ ] Quota day -> waitlist hoac rejected theo rule.
- [ ] Reset form -> confirm -> clear data.

Acceptance criteria:
- Khong submit khi co field invalid.
- Loi hien gan field va co summary neu nhieu loi.
- Submit thanh cong hien status ho so va huong dan buoc tiep.

### `/team-invitation` - Xac nhan loi moi

Muc tieu UI:
- Thanh vien xac nhan hoac tu choi loi moi vao doi.

Expected UI/UX:
- Card hien ten doi, ten thanh vien, email, vai tro, han phan hoi.
- Badge trang thai hien tai.
- Nut Xac nhan va Tu choi tach ro.
- Tu choi nen co confirm nhe neu action khong the undo.

Test cases:
- [ ] Xac nhan loi moi -> status da xac nhan.
- [ ] Tu choi loi moi -> status tu choi.
- [ ] Loi moi het han -> disabled action.
- [ ] Sau action co toast thanh cong.

Acceptance criteria:
- Mot email chi thuoc mot doi trong cung event.
- Trang thai cap nhat dong bo voi `/team-invitations/status`.

### `/team-invitations/status` - Trang thai loi moi

Muc tieu UI:
- Theo doi tat ca thanh vien da phan hoi hay chua.

Expected UI/UX:
- Table co filter: Tat ca, Chua phan hoi, Da xac nhan, Tu choi, Het han.
- Hien countdown "Han phan hoi con ...".
- Progress da xac nhan/tong thanh vien.

Test cases:
- [ ] Filter chua phan hoi chi hien pending.
- [ ] Filter da xac nhan chi hien confirmed.
- [ ] Countdown dung voi expiresAt.
- [ ] Het han hien status het han.

Acceptance criteria:
- So thanh vien da xac nhan khop voi table.
- Pending/expired khong bi hien la hop le.

### `/me` - Participant dashboard

Muc tieu UI:
- Mot man tong quan giup thi sinh biet can lam gi tiep.

Expected UI/UX:
- Timeline: Dang ky -> Check-in -> Mo de -> Nop bai -> Ket qua.
- CTA theo buoc tiep theo: Check-in ngay, Xem de, Nop bai.
- KPI: bang thi, check-in, danh gia AI, phieu cham da chot.
- Hoat dong gan day de scan nhanh.

Test cases:
- [ ] Team confirmed -> step dang ky done.
- [ ] Check-in pending -> CTA check-in.
- [ ] Problem chua mo -> CTA xem de nhung hien locked khi vao.
- [ ] Submission draft -> CTA nop bai.
- [ ] Ket qua chua cong bo -> ket qua locked.

Acceptance criteria:
- Dashboard khong bat user doc bang dai moi biet viec tiep theo.
- Moi CTA den dung route.

### `/me/team` - Doi cua toi

Muc tieu UI:
- Quan ly thanh vien, status loi moi va thong tin doi.

Expected UI/UX:
- Danh sach thanh vien co ten, email, vai tro, status.
- Progress da xac nhan/tong.
- Panel thong tin doi: bang, track, repository, danh gia AI.
- CTA xem loi moi va cap nhat bai nop.

Test cases:
- [ ] Hien dung thanh vien cua team.
- [ ] Member pending co badge "Cho xac nhan".
- [ ] Member rejected co badge "Tu choi".
- [ ] Link cap nhat bai nop -> `/me/submission`.

Acceptance criteria:
- Team hop le khi co 1-5 thanh vien.
- Status team khop rule dang ky.

### `/me/status` - Trang thai doi

Muc tieu UI:
- Giai thich team dang o trang thai nao va can lam gi.

Expected UI/UX:
- Badge status lon.
- Timeline duyet dang ky/loi moi/check-in/nop bai.
- Huong dan hanh dong tiep theo.

Test cases:
- [ ] Pending hien "cho ban to chuc duyet".
- [ ] Waitlist hien "danh sach cho".
- [ ] Rejected hien ly do neu co.
- [ ] Confirmed hien cac buoc tiep theo.

Acceptance criteria:
- User khong bi ket o man chi co status ma khong co next action.

### `/me/board` - Bang thi duoc phan cong

Muc tieu UI:
- Cho thi sinh biet minh o bang nao, mentor/judge nao, lich thi nao.

Expected UI/UX:
- Card bang thi gom ten bang, round, track.
- Danh sach mentor/judge neu co.
- Quy tac: mot team chi nam mot bang trong cung round.

Test cases:
- [ ] Team co board -> hien board.
- [ ] Team chua board -> empty state "chua phan bang".
- [ ] Hien dung round/track.

Acceptance criteria:
- Khong hien nhieu board cung round cho mot team.

### `/me/check-in` - Check-in

Muc tieu UI:
- Thi sinh nop anh tham du va theo doi duyet.

Expected UI/UX:
- Buoc 1 upload anh.
- Buoc 2 xac nhan nop.
- Preview anh/ten file.
- Status icon: cho duyet, da xac nhan, bi tu choi.

Test cases:
- [ ] Chua chon anh -> khong cho nop hoac hien huong dan.
- [ ] Chon anh -> preview hien.
- [ ] Submit -> status cho duyet.
- [ ] Bi tu choi -> hien ly do va cho nop lai neu rule cho phep.

Acceptance criteria:
- Check-in khong khoa quyen xem de.
- Upload action co loading/disabled.

### `/me/problem` - De thi

Muc tieu UI:
- Khoa noi dung de truoc release_at, mo de dung thoi diem.

Expected UI/UX:
- Truoc release: banner khoa de + countdown lon.
- Sau release: noi dung de, yeu cau, link file neu co, CTA nop bai.
- Panel thong tin: bang, thoi luong, team.

Test cases:
- [ ] `now < release_at` -> khong hien noi dung de.
- [ ] `now >= release_at` -> hien noi dung de.
- [ ] CTA nop bai -> `/me/submission`.
- [ ] Check-in pending van xem duoc de neu da release.

Acceptance criteria:
- Release_at la rule duy nhat khoa/mo de trong FE.

### `/me/submission` - Bai nop

Muc tieu UI:
- Luu nhap va nop chinh thuc repository hop le.

Expected UI/UX:
- Status hien ro: ban nhap, da nop, can cap nhat.
- Validate URL khi blur va khi submit.
- Nut Luu ban nhap va Nop chinh thuc tach ro.
- Nop chinh thuc co confirm.

Test cases:
- [ ] URL empty -> draft co the luu neu rule cho phep, submit bi chan.
- [ ] URL example.com -> error.
- [ ] GitHub/GitLab URL -> hop le.
- [ ] Luu ban nhap -> status ban nhap.
- [ ] Nop chinh thuc -> confirm -> status da nop.

Acceptance criteria:
- Repository link la GitHub/GitLab hop le.
- Nop chinh thuc khong bi tinh thanh diem neu judge chua cham.

### `/me/ai-review` - Danh gia AI

Muc tieu UI:
- Hien nhan xet tham khao tu repository.

Expected UI/UX:
- Badge "Chi tham khao".
- Moi lan review la card: timestamp, diem, tom tat, issues.
- Severity co mau ro.

Test cases:
- [ ] Chua co repository -> empty state.
- [ ] Co review -> hien danh sach review.
- [ ] Issue HIGH -> warning/danger style.

Acceptance criteria:
- Diem AI khong anh huong diem/xep hang.

### `/me/results` - Ket qua thi sinh

Muc tieu UI:
- Thi sinh xem ket qua sau cong bo.

Expected UI/UX:
- Neu chua cong bo: empty state.
- Neu da cong bo: hang, diem, bang, so phieu da chot.

Test cases:
- [ ] Chua publish -> khong hien bang.
- [ ] Publish -> hien ket qua.
- [ ] Team bi loai -> hien trang thai bi loai neu la doi minh, khong tinh ket qua hop le.

Acceptance criteria:
- Ket qua chi mo sau publish.

## Organizer module

### `/organizer/dashboard` - Tong quan ban to chuc

Muc tieu UI:
- Cho BTC thay viec can xu ly ngay.

Expected UI/UX:
- KPI: tong doi, da xac nhan, cho duyet, danh sach cho, check-in cho duyet, phieu cham da chot.
- Alert can xu ly: dang ky pending, check-in pending, phieu cham nhap.
- Workflow: thiet lap -> dang ky -> phan cong -> cham diem -> cong bo.
- Moi card co link den man lien quan.

Test cases:
- [ ] KPI khop data bang chi tiet.
- [ ] Click "Dang ky" -> `/organizer/registrations`.
- [ ] Click "Cham diem" -> `/organizer/scoring`.
- [ ] Click "Cong bo" -> `/organizer/publish-results`.

Acceptance criteria:
- BTC biet 3 viec can xu ly tiep theo ngay tren dashboard.

### `/organizer/events`

Muc tieu UI:
- Quan ly danh sach event va trang thai cau hinh.

Expected UI/UX:
- Table event co status, thoi gian dang ky, thoi gian dien ra, quota.
- CTA tao event va chinh sua.
- Breadcrumb: Ban to chuc -> Cuoc thi.

Test cases:
- [ ] Tao cuoc thi -> `/organizer/events/new`.
- [ ] Chinh sua -> `/organizer/events/basic-info`.
- [ ] Filter/search neu danh sach dai.

Acceptance criteria:
- Event status ro va khong nham voi registration status.

### `/organizer/events/new`

Muc tieu UI:
- Wizard tao event theo buoc.

Expected UI/UX:
- Step list: thong tin co ban, dang ky, bang thi, de thi/tieu chi.
- Step co status: da san sang/can cau hinh.
- CTA mo buoc lien quan.

Test cases:
- [ ] Click tung step den route dung.
- [ ] Step chua cau hinh hien warning.

Acceptance criteria:
- Wizard khong cho cam giac form mot man qua dai/roi.

### `/organizer/events/basic-info`

Muc tieu UI:
- Cau hinh thong tin, quota, team size.

Expected UI/UX:
- Field co label va helper.
- Loi quota/team size gan field.
- Save co loading state.

Test cases:
- [ ] Ten event rong -> error.
- [ ] Quota <= 0 -> error.
- [ ] Min > max -> error.
- [ ] Max > 5 -> error.

Acceptance criteria:
- Khong luu config sai rule team 1-5.

### `/organizer/registrations`

Muc tieu UI:
- Duyet/tach trang thai dang ky doi.

Expected UI/UX:
- Toolbar search/filter/density/export.
- Filter: Tat ca, Cho duyet, Da xac nhan, Danh sach cho, Tu choi.
- Row actions: Xem chi tiet, Duyet, Cho, Tu choi.
- Tu choi co confirm.
- Xem chi tiet nen la slide-over.

Test cases:
- [ ] Duyet pending khi quota con -> confirmed.
- [ ] Duyet khi quota day -> bi chan va warning.
- [ ] Dua vao waitlist -> waitlist.
- [ ] Tu choi -> confirm -> rejected.
- [ ] Search theo team/track/status.
- [ ] Bulk action voi selected rows.

Acceptance criteria:
- Confirmed count khong vuot quota.
- Reject/Waitlist cap nhat badge va KPI.

### `/organizer/users`

Muc tieu UI:
- Quan ly user/role trong he thong.

Expected UI/UX:
- Table co role, email, status, last active.
- Filter role: participant, organizer, mentor, judge.
- Action doi role can confirm neu anh huong quyen.

Test cases:
- [ ] Search user theo email/name.
- [ ] Filter role.
- [ ] Doi role -> confirm -> role cap nhat.

Acceptance criteria:
- Role guard phan anh dung role moi sau khi doi.

### `/organizer/problems`

Muc tieu UI:
- Cau hinh de thi va thoi gian mo de.

Expected UI/UX:
- Field: ten de, release_at, tom tat, file/link de.
- Badge draft/published.
- Cong bo de co confirm.

Test cases:
- [ ] Luu draft -> status draft.
- [ ] Cong bo -> confirm -> published.
- [ ] Release_at invalid -> error.
- [ ] Participant chua den gio -> khong thay de.

Acceptance criteria:
- De chi hien khi published va den release_at.

### `/organizer/rubric`

Muc tieu UI:
- Thiet lap tieu chi cham diem hop le.

Expected UI/UX:
- Moi row criterion co min, max, weight/description.
- Row invalid to warning/danger.
- Summary tong diem toi da.

Test cases:
- [ ] Max < min -> error.
- [ ] Min am neu khong cho phep -> error.
- [ ] Tong weight != 100 -> warning/error theo rule.

Acceptance criteria:
- Judge score khong the vuot min/max da cau hinh.

### `/organizer/boards`

Muc tieu UI:
- Tao bang thi/round va quan ly team trong bang.

Expected UI/UX:
- Card/table theo round.
- Moi bang hien team count, mentor, judge.
- Warning neu team chua co bang.

Test cases:
- [ ] Tao bang moi.
- [ ] Gan team vao bang.
- [ ] Chuyen team giua bang.
- [ ] Phat hien team nam 2 bang cung round.

Acceptance criteria:
- Mot team chi nam mot bang trong cung round.

### `/organizer/assignments`

Muc tieu UI:
- Phan mentor/judge cho bang.

Expected UI/UX:
- Bang assignment co board, mentor, judge, status.
- Empty state cho board chua co mentor/judge.
- Bulk assign neu co nhieu board.

Test cases:
- [ ] Gan mentor vao board.
- [ ] Gan judge vao board.
- [ ] Remove assignment -> confirm neu da co scoring.

Acceptance criteria:
- Mentor/Judge chi thay team thuoc board duoc gan.

### `/organizer/invitations`

Muc tieu UI:
- Theo doi va gui lai loi moi thanh vien/mentor/judge.

Expected UI/UX:
- Table co status va han phan hoi.
- Filter pending/confirmed/rejected/expired.
- Action gui lai loi moi.

Test cases:
- [ ] Gui lai pending invitation.
- [ ] Khong gui lai invitation confirmed neu rule khong cho.
- [ ] Expired hien badge ro.

Acceptance criteria:
- Invitation status khop voi man participant.

### `/organizer/check-ins`

Muc tieu UI:
- Duyet anh check-in.

Expected UI/UX:
- Card/table co anh, team, thoi gian nop, status.
- Filter theo status.
- Approve/reject actions; reject co ly do.

Test cases:
- [ ] Approve -> confirmed.
- [ ] Reject -> rejected + reason.
- [ ] Search team.
- [ ] Bulk approve pending neu co.

Acceptance criteria:
- Check-in status khong khoa/mo de thi.

### `/organizer/scoring`

Muc tieu UI:
- Theo doi tien do cham.

Expected UI/UX:
- KPI: da chot, ban nhap, tien do.
- Table theo team: submitted/total, draft, status.
- Highlight team chua cham du.

Test cases:
- [ ] Judge chot diem -> progress tang.
- [ ] Judge luu nhap -> progress khong tang.
- [ ] Team thieu diem -> warning.

Acceptance criteria:
- Diem trung binh/xep hang chi tinh phieu da chot.

### `/organizer/ranking`

Muc tieu UI:
- Xem xep hang va chon finalist thu cong.

Expected UI/UX:
- Table hien hang, team, board, diem TB, phieu da chot, status.
- Toggle finalist ro selected/unselected.
- Summary so team da chon.
- Chot danh sach co confirm.

Test cases:
- [ ] Toggle finalist on/off.
- [ ] Chot finalist -> confirm -> success.
- [ ] Team disqualified khong tinh ket qua hop le.
- [ ] AI score khong thay doi average.

Acceptance criteria:
- Finalist khong auto top N.
- Draft score khong tinh diem TB.

### `/organizer/finals`

Muc tieu UI:
- Quan ly danh sach chung ket.

Expected UI/UX:
- Card finalist co team, board, diem, status.
- Summary tong finalist.
- Action remove/add co confirm neu da publish.

Test cases:
- [ ] Add finalist.
- [ ] Remove finalist.
- [ ] Published results -> action co confirm manh hon.

Acceptance criteria:
- Danh sach finals khop voi ranking selection.

### `/organizer/disqualifications`

Muc tieu UI:
- Xu ly vi pham va loai doi.

Expected UI/UX:
- Muc do vi pham co mau ro.
- Button danger "Loai doi".
- Confirm noi ro anh huong den ket qua.

Test cases:
- [ ] Loai doi -> DISQUALIFIED.
- [ ] Team disqualified bien mat khoi ket qua hop le.
- [ ] Action ghi audit khi backend san sang.

Acceptance criteria:
- Khong the loai doi ma khong confirm.

### `/organizer/ai-auditor`

Muc tieu UI:
- Giam sat hang doi/chay lai danh gia AI.

Expected UI/UX:
- Hien rui ro theo severity.
- CTA chay lai danh gia AI.
- Noi ro chi la tham khao.

Test cases:
- [ ] Chay lai -> loading -> success/error.
- [ ] Issue high -> danger/warning.

Acceptance criteria:
- AI khong anh huong xep hang.

### `/organizer/ai-insights`

Muc tieu UI:
- Tong hop nhan xet AI theo team.

Expected UI/UX:
- Card team co score, summary, issue count.
- Filter severity/board neu du lieu lon.

Test cases:
- [ ] Team co issue high hien warning.
- [ ] Team khong co review hien empty state.

Acceptance criteria:
- Mentor va BTC xem duoc nhan xet nhung khong sua diem chinh thuc tu day.

### `/organizer/publish-results`

Muc tieu UI:
- Preview va cong bo ket qua.

Expected UI/UX:
- KPI preview: doi co diem hop le, phieu da chot, hang 1 tam thoi.
- Status ban nhap/da cong bo.
- Confirm modal truoc publish.

Test cases:
- [ ] Chua publish -> public khong xem.
- [ ] Publish -> confirm -> public xem.
- [ ] Publish lan 2 disabled.

Acceptance criteria:
- Ket qua chi public sau publish.
- Publish phai co confirm.

### `/organizer/export-success`

Muc tieu UI:
- Xuat ket qua CSV/PDF.

Expected UI/UX:
- Hien ten file, thoi gian tao, nguon du lieu.
- Button tai file co loading.
- Link ve xep hang.

Test cases:
- [ ] Export CSV.
- [ ] Export PDF neu co.
- [ ] API loi -> error toast.

Acceptance criteria:
- Export dung ket qua hop le theo rule da publish/preview.

### `/organizer/announcements`

Muc tieu UI:
- Tao va quan ly thong bao.

Expected UI/UX:
- Editor co preview markdown/rich text.
- Status draft/scheduled/sent.
- CTA publish/send co confirm neu gui den nhieu nguoi.

Test cases:
- [ ] Save draft.
- [ ] Preview markdown.
- [ ] Send notification -> confirm -> sent.

Acceptance criteria:
- Draft khong hien cho participant.
- Sent co lich su gui.

### `/organizer/notifications`

Muc tieu UI:
- Theo doi lich su thong bao da gui.

Expected UI/UX:
- Timeline theo thoi gian.
- Filter recipient/status.
- Empty state neu chua gui.

Test cases:
- [ ] Filter sent/scheduled.
- [ ] Search theo title.

Acceptance criteria:
- Notification history khop announcement send history.

## Mentor module

### `/mentor/dashboard`

Muc tieu UI:
- Mentor xem doi duoc phu trach va viec can ho tro.

Expected UI/UX:
- "My assigned teams" co team, board, repository, check-in, submission status, danh gia AI.
- Quick link repository va danh gia AI.
- Badge rui ro high neu co.

Test cases:
- [ ] Mentor chi thay team assigned.
- [ ] Team co repo -> link hien.
- [ ] Team chua repo -> empty/hint.
- [ ] Issue high -> warning.

Acceptance criteria:
- Mentor khong thay team ngoai phan cong.

### `/mentor/ai-review`

Muc tieu UI:
- Xem chi tiet danh gia AI cua team phu trach.

Expected UI/UX:
- Group theo team.
- Card issue co severity, summary, recommendation.
- Badge "Chi tham khao".

Test cases:
- [ ] Co review -> hien issues.
- [ ] Chua review -> empty state.
- [ ] Filter severity neu co.

Acceptance criteria:
- Mentor khong sua diem/xep hang tu man nay.

## Judge module

### `/judge/dashboard`

Muc tieu UI:
- Judge xem doi duoc cham va trang thai cham.

Expected UI/UX:
- "My assigned teams" co status: chua cham, dang nhap, da chot.
- Quick link "Mo phieu cham".
- KPI da chot/ban nhap.

Test cases:
- [ ] Judge chi thay assigned teams.
- [ ] Click mo phieu cham -> `/judge/scoring`.
- [ ] Team da chot hien success.

Acceptance criteria:
- Judge khong thay/cham team ngoai phan cong.

### `/judge/scoring`

Muc tieu UI:
- Nhap diem theo rubric, luu nhap, chot diem.

Expected UI/UX:
- Moi criterion hien min/max.
- Row/input invalid to mau.
- Error gan input khi diem ngoai range.
- Luu nhap va Chot diem tach ro.
- Chot diem co confirm.

Test cases:
- [ ] Diem < min -> error.
- [ ] Diem > max -> error.
- [ ] Luu nhap -> status draft.
- [ ] Chot diem -> confirm -> submitted/da chot.
- [ ] Reload page van hien draft neu co backend/local state.

Acceptance criteria:
- Draft khong tinh xep hang.
- Chi da chot moi tinh tien do va diem trung binh.

## Full-flow acceptance

### Flow A: Guest -> Participant registration

- [ ] Guest vao `/events`.
- [ ] Xem detail event dang mo.
- [ ] Dang nhap participant.
- [ ] Dang ky doi hop le.
- [ ] Thanh vien xac nhan loi moi.

Acceptance criteria:
- Team tao hop le 1-5 thanh vien.
- Email trung bi chan.
- Status ho so dung quota rule.

### Flow B: Competition day

- [ ] Participant check-in.
- [ ] Organizer approve check-in.
- [ ] Organizer publish problem.
- [ ] Participant chua den release_at khong thay de.
- [ ] Participant den release_at thay de.
- [ ] Participant nop repository.

Acceptance criteria:
- Check-in khong khoa de.
- Repository URL hop le moi nop chinh thuc.

### Flow C: Scoring -> results

- [ ] Judge luu nhap diem.
- [ ] Organizer scoring progress khong tinh draft.
- [ ] Judge chot diem.
- [ ] Organizer ranking tinh diem TB.
- [ ] Organizer chon finalist thu cong.
- [ ] Organizer loai team vi pham neu co.
- [ ] Organizer publish results.
- [ ] Public/participant xem ket qua.

Acceptance criteria:
- Diem ngoai rubric bi chan.
- Draft score khong tinh xep hang.
- Team disqualified khong tinh ket qua hop le.
- Results chi hien sau publish.

### Flow D: Mentor/Judge boundaries

- [ ] Mentor vao dashboard chi thay assigned teams.
- [ ] Mentor xem danh gia AI cua assigned teams.
- [ ] Judge vao dashboard chi thay assigned teams.
- [ ] Judge khong mo duoc team ngoai phan cong.

Acceptance criteria:
- Role guard va data filter deu dung.
- Khong co cross-role data leak tren UI.
