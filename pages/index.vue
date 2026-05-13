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
      <button
        type="button"
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="rankingScope === 'custom' ? 'bg-jade text-white' : 'text-white/50'"
        @click="rankingScope = 'custom'"
      >
        カスタム
      </button>
    </div>

    <!-- カスタムスコープ: 日付選択UI -->
    <div v-if="rankingScope === 'custom'" class="mb-4">
      <button
        type="button"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-felt-100 border border-white/10 text-white/60 hover:border-jade/40 hover:text-jade-light transition-colors"
        @click="showDatePicker = !showDatePicker"
      >
        <span class="text-sm font-medium">
          {{ selectedDates.length }}日を選択中
        </span>
        <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': showDatePicker }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>
      <transition name="fade-slide">
        <div v-if="showDatePicker" class="mt-2 card space-y-2 max-h-64 overflow-y-auto">
          <div v-if="availableDates.length === 0" class="text-center text-white/40 text-xs py-4">
            利用可能な日付がありません
          </div>
          <label v-for="date in availableDates" :key="date" class="flex items-center gap-2 p-2 rounded-lg hover:bg-felt-100 transition-colors cursor-pointer">
            <input
              type="checkbox"
              :checked="selectedDates.includes(date)"
              @change="toggleDateSelection(date)"
              class="w-4 h-4 rounded border-white/30 bg-felt-100 accent-jade cursor-pointer"
            />
            <span class="text-sm text-white/80">{{ formatDisplayDate(date) }}</span>
            <span class="text-xs text-white/30">{{ dateGameCounts[date] || 0 }}戦</span>
          </label>
          <div v-if="selectedDates.length > 0" class="pt-2 border-t border-white/10">
            <button
              type="button"
              class="w-full text-xs text-white/50 hover:text-white/70 transition-colors py-1"
              @click="selectedDates = []"
            >
              すべてクリア
            </button>
          </div>
        </div>
      </transition>
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
      <p
        v-if="rankingScope === 'custom' && selectedDates.length === 0"
        class="text-white/40 text-xs mb-3"
      >
        日付を選択してください
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
        <div v-if="allStats.length === 0 && !loading && rankingScope !== 'custom'" class="card text-center text-white/40 text-sm py-8">
          データがありません
        </div>
        <div v-if="allStats.length === 0 && !loading && rankingScope === 'custom' && selectedDates.length > 0" class="card text-center text-white/40 text-sm py-8">
          該当するデータがありません
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
const rankingScope = ref<'season' | 'all' | 'custom'>('season')
const showSeasonStartModal = ref(false)
const showDatePicker = ref(false)
const seasonBusy = ref(false)
const seasonModalError = ref('')
const flashMessage = ref('')
const users = ref<User[]>([])
const recentHanchans = ref<HanchanWithScores[]>([])
const currentSeason = ref<Awaited<ReturnType<typeof fetchCurrentSeason>>>(null)
const allStats = ref<ReturnType<typeof calcAllStats>>([])
const selectedDates = ref<string[]>([])
const availableDates = ref<string[]>([])
const dateGameCounts = ref<Record<string, number>>({})

const headerTitle = computed(() => {
  if (rankingScope.value === 'custom') {
    return selectedDates.length > 0 ? `${selectedDates.length}日間` : 'カスタム'
  }
  if (rankingScope.value === 'all') return '全期間'
  return currentSeason.value?.name ?? 'シーズン'
})

const rankingSectionLabel = computed(() => {
  if (rankingScope.value === 'custom') return 'カスタムランキング'
  if (rankingScope.value === 'all') return '全期間ランキング'
  return currentSeason.value ? 'シーズン内ランキング' : 'シーズン内ランキング'
})

const recentScopeHint = computed(() => {
  if (rankingScope.value === 'custom') {
    return selectedDates.length > 0 
      ? `選択した${selectedDates.length}日間の直近5半荘`
      : '日付を選択して対局を表示'
  }
  if (rankingScope.value === 'all') return '全期間の直近5半荘'
  return currentSeason.value
    ? '今シーズンに紐付いた対局の直近5半荘'
    : 'シーズン未設定のため対象データなし'
})

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

const formatDisplayDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  const dayName = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
  return `${month}月${day}日 (${dayName})`
}

const sortedScores = (scores: ScoreWithRelations[]) =>
  [...scores].sort((a, b) => a.placement - b.placement)

const toggleDateSelection = (date: string) => {
  const idx = selectedDates.value.indexOf(date)
  if (idx >= 0) {
    selectedDates.value.splice(idx, 1)
  } else {
    selectedDates.value.push(date)
  }
  selectedDates.value = [...selectedDates.value].sort()
}

const extractDatesFromHanchans = (hanchans: HanchanWithScores[]) => {
  const dateMap = new Map<string, number>()
  const dateSet = new Set<string>()
  
  for (const h of hanchans) {
    const d = new Date(h.played_at)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    dateSet.add(dateStr)
    dateMap.set(dateStr, (dateMap.get(dateStr) ?? 0) + 1)
  }
  
  return {
    dates: Array.from(dateSet).sort().reverse(),
    counts: dateMap,
  }
}

const filterHanchansByCustomDates = (hanchans: HanchanWithScores[], dates: string[]): HanchanWithScores[] => {
  if (dates.length === 0) return []
  
  return hanchans.filter(h => {
    const d = new Date(h.played_at)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return dates.includes(dateStr)
  })
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
  
  if (rankingScope.value === 'custom') {
    // カスタム: 全半荘から利用可能な日付を抽出、選択された日付でフィルタ
    const allHanchans = await fetchHanchans(1000)
    const { dates, counts } = extractDatesFromHanchans(allHanchans)
    availableDates.value = dates
    dateGameCounts.value = Object.fromEntries(counts)
    
    hanchans = filterHanchansByCustomDates(allHanchans, selectedDates.value)
  } else if (rankingScope.value === 'all') {
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
  if (users.value.length) {
    selectedDates.value = []
    loadDashboard()
  }
})

watch(selectedDates, () => {
  if (rankingScope.value === 'custom' && users.value.length) {
    loadDashboard()
  }
}, { deep: true })

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
