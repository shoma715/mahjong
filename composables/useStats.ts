import type { User, PlayerStats, HanchanWithScores } from '~/types'

export const useStats = () => {
  const calcStreak = (placements: number[], condition: (p: number) => boolean): number => {
    let streak = 0
    for (let i = placements.length - 1; i >= 0; i--) {
      if (condition(placements[i]!)) streak++
      else break
    }
    return streak
  }

  const calcPlayerStats = (user: User, hanchans: HanchanWithScores[]): PlayerStats => {
    const myScores = hanchans
      .flatMap(h =>
        h.scores
          .filter(s => s.user_id === user.id)
          .map(s => ({ ...s, played_at: h.played_at })),
      )
      .sort((a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime())

    const totalGames = myScores.length

    if (totalGames === 0) {
      return {
        user,
        total_games: 0,
        rank_counts: [0, 0, 0, 0],
        total_point: 0,
        avg_placement: 0,
        best_point: 0,
        best_raw_score: 0,
        top_rate: 0,
        rentai_rate: 0,
        last_avoidance_rate: 0,
        current_top_streak: 0,
        current_rentai_streak: 0,
      }
    }

    const rank_counts: [number, number, number, number] = [0, 0, 0, 0]
    for (const s of myScores) {
      if (s.placement >= 1 && s.placement <= 4) {
        rank_counts[s.placement - 1]++
      }
    }

    const total_point =
      Math.trunc(myScores.reduce((sum, s) => sum + s.point, 0) * 10) / 10

    const avg_placement =
      Math.round((myScores.reduce((sum, s) => sum + s.placement, 0) / totalGames) * 100) / 100

    const best_point = Math.max(...myScores.map(s => s.point))
    const best_raw_score = Math.max(...myScores.map(s => s.raw_score))

    const top_rate = rank_counts[0] / totalGames
    const rentai_rate = (rank_counts[0] + rank_counts[1]) / totalGames
    const last_avoidance_rate = (totalGames - rank_counts[3]) / totalGames

    const placements = myScores.map(s => s.placement)
    const current_top_streak = calcStreak(placements, p => p === 1)
    const current_rentai_streak = calcStreak(placements, p => p <= 2)

    return {
      user,
      total_games: totalGames,
      rank_counts,
      total_point,
      avg_placement,
      best_point,
      best_raw_score,
      top_rate,
      rentai_rate,
      last_avoidance_rate,
      current_top_streak,
      current_rentai_streak,
    }
  }

  const calcAllStats = (users: User[], hanchans: HanchanWithScores[]): PlayerStats[] => {
    return users
      .map(user => calcPlayerStats(user, hanchans))
      .sort((a, b) => b.total_point - a.total_point)
  }

  const formatRate = (rate: number): string => `${(rate * 100).toFixed(1)}%`

  const formatAvgPlacement = (avg: number): string => avg.toFixed(2)

  return {
    calcAllStats,
    calcPlayerStats,
    formatRate,
    formatAvgPlacement,
  }
}
