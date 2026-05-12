<template>
  <div class="page-container pb-28">
    <header class="mb-6">
      <p class="section-title mb-1">スコア入力</p>
      <h1 class="font-display text-3xl tracking-wide text-white">半荘を記録</h1>
    </header>

    <div v-if="seasonLoading" class="card text-center text-white/40 py-12">
      読み込み中…
    </div>

    <div
      v-else-if="!currentSeason"
      class="rounded-2xl border-2 border-amber-500/50 bg-amber-950/40 px-6 py-10 text-center space-y-4"
      role="alert"
    >
      <p class="font-display text-xl sm:text-2xl text-amber-100 leading-snug">
        現在進行中のシーズンがありません。ホーム画面から新しいシーズンを開始してから記録してください。
      </p>
      <NuxtLink to="/" class="inline-block text-jade-light underline text-sm">
        ホームへ戻る
      </NuxtLink>
    </div>

    <template v-else>
      <section class="card mb-4">
        <label class="section-title block mb-2">対局日</label>
        <input v-model="playedDate" type="date" class="input-base tabular">
      </section>

      <section class="card mb-4">
      <button
        type="button"
        class="w-full flex items-center justify-between gap-2 py-1 text-left"
        @click="rulesOpen = !rulesOpen"
      >
        <span class="section-title !mb-0">詳細設定（オカ・ウマ）</span>
        <ChevronDownIcon
          class="w-5 h-5 text-white/50 shrink-0 transition-transform duration-200"
          :class="{ 'rotate-180': rulesOpen }"
        />
      </button>
      <div v-show="rulesOpen" class="mt-4 pt-4 border-t border-white/10 space-y-4">
        <p class="text-xs text-white/40 leading-relaxed">
          デフォルトは M リーグ準拠（オカ 20 / ウマ +30, +10, −10, −30）。半荘ごとに変更すると、プレビュー・保存の両方に反映されます。
        </p>
        <div>
          <label class="text-xs text-white/50 block mb-1">オカ（1位に加算する pt）</label>
          <input v-model.number="rules.rule_oka" type="number" step="0.1" class="input-base tabular">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-white/50 block mb-1">1位ウマ</label>
            <input v-model.number="rules.rule_uma_1" type="number" step="0.1" class="input-base tabular">
          </div>
          <div>
            <label class="text-xs text-white/50 block mb-1">2位ウマ</label>
            <input v-model.number="rules.rule_uma_2" type="number" step="0.1" class="input-base tabular">
          </div>
          <div>
            <label class="text-xs text-white/50 block mb-1">3位ウマ</label>
            <input v-model.number="rules.rule_uma_3" type="number" step="0.1" class="input-base tabular">
          </div>
          <div>
            <label class="text-xs text-white/50 block mb-1">4位ウマ</label>
            <input v-model.number="rules.rule_uma_4" type="number" step="0.1" class="input-base tabular">
          </div>
        </div>
        <button type="button" class="btn-secondary text-sm py-2" @click="resetRules">
          Mリーグ準拠の値に戻す
        </button>
      </div>
    </section>

    <section class="space-y-4 mb-4">
      <div
        v-for="(row, idx) in rows"
        :key="idx"
        class="card space-y-2"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-white/40">席 {{ idx + 1 }}</span>
        </div>
        <select v-model="row.user_id" class="input-base">
          <option :value="null">プレイヤーを選択</option>
          <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
        </select>
        <div>
          <label class="text-xs text-white/40">素点（持ち点）</label>
          <input
            v-model.number="row.raw_score"
            type="number"
            inputmode="numeric"
            class="input-base tabular mt-1"
            placeholder="25000"
          >
        </div>
      </div>
    </section>

    <div class="card mb-4">
      <div class="flex justify-between items-center text-sm">
        <span class="text-white/50">合計</span>
        <span
          class="tabular font-bold text-lg"
          :class="totalValid ? 'text-jade-light' : 'text-red-400'"
        >
          {{ totalPoints.toLocaleString() }} / 100,000
        </span>
      </div>
      <p v-if="!totalValid" class="text-xs text-white/40 mt-2">
        4人の素点の合計がちょうど 100,000 点のときのみ保存できます。
      </p>
    </div>

    <div v-if="preview.length && totalValid" class="card mb-4">
      <p class="section-title mb-2">算出ポイント（保存時と同じ）</p>
      <div class="space-y-1 text-sm">
        <div v-for="p in preview" :key="p.user_id" class="flex justify-between">
          <span>{{ userName(p.user_id) }}</span>
          <span class="tabular" :class="pointClass(p.point)">{{ formatPoint(p.point) }}</span>
        </div>
      </div>
    </div>

    <p v-if="errorMsg" class="text-red-400 text-sm mb-3">{{ errorMsg }}</p>

    <button
      type="button"
      class="btn-primary mb-3"
      :disabled="!canSave || saving"
      @click="onSave"
    >
      {{ saving ? '保存中…' : '保存する' }}
    </button>

    <button type="button" class="btn-secondary" @click="showAddUser = true">
      プレイヤーを追加
    </button>

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
    </template>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import type { User, ScoreInput, CalcResult, HanchanRulesInput, Season } from '~/types'
