import Aura from '@primeuix/themes/aura'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2026-05-20',
  devtools: { enabled: true },
  modules: [
    '@nuxt/fonts',
    '@nuxt/icon',
    '@primevue/nuxt-module',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt',
    '@nuxt/eslint',
    '@nuxt/a11y'
  ],
  css: ['primeicons/primeicons.css', '~/assets/css/main.css'],
  // @ts-expect-error @nuxt/fonts does not expose config typings in this install.
  fonts: {
    families: [
      { name: 'Manrope', provider: 'google', weights: [400, 500, 600, 700, 800] },
      { name: 'Noto Sans JP', provider: 'google', weights: [400, 500, 700, 900] }
    ]
  },
  i18n: {
    defaultLocale: 'en',
    strategy: 'no_prefix',
    langDir: 'locales',
    locales: [
      { code: 'en', name: 'English', language: 'en-US', file: 'en.json' },
      { code: 'de', name: 'Deutsch', language: 'de-DE', file: 'de.json' },
      { code: 'ja', name: 'Japanese', language: 'ja-JP', file: 'ja.json' }
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'zenstudy_locale',
      redirectOn: 'root'
    }
  },
  icon: {
    provider: 'iconify',
    serverBundle: 'local'
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'ZenStudy',
      short_name: 'ZenStudy',
      description: 'A local-first language learning app powered by course repositories.',
      theme_color: '#FAFAF8',
      background_color: '#FAFAF8',
      display: 'standalone'
    }
  },
  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false,
          cssLayer: {
            name: 'primevue',
            order: 'theme, base, primevue'
          }
        }
      },
      ripple: true
    }
  },
  app: {
    head: {
      title: 'ZenStudy | Language Learning',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A local-first language learning app with repository-driven courses, offline progress, and course creation tools.' }
      ]
    }
  }
})