-- 進行中シーズンは end_date を NULL で表す
ALTER TABLE public.seasons ALTER COLUMN end_date DROP NOT NULL;

COMMENT ON COLUMN public.seasons.end_date IS '終了日（含む）。NULL のときは進行中シーズン';
