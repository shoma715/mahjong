<template>
  <div class="page-container">
    <header class="flex items-start justify-between gap-3 mb-6">
      <div class="min-w-0">
        <p class="section-title mb-1">成績・スタッツ</p>
        <h1 class="font-display text-3xl tracking-wide text-white">マイスタッツ</h1>
      </div>
      <button
        type="button"
        class="w-10 h-10 rounded-full bg-jade/20 border border-jade/30 flex items-center justify-center text-jade-light font-bold text-sm shrink-0"
        @click="showUserSelect = true"
      >
        {{ currentUserName ? currentUserName[0] : '?' }}
      </button>
    </header>

    <div v-if="!currentUserId" class="card text-center text-white/50 text-sm py-10">
      画面の右上から自分のプレイヤーを選択してください。
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
          @click="tab = 'season'"
        >
          シーズン成績
        </button>
      </div>

      <div v-if="tab === 'season' && seasons.length > 0" class="card mb-4">
        <label class="section-title block mb-2">シーズンを選択</label>
        <select v-model="selectedSeasonId" class="input-base">
          <option v-for="s in sortedSeasons" :key="s.id" :value="s.id">
            {{ s.name }}
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
            <span class="tabular font-medium text-white">{{ stats.best_raw_score.toLocaleString() }}</span>
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
          <button type="button" class="btn-primary mt-2" @click="showAddUser = true">
            プレイヤーを追加
          </button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showAddUser"
        class="fixed inset-0 z-[60] bg-black/70 flex items-center px-4"
        @click.self="showAddUser = false"
      >
        <div class="card w-full max-w-sm mx-auto animate-slide-up">
          <p class="font-medium mb-3">新しいプレイヤー</p>
          <input v-model="newUserName" type="text" class="input-base mb-3" placeholder="名前" maxlength="32">
          <button type="button" class="btn-primary mb-2" :disabled="!newUserName.trim()" @click="onAddUser">
            追加
          </button>
          <button type="button" class="btn-secondary" @click="showAddUser = false">キャンセル</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { User, HanchanWithScores, PlayerStats, Season } from '~/types'
import { useMahjongSeasons } from '~/composables/useMahjongSeasons'

definePageMeta({ layout: 'default' })

const { currentUserId, fetchUsers, login, currentUserName, createUser } = useAuth()
const { fetchHanchans, fetchHanchansBySeasonId } = useHanchans()
const { fetchCurrentSeason, fetchSeasons } = useMahjongSeasons()
const { calcPlayerStats, formatRate, formatAvgPlacement } = useStats()
const { formatPoint, pointClass } = useScoreCalc()

const tab = ref<'all' | 'season'>('all')
const loading = ref(true)
const seasonTabReady = ref(false)
const showUserSelect = ref(false)
const showAddUser = ref(false)
const newUserName = ref('')
const users = ref<User[]>([])
const seasons = ref<Season[]>([])
const selectedSeasonId = ref('')
const hanchans = ref<HanchanWithScores[]>([])
const stats = ref<PlayerStats | null>(null)

const seasonRangeLabel = (s: Season) => {
  const end = s.end_date ?? '進行中'
  return `${s.start_date} 〜 ${end}`
}

const sortedSeasons = computed(() => {
  return [...seasons.value].sort((a, b) => {
    const dateA = new Date(a.created_at ?? 0).getTime()
    const dateB = new Date(b.created_at ?? 0).getTime()
    return dateB - dateA
  })
})

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

const selectUser = (user: User) => {
  login(user)
  showUserSelect.value = false
}

const onAddUser = async () => {
  const name = newUserName.value.trim()
  if (!name) return
  const u = await createUser(name)
  if (!u) {
    return
  }
  newUserName.value = ''
  showAddUser.value = false
  await loadAllTab()
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

onMounted(async () => {
  if (!users.value.length) {
    users.value = await fetchUsers()
  }
})

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
