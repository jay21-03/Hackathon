WITH ranked_slots AS (
    SELECT
        bs.team_id,
        bs.board_id,
        b.round_id,
        p.id AS problem_id,
        ROW_NUMBER() OVER (
            PARTITION BY bs.team_id
            ORDER BY r.round_order DESC NULLS LAST, bs.assigned_at DESC NULLS LAST, bs.id DESC
        ) AS rn
    FROM board_slots bs
    JOIN boards b ON b.id = bs.board_id
    JOIN rounds r ON r.id = b.round_id
    LEFT JOIN LATERAL (
        SELECT p2.id
        FROM problems p2
        WHERE p2.board_id = bs.board_id
        ORDER BY p2.release_at ASC NULLS LAST, p2.id ASC
        LIMIT 1
    ) p ON TRUE
    WHERE bs.team_id IS NOT NULL
)
UPDATE team_repositories tr
SET
    board_id = COALESCE(tr.board_id, ranked_slots.board_id),
    round_id = COALESCE(tr.round_id, ranked_slots.round_id),
    problem_id = COALESCE(tr.problem_id, ranked_slots.problem_id),
    provision_status = CASE
        WHEN tr.repository_url IS NOT NULL
             AND tr.provision_status = 'PENDING'
             AND ranked_slots.problem_id IS NOT NULL THEN 'CREATED'
        ELSE tr.provision_status
    END,
    access_status = CASE
        WHEN tr.repository_url IS NOT NULL
             AND tr.access_status = 'PENDING' THEN 'OPEN'
        ELSE tr.access_status
    END,
    updated_at = NOW()
FROM ranked_slots
WHERE tr.team_id = ranked_slots.team_id
  AND ranked_slots.rn = 1
  AND tr.problem_id IS NULL
  AND tr.round_id IS NULL
  AND tr.board_id IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM team_repositories existing
      WHERE existing.team_id = tr.team_id
        AND existing.problem_id = ranked_slots.problem_id
        AND existing.id <> tr.id
  );
