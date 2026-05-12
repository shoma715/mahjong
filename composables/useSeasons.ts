import type { Season } from '~/types'

/** 進行中シーズンの仮終了日（手動終了まで） */
export const ONGOING_SEASON_END_DATE = '2099-12-31'

const todayYmd = () => {
  const t = new Date()
  const y = t.getFullYear()
  const m = String(t.getMonth() + 1).padStart(2, '0')
  const d = String(t.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const nowIso = () => new Date().toISOString()

/** 進行中シーズン用の end_date（DB の timestamptz 向け） */
const ongoingEndTimestamp = () => `${ONGOING_SEASON_END_DATE}T23:59:59.999Z`

/**
 * シーズン取得・作成・手動終了。
 * 進行中は `end_date` が現在時刻より未来（例: 2099-12-31）で表す。
 */
export const useSeasons = () => {
  const supabase = useSupabase()

  const fetchSeasons = async (): Promise<Season[]> => {
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .order('start_date', { ascending: false })

    if (error) {
      console.error('[useSeasons] fetchSeasons:', error)
      return []
    }
    return data as Season[]
  }

  /**
   * 進行中シーズン1件: `end_date` が現在より未来、かつ `start_date` が今日以前。
   * 複数ある場合は `start_date` が新しい方。
   */
  const fetchCurrentSeason = async (): Promise<Season | null> => {
    const todayStr = todayYmd()
    const nowStr = nowIso()

    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .lte('start_date', todayStr)
      .gt('end_date', nowStr)
      .order('start_date', { ascending: false })
      .limit(1)

    if (error) {
      console.error('[useSeasons] fetchCurrentSeason:', error)
      return null
    }
    const row = Array.isArray(data) ? data[0] : data
    return (row as Season | undefined) ?? null
  }

  /**
   * 新規シーズン開始。`start_date` は今日、`end_date` は 2099-12-31（進行中扱い）。
   * 既に進行中があれば null。
   */
  const createSeason = async (name: string): Promise<Season | null> => {
    const trimmed = name.trim()
    if (!trimmed) return null

    const active = await fetchCurrentSeason()
    if (active) {
      console.warn('[useSeasons] createSeason: active season already exists')
      return null
    }

    const todayStr = todayYmd()
    const { data, error } = await supabase
      .from('seasons')
      .insert({
        name: trimmed,
        start_date: todayStr,
        end_date: ongoingEndTimestamp(),
      })
      .select()
      .single()

    if (error) {
      console.error('[useSeasons] createSeason:', error)
      return null
    }
    return data as Season
  }

  /** シーズン終了: `end_date` を現在時刻に更新 */
  const endSeason = async (id: string): Promise<boolean> => {
    if (!id?.trim()) return false
    const { error } = await supabase
      .from('seasons')
      .update({ end_date: nowIso() })
      .eq('id', id)

    if (error) {
      console.error('[useSeasons] endSeason:', error)
      return false
    }
    return true
  }

  /** @deprecated 互換用。`endSeason` + 直前の `fetchCurrentSeason` と同等 */
  const endCurrentSeason = async (): Promise<boolean> => {
    const cur = await fetchCurrentSeason()
    if (!cur) return false
    return endSeason(cur.id)
  }

  /**
   * @deprecated `createSeason(name)` を使用してください（開始日・終了日は固定）。
   */
  const startNewSeason = async (name: string): Promise<Season | null> => {
    return createSeason(name)
  }

  return {
    fetchSeasons,
    fetchCurrentSeason,
    createSeason,
    endSeason,
    endCurrentSeason,
    startNewSeason,
  }
}
