<template>
  <div class="min-h-screen bg-felt">
    <!-- メインコンテンツ -->
    <main>
      <slot />
    </main>

    <!-- ボトムナビゲーション -->
    <nav class="fixed bottom-0 left-0 right-0 z-50 bg-felt-50/95 backdrop-blur-md border-t border-white/5"
         :style="{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }">
      <div class="max-w-md mx-auto flex items-stretch justify-around">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item flex-1"
          :class="{ active: isActive(item.to) }"
        >
          <!-- アイコン -->
          <component :is="item.icon" class="w-5 h-5" />
          <!-- ラベル -->
          <span class="text-[10px] font-medium leading-none">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import {
  HomeIcon,
  PlusCircleIcon,
  ChartBarIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()

const navItems = [
  { to: '/',        label: 'ホーム',   icon: HomeIcon },
  { to: '/input',   label: '入力',     icon: PlusCircleIcon },
  { to: '/stats',   label: 'スタッツ', icon: ChartBarIcon },
  { to: '/history', label: '履歴',     icon: ClockIcon },
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
