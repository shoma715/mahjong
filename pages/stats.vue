<template>
  <div class="page-container">
    <header class="mb-6">
      <p class="section-title mb-1">成績・スタッツ</p>
      <h1 class="font-display text-3xl tracking-wide text-white">マイスタッツ</h1>
    </header>

    <div v-if="!currentUserId" class="card text-center text-white/50 text-sm py-10">
      ホーム画面の右上から自分のプレイヤーを選択してください。
    </div>

    <template v-else>
      <div class="flex rounded-xl bg-felt-100 p-1 mb-4">
        <button
          type="button"
          class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="tab === 'all' ? 'bg-jade text-white' : 'text-white/50'"
          @click="tab = 'all'"
        >
          全期間
        </button>
        <button
          type="button"
          class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="tab === 'season' ? 'bg-jade text-white' : 'text-white/50'"
          :disabled="seasons.length === 0"
          @click="tab = 'season'"
        >
          シーズン成績
        </button>
      </div>

      <div v-if="tab === 'season' && seasons.length > 0" class="card mb-4">
        <label class="section-title block mb-2">シーズンを選択</label>
        <select v-model="selectedSeasonId" class="input-base">
          <option v-for="s in seasons" :key="s.id" :value="s.id">
            {{ s.name }}（{{ seasonRangeLabel(s) }}）
          </option>
        </select>
      </div>

      <p v-if="tab === 'season' && seasons.length === 0" class="text-white/40 text-sm mb-4">
        シーズンがありません。
        <NuxtLink to="/admin/seasons" class="text-jade-light underline">シーズン管理</NuxtLink>
      </p>

      <div v-if="loading" class="card text-center text-white/40 py-10">読み込み中…</div>

      <div v-else-if="stats" class="space-y-4">
        <div class="card">
          <p class="section-title mb-1">プレイヤー</p>
          <p class="text-xl font-bold">{{ stats.user.name }}</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="card">
            <p class="text-white/40 text-xs mb-1">対局数</p>
            <p class="font-display text-2xl text-jade-light">{{ stats.total_games }}</p>
          </div>
          <div class="card">
            <p class="text-white/40 text-xs mb-1">通算ポイント</p>
            <p class="font-display text-2xl tabular" :class="pointClass(stats.total_point)">
              {{ formatPoint(stats.total_point) }}
            </p>
          </div>
        </div>

        <div class="card">
          <p class="section-title mb-2">着順分布</p>
          <p class="text-sm tabular text-white/90">
            {{ stats.rank_counts[0] }}-{{ stats.rank_counts[1] }}-{{ stats.rank_counts[2] }}-{{ stats.rank_counts[3] }}
            <span class="text-white/40 text-xs ml-2">（1-2-3-4着）</span>
          </p>
        </div>

        <div class="card space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-white/50">平均着順</span>
            <span class="tabular font-medium">{{ formatAvgPlacement(stats.avg_placement) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/50">半荘最高得点</span>
            <span class="tabular font-medium" :class="pointClass(stats.best_point)">{{ formatPoint(stats.best_point) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/50">トップ率</span>
            <span class="tabular font-medium">{{ formatRate(stats.top_rate) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/50">連対率</span>
            <span class="tabular font-medium">{{ formatRate(stats.rentai_rate) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/50">ラス回避率</span>
            <span class="tabular font-medium">{{ formatRate(stats.last_avoidance_rate) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/50">連続トップ（直近）</span>
            <span class="tabular font-medium">{{ stats.current_top_streak }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/50">連続連対（直近）</span>
            <span class="tabular font-medium">{{ stats.current_rentai_streak }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { User, HanchanWithScores, PlayerStats, Season } from '~/types'
import { useMahjongSeasons } from '~/composables/useMahjongSeasons'

definePageMeta({ layout: 'default' })

const { currentUserId, fetchUsers } = useAuth()
const { fetchHanchans, fetchHanchansBySeasonId } = useHanchans()
const { fetchCurrentSeason, fetchSeasons } = useMahjongSeasons()
const { calcPlayerStats, formatRate, formatAvgPlacement } = useStats()
const { formatPoint, pointClass } = useScoreCalc()

const tab = ref<'all' | 'season'>('all')
const loading = ref(true)
const seasonTabReady = ref(false)
const users = ref<User[]>([])
const seasons = ref<Season[]>([])
const selectedSeasonId = ref('')
const hanchans = ref<HanchanWithScores[]>([])
const stats = ref<PlayerStats | null>(null)

const seasonRangeLabel = (s: Season) => {
  const end = s.end_date ?? '進行中'
  return `${s.start_date} 〜 ${end}`
}

const resolveSeasonId = (list: Season[], currentId: string | null) => {
  if (selectedSeasonId.value && list.some(x => x.id === selectedSeasonId.value)) {
    return selectedSeasonId.value
  }
  return currentId ?? list[0]?.id ?? ''
}

const applyStats = (u: User[], list: HanchanWithScores[]) => {
  const me = u.find(x => x.id === currentUserId.value)
  stats.value = me ? calcPlayerStats(me, list) : null
}

const loadAllTab = async () => {
  loading.value = true
  const u = await fetchUsers()
  users.value = u
  const list = await fetchHanchans(500)
  hanchans.value = list
  applyStats(u, list)
  loading.value = false
}

const loadSeasonTab = async () => {
  loading.value = true
  seasonTabReady.value = false
  const [u, allSeasons, current] = await Promise.all([
    fetchUsers(),
    fetchSeasons(),
    fetchCurrentSeason(),
  ])
  users.value = u
  seasons.value = allSeasons
  if (allSeasons.length === 0) {
    selectedSeasonId.value = ''
    hanchans.value = []
    applyStats(u, [])
    loading.value = false
    seasonTabReady.value = true
    return
  }
  const sid = resolveSeasonId(allSeasons, current?.id ?? null)
  selectedSeasonId.value = sid
  const list = await fetchHanchansBySeasonId(sid)
  hanchans.value = list
  applyStats(u, list)
  loading.value = false
  seasonTabReady.value = true
}

const loadFromSeasonSelection = async () => {
  if (!currentUserId.value || tab.value !== 'season' || !selectedSeasonId.value) return
  loading.value = true
  const u = users.value.length ? users.value : await fetchUsers()
  users.value = u
  const list = await fetchHanchansBySeasonId(selectedSeasonId.value)
  hanchans.value = list
  applyStats(u, list)
  loading.value = false
}

watch([tab, currentUserId], async () => {
  if (!currentUserId.value) {
    stats.value = null
    loading.value = false
    seasonTabReady.value = false
    return
  }
  if (tab.value === 'all') {
    await loadAllTab()
  } else {
    await loadSeasonTab()
  }
}, { immediate: true })

watch(selectedSeasonId, async () => {
  if (!seasonTabReady.value || tab.value !== 'season' || !selectedSeasonId.value) return
  await loadFromSeasonSelection()
})
</script>
