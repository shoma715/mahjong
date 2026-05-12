<template>
  <div class="page-container">
    <header class="mb-6">
      <NuxtLink to="/" class="text-jade-light text-sm">← ホーム</NuxtLink>
      <p class="section-title mt-3 mb-1">管理</p>
      <h1 class="font-display text-3xl tracking-wide text-white">シーズン設定</h1>
    </header>

    <section v-if="loading" class="card text-center text-white/40 py-10">読み込み中…</section>

    <template v-else>
      <section class="card mb-4 space-y-3">
        <p class="section-title">現在のシーズン</p>
        <div v-if="activeSeason" class="space-y-2">
          <p class="font-medium text-lg text-jade-light">{{ activeSeason.name }}</p>
          <p class="text-sm text-white/50 tabular">
            {{ activeSeason.start_date }} 〜 {{ formatSeasonEndDisplay(activeSeason.end_date) }}
          </p>
          <button type="button" class="btn-secondary border-red-400/40 text-red-400" @click="onEndSeason">
            シーズンを終了する
          </button>
        </div>
        <p v-else class="text-white/50 text-sm">進行中のシーズンはありません。</p>
      </section>

      <section class="card space-y-4">
        <div>
          <p class="section-title">新しいシーズンを作成</p>
          <p class="text-xs text-white/40 leading-relaxed mt-2">
            年と季節を選ぶと、開始日・終了日・名称を自動で組み立てて保存します。
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <label class="space-y-2">
            <span class="text-xs text-white/40">年</span>
            <select v-model.number="selectedYear" class="input-base">
              <option v-for="year in availableYears" :key="year" :value="year">{{ year }}年</option>
            </select>
          </label>
          <label class="space-y-2">
            <span class="text-xs text-white/40">季節</span>
            <select v-model="selectedSeasonKind" class="input-base">
              <option v-for="season in seasonOptions" :key="season.value" :value="season.value">
                {{ season.label }}
              </option>
            </select>
          </label>
        </div>

        <div class="rounded-2xl border border-white/10 bg-felt-100/80 p-4 space-y-2">
          <p class="section-title">保存内容のプレビュー</p>
          <p class="text-jade-light font-medium">{{ seasonPreview.name }}</p>
          <p class="text-xs text-white/40 leading-relaxed">
            登録時は開始日が当日、進行中は内部の終了日（2099-12-31 相当）で保存されます。シーズンを閉じる操作まではランキングに含まれます。
          </p>
        </div>

        <p v-if="formError" class="text-red-400 text-sm">{{ formError }}</p>
        <button
          type="button"
          class="btn-primary"
          :disabled="saving"
          @click="onCreateSeason"
        >
          {{ saving ? '保存中…' : `「${seasonPreview.name}」を保存` }}
        </button>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Season, SeasonKind } from '~/types'
import { useMahjongSeasons } from '~/composables/useMahjongSeasons'

definePageMeta({ layout: 'default' })

type SeasonOption = {
  value: SeasonKind
  label: string
}

type SeasonPreview = {
  name: string
}

const seasonApi = useMahjongSeasons()

const loading = ref(true)
const saving = ref(false)
const activeSeason = ref<Season | null>(null)
const formError = ref('')

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const availableYears = Array.from({ length: 4 }, (_, index) => currentYear - 2 + index)
const selectedYear = ref(currentYear)
const selectedSeasonKind = ref<SeasonKind>(
  currentMonth >= 3 && currentMonth <= 5 ? 'spring'
  : currentMonth >= 6 && currentMonth <= 8 ? 'summer'
  : currentMonth >= 9 && currentMonth <= 11 ? 'autumn'
  : 'winter',
)

const seasonOptions: SeasonOption[] = [
  { value: 'spring', label: '春 (3-5月)' },
  { value: 'summer', label: '夏 (6-8月)' },
  { value: 'autumn', label: '秋 (9-11月)' },
  { value: 'winter', label: '冬 (12-2月)' },
]

const seasonMeta: Record<SeasonKind, { startMonth: number; endMonth: number; label: string }> = {
  spring: { startMonth: 3, endMonth: 5, label: 'Spring' },
  summer: { startMonth: 6, endMonth: 8, label: 'Summer' },
  autumn: { startMonth: 9, endMonth: 11, label: 'Autumn' },
  winter: { startMonth: 12, endMonth: 2, label: 'Winter' },
}

const pad2 = (value: number) => String(value).padStart(2, '0')

const formatDateTime = (dateTime: string) => {
  const date = new Date(dateTime)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

const buildSeasonPreview = (year: number, kind: SeasonKind): SeasonPreview => {
  const meta = seasonMeta[kind]
  return {
    name: `${meta.label} Season ${year}`,
  }
}

const seasonPreview = computed(() => buildSeasonPreview(selectedYear.value, selectedSeasonKind.value))

const isOngoingEndDate = (endDate: string | null) => {
  if (!endDate) return false
  return endDate.startsWith('2099-12-31')
}

const formatSeasonEndDisplay = (endDate: string | null) => {
  if (!endDate) return '進行中'
  if (isOngoingEndDate(endDate)) return '進行中'
  return formatDateTime(endDate)
}

const refresh = async () => {
  activeSeason.value = await seasonApi.fetchCurrentSeason()
}

onMounted(async () => {
  loading.value = true
  await refresh()
  loading.value = false
})

const onEndSeason = async () => {
  if (!activeSeason.value) return
  saving.value = true
  formError.value = ''
  const ok = await seasonApi.endCurrentSeason()
  saving.value = false
  if (!ok) {
    formError.value = '終了に失敗しました。ネットワークと DB の seasons テーブルを確認してください。'
    return
  }
  await refresh()
}

const onCreateSeason = async () => {
  formError.value = ''
  saving.value = true
  const row = await seasonApi.createSeason(seasonPreview.value.name)
  saving.value = false

  if (!row) {
    formError.value = '作成に失敗しました。Supabase の seasons テーブル定義と接続を確認してください。'
    return
  }

  await navigateTo({ path: '/', query: { season: 'created' } })
}
</script>
