// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    'nitro-graphql/nuxt',

  ],
  ssr: false,

  css: ['~/assets/css/tailwind.css'],

  nitro: {
    modules: ['nitro-graphql'],
    graphql: {
      framework: 'graphql-yoga',
      codegen: {
        server: {
          scalars: {
            Timestamp: 'string',
            File: 'File',
          },
        },
        client: {
          scalars: {
            Timestamp: 'string',
            File: 'File',
          },
        },
      },
    },
  },

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './app/components/ui'
  },

  colorMode: {
    classSuffix: '',
    fallback: 'light',
    storageKey: 'sayfa-color-mode',
    preference: 'light', // System yerine light default
    hid: 'nuxt-color-mode-script',
  },
})