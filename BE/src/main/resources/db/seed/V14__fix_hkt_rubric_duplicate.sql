-- Xoa tieu chi rubric thua tren round 22 (R1_01 100% — trung voi bo HKT_01-05).
DELETE FROM score_criteria sc
WHERE sc.round_id = 22
  AND sc.code = 'R1_01'
  AND NOT EXISTS (
      SELECT 1 FROM score_items si WHERE si.criteria_id = sc.id
  );
