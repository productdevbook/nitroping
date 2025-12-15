// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    'abckit',
  ],
  ssr: false,

  css: [
    '~/assets/css/tailwind.css',
    'notivue/notification.css',
    'notivue/animations.css',
  ],

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

  $development: {
    vite: {
      server: {
        allowedHosts: true,
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
    componentDir: '~/components/ui',
  },
})
