import { defineField } from 'nitro-graphql/define'

export const hookFieldsResolver = defineField({
  Hook: {
    // Always resolve secret to null — never expose over GraphQL
    secret: {
      resolve: () => null,
    },
  },
})
