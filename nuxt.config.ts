import type { NitroGraphQLOptions } from 'nitro-graphql'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: [
    'abckit',
  ],
  ssr: false,
  css: [
    '~/assets/css/tailwind.css',
    'notivue/notification.css',
    'notivue/animations.css',
  ],
  abckit: {
    modules: {
      graphql: true,
    },
  },

  nitro: {
    experimental: {
      tasks: true,
    },
    modules: ['nitro-graphql'],
    serverAssets: [{
      baseName: 'migrations',
      dir: './database/migrations', // Relative to Nitro srcDir (server/)
    }],
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
    } as NitroGraphQLOptions,
  },
})
