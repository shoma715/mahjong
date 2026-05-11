import type { ScoreInput, CalcResult, Hanchan } from '~/types'

export const useScoreCalc = () => {
  const DEFAULT_RULES = {
    kaeshi: 30_000,
    oka: 20.0,
    uma: [30.0, 10.0, -10.0, -30.0] as const,
  }

  const calcPoints = (
    inputs: ScoreInput[],
    hanchan?: Pick<Hanchan, 'rule_oka' | 'rule_uma_1' | 'rule_uma_2' | 'rule_uma_3' | 'rule_uma_4'>,
  ): CalcResult[] => {
    const oka = hanchan?.rule_oka ?? DEFAULT_RULES.oka
    const uma = hanchan
      ? [hanchan.rule_uma_1, hanchan.rule_uma_2, hanchan.rule_uma_3, hanchan.rule_uma_4]
      : [...DEFAULT_RULES.uma]

    const sorted = [...inputs]
      .map((s, originalIndex) => ({ ...s, originalIndex }))
      .sort((a, b) => (b.raw_score ?? 0) - (a.raw_score ?? 0))

    const placementPoints: number[] = new Array(4).fill(0)

    let i = 0
    while (i < 4) {
      let j = i
      while (j < 4 && sorted[j].raw_score === sorted[i].raw_score) j++

      let pointSum = 0
      for (let k = i; k < j; k++) {
        const rank = k + 1
        const umaPoint = uma[k]
        const okaPoint = rank === 1 ? oka : 0
        pointSum += umaPoint + okaPoint
      }

      const avgPoint = pointSum / (j - i)
      for (let k = i; k < j; k++) {
        placementPoints[k] = avgPoint
      }

      i = j
    }

    const results: CalcResult[] = sorted.map((s, idx) => {
      const basePoint = ((s.raw_score ?? 0) - DEFAULT_RULES.kaeshi) / 1000
      const totalPoint = basePoint + placementPoints[idx]
      const point = Math.trunc(totalPoint * 10) / 10

      const placement = (() => {
        const higherCount = sorted.filter(
          (_, k) => k < idx && (sorted[k].raw_score ?? 0) > (s.raw_score ?? 0),
        ).length
        return higherCount + 1
      })()

      return {
        user_id: s.user_id!,
        raw_score: s.raw_score ?? 0,
        placement,
        point,
      }
    })

    return results
  }

  const validateTotal = (inputs: ScoreInput[]): boolean => {
    const total = inputs.reduce((sum, s) => sum + (s.raw_score ?? 0), 0)
    return total === 100_000
  }

  const currentTotal = (inputs: ScoreInput[]): number => {
    return inputs.reduce((sum, s) => sum + (s.raw_score ?? 0), 0)
  }

  const formatPoint = (point: number): string => {
    const sign = point > 0 ? '+' : ''
    return `${sign}${point.toFixed(1)}`
  }

  const pointClass = (point: number): string => {
    if (point > 0) return 'point-positive'
    if (point < 0) return 'point-negative'
    return 'point-zero'
  }

  return {
    DEFAULT_RULES,
    calcPoints,
    validateTotal,
    currentTotal,
    formatPoint,
    pointClass,
  }
}
