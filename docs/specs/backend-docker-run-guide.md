# Backend Docker Run Guide

## 1. Prepare `.env`
1. Copy `.env.example` to `.env`.
2. Fill required values:
   - `GOOGLE_CLIENT_ID`: Google OAuth Web Client ID thật.
   - `JWT_SECRET`: secret đủ mạnh (>= 32 chars).
   - `ALLOWED_EMAIL_DOMAINS`: ví dụ `fpt.edu.vn,fe.edu.vn,gmail.com`.
   - `APP_BOOTSTRAP_ORGANIZER_EMAIL`: email dùng bootstrap organizer (optional nhưng nên set để test admin).

## 2. Important DB URL rule
- Backend chạy trong Docker phải dùng: `jdbc:postgresql://postgres:5432/seal_hackathon`.
- Backend chạy local (`run-dev.ps1`) mới dùng: `jdbc:postgresql://localhost:5433/seal_hackathon`.

## 3. Build backend image
```powershell
cd hackathon
docker compose build --progress=plain backend
```

## 4. Run Postgres + Backend only
```powershell
docker compose up -d postgres backend
docker compose ps
docker compose logs -f backend
```

## 5. Open Swagger
- `http://localhost:8085/swagger-ui.html`
- `http://localhost:8085/v3/api-docs`

## 6. Smoke test
```powershell
curl.exe -i http://localhost:8085/swagger-ui.html
curl.exe -i http://localhost:8085/v3/api-docs
curl.exe -i http://localhost:8085/api/v1/me

curl.exe -i -X POST http://localhost:8085/api/v1/auth/google-login -H "Content-Type: application/json" -d "{}"
curl.exe -i -X POST http://localhost:8085/api/v1/auth/google-login -H "Content-Type: application/json" -d "{\"idToken\":\"invalid-token\"}"

curl.exe -i -X OPTIONS "http://localhost:8085/api/v1/me" `
  -H "Origin: http://localhost:5173" `
  -H "Access-Control-Request-Method: GET" `
  -H "Access-Control-Request-Headers: Authorization,Content-Type"
```

Expected:
- Swagger: `200/302`
- `/v3/api-docs`: `200`
- `/api/v1/me` không token: `401`
- `google-login` `{}`: `400`
- `google-login` invalid token: `401`
- OPTIONS có `Access-Control-Allow-Origin: http://localhost:5173`

## 7. Stop services
```powershell
docker compose stop backend
docker compose down
```

## 8. Reset DB (destructive)
Chỉ dùng khi cần reset sạch dữ liệu:
```powershell
docker compose down -v
```
