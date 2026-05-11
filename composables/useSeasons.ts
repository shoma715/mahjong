import type { Season } from '~/types'

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

  /** 今日の日付が start_date〜end_date に含まれるシーズン（JST 基準で日付文字列比較） */
  const fetchCurrentSeason = async (): Promise<Season | null> => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const todayStr = `${y}-${m}-${d}`

    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .lte('start_date', todayStr)
      .gte('end_date', todayStr)
      .maybeSingle()

    if (error) {
      console.error('[useSeasons] fetchCurrentSeason:', error)
      return null
    }
    return data as Season | null
  }

  return {
    fetchSeasons,
    fetchCurrentSeason,
  }
}
