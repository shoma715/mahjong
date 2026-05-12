<template>
  <div class="page-container">
    <header class="mb-4">
      <p class="section-title mb-1">対局履歴</p>
      <h1 class="font-display text-3xl tracking-wide text-white">過去の半荘</h1>
    </header>

    <section class="card mb-4">
      <label class="section-title block mb-2">シーズン</label>
      <select v-model="selectedSeasonId" class="input-base" :disabled="seasons.length === 0">
        <option v-for="s in seasons" :key="s.id" :value="s.id">
          {{ s.name }}（{{ seasonRangeLabel(s) }}）
        </option>
      </select>
      <p v-if="seasons.length === 0" class="text-white/40 text-xs mt-2">
        シーズンがありません。
        <NuxtLink to="/admin/seasons" class="text-jade-light underline">管理画面</NuxtLink>
        から開始してください。
      </p>
    </section>

    <div v-if="loading" class="card text-center text-white/40 py-10">読み込み中…</div>

    <div v-else-if="!selectedSeasonId || grouped.length === 0" class="card text-center text-white/40 text-sm py-10">
      このシーズンに対局記録がありません
    </div>

    <div v-else class="space-y-6">
      <section v-for="g in grouped" :key="g.date" class="space-y-2">
        <p class="section-title">{{ g.dateLabel }}</p>
        <NuxtLink
          v-for="h in g.items"
          :key="h.id"
          :to="`/edit-hanchan/${h.id}`"
          class="card block active:scale-[0.99] transition-transform"
        >
          <div class="flex justify-end items-start gap-0 mb-2">
              <span class="text-jade-light text-xs">編集 →</span>
            </div>
          <div class="flex flex-nowrap gap-1 overflow-hidden">
            <span
              v-for="sc in sortedScores(h.scores)"
              :key="sc.id"
              class="inline-flex items-center gap-0.5 text-xs shrink-0 min-w-0"
            >
              <span class="rank-badge shrink-0 text-xs leading-5 w-5 h-5 flex items-center justify-center" :class="`rank-badge-${sc.placement}`">{{ sc.placement }}</span>
              <span class="text-white/80 truncate max-w-[3rem]">{{ sc.user.name }}</span>
              <span class="tabular shrink-0" :class="pointClass(sc.point)">{{ formatPoint(sc.point) }}</span>
            </span>
          </div>
        </NuxtLink>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HanchanWithScores, ScoreWithRelations, Season } from '~/types'
import { useMahjongSeasons } from '~/composables/useMahjongSeasons'

definePageMeta({ layout: 'default' })

const { fetchHanchansBySeasonId } = useHanchans()
const { fetchSeasons, fetchCurrentSeason } = useMahjongSeasons()
const { formatPoint, pointClass } = useScoreCalc()

const loading = ref(true)
const seasons = ref<Season[]>([])
const selectedSeasonId = ref<string | null>(null)
const list = ref<HanchanWithScores[]>([])

const sortedScores = (scores: ScoreWithRelations[]) =>
  [...scores].sort((a, b) => a.placement - b.placement)

const formatTime = (iso: string) => {
  const d = new Date(iso)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

const seasonRangeLabel = (s: Season) => {
  const end = s.end_date ?? '進行中'
  return `${s.start_date} 〜 ${end}`
}

const grouped = computed(() => {
  const map = new Map<string, HanchanWithScores[]>()
  for (const h of list.value) {
    const d = new Date(h.played_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(h)
  }
  const keys = [...map.keys()].sort((a, b) => b.localeCompare(a))
  return keys.map(date => ({
    date,
    dateLabel: formatDateLabel(date),
    items: map.get(date)!.sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()),
  }))
})

const formatDateLabel = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return `${y}年${m}月${d}日`
}

const listReady = ref(false)

const loadList = async () => {
  const s = seasons.value.find(x => x.id === selectedSeasonId.value)
  if (!s) {
    list.value = []
    return
  }
  list.value = await fetchHanchansBySeasonId(s.id)
  // Ensure newest first
  list.value = list.value.sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())
}

watch(selectedSeasonId, async () => {
  if (!listReady.value || !selectedSeasonId.value) return
  loading.value = true
  await loadList()
  loading.value = false
})

onMounted(async () => {
  loading.value = true
  const [allSeasons, current] = await Promise.all([
    fetchSeasons(),
    fetchCurrentSeason(),
  ])
  seasons.value = allSeasons
  selectedSeasonId.value = current?.id ?? allSeasons[0]?.id ?? null
  await loadList()
  listReady.value = true
  loading.value = false
})
</script>
