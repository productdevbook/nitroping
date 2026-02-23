import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import graphql from 'nitro-graphql'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  server: {
    port: Number(process.env.PORT ?? 3100),
    allowedHosts: [
      'localhost',
      'nitroping.localhost',
      'host.docker.internal',
      '.localhost',
    ],
    cors: true,
  },
  plugins: [
    vue(),
    tailwindcss(),
    // graphql() must be BEFORE nitro()
    graphql({
      serverDir: 'server',
      clientDir: './server/.graphql',
      framework: 'graphql-yoga',
      subscriptions: {
        enabled: true,
        websocket: { enabled: true },
      },
      skipLocalScan: true,
      sdk: {
        enabled: true,
        main: './.graphql/default/sdk.ts',
      },
      codegen: {
        server: {
          scalars: {
            Timestamp: 'string',
            JSON: 'any',
          },
        },
      },
    }),
    nitro({
      serverDir: 'server',
      builder: 'rolldown',
      routesDir: 'server/routes',
      alias: {
        '#server': resolve(__dirname, './server'),
        '~~/server': resolve(__dirname, './server'),
      },
      experimental: {
        tasks: true,
        vite: {},
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version || '0.0.1'),
  },
  optimizeDeps: {
    include: [
      '@iconify/vue',
      '@vueuse/core',
      'class-variance-authority',
      'clsx',
      'lucide-vue-next',
      'notivue',
      'pinia',
      'pinia-plugin-persistedstate',
      'reka-ui',
      'tailwind-merge',
      'vue-router',
      'vue',
    ],
  },
  experimental: {
    enableNativePlugin: true,
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '#server': fileURLToPath(new URL('./server', import.meta.url)),
      '~~/server': fileURLToPath(new URL('./server', import.meta.url)),
      '#graphql/client': fileURLToPath(
        new URL('./.graphql/nitro-graphql-client.d.ts', import.meta.url),
      ),
      '#graphql': fileURLToPath(new URL('./.graphql', import.meta.url)),
    },
  },
})
