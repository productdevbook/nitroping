// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@nuxtjs/color-mode',
  ],
  ssr: true,

  css: ['~/assets/css/tailwind.css'],

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './app/components/ui',
  },

  colorMode: {
    classSuffix: '',
    fallback: 'light',
    storageKey: 'nitroping-docs-color-mode',
    preference: 'light',
    hid: 'nuxt-color-mode-script',
  },
})