import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'
import { count, eq } from 'drizzle-orm'
import { defineMutation, defineQuery } from 'nitro-graphql/define'

export const inAppQuery = defineQuery({
  inAppMessages: {
    resolve: async (_parent, { contactId, limit, offset }, _ctx) => {
      const db = useDatabase()
      return db
        .select()
        .from(tables.inAppMessage)
        .where(eq(tables.inAppMessage.contactId, contactId as string))
        .limit((limit as number) ?? 20)
        .offset((offset as number) ?? 0)
    },
  },

  unreadInAppCount: {
    resolve: async (_parent, { contactId }, _ctx) => {
      const db = useDatabase()
      const rows = await db
        .select({ value: count() })
        .from(tables.inAppMessage)
        .where(eq(tables.inAppMessage.contactId, contactId as string))
      return rows[0]?.value ?? 0
    },
  },
})

export const inAppMutation = defineMutation({
  markInAppMessageRead: {
    resolve: async (_parent, { id }, _ctx) => {
      const db = useDatabase()
      await db
        .update(tables.inAppMessage)
        .set({ isRead: true, readAt: new Date().toISOString() })
        .where(eq(tables.inAppMessage.id, id as string))
      return true
    },
  },
})
