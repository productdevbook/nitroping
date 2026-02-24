import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'
import { eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'
import { HTTPError } from 'nitro/h3'

export const updateDeviceMutation = defineMutation({
  updateDevice: {
    resolve: async (_parent, { id, input }, _ctx) => {
      const db = useDatabase()

      const updatedDevice = await db
        .update(tables.device)
        .set({
          ...input,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tables.device.id, id))
        .returning()

      if (updatedDevice.length === 0) {
        throw new HTTPError({
          status: 404,
          message: 'Device not found',
        })
      }

      return updatedDevice[0]
    },
  },
})
