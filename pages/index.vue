<template>
  <div class="page-container">
    <div
      v-if="flashMessage"
      class="card mb-4 border border-jade/40 bg-jade/10 flex items-start justify-between gap-3"
    >
      <p class="text-sm text-jade-light">{{ flashMessage }}</p>
      <button type="button" class="text-white/50 text-xs shrink-0" @click="flashMessage = ''">閉じる</button>
    </div>

    <header class="flex items-start justify-between gap-3 mb-4">
      <div class="min-w-0">
        <p class="section-title mb-1">麻雀スコアトラッカー</p>
        <h1 class="font-display text-3xl tracking-wide text-white truncate">
          {{ headerTitle }}
        </h1>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <NuxtLink
          to="/admin/seasons"
          class="w-10 h-10 rounded-full bg-felt-100 border border-white/10 flex items-center justify-center text-white/60 hover:border-jade/40 hover:text-jade-light transition-colors"
          aria-label="設定・シーズン管理"
        >
          <Cog6ToothIcon class="w-5 h-5" />
        </NuxtLink>
        <button
          type="button"
          class="w-10 h-10 rounded-full bg-jade/20 border border-jade/30 flex items-center justify-center text-jade-light font-bold text-sm"
          @click="showUserSelect = true"
        >
          {{ currentUserName ? currentUserName[0] : '?' }}
        </button>
      </div>
    </header>

    <!-- シーズン表示は別で設定するためホーム画面では表示しない -->

    <div class="flex rounded-xl bg-felt-100 p-1 mb-4">
      <button
        type="button"
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="rankingScope === 'season' ? 'bg-jade text-white' : 'text-white/50'"
        @click="rankingScope = 'season'"
      >
        シーズン
      </button>
      <button
        type="button"
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="rankingScope === 'all' ? 'bg-jade text-white' : 'text-white/50'"
        @click="rankingScope = 'all'"
      >
        総合
      </button>
    </div>

    <section class="mb-6">
      <p class="section-title mb-3">{{ rankingSectionLabel }}</p>
      <p
        v-if="rankingScope === 'season' && !currentSeason"
        class="text-white/40 text-xs mb-3"
      >
        進行中のシーズンがありません。上部の「新しいシーズンを開始」から開始するか、
        <NuxtLink to="/admin/seasons" class="text-jade-light underline">シーズン管理</NuxtLink>
        画面から作成してください。
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
      <p class="text-white/30 text-xs mb-2">{{ recentScopeHint }}</p>
      <div class="space-y-3">
        <div
          v-for="hanchan in recentHanchans"
          :key="hanchan.id"
          class="card"
        >
          <p class="text-white/40 text-xs mb-2 tabular">
            {{ formatDate(hanchan.played_at) }}
          </p>
          <div class="flex flex-nowrap gap-1 overflow-hidden">
            <div
              v-for="score in sortedScores(hanchan.scores)"
              :key="score.id"
              class="inline-flex items-center gap-0.5 text-xs shrink-0 min-w-0"
            >
              <span class="rank-badge shrink-0 text-xs leading-5 w-5 h-5 flex items-center justify-center" :class="`rank-badge-${score.placement}`">{{ score.placement }}</span>
              <span class="text-xs text-white/80 truncate max-w-[3rem]">{{ score.user.name }}</span>
              <span class="text-xs tabular shrink-0" :class="pointClass(score.point)">{{ formatPoint(score.point) }}</span>
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
        v-if="showSeasonStartModal"
        class="fixed inset-0 z-[60] bg-black/70 flex items-center px-4"
        @click.self="showSeasonStartModal = false"
      >
        <div class="card w-full max-w-sm mx-auto animate-slide-up space-y-4">
          <p class="section-title text-center">新しいシーズンを開始</p>
          <label class="block space-y-1">
            <span class="text-xs text-white/50">年（例: 2026）</span>
            <select v-model.number="startSeasonYear" class="input-base">
              <option v-for="y in startSeasonYears" :key="y" :value="y">{{ y }}年</option>
            </select>
          </label>
          <label class="block space-y-1">
            <span class="text-xs text-white/50">季節</span>
            <select v-model="startSeasonKind" class="input-base">
              <option v-for="opt in startSeasonKindOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>
          <p class="text-xs text-white/40 leading-relaxed">
            シーズン名: <span class="text-jade-light font-medium">{{ generatedSeasonName }}</span>
          </p>
          <p v-if="seasonModalError" class="text-red-400 text-sm">{{ seasonModalError }}</p>
          <button
            type="button"
            class="btn-primary w-full"
            :disabled="seasonBusy"
            @click="onConfirmStartSeason"
          >
            {{ seasonBusy ? '作成中…' : '開始する' }}
          </button>
          <button type="button" class="btn-secondary w-full" @click="showSeasonStartModal = false">
            キャンセル
          </button>
        </div>
      </div>
    </Teleport>

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
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'
import type { User, HanchanWithScores, ScoreWithRelations, SeasonKind } from '~/types'
import { useSeasons } from '~/composables/useSeasons'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()

