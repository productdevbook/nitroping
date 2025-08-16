import { eq } from 'drizzle-orm'

export const notificationQuery = defineQuery({
  notification: {
    resolve: async (_parent, { id }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const result = await db
        .select()
        .from(tables.notification)
        .where(eq(tables.notification.id, id))
        .limit(1)

      return result[0] || null
    },
  },
})
