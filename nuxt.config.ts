// https://nuxt.com/docs/api/configuration/nuxt-config
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  // ssr: false のとき SSR 用 Vite が起動せず NUXT_VITE_NODE_OPTIONS が未設定になり、
  // 「Vite Node IPC socket path not configured」が発生するため有効化する
  experimental: {
    viteEnvironmentApi: true,
  },

  // Vite 7 + viteEnvironmentApi 時に #app-manifest が解決されず dev が落ちる対策（Nuxt の empty スタブと同等）
  vite: {
    resolve: {
      alias: {
        '#app-manifest': resolve(projectRoot, 'node_modules/mocked-exports/lib/empty.mjs'),
      },
    },
    server: {
      allowedHosts: ['unavailable-flow-stuffed-shoulder.trycloudflare.com'],
    },
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
  ],

  tailwindcss: {
    config: {
      theme: {
        extend: {
          colors: {
            felt: {
              DEFAULT: '#0f1923',
              50: '#1a2836',
              100: '#243445',
              200: '#2f4254',
            },
            jade: {
              DEFAULT: '#1a9b7a',
              light: '#2ed4a4',
            },
            gold: '#d4a853',
          },
        },
      },
    },
  },

  // Supabase の環境変数をランタイム設定で公開
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
      liffId: '2010089650-gSzzeiJ6',
    },
  },

  // モバイルファースト: viewport meta
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
      title: '麻雀スコアトラッカー',
      meta: [
        { name: 'description', content: '友人間のクローズド麻雀成績管理アプリ' },
        { name: 'theme-color', content: '#0f1923' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Bebas+Neue&display=swap',
        },
      ],
    },
  },

  // SSR は不要（クローズド SPA として動作）
  ssr: false,

  css: ['~/assets/main.css'],

  // 今回追加する設定（vite 設定は上で統合済み）
})
