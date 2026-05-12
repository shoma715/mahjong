import type { CalcResult, Hanchan, HanchanRulesInput, HanchanWithScores, Season } from '~/types'

export const useHanchans = () => {
  const supabase = useSupabase()

  const isMissingSeasonIdColumnError = (error: { code?: string; message?: string } | null) => {
    return error?.code === '42703' && (error.message ?? '').includes('season_id')
  }

  const toUtcStartOfDay = (ymd: string) => `${ymd}T00:00:00.000Z`

  const toUtcEndOfDay = (dateTime: string) => {
    return dateTime.includes('T') ? dateTime : `${dateTime}T23:59:59.999Z`
  }

  const fetchSeasonById = async (seasonId: string): Promise<Season | null> => {
    const { data, error } = await supabase.from('seasons').select('*').eq('id', seasonId).limit(1)

    if (error) {
      console.error('[useHanchans] fetchSeasonById:', error)
      return null
    }

    const row = Array.isArray(data) ? data[0] : data
    return (row as Season | undefined) ?? null
  }

  const fetchSeasonForPlayedAt = async (playedAt: string): Promise<Season | null> => {
    const playedDate = new Date(playedAt)
    const y = playedDate.getFullYear()
    const m = String(playedDate.getMonth() + 1).padStart(2, '0')
    const d = String(playedDate.getDate()).padStart(2, '0')
    const playedYmd = `${y}-${m}-${d}`

    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .lte('start_date', playedYmd)
      .gte('end_date', playedAt)
      .order('start_date', { ascending: false })
      .limit(1)

    if (error) {
      console.error('[useHanchans] fetchSeasonForPlayedAt:', error)
      return null
    }

    const row = Array.isArray(data) ? data[0] : data
    return (row as Season | undefined) ?? null
  }

  const fetchHanchansInSeasonWindow = async (season: Season): Promise<HanchanWithScores[]> => {
    const startAt = toUtcStartOfDay(season.start_date)
    const endAt = season.end_date ? toUtcEndOfDay(season.end_date) : null

    let query = supabase
      .from('hanchans')
      .select(`
        *,
        scores (
          *,
          user:users (*)
        )
      `)
      .gte('played_at', startAt)
      .order('created_at', { ascending: false })

    if (endAt) {
      query = query.lte('played_at', endAt)
    }

    const { data, error } = await query.limit(500)

    if (error) {
      console.error('[useHanchans] fetchHanchansInSeasonWindow:', error)
      return []
    }

    return data as HanchanWithScores[]
  }

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

  /** 指定シーズン ID に属する半荘のみ（日付範囲は使わない） */
  const fetchHanchansBySeasonId = async (seasonId: string): Promise<HanchanWithScores[]> => {
    if (!seasonId?.trim()) return []
    const { data, error } = await supabase
      .from('hanchans')
      .select(`
        *,
        scores (
          *,
          user:users (*)
        )
      `)
      .eq('season_id', seasonId)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      if (isMissingSeasonIdColumnError(error)) {
        const season = await fetchSeasonById(seasonId)
        if (!season) return []
        return fetchHanchansInSeasonWindow(season)
      }
      console.error('[useHanchans] fetchHanchansBySeasonId:', error)
      return []
    }
    return data as HanchanWithScores[]
  }

  const fetchHanchansByPlayedAt = async (playedAt: string): Promise<HanchanWithScores[]> => {
    if (!playedAt?.trim()) return []
    const season = await fetchSeasonForPlayedAt(playedAt)
    if (!season) return []
    return fetchHanchansInSeasonWindow(season)
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
    seasonId: string,
    rules?: HanchanRulesInput,
  ): Promise<Hanchan | null> => {
    if (!seasonId?.trim()) {
      console.error('[useHanchans] saveHanchan: seasonId is required')
      return null
    }
    const insertPayload = {
      played_at: new Date(`${playedAt}T12:00:00`).toISOString(),
      season_id: seasonId,
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
      if (isMissingSeasonIdColumnError(hanchanError)) {
        const { season_id: _seasonId, ...payloadWithoutSeasonId } = insertPayload
        const { data: retryHanchan, error: retryError } = await supabase
          .from('hanchans')
          .insert(payloadWithoutSeasonId)
          .select()
          .single()

        if (retryError || !retryHanchan) {
          console.error('[useHanchans] insert hanchan retry:', retryError)
          return null
        }

        const retryScoreRows = calcResults.map(r => ({
          hanchan_id: retryHanchan.id,
          user_id: r.user_id,
          raw_score: r.raw_score,
          placement: r.placement,
          point: r.point,
        }))

        const { error: retryScoresError } = await supabase.from('scores').insert(retryScoreRows)

        if (retryScoresError) {
          console.error('[useHanchans] insert scores:', retryScoresError)
          await supabase.from('hanchans').delete().eq('id', retryHanchan.id)
          return null
        }

        return retryHanchan as Hanchan
      }

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
    fetchHanchansBySeasonId,
    fetchHanchansByPlayedAt,
    fetchHanchanById,
    saveHanchan,
    deleteHanchan,
    updateScores,
  }
}
