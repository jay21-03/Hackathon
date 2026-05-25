# SEAL Hackathon Monorepo (Skeleton)

## 1) Chạy backend (local)
```bash
cd backend
./run-dev.ps1
mvn spring-boot:run
```
Backend mặc định chạy tại `http://localhost:8085`.
Swagger: `http://localhost:8085/swagger-ui.html`

Nếu `8085` đã bị chiếm, đổi `SERVER_PORT` trong `backend/run-dev.ps1` trước khi chạy.

## 2) Chạy frontend (local)
```bash
cd frontend
npm install
npm run dev
```
Frontend mặc định chạy tại `http://localhost:5173`.
Frontend gọi backend tại `http://localhost:8085/api` theo cấu hình mặc định.

## 3) Chạy bằng Docker Compose
```bash
cp .env.example .env
docker compose up --build
```
PostgreSQL map ra host `5433`, backend map ra host `8085`.

## 4) Cấu hình `.env`
Tạo file `.env` từ `.env.example` và điền các biến:
- `SERVER_PORT`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `JWT_SECRET`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `AI_API_KEY`
- `AI_REVIEW_INTERVAL_MINUTES`
- `FILE_STORAGE_PATH`

## 5) Ghi chú scope MVP
- Team size: **1-5** người.
- Mở đề theo `release_at`.
- Check-in chỉ xác nhận có mặt, **không chặn** xem đề.
- Ranking tính bằng điểm **trung bình** từ judge đã submit.
- Advancement do Organizer tick chọn thủ công.
- AI Review chạy định kỳ mỗi **30 phút**, chỉ để tham khảo, không ảnh hưởng điểm chính thức/ranking.

## Thư mục chính
- `backend/`: Spring Boot 3.x + Java 21 + Maven + Flyway + PostgreSQL.
- `frontend/`: React + TypeScript + Vite.
- `docs/`: tài liệu bổ sung.

## Ghi chú port dev
- PostgreSQL local: `localhost:5433`
- Backend local: `localhost:8085`
- Frontend local: `localhost:5173`
