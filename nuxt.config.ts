import Aura from '@primeuix/themes/aura'

export default defineNuxtConfig({
  compatibilityDate: '2026-05-13',
  devtools: { enabled: true },
  modules: ['@nuxt/fonts', '@nuxt/icon', '@primevue/nuxt-module'],
  css: ['primeicons/primeicons.css', '~/assets/css/main.css'],
  fonts: {
    families: [
      { name: 'Manrope', provider: 'google', weights: [400, 500, 600, 700, 800] },
      { name: 'Noto Sans JP', provider: 'google', weights: [400, 500, 700, 900] }
    ]
  },
  icon: {
    provider: 'iconify',
    serverBundle: 'local'
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
      title: 'ZenStudy | Japanese Study App',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A local-first Japanese study app for vocabulary, kanji, dialogue training, and SQLite backups.' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  }
})