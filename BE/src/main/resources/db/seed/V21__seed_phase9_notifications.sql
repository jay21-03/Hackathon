-- Sample in-app notifications for manual smoke (event 13, participant user 105)
INSERT INTO notifications (
    user_id, email, event_id, notification_type, title, content, link_url, dedupe_key, is_read, created_at
)
SELECT
    105,
    'hoangdhse184661@fpt.edu.vn',
    13,
    'TEAM_STATUS',
    'Đội đã được duyệt',
    'Đội «HKT Pioneers» đã được BTC xác nhận tham gia Hackathon Kỹ thuật 2025.',
    '/me/team?eventId=13',
    'seed:team-status:13:105',
    false,
    NOW() - INTERVAL '2 days'
WHERE EXISTS (SELECT 1 FROM users WHERE id = 105)
  AND EXISTS (SELECT 1 FROM events WHERE id = 13)
  AND NOT EXISTS (SELECT 1 FROM notifications WHERE dedupe_key = 'seed:team-status:13:105');

INSERT INTO notifications (
    user_id, email, event_id, notification_type, title, content, link_url, dedupe_key, is_read, created_at
)
SELECT
    105,
    'hoangdhse184661@fpt.edu.vn',
    13,
    'ANNOUNCEMENT',
    'Chào mừng đến Hackathon Kỹ thuật',
    'BTC đã mở đăng ký. Kiểm tra lịch thi và quy định trên trang cuộc thi.',
    '/me/notifications?eventId=13',
    'seed:announcement:welcome:13:105',
    true,
    NOW() - INTERVAL '1 day'
WHERE EXISTS (SELECT 1 FROM users WHERE id = 105)
  AND EXISTS (SELECT 1 FROM events WHERE id = 13)
  AND NOT EXISTS (SELECT 1 FROM notifications WHERE dedupe_key = 'seed:announcement:welcome:13:105');
