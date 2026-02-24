import { defineField } from 'nitro-graphql/define'

export const channelFieldsResolver = defineField({
  Channel: {
    // Always resolve config to null — never expose credentials over GraphQL
    config: {
      resolve: () => null,
    },
  },
})
