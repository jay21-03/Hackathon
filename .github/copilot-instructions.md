# Project Baseline

## Folder Structure

```
hackathon/
  BE/          # Spring Boot backend (port 8085, /api)
  FE/          # React + Vite frontend (port 5173)
  docs/
  storage/
```

## Dev ports

- PostgreSQL: `localhost:5433`
- Backend: `localhost:8085` — API prefix `/api`
- Frontend: `localhost:5173` — proxies `/api` → backend in dev

## Guidelines

1. Put backend code in `BE/`, frontend in `FE/`.
2. FE calls BE via `apiClient` (`FE/src/services/apiClient.ts`).
3. Public events API: `GET /api/v1/events`.
