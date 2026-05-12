export interface User {
  id: string
  name: string
  icon_url: string | null
  created_at?: string
}

export interface Season {
  id: string
  name: string
  start_date: string
  /** 終了日時（その瞬間まで含む）。NULL のときは進行中 */
  end_date: string | null
  created_at?: string
}

/** シーズン作成UI用（暦の四半期イメージ） */
export type SeasonKind = 'spring' | 'summer' | 'autumn' | 'winter'

export interface Hanchan {
  id: string
  played_at: string
  rule_oka: number
  rule_uma_1: number
  rule_uma_2: number
  rule_uma_3: number
  rule_uma_4: number
  created_at?: string
}

export interface Score {
  id: string
  hanchan_id: string
  user_id: string
  raw_score: number
  placement: number
  point: number
  created_at?: string
}

/** scores + users JOIN など、関連データを含むスコア行 */
export interface ScoreWithRelations extends Score {
  user: User
}

export interface HanchanWithScores extends Hanchan {
  scores: ScoreWithRelations[]
}

export type HanchanRulesInput = Pick<
  Hanchan,
  'rule_oka' | 'rule_uma_1' | 'rule_uma_2' | 'rule_uma_3' | 'rule_uma_4'
>

export interface ScoreInput {
  user_id: string | null
  raw_score: number | null
}

export interface CalcResult {
  user_id: string
  raw_score: number
  placement: number
  point: number
}

export interface AuthState {
  userId: string | null
  userName: string | null
}

export interface PlayerStats {
  user: User
  total_games: number
  rank_counts: [number, number, number, number]
  total_point: number
  avg_placement: number
  best_point: number
  top_rate: number
  rentai_rate: number
  last_avoidance_rate: number
  current_top_streak: number
  current_rentai_streak: number
}
