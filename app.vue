<template>
  <div class="min-h-screen bg-felt-50 text-white flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-felt-DEFAULT/95 backdrop-blur-md rounded-xl shadow-lg p-6">
      <div v-if="loading" class="flex items-center space-x-3">
        <svg class="w-6 h-6 animate-spin text-jade-light" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <p class="animate-pulse">LINE情報を取得中...</p>
      </div>

      <div v-else>
        <div v-if="profile" class="flex items-center space-x-4">
          <img :src="profile.pictureUrl" alt="profile" class="w-16 h-16 rounded-full border-2 border-jade-DEFAULT object-cover" />
          <div>
            <div class="font-medium text-lg">{{ profile.displayName }}</div>
            <div class="text-sm text-jade-light flex items-center">✓ <span class="ml-2">LINE連携完了</span></div>
          </div>
        </div>

        <!-- Notify button -->
        <div v-if="profile" class="mt-6">
          <button
            :disabled="isSending"
            @click="sendResultAndNotify"
            class="w-full px-4 py-3 bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-lg shadow-md disabled:opacity-50"
          >
            <span v-if="!isSending">結果を保存して通知</span>
            <span v-else>送信中...</span>
          </button>
        </div>

        <div v-else class="text-center">
          <p class="mb-4">LINEに接続できませんでした。</p>
          <button @click="retryLogin" class="px-4 py-2 bg-jade-DEFAULT rounded shadow">LINEでログイン</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Ref } from 'vue'

const nuxtApp = useNuxtApp()
const liffProvided: any = nuxtApp.$liff

const loading: Ref<boolean> = ref(true)
const profile: Ref<any | null> = ref(null)
const isSending = ref(false)

async function initLiffFlow() {
  // wait for plugin init to finish
  try {
    await liffProvided?.ready
  } catch (e) {
    // ignore — handled below
  }

  const liff = liffProvided?.liff
  if (!liff) {
    loading.value = false
    return
  }

  if (liff.isLoggedIn && liff.isLoggedIn()) {
    try {
      const p = await liff.getProfile()
      profile.value = p
    } catch (e) {
      profile.value = null
    } finally {
      loading.value = false
    }
  } else {
    // automatically redirect to login
    try {
      liff.login()
    } catch (e) {
      loading.value = false
    }
  }
}

function retryLogin() {
  const liff = liffProvided?.liff
  if (liff) liff.login()
}

onMounted(() => {
  initLiffFlow()
})

async function sendResultAndNotify() {
  if (!profile.value || !profile.value.userId) {
    alert('ユーザー情報がありません')
    return
  }

  isSending.value = true
  try {
    await $fetch('/api/notify', {
      method: 'POST',
      body: {
        userId: profile.value.userId,
        message: '第1戦の結果が保存されました！',
      },
    })
    alert('通知を送信しました')
  } catch (err) {
    console.error('notify error', err)
    alert('通知の送信に失敗しました')
  } finally {
    isSending.value = false
  }
}
</script>

<style>
/* keep Tailwind for the bulk; small local fallbacks if needed */
</style>
