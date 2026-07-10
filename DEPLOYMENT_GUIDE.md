# Deployment Guide: Vercel Free + Render Free + Neon Free

Huong dan nay danh cho demo do an. Khong commit file `.env` that va khong dua secret vao source code.

## 1. Tong quan source

- Frontend: `FE/` - React 18, TypeScript, Vite.
- Backend: `BE/` - Spring Boot 3.3.5, Maven, Java 21.
- Database: PostgreSQL.
- Migration: Flyway trong `BE/src/main/resources/db/migration`.
- Seed data: `docs/Seeds/phase2-contest-seed.sql` va cac file `docs/seed-demo*.sql`.
- Auth: JWT, Google OAuth, username/password.
- Tich hop phu: email, upload file local, GitHub provisioning/webhook, WebSocket `/ws/commits`, scheduler, AI review.

## 2. Tao Neon PostgreSQL

1. Tao project/database tren Neon.
2. Lay connection string PostgreSQL.
3. Doi sang JDBC URL cho Spring Boot:

```text
jdbc:postgresql://<neon-host>/<database>?sslmode=require
```

Vi du bien moi truong backend:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-example.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
SPRING_DATASOURCE_USERNAME=<neon-user>
SPRING_DATASOURCE_PASSWORD=<neon-password>
```

Flyway se tu chay migration khi backend Render start thanh cong.

## 3. Deploy backend len Render

Tao Web Service tren Render tu repo nay.

- Root directory: `BE`
- Runtime: Java
- Build command:

```bash
mvn -B -DskipTests clean package
```

- Start command:

```bash
java -Dserver.port=$PORT -jar target/hackathon-0.0.1-SNAPSHOT.jar
```

- Health check path:

```text
/actuator/health
```

### Backend environment variables tren Render

Bat buoc:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>/<database>?sslmode=require
SPRING_DATASOURCE_USERNAME=<neon-user>
SPRING_DATASOURCE_PASSWORD=<neon-password>
JWT_SECRET=<strong-random-secret-at-least-32-chars>
GOOGLE_CLIENT_ID=<google-oauth-web-client-id>
APP_FRONTEND_URL=https://<your-vercel-app>.vercel.app
CORS_ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app
APP_BOOTSTRAP_ORGANIZER_EMAIL=<organizer-email>
APP_INVITATION_TOKEN_SECRET=<strong-random-secret>
```

Khuyen nghi cho Render Free/Neon Free:

```text
DB_MAX_POOL_SIZE=5
DB_MIN_IDLE=1
DB_CONNECTION_TIMEOUT_MS=30000
DEV_AUTH_ENABLED=false
MAIL_ENABLED=false
AI_REVIEW_SCHEDULER_ENABLED=false
AI_REVIEW_GITHUB_ISSUES_ENABLED=false
GITHUB_SCHEDULER_ENABLED=false
FILE_STORAGE_PATH=/tmp/seal-hackathon-storage
```

Neu demo email that:

```text
MAIL_ENABLED=true
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SMTP_AUTH=true
MAIL_SMTP_STARTTLS_ENABLE=true
MAIL_USERNAME=<gmail-address>
MAIL_PASSWORD=<gmail-app-password>
MAIL_FROM=<gmail-address-or-sender>
INVITATION_BASE_URL=https://<your-vercel-app>.vercel.app
MAIL_API_BASE_URL=https://<your-render-service>.onrender.com
```

Neu demo GitHub provisioning/webhook:

```text
GITHUB_MODE=pat
GITHUB_ORG=<github-org-or-owner>
GITHUB_PAT=<new-github-token>
GITHUB_TEMPLATE_OWNER=<template-owner>
GITHUB_TEMPLATE_REPO=<template-repo>
GITHUB_WEBHOOK_SECRET=<strong-webhook-secret>
GITHUB_WEBHOOK_URL=https://<your-render-service>.onrender.com/api/v1/webhooks/github
GITHUB_WEBHOOK_AUTO_REGISTER=true
```

Quan trong: neu GitHub token tung bi lo, revoke token do va tao token moi truoc khi deploy.

## 4. Chay migration

Khong can chay lenh rieng neu backend start thanh cong. Spring Boot se chay Flyway tu:

```text
classpath:db/migration
```

Kiem tra Render logs de thay Flyway migration thanh cong. Neu migration fail, backend co the khong start.

## 5. Chay seed data vao Neon

Chi chay seed sau khi backend da start thanh cong lan dau va Flyway da tao schema.

Dung `psql` voi connection string Neon:

