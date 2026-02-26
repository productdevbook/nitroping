import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'
import { eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'

export const templateMutations = defineMutation({
  createTemplate: {
    resolve: async (_parent, { input }, _ctx) => {
      const db = useDatabase()

      const [row] = await db
        .insert(tables.template)
        .values({
          appId: input.appId as string,
          channelId: input.channelId as string | undefined,
          name: input.name as string,
          channelType: input.channelType as any,
          subject: input.subject as string | undefined,
          body: input.body as string,
          htmlBody: input.htmlBody as string | undefined,
        })
        .returning()

      if (!row)
        throw new Error('Failed to create template')
      return row
    },
  },

  updateTemplate: {
    resolve: async (_parent, { id, input }, _ctx) => {
      const db = useDatabase()

      const updates: any = { updatedAt: new Date().toISOString() }
      if (input.channelId !== undefined)
        updates.channelId = input.channelId
      if (input.name !== undefined)
        updates.name = input.name
      if (input.subject !== undefined)
        updates.subject = input.subject
      if (input.body !== undefined)
        updates.body = input.body
      if (input.htmlBody !== undefined)
        updates.htmlBody = input.htmlBody

      const [row] = await db
        .update(tables.template)
        .set(updates)
        .where(eq(tables.template.id, id as string))
        .returning()

      if (!row)
        throw new Error('Template not found')
      return row
    },
  },

  deleteTemplate: {
    resolve: async (_parent, { id }, _ctx) => {
      const db = useDatabase()
      await db.delete(tables.template).where(eq(tables.template.id, id as string))
      return true
    },
  },
})
