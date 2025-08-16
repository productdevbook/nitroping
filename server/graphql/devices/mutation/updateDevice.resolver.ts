import { eq } from 'drizzle-orm'

export const updateDeviceMutation = defineMutation({
  updateDevice: {
    resolve: async (_parent, { id, input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const updatedDevice = await db
        .update(tables.device)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(tables.device.id, id))
        .returning()

      if (updatedDevice.length === 0) {
        throw createError({
          statusCode: 404,
          message: 'Device not found',
        })
      }

      return updatedDevice[0]
    },
  },
})
