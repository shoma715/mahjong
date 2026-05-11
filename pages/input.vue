<template>
  <div class="page-container pb-28">
    <header class="mb-6">
      <p class="section-title mb-1">スコア入力</p>
      <h1 class="font-display text-3xl tracking-wide text-white">半荘を記録</h1>
    </header>

    <section class="card mb-4">
      <label class="section-title block mb-2">対局日</label>
      <input v-model="playedDate" type="date" class="input-base tabular">
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
  </div>
</template>

<script setup lang="ts">
import type { User, ScoreInput, CalcResult } from '~/types'

definePageMeta({ layout: 'default' })

const { fetchUsers, createUser } = useAuth()
const { saveHanchan } = useHanchans()
const { validateTotal, currentTotal, calcPoints, formatPoint, pointClass } = useScoreCalc()

const todayStr = () => {
  const t = new Date()
  const y = t.getFullYear()
  const m = String(t.getMonth() + 1).padStart(2, '0')
  const d = String(t.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const playedDate = ref(todayStr())
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
  () => totalValid.value && fourUsersPicked.value && rawScoresFinite.value,
)

const preview = computed<CalcResult[]>(() => {
  if (!canSave.value) return []
  return calcPoints(rows.value as ScoreInput[])
})

const userName = (id: string) => users.value.find(u => u.id === id)?.name ?? ''

const loadUsers = async () => {
  users.value = await fetchUsers()
}

onMounted(loadUsers)

const onSave = async () => {
  errorMsg.value = ''
  if (!canSave.value) return
  saving.value = true
  const results = calcPoints(rows.value as ScoreInput[])
  const h = await saveHanchan(playedDate.value, results)
  saving.value = false
  if (!h) {
    errorMsg.value = '保存に失敗しました。Supabase の設定とテーブルを確認してください。'
    return
  }
  await navigateTo('/history')
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
