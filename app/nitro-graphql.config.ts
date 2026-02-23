import { defineConfig } from 'nitro-graphql/config'

export default defineConfig({
  serverDir: 'server/graphql',
  clientDir: 'src/graphql',
  buildDir: '.graphql',
  framework: 'graphql-yoga',
  codegen: {
    client: {
      scalars: {
        Timestamp: 'string',
        JSON: 'any',
      },
    },
  },
})
