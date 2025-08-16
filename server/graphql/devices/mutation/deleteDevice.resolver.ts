import { eq } from 'drizzle-orm'

export const deleteDeviceMutation = defineMutation({
  deleteDevice: {
    resolve: async (_parent, { id }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      await db
        .delete(tables.device)
        .where(eq(tables.device.id, id))

      return true
    },
  },
})