import { useSeasons } from '~/composables/useSeasons'

definePageMeta({ layout: 'default' })

const { fetchUsers, createUser } = useAuth()
const { saveHanchan } = useHanchans()
const {
  validateTotal,
  currentTotal,
  calcPoints,
  formatPoint,
  pointClass,
  defaultHanchanRules,
} = useScoreCalc()

const { fetchCurrentSeason } = useSeasons()

const todayStr = () => {
  const t = new Date()
  const y = t.getFullYear()
  const m = String(t.getMonth() + 1).padStart(2, '0')
  const d = String(t.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const seasonLoading = ref(true)
const currentSeason = ref<Season | null>(null)

const playedDate = ref(todayStr())
const rulesOpen = ref(false)
const rules = ref<HanchanRulesInput>({ ...defaultHanchanRules() })

const users = ref<User[]>([])
const rows = ref<ScoreInput[]>([
  { user_id: null, raw_score: null },
  { user_id: null, raw_score: null },
  { user_id: null, raw_score: null },
  { user_id: null, raw_score: null },
])

const saving = ref(false)
const errorMsg = ref('')
const showAddUser = ref(false)
const newUserName = ref('')

const totalPoints = computed(() =>
  currentTotal(rows.value as ScoreInput[]),
)

const totalValid = computed(() => validateTotal(rows.value as ScoreInput[]))

const fourUsersPicked = computed(() => {
  const ids = rows.value.map(r => r.user_id).filter(Boolean) as string[]
  return ids.length === 4 && new Set(ids).size === 4
})

const rawScoresFinite = computed(() =>
  rows.value.every(
    r => r.raw_score !== null && r.raw_score !== undefined && Number.isFinite(r.raw_score),
  ),
)

const canSave = computed(
  () =>
    Boolean(currentSeason.value)
    && totalValid.value
    && fourUsersPicked.value
    && rawScoresFinite.value,
)

const finiteOr = (v: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback

const defaults = defaultHanchanRules()

const rulePick = computed<HanchanRulesInput>(() => ({
  rule_oka: finiteOr(rules.value.rule_oka, defaults.rule_oka),
  rule_uma_1: finiteOr(rules.value.rule_uma_1, defaults.rule_uma_1),
  rule_uma_2: finiteOr(rules.value.rule_uma_2, defaults.rule_uma_2),
  rule_uma_3: finiteOr(rules.value.rule_uma_3, defaults.rule_uma_3),
  rule_uma_4: finiteOr(rules.value.rule_uma_4, defaults.rule_uma_4),
}))

const preview = computed<CalcResult[]>(() => {
  if (!canSave.value) return []
  return calcPoints(rows.value as ScoreInput[], rulePick.value)
})

const userName = (id: string) => users.value.find(u => u.id === id)?.name ?? ''

const loadUsers = async () => {
  users.value = await fetchUsers()
}

onMounted(async () => {
  seasonLoading.value = true
  const [usersList, season] = await Promise.all([fetchUsers(), fetchCurrentSeason()])
  users.value = usersList
  currentSeason.value = season
  seasonLoading.value = false
})

const onSave = async () => {
  errorMsg.value = ''
  if (!currentSeason.value) return
  if (!canSave.value) return
  saving.value = true
  const results = calcPoints(rows.value as ScoreInput[], rulePick.value)
  const h = await saveHanchan(playedDate.value, results, currentSeason.value.id, rulePick.value)
  saving.value = false
  if (!h) {
    errorMsg.value = '保存に失敗しました。Supabase の設定とテーブルを確認してください。'
    return
  }
  await navigateTo('/history')
}

const resetRules = () => {
  Object.assign(rules.value, defaultHanchanRules())
}

const onAddUser = async () => {
  const name = newUserName.value.trim()
  if (!name) return
  const u = await createUser(name)
  if (!u) {
    errorMsg.value = 'プレイヤーの追加に失敗しました'
    return
  }
  newUserName.value = ''
  showAddUser.value = false
  await loadUsers()
}
</script>
