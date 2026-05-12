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
      <div class="flex rounded-xl bg-felt-100 p-1 mb-6">
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
          :disabled="!currentSeason"
          @click="tab = 'season'"
        >
          シーズン
        </button>
      </div>
      <p v-if="tab === 'season' && !currentSeason" class="text-white/40 text-sm mb-4">
        進行中のシーズンがありません。
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
import type { User, HanchanWithScores, PlayerStats } from '~/types'
import { useMahjongSeasons } from '~/composables/useMahjongSeasons'

definePageMeta({ layout: 'default' })

const { currentUserId, fetchUsers } = useAuth()
const { fetchHanchans, fetchHanchansBySeason } = useHanchans()
const { fetchCurrentSeason } = useMahjongSeasons()
const { calcPlayerStats, formatRate, formatAvgPlacement } = useStats()
const { formatPoint, pointClass } = useScoreCalc()

const tab = ref<'all' | 'season'>('all')
const loading = ref(true)
const users = ref<User[]>([])
const hanchans = ref<HanchanWithScores[]>([])
const currentSeason = ref<Awaited<ReturnType<typeof fetchCurrentSeason>>>(null)
const stats = ref<PlayerStats | null>(null)

const load = async () => {
  loading.value = true
  const [u, season] = await Promise.all([fetchUsers(), fetchCurrentSeason()])
  users.value = u
  currentSeason.value = season

  let list: HanchanWithScores[]
  if (tab.value === 'season' && season) {
    list = await fetchHanchansBySeason(season.start_date, season.end_date)
  } else {
    list = await fetchHanchans(500)
  }
  hanchans.value = list

  const me = u.find(x => x.id === currentUserId.value)
  stats.value = me ? calcPlayerStats(me, list) : null
  loading.value = false
}

watch([tab, currentUserId], load, { immediate: true })
</script>
