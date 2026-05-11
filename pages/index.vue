<template>
  <div class="page-container">
    <header class="flex items-center justify-between mb-6">
      <div>
        <p class="section-title mb-1">麻雀スコアトラッカー</p>
        <h1 class="font-display text-3xl tracking-wide text-white">
          {{ currentSeason?.name ?? 'ホーム' }}
        </h1>
      </div>
      <button
        type="button"
        class="w-10 h-10 rounded-full bg-jade/20 border border-jade/30 flex items-center justify-center text-jade-light font-bold text-sm shrink-0"
        @click="showUserSelect = true"
      >
        {{ currentUserName ? currentUserName[0] : '?' }}
      </button>
    </header>

    <section class="mb-6">
      <p class="section-title mb-3">
        {{ currentSeason ? 'シーズン内ランキング' : '総合ランキング' }}
      </p>
      <div class="space-y-2">
        <div
          v-for="(stat, idx) in allStats"
          :key="stat.user.id"
          class="card flex items-center gap-3 animate-slide-up"
          :style="{ animationDelay: `${idx * 40}ms` }"
        >
          <span class="rank-badge shrink-0" :class="`rank-badge-${Math.min(idx + 1, 4)}`">
            {{ idx + 1 }}
          </span>
          <span class="flex-1 font-medium text-sm truncate">{{ stat.user.name }}</span>
          <span class="tabular text-sm shrink-0" :class="pointClass(stat.total_point)">
            {{ formatPoint(stat.total_point) }}
          </span>
          <span class="text-white/30 text-xs tabular shrink-0">{{ stat.total_games }}戦</span>
        </div>
        <div v-if="allStats.length === 0 && !loading" class="card text-center text-white/40 text-sm py-8">
          データがありません
        </div>
        <div v-if="loading" class="card text-center text-white/30 text-sm py-8">
          読み込み中...
        </div>
      </div>
    </section>

    <section>
      <p class="section-title mb-3">直近の対局</p>
      <div class="space-y-3">
        <div
          v-for="hanchan in recentHanchans"
          :key="hanchan.id"
          class="card"
        >
          <p class="text-white/40 text-xs mb-2 tabular">
            {{ formatDate(hanchan.played_at) }}
          </p>
          <div class="flex gap-2 flex-wrap">
            <div
              v-for="score in sortedScores(hanchan.scores)"
              :key="score.id"
              class="flex items-center gap-1.5"
            >
              <span class="rank-badge shrink-0" :class="`rank-badge-${score.placement}`">
                {{ score.placement }}
              </span>
              <span class="text-xs text-white/80 truncate max-w-[5rem]">{{ score.user.name }}</span>
              <span class="text-xs tabular shrink-0" :class="pointClass(score.point)">
                {{ formatPoint(score.point) }}
              </span>
            </div>
          </div>
        </div>
        <div v-if="recentHanchans.length === 0 && !loading" class="card text-center text-white/40 text-sm py-8">
          まだ対局記録がありません
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="showUserSelect"
        class="fixed inset-0 z-[60] bg-black/70 flex items-end"
        @click.self="showUserSelect = false"
      >
        <div class="w-full max-w-md mx-auto bg-felt-50 rounded-t-3xl p-6 pb-8 animate-slide-up max-h-[80vh] overflow-y-auto">
          <p class="section-title mb-4 text-center">プレイヤーを選択</p>
          <div class="space-y-2">
            <button
              v-for="user in users"
              :key="user.id"
              type="button"
              class="w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left"
              :class="user.id === currentUserId ? 'bg-jade/20 text-jade-light' : 'bg-felt-100 text-white'"
              @click="selectUser(user)"
            >
              <span class="w-8 h-8 rounded-full bg-jade/20 flex items-center justify-center text-sm font-bold shrink-0">
                {{ user.name[0] }}
              </span>
              <span class="font-medium truncate">{{ user.name }}</span>
              <span v-if="user.id === currentUserId" class="ml-auto text-xs text-jade-light shrink-0">選択中</span>
            </button>
          </div>
          <button type="button" class="btn-secondary mt-4" @click="showUserSelect = false">閉じる</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { User, HanchanWithScores, ScoreWithUser } from '~/types'

definePageMeta({ layout: 'default' })

const { currentUserId, currentUserName, login, fetchUsers } = useAuth()
const { fetchHanchansBySeason, fetchHanchans } = useHanchans()
const { fetchCurrentSeason } = useSeasons()
const { calcAllStats } = useStats()
const { formatPoint, pointClass } = useScoreCalc()

const loading = ref(true)
const showUserSelect = ref(false)
const users = ref<User[]>([])
const recentHanchans = ref<HanchanWithScores[]>([])
const currentSeason = ref<Awaited<ReturnType<typeof fetchCurrentSeason>>>(null)
const allStats = ref<ReturnType<typeof calcAllStats>>([])

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

const sortedScores = (scores: ScoreWithUser[]) =>
  [...scores].sort((a, b) => a.placement - b.placement)

const selectUser = (user: User) => {
  login(user)
  showUserSelect.value = false
}

onMounted(async () => {
  loading.value = true
  const [fetchedUsers, season] = await Promise.all([fetchUsers(), fetchCurrentSeason()])
  users.value = fetchedUsers
  currentSeason.value = season

  const hanchans = season
    ? await fetchHanchansBySeason(season.start_date, season.end_date)
    : await fetchHanchans(50)

  recentHanchans.value = hanchans.slice(0, 5)
  allStats.value = calcAllStats(fetchedUsers, hanchans)
  loading.value = false
})
</script>
