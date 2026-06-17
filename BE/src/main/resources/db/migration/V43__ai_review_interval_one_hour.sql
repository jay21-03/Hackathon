-- Align scheduled AI review cadence with handover (cron mỗi 1 giờ)
UPDATE team_repositories
SET review_interval_minutes = 60
WHERE review_interval_minutes IS NULL
   OR review_interval_minutes < 60;
