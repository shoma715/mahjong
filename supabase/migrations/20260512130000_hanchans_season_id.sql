-- 半荘をシーズン ID で紐付け（日付範囲集計による混在を防ぐ）

ALTER TABLE public.hanchans
    ADD COLUMN season_id uuid REFERENCES public.seasons (id) ON DELETE SET NULL;

CREATE INDEX idx_hanchans_season_id ON public.hanchans (season_id);

COMMENT ON COLUMN public.hanchans.season_id IS '所属シーズン。集計・履歴は played_at ではなくこの ID でフィルタする';

-- 既存行: played_at が含まれるシーズン（開始が新しい方を優先）に紐付け
UPDATE public.hanchans h
SET season_id = sub.season_row_id
FROM (
    SELECT DISTINCT ON (h2.id)
        h2.id AS hanchan_id,
        s2.id AS season_row_id
    FROM public.hanchans h2
    INNER JOIN public.seasons s2
        ON (h2.played_at::date >= s2.start_date)
        AND (s2.end_date IS NULL OR h2.played_at <= s2.end_date)
    ORDER BY h2.id, s2.start_date DESC
) AS sub
WHERE h.id = sub.hanchan_id;
