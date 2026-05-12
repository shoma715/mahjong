import type { Hanchan, HanchanWithScores, CalcResult, HanchanRulesInput } from '~/types'

export const useHanchans = () => {
  const supabase = useSupabase()

  const fetchHanchans = async (limit = 50): Promise<HanchanWithScores[]> => {
    const { data, error } = await supabase
      .from('hanchans')
      .select(`
        *,
        scores (
          *,
          user:users (*)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[useHanchans] fetchHanchans:', error)
      return []
    }
    return data as HanchanWithScores[]
  }

  /** endDate が null のときは進行中シーズン扱いで上限を遠い未来にする */
  const fetchHanchansBySeason = async (
    startDate: string,
    endDate: string | null,
  ): Promise<HanchanWithScores[]> => {
    const end = endDate ?? new Date().toISOString()
    const { data, error } = await supabase
      .from('hanchans')
      .select(`
        *,
        scores (
          *,
          user:users (*)
        )
      `)
      .gte('played_at', `${startDate}T00:00:00`)
      .lte('played_at', end)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('[useHanchans] fetchHanchansBySeason:', error)
      return []
    }
    return data as HanchanWithScores[]
  }

  /**
   * 指定IDの半荘1件を取得（scores に users を JOIN）
   * 編集画面 `pages/history/[id].vue` から利用
   */
  const fetchHanchanById = async (id: string): Promise<HanchanWithScores | null> => {
    if (!id?.trim()) return null
    const { data, error } = await supabase
      .from('hanchans')
      .select(`
        *,
        scores (
          *,
          user:users (*)
        )
      `)
      .eq('id', id)
      .limit(1)

    if (error) {
      console.error('[useHanchans] fetchHanchanById:', error)
      return null
    }
    const row = Array.isArray(data) ? data[0] : data
    if (!row) return null
    return row as HanchanWithScores
  }

  const saveHanchan = async (
    playedAt: string,
    calcResults: CalcResult[],
    rules?: HanchanRulesInput,
  ): Promise<Hanchan | null> => {
    const insertPayload = {
      played_at: new Date(`${playedAt}T12:00:00`).toISOString(),
      rule_oka: rules?.rule_oka ?? 20,
      rule_uma_1: rules?.rule_uma_1 ?? 30,
      rule_uma_2: rules?.rule_uma_2 ?? 10,
      rule_uma_3: rules?.rule_uma_3 ?? -10,
      rule_uma_4: rules?.rule_uma_4 ?? -30,
    }

    const { data: hanchan, error: hanchanError } = await supabase
      .from('hanchans')
      .insert(insertPayload)
      .select()
      .single()

    if (hanchanError || !hanchan) {
      console.error('[useHanchans] insert hanchan:', hanchanError)
      return null
    }

    const scoreRows = calcResults.map(r => ({
      hanchan_id: hanchan.id,
      user_id: r.user_id,
      raw_score: r.raw_score,
      placement: r.placement,
      point: r.point,
    }))

    const { error: scoresError } = await supabase.from('scores').insert(scoreRows)

    if (scoresError) {
      console.error('[useHanchans] insert scores:', scoresError)
      await supabase.from('hanchans').delete().eq('id', hanchan.id)
      return null
    }

    return hanchan as Hanchan
  }

  const deleteHanchan = async (hanchanId: string): Promise<boolean> => {
    const { error } = await supabase.from('hanchans').delete().eq('id', hanchanId)
    if (error) {
      console.error('[useHanchans] deleteHanchan:', error)
      return false
    }
    return true
  }

  const updateScores = async (
    hanchanId: string,
    playedAt: string,
    calcResults: CalcResult[],
  ): Promise<boolean> => {
    const { error: dateError } = await supabase
      .from('hanchans')
      .update({ played_at: new Date(`${playedAt}T12:00:00`).toISOString() })
      .eq('id', hanchanId)

    if (dateError) {
      console.error('[useHanchans] update hanchan:', dateError)
      return false
    }

    const scoreRows = calcResults.map(r => ({
      hanchan_id: hanchanId,
      user_id: r.user_id,
      raw_score: r.raw_score,
      placement: r.placement,
      point: r.point,
    }))

    const { error: scoresError } = await supabase
      .from('scores')
      .upsert(scoreRows, { onConflict: 'hanchan_id,user_id' })

    if (scoresError) {
      console.error('[useHanchans] upsert scores:', scoresError)
      return false
    }

    return true
  }

  return {
    fetchHanchans,
    fetchHanchansBySeason,
    fetchHanchanById,
    saveHanchan,
    deleteHanchan,
    updateScores,
  }
}