```bash
psql "postgresql://<user>:<password>@<host>/<database>?sslmode=require" -v ON_ERROR_STOP=1 -c "SET client_encoding = 'UTF8';"
psql "postgresql://<user>:<password>@<host>/<database>?sslmode=require" -v ON_ERROR_STOP=1 -f docs/Seeds/phase2-contest-seed.sql
```

Neu can demo diem/ranking, chay tiep cac seed score phu hop:

```bash
psql "postgresql://<user>:<password>@<host>/<database>?sslmode=require" -v ON_ERROR_STOP=1 -f docs/seed-demo02-pham-hoai-duc-scores.sql
psql "postgresql://<user>:<password>@<host>/<database>?sslmode=require" -v ON_ERROR_STOP=1 -f docs/seed-demo03-round1-scores.sql
psql "postgresql://<user>:<password>@<host>/<database>?sslmode=require" -v ON_ERROR_STOP=1 -f docs/seed-demo03-final-pham-hoai-duc-scores.sql
```

Ghi chu:

- Chay seed bang terminal UTF-8.
- Nen chay seed tren database demo/fresh database.
- Mot so seed co `ON CONFLICT`, nhung khong nen xem tat ca seed la idempotent tuyet doi.
- Neu muon reset demo database, reset tren Neon roi de backend chay Flyway lai truoc khi seed.

## 6. Deploy frontend len Vercel

Tao project Vercel tu repo nay.

- Root directory: `FE`
- Build command: `npm run build`
- Output directory: `dist`

`FE/vercel.json` da cau hinh rewrite tat ca route ve `/index.html` de React Router refresh khong bi 404.

### Frontend environment variables tren Vercel

Bat buoc:

```text
VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api
VITE_WS_BASE_URL=https://<your-render-service>.onrender.com
VITE_GOOGLE_CLIENT_ID=<google-oauth-web-client-id>
```

Neu muon giam rui ro demo free tier:

```text
VITE_ENABLE_AI_REVIEW=false
VITE_AI_REVIEW_JUDGE_ACCESS=false
VITE_ENABLE_GITHUB_PROVISIONING=false
```

Giu cac tinh nang chinh cho demo scoring/ranking:

```text
VITE_ENABLE_PHASE_7=true
VITE_ENABLE_SCORING=true
VITE_ENABLE_RANKING=true
```

## 7. Google OAuth

Trong Google Cloud Console, them domain production:

```text
https://<your-vercel-app>.vercel.app
```

Dung cung mot OAuth Web Client ID cho:

- Backend `GOOGLE_CLIENT_ID`
- Frontend `VITE_GOOGLE_CLIENT_ID`

## 8. Checklist test sau deploy

Backend:

- Mo `https://<render-service>.onrender.com/actuator/health`.
- Kiem tra Render logs khong co Flyway error.
- Kiem tra `/swagger-ui.html` neu can test API.

Frontend:

- Mo Vercel URL.
- Refresh truc tiep `/login`, `/events`, `/organizer/dashboard` de dam bao khong 404.
- Kiem tra Network tab: frontend khong goi `localhost`.

Login:

- Dang nhap Google bang email bootstrap organizer.
- Kiem tra token duoc luu va `/api/v1/me` tra ve user.

Event/team/board:

- Mo danh sach events.
- Tao/kiem tra team.
- Kiem tra board/slot/problem.

Judge scoring:

- Dang nhap user co role `JUDGE`.
- Mo `/judge/scoring`.
- Luu diem va kiem tra organizer thay progress.

Ranking/publish result:

- Mo organizer results hub.
- Kiem tra ranking.
- Publish result.
- Mo public results route `/events/:eventId/results`.

## 9. Rui ro free tier

- Render Free co the sleep/cold start. Truoc demo, mo `/actuator/health` truoc vai phut.
- Render Free filesystem khong nen dung cho file quan trong. Upload local chi nen demo ngan.
- Frontend HTTPS phai goi backend HTTPS, khong goi HTTP.
- Frontend production khong duoc goi `localhost`.
- Backend production khong duoc dung database `localhost`.
- Neon can `sslmode=require` trong JDBC URL.
- Khong dung `JWT_SECRET=change_me` hoac secret mac dinh.
- Seed data nen chay voi UTF-8.
- Email that can Gmail App Password hoac SMTP provider rieng.
- GitHub webhook can URL public cua Render.
- Scheduler khong dang tin cay khi service Render dang sleep.
- AI review/GitHub issue creation phu thuoc quota va token ben ngoai; nen tat neu khong phai diem demo chinh.
