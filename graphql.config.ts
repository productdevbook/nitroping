import type { IGraphQLConfig } from 'graphql-config'

export default <IGraphQLConfig> {
  projects: {
    default: {
      schema: [
        './.nuxt/graphql/schema.graphql',
      ],
      documents: [
        './app/graphql/**/*.{graphql,js,ts,jsx,tsx}',
      ],
    },
  },
}
