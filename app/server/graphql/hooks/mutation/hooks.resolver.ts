import { encryptSensitiveData } from '#server/utils/crypto'
import { eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'

export const hookMutations = defineMutation({
  createHook: {
    resolve: async (_parent, { input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const secret = input.secret
        ? encryptSensitiveData(input.secret as string)
        : null

      const [row] = await db
        .insert(tables.hook)
        .values({
          appId: input.appId as string,
          name: input.name as string,
          url: input.url as string,
          secret,
          events: (input.events as any) || [],
        })
        .returning()

      if (!row)
        throw new Error('Failed to create hook')

      return { ...row, secret: null }
    },
  },

  updateHook: {
    resolve: async (_parent, { id, input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const updates: any = { updatedAt: new Date().toISOString() }
      if (input.name !== undefined)
        updates.name = input.name
      if (input.url !== undefined)
        updates.url = input.url
      if (input.events !== undefined)
        updates.events = input.events
      if (input.isActive !== undefined)
        updates.isActive = input.isActive
      if (input.secret !== undefined) {
        updates.secret = input.secret
          ? encryptSensitiveData(input.secret as string)
          : null
      }

      const [row] = await db
        .update(tables.hook)
        .set(updates)
        .where(eq(tables.hook.id, id as string))
        .returning()

      if (!row)
        throw new Error('Hook not found')

      return { ...row, secret: null }
    },
  },

  deleteHook: {
    resolve: async (_parent, { id }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()
      await db.delete(tables.hook).where(eq(tables.hook.id, id as string))
      return true
    },
  },
})
