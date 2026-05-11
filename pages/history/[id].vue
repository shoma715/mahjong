<template>
  <div class="page-container pb-28">
    <header class="mb-6 flex items-center gap-3">
      <NuxtLink to="/history" class="text-jade-light text-sm shrink-0">← 戻る</NuxtLink>
      <div class="min-w-0">
        <p class="section-title mb-1">半荘の編集</p>
        <h1 class="font-display text-2xl tracking-wide text-white truncate">対局を修正</h1>
      </div>
    </header>

    <div v-if="loading" class="card text-center text-white/40 py-10">読み込み中…</div>

    <template v-else-if="hanchan">
      <section class="card mb-4">
        <label class="section-title block mb-2">対局日</label>
        <input v-model="playedDate" type="date" class="input-base tabular">
      </section>

      <section class="space-y-4 mb-4">
        <div v-for="(row, idx) in rows" :key="idx" class="card space-y-2">
          <span class="text-xs text-white/40">席 {{ idx + 1 }}</span>
          <select v-model="row.user_id" class="input-base">
            <option :value="null">プレイヤーを選択</option>
            <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
          <div>
            <label class="text-xs text-white/40">素点</label>
            <input
              v-model.number="row.raw_score"
              type="number"
              inputmode="numeric"
              class="input-base tabular mt-1"
            >
          </div>
        </div>
      </section>

      <div class="card mb-4">
        <div class="flex justify-between items-center text-sm">
          <span class="text-white/50">合計</span>
          <span class="tabular font-bold text-lg" :class="totalValid ? 'text-jade-light' : 'text-red-400'">
            {{ totalPoints.toLocaleString() }} / 100,000
          </span>
        </div>
      </div>

      <p v-if="errorMsg" class="text-red-400 text-sm mb-3">{{ errorMsg }}</p>

      <button type="button" class="btn-primary mb-3" :disabled="!canSave || saving" @click="onSave">
        {{ saving ? '更新中…' : '変更を保存' }}
      </button>

      <button type="button" class="btn-secondary text-red-400 border-red-400/30 mb-4" @click="onDelete">
        この半荘を削除
      </button>
    </template>

    <div v-else class="card text-center text-white/40 py-10">
      見つかりませんでした
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User, ScoreInput, HanchanWithScores, CalcResult } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const id = computed(() => route.params.id as string)

const { fetchUsers } = useAuth()
const { fetchHanchanById, updateScores, deleteHanchan } = useHanchans()
const { validateTotal, currentTotal, calcPoints } = useScoreCalc()

const loading = ref(true)
const hanchan = ref<HanchanWithScores | null>(null)
const users = ref<User[]>([])
const playedDate = ref('')
const rows = ref<ScoreInput[]>([
  { user_id: null, raw_score: null },
  { user_id: null, raw_score: null },
  { user_id: null, raw_score: null },
  { user_id: null, raw_score: null },
])

const saving = ref(false)
const errorMsg = ref('')

const totalPoints = computed(() => currentTotal(rows.value as ScoreInput[]))
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

const toYmd = (iso: string) => {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const load = async () => {
  loading.value = true
  errorMsg.value = ''
  const [u, h] = await Promise.all([fetchUsers(), fetchHanchanById(id.value)])
  users.value = u
  hanchan.value = h
  if (h) {
    playedDate.value = toYmd(h.played_at)
    const sorted = [...h.scores].sort((a, b) => a.placement - b.placement)
    rows.value = [0, 1, 2, 3].map(i => {
      const s = sorted[i]
      return s
        ? { user_id: s.user_id, raw_score: s.raw_score }
        : { user_id: null, raw_score: null }
    })
  }
  loading.value = false
}

watch(id, load)

onMounted(load)

const onSave = async () => {
  if (!hanchan.value || !canSave.value) return
  saving.value = true
  errorMsg.value = ''
  const results = calcPoints(rows.value as ScoreInput[], hanchan.value)
  const ok = await updateScores(hanchan.value.id, playedDate.value, results)
  saving.value = false
  if (!ok) {
    errorMsg.value = '更新に失敗しました'
    return
  }
  await navigateTo('/history')
}

const onDelete = async () => {
  if (!hanchan.value) return
  if (!confirm('この半荘を削除しますか？取り消せません。')) return
  const ok = await deleteHanchan(hanchan.value.id)
  if (!ok) {
    errorMsg.value = '削除に失敗しました'
    return
  }
  await navigateTo('/history')
}
</script>
