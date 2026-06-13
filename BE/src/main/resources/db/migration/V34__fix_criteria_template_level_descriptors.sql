-- Fix criteria template level_descriptors: level must be EXCELLENT|GOOD|SATISFACTORY|UNSATISFACTORY
UPDATE criteria_template_items
SET level_descriptors = '[
  {"level":"EXCELLENT","label":"Xuất sắc","minScore":9,"maxScore":10,"description":""},
  {"level":"GOOD","label":"Tốt","minScore":7,"maxScore":8.9,"description":""},
  {"level":"SATISFACTORY","label":"Đạt","minScore":5,"maxScore":6.9,"description":""},
  {"level":"UNSATISFACTORY","label":"Chưa đạt","minScore":0,"maxScore":4.9,"description":""}
]'::jsonb
WHERE level_descriptors::text LIKE '%"level":1%'
   OR level_descriptors::text LIKE '%"level": 1%'
   OR level_descriptors::text LIKE '%"level":"1"%';