const { currentUserId, currentUserName, login, fetchUsers } = useAuth()
const { fetchHanchansBySeasonId, fetchHanchans } = useHanchans()
const { fetchCurrentSeason, createSeason, endSeason } = useSeasons()
const { calcAllStats } = useStats()
const { formatPoint, pointClass } = useScoreCalc()

const loading = ref(true)
const rankingScope = ref<'season' | 'all'>('season')
const showUserSelect = ref(false)
const showSeasonStartModal = ref(false)
const seasonBusy = ref(false)
const seasonModalError = ref('')
const flashMessage = ref('')
const users = ref<User[]>([])
const recentHanchans = ref<HanchanWithScores[]>([])
const currentSeason = ref<Awaited<ReturnType<typeof fetchCurrentSeason>>>(null)
const allStats = ref<ReturnType<typeof calcAllStats>>([])

const headerTitle = computed(() => {
  if (rankingScope.value === 'all') return '全期間'
  return currentSeason.value?.name ?? 'シーズン'
})

const rankingSectionLabel = computed(() => {
  if (rankingScope.value === 'all') return '全期間ランキング'
  return currentSeason.value ? 'シーズン内ランキング' : 'シーズン内ランキング'
})

const recentScopeHint = computed(() => {
  if (rankingScope.value === 'all') return '全期間の直近5半荘'
  return currentSeason.value
    ? '今シーズンに紐付いた対局の直近5半荘'
    : 'シーズン未設定のため対象データなし'
})

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

const sortedScores = (scores: ScoreWithRelations[]) =>
  [...scores].sort((a, b) => a.placement - b.placement)

const selectUser = (user: User) => {
  login(user)
  showUserSelect.value = false
}

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const startSeasonYears = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
const startSeasonYear = ref(currentYear)
const startSeasonKind = ref<SeasonKind>(
  currentMonth >= 3 && currentMonth <= 5 ? 'spring'
  : currentMonth >= 6 && currentMonth <= 8 ? 'summer'
  : currentMonth >= 9 && currentMonth <= 11 ? 'autumn'
  : 'winter',
)

const startSeasonKindOptions: { value: SeasonKind; label: string }[] = [
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'autumn', label: 'Autumn' },
  { value: 'winter', label: 'Winter' },
]

const seasonEnglish: Record<SeasonKind, string> = {
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
}

const generatedSeasonName = computed(
  () => `${seasonEnglish[startSeasonKind.value]} Season ${startSeasonYear.value}`,
)

const openStartSeasonModal = () => {
  seasonModalError.value = ''
  showSeasonStartModal.value = true
}

const onRequestEndSeason = async () => {
  if (!currentSeason.value) return
  if (!window.confirm('現在のシーズンを終了しますか？終了後は新しいシーズンを開始するまでシーズン内集計の対象外になります。')) return
  seasonBusy.value = true
  const ok = await endSeason(currentSeason.value.id)
  if (!ok) {
    window.alert('シーズンの終了に失敗しました。しばらくしてから再度お試しください。')
    seasonBusy.value = false
    return
  }
  currentSeason.value = await fetchCurrentSeason()
  await loadDashboard()
  seasonBusy.value = false
  flashMessage.value = 'シーズンを終了しました'
}

const onConfirmStartSeason = async () => {
  seasonModalError.value = ''
  seasonBusy.value = true
  const row = await createSeason(generatedSeasonName.value)
  seasonBusy.value = false
  if (!row) {
    seasonModalError.value = '作成に失敗したか、既に進行中のシーズンがあります。'
    return
  }
  showSeasonStartModal.value = false
  currentSeason.value = row
  await loadDashboard()
  flashMessage.value = '新しいシーズンを開始しました'
}

async function loadDashboard() {
  loading.value = true
  const season = currentSeason.value
  let hanchans: HanchanWithScores[] = []
  if (rankingScope.value === 'all') {
    hanchans = await fetchHanchans(1000)
  } else if (season) {
    hanchans = await fetchHanchansBySeasonId(season.id)
  } else {
    hanchans = []
  }
  // sort newest-first then take 5
  recentHanchans.value = hanchans
    .sort((a, b) => new Date(b.created_at ?? b.played_at).getTime() - new Date(a.created_at ?? a.played_at).getTime())
    .slice(0, 5)
  allStats.value = calcAllStats(users.value, hanchans)
  loading.value = false
}

watch(rankingScope, () => {
  if (users.value.length) loadDashboard()
})

onMounted(async () => {
  if (route.query.season === 'created') {
    flashMessage.value = 'シーズンを保存しました'
    await router.replace({ path: '/', query: {} })
  }
  loading.value = true
  const [fetchedUsers, season] = await Promise.all([fetchUsers(), fetchCurrentSeason()])
  users.value = fetchedUsers
  currentSeason.value = season
  await loadDashboard()
})
</script>
