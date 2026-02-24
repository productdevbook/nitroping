import { eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'
import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'

export const deleteDeviceMutation = defineMutation({
  deleteDevice: {
    resolve: async (_parent, { id }, { context }) => {
      const db = useDatabase()

      await db
        .delete(tables.device)
        .where(eq(tables.device.id, id))

      return true
    },
  },
})
