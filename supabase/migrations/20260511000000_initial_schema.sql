-- Mahjong tracker: initial schema (users, seasons, hanchans, scores)
-- Mリーグ準拠のデフォルト: オカ20 / ウマ +30,+10,-10,-30
-- （順位点+50/+10/-10/-30 は アプリで「ウマ＋オカ配分」を合成して scores.point に反映）

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. users
CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    icon_url text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.users IS 'プレイヤー（表示名・アイコン）';

-- 2. seasons（例: 3ヶ月ごとの期間）
CREATE TABLE public.seasons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT seasons_valid_range CHECK (end_date >= start_date)
);

COMMENT ON TABLE public.seasons IS 'シーズン期間（hanchans.played_at の日付と突き合わせて集計）';

-- 3. hanchans（半荘）
CREATE TABLE public.hanchans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    played_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    rule_oka real NOT NULL DEFAULT 20.0,
    rule_uma_1 real NOT NULL DEFAULT 30.0,
    rule_uma_2 real NOT NULL DEFAULT 10.0,
    rule_uma_3 real NOT NULL DEFAULT (-10.0),
    rule_uma_4 real NOT NULL DEFAULT (-30.0),
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.hanchans IS '半荘単位（ルール値は当該半荘にスナップショット保存）';

-- 4. scores（半荘あたり4行）
CREATE TABLE public.scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hanchan_id uuid NOT NULL REFERENCES public.hanchans (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    raw_score integer NOT NULL,
    placement integer NOT NULL,
    point real NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT scores_placement_range CHECK (placement >= 1 AND placement <= 4),
    CONSTRAINT scores_hanchan_user_unique UNIQUE (hanchan_id, user_id)
);

COMMENT ON TABLE public.scores IS '各半荘の各プレイヤー1行（素点・順位・最終ポイント）';
COMMENT ON COLUMN public.scores.point IS '(素点 - 30000)/1000 + 順位点（同着時はアプリで平均した値を保存想定）';

-- インデックス
CREATE INDEX idx_hanchans_played_at ON public.hanchans (played_at DESC);
CREATE INDEX idx_scores_hanchan_id ON public.scores (hanchan_id);
CREATE INDEX idx_scores_user_id ON public.scores (user_id);

-- RLS（クローズド運用: anon / authenticated に全操作許可）
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hanchans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for users"
    ON public.users
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for seasons"
    ON public.seasons
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for hanchans"
    ON public.hanchans
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for scores"
    ON public.scores
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Data API 用ロールへの権限
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.users TO anon, authenticated;
GRANT ALL ON TABLE public.seasons TO anon, authenticated;
GRANT ALL ON TABLE public.hanchans TO anon, authenticated;
GRANT ALL ON TABLE public.scores TO anon, authenticated;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
