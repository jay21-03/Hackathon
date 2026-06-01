# Phase 2 Contest Seed Data Guide

## 1. Chạy Docker BE + DB
```bash
cd D:\Bin\SWP391\Hackathon\seal-hackathon
docker compose up -d postgres backend
```

## 2. Chạy seed SQL
```bash
docker compose exec -T postgres psql -U postgres -d seal_hackathon < docs/Seeds/phase2-contest-seed.sql
```

Nếu PowerShell redirect gặp lỗi, dùng cách này:
```powershell
Get-Content .\docs\Seeds\phase2-contest-seed.sql | docker compose exec -T postgres psql -U postgres -d seal_hackathon
```

## 3. Kiểm tra DB
```bash
docker compose exec postgres psql -U postgres -d seal_hackathon -c "select id,name,status,max_teams,min_team_size,max_team_size from events order by id;"
docker compose exec postgres psql -U postgres -d seal_hackathon -c "select event_id,round_type,count(*) from rounds group by event_id,round_type order by event_id,round_type;"
docker compose exec postgres psql -U postgres -d seal_hackathon -c "select r.event_id,b.round_id,count(*) from boards b join rounds r on r.id=b.round_id group by r.event_id,b.round_id order by r.event_id,b.round_id;"
docker compose exec postgres psql -U postgres -d seal_hackathon -c "select board_id,count(*) from board_slots group by board_id order by board_id;"
docker compose exec postgres psql -U postgres -d seal_hackathon -c "select board_id,count(*) from problems group by board_id order by board_id;"
```

Kỳ vọng sau seed:
- 3 events
- mỗi event 2 rounds
- mỗi round 3 boards
- mỗi board 5 slots
- mỗi board ít nhất 1 problem

## 4. Test Swagger
- `GET /api/v1/events`
- `GET /api/v1/events/{eventId}`
- `GET /api/v1/admin/events/{eventId}/rounds`
- `GET /api/v1/admin/rounds/{roundId}/boards`
- `GET /api/v1/admin/boards/{boardId}/slots`
- `GET /api/v1/admin/boards/{boardId}/problems`

## 5. Reset dev DB nếu cần
Không xóa data tự động trong seed.

Nếu muốn reset sạch dev DB:
```bash
docker compose down -v
docker compose up -d --build postgres backend
```
Sau đó chạy lại seed SQL ở bước 2.
