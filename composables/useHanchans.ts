import type { Hanchan, HanchanWithScores, CalcResult } from '~/types'

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
      .order('played_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[useHanchans] fetchHanchans:', error)
      return []
    }
    return data as HanchanWithScores[]
  }

  const fetchHanchansBySeason = async (
    startDate: string,
    endDate: string,
  ): Promise<HanchanWithScores[]> => {
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
      .lte('played_at', `${endDate}T23:59:59.999`)
      .order('played_at', { ascending: false })

    if (error) {
      console.error('[useHanchans] fetchHanchansBySeason:', error)
      return []
    }
    return data as HanchanWithScores[]
  }

  const fetchHanchanById = async (id: string): Promise<HanchanWithScores | null> => {
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
      .maybeSingle()

    if (error) {
      console.error('[useHanchans] fetchHanchanById:', error)
      return null
    }
    if (!data) return null
    return data as HanchanWithScores
  }

  const saveHanchan = async (
    playedAt: string,
    calcResults: CalcResult[],
  ): Promise<Hanchan | null> => {
    const { data: hanchan, error: hanchanError } = await supabase
      .from('hanchans')
      .insert({ played_at: new Date(`${playedAt}T12:00:00`).toISOString() })
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
