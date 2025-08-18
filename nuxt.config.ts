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
    hooks: {
      compiled: async () => {
        // Migration dosyalarını build output'a kopyala
        const { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } = await import('node:fs')
        const { join } = await import('node:path')

        const copyDirectory = (source: string, target: string) => {
          if (!existsSync(source))
            return

          const files = readdirSync(source)

          for (const file of files) {
            const sourcePath = join(source, file)
            const targetPath = join(target, file)

            if (statSync(sourcePath).isDirectory()) {
              if (!existsSync(targetPath)) {
                mkdirSync(targetPath, { recursive: true })
              }
              copyDirectory(sourcePath, targetPath)
            }
            else {
              copyFileSync(sourcePath, targetPath)
            }
          }
        }

        const migrationsSource = './server/database/migrations'
        const migrationsTarget = './.output/server/migrations'

        if (existsSync(migrationsSource)) {
          console.log('[build] Copying migration files to build directory...')
          // Hedef klasörü oluştur
          mkdirSync(migrationsTarget, { recursive: true })
          copyDirectory(migrationsSource, migrationsTarget)
          console.log('[build] ✅ Migration files copied successfully')
        }
      },
    },
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
    componentDir: './app/components/ui',
  },

  colorMode: {
    classSuffix: '',
    fallback: 'light',
    storageKey: 'sayfa-color-mode',
    preference: 'light', // System yerine light default
    hid: 'nuxt-color-mode-script',
  },
})
