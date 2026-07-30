DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM events
        WHERE registration_start_at IS NOT NULL
          AND registration_end_at IS NOT NULL
          AND registration_start_at > registration_end_at
    ) THEN
        RAISE EXCEPTION 'validation hardening preflight failed: events registration_start_at > registration_end_at';
    END IF;

    IF EXISTS (
        SELECT 1 FROM problems
        WHERE release_at IS NOT NULL
          AND close_at IS NOT NULL
          AND close_at <= release_at
    ) THEN
        RAISE EXCEPTION 'validation hardening preflight failed: problems close_at <= release_at';
    END IF;

    IF EXISTS (SELECT 1 FROM rounds WHERE round_order <= 0) THEN
        RAISE EXCEPTION 'validation hardening preflight failed: rounds round_order <= 0';
    END IF;

    IF EXISTS (SELECT 1 FROM boards WHERE board_order <= 0) THEN
        RAISE EXCEPTION 'validation hardening preflight failed: boards board_order <= 0';
    END IF;

    IF EXISTS (SELECT 1 FROM board_slots WHERE team_number <= 0) THEN
        RAISE EXCEPTION 'validation hardening preflight failed: board_slots team_number <= 0';
    END IF;

    IF EXISTS (SELECT 1 FROM award_categories WHERE rank_order IS NOT NULL AND rank_order <= 0) THEN
        RAISE EXCEPTION 'validation hardening preflight failed: award_categories rank_order <= 0';
    END IF;

    IF EXISTS (SELECT 1 FROM award_categories WHERE sort_order < 0) THEN
        RAISE EXCEPTION 'validation hardening preflight failed: award_categories sort_order < 0';
    END IF;

    IF EXISTS (SELECT 1 FROM award_categories WHERE award_type = 'RANK' AND rank_order IS NULL) THEN
        RAISE EXCEPTION 'validation hardening preflight failed: RANK award_categories without rank_order';
    END IF;

    IF EXISTS (SELECT 1 FROM award_categories WHERE award_type = 'CUSTOM' AND rank_order IS NOT NULL) THEN
        RAISE EXCEPTION 'validation hardening preflight failed: CUSTOM award_categories with rank_order';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM award_categories
        WHERE award_type = 'RANK'
          AND rank_order IS NOT NULL
        GROUP BY event_id, COALESCE(round_id, -1), rank_order
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'validation hardening preflight failed: duplicate RANK award rank_order in the same scope';
    END IF;

    IF EXISTS (SELECT 1 FROM score_criteria WHERE min_score >= max_score) THEN
        RAISE EXCEPTION 'validation hardening preflight failed: score_criteria min_score >= max_score';
    END IF;

    IF to_regclass('public.criteria_template_items') IS NOT NULL
       AND EXISTS (SELECT 1 FROM criteria_template_items WHERE min_score >= max_score) THEN
        RAISE EXCEPTION 'validation hardening preflight failed: criteria_template_items min_score >= max_score';
    END IF;
END $$;

ALTER TABLE problems
    ALTER COLUMN attachment_url TYPE VARCHAR(2048),
    ALTER COLUMN external_link TYPE VARCHAR(2048);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_events_registration_window') THEN
        ALTER TABLE events
            ADD CONSTRAINT ck_events_registration_window
            CHECK (
                registration_start_at IS NULL
                OR registration_end_at IS NULL
                OR registration_start_at <= registration_end_at
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_problems_release_close') THEN
        ALTER TABLE problems
            ADD CONSTRAINT ck_problems_release_close
            CHECK (
                release_at IS NULL
                OR close_at IS NULL
                OR close_at > release_at
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_rounds_round_order_positive') THEN
        ALTER TABLE rounds
            ADD CONSTRAINT ck_rounds_round_order_positive CHECK (round_order > 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_boards_board_order_positive') THEN
        ALTER TABLE boards
            ADD CONSTRAINT ck_boards_board_order_positive CHECK (board_order > 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_board_slots_team_number_positive') THEN
        ALTER TABLE board_slots
            ADD CONSTRAINT ck_board_slots_team_number_positive CHECK (team_number > 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_award_categories_rank_order_positive') THEN
        ALTER TABLE award_categories
            ADD CONSTRAINT ck_award_categories_rank_order_positive CHECK (rank_order IS NULL OR rank_order > 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_award_categories_sort_order_non_negative') THEN
        ALTER TABLE award_categories
            ADD CONSTRAINT ck_award_categories_sort_order_non_negative CHECK (sort_order >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_award_categories_rank_type') THEN
        ALTER TABLE award_categories
            ADD CONSTRAINT ck_award_categories_rank_type CHECK (
                (award_type = 'RANK' AND rank_order IS NOT NULL)
                OR (award_type = 'CUSTOM' AND rank_order IS NULL)
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_score_criteria_score_range') THEN
        ALTER TABLE score_criteria
            ADD CONSTRAINT ck_score_criteria_score_range CHECK (min_score < max_score);
    END IF;

    IF to_regclass('public.criteria_template_items') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_criteria_template_items_score_range') THEN
        ALTER TABLE criteria_template_items
            ADD CONSTRAINT ck_criteria_template_items_score_range CHECK (min_score < max_score);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_award_categories_rank_scope
    ON award_categories (event_id, COALESCE(round_id, -1), rank_order)
    WHERE award_type = 'RANK' AND rank_order IS NOT NULL;
