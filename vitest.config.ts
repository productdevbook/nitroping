import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    coverage: {
      include: ['server/**/*.ts'],
      exclude: [
        'server/**/*.d.ts',
        'server/database/migrations/**',
        'server/graphql/sdk.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '~~/': new URL('./', import.meta.url).pathname,
      '~/': new URL('./', import.meta.url).pathname,
    },
  },
})
