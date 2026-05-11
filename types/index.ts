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
  end_date: string
  created_at?: string
}

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

export interface ScoreWithUser extends Score {
  user: User
}

export interface HanchanWithScores extends Hanchan {
  scores: ScoreWithUser[]
}

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
