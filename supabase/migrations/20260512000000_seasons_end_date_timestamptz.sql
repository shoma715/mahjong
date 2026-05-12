-- seasons.end_date を「その瞬間」まで扱えるように timestamptz に変更
ALTER TABLE public.seasons
    ALTER COLUMN end_date TYPE timestamptz
    USING CASE
        WHEN end_date IS NULL THEN NULL
        ELSE end_date::timestamp AT TIME ZONE 'UTC'
    END;

COMMENT ON COLUMN public.seasons.end_date IS '終了日時（その瞬間まで含む）。NULL のときは進行中シーズン';