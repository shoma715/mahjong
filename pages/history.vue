<template>
  <div class="page-container">
    <header class="mb-6">
      <p class="section-title mb-1">対局履歴</p>
      <h1 class="font-display text-3xl tracking-wide text-white">過去の半荘</h1>
    </header>

    <div v-if="loading" class="card text-center text-white/40 py-10">読み込み中…</div>

    <div v-else-if="grouped.length === 0" class="card text-center text-white/40 text-sm py-10">
      まだ対局がありません
    </div>

    <div v-else class="space-y-6">
      <section v-for="g in grouped" :key="g.date" class="space-y-2">
        <p class="section-title">{{ g.dateLabel }}</p>
        <NuxtLink
          v-for="h in g.items"
          :key="h.id"
          :to="`/history/${h.id}`"
          class="card block active:scale-[0.99] transition-transform"
        >
          <div class="flex justify-between items-start gap-2 mb-2">
            <span class="text-white/40 text-xs tabular">{{ formatTime(h.played_at) }}</span>
            <span class="text-jade-light text-xs">編集 →</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="s in sortedScores(h.scores)"
              :key="s.id"
              class="inline-flex items-center gap-1 text-xs"
            >
              <span class="rank-badge shrink-0" :class="`rank-badge-${s.placement}`">{{ s.placement }}</span>
              <span class="text-white/80 truncate max-w-[4.5rem]">{{ s.user.name }}</span>
              <span class="tabular shrink-0" :class="pointClass(s.point)">{{ formatPoint(s.point) }}</span>
            </span>
          </div>
        </NuxtLink>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HanchanWithScores, ScoreWithUser } from '~/types'

definePageMeta({ layout: 'default' })

const { fetchHanchans } = useHanchans()
const { formatPoint, pointClass } = useScoreCalc()

const loading = ref(true)
const list = ref<HanchanWithScores[]>([])

const sortedScores = (scores: ScoreWithUser[]) =>
  [...scores].sort((a, b) => a.placement - b.placement)

const formatTime = (iso: string) => {
  const d = new Date(iso)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
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
    items: map.get(date)!,
  }))
})

const formatDateLabel = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return `${y}年${m}月${d}日`
}

onMounted(async () => {
  loading.value = true
  list.value = await fetchHanchans(200)
  loading.value = false
})
</script>
