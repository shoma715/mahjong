import liff from '@line/liff'
import { ref } from 'vue'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const liffId = config.public.liffId ?? ''

  const isReady = ref(false)
  const initError = ref<Error | null>(null)

  const ready = (async () => {
    try {
      await liff.init({ liffId })
      isReady.value = true
    } catch (e) {
      initError.value = e as Error
      // Keep failing silently; app can inspect initError if needed
    }
  })()

  const provided = {
    liff,
    isReady,
    initError,
    ready,
  }

  nuxtApp.provide('liff', provided)
})
