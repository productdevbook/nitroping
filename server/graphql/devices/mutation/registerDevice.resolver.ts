import { eq } from 'drizzle-orm'

export const deviceQueries = defineQuery({
  devices: {
    resolve: async (_parent, { appId }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()
      
      let query = db.select().from(tables.device)
      
      if (appId) {
        query = query.where(eq(tables.device.appId, appId))
      }
      
      return await query
    }
  },
  
  device: {
    resolve: async (_parent, { id }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()
      
      const result = await db
        .select()
        .from(tables.device)
        .where(eq(tables.device.id, id))
        .limit(1)
      
      return result[0] || null
    }
  },
  
  deviceByToken: {
    resolve: async (_parent, { token }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()
      
      const result = await db
        .select()
        .from(tables.device)
        .where(eq(tables.device.token, token))
        .limit(1)
      
      return result[0] || null
    }
  }
})

export const deviceMutations = defineMutation({
  registerDevice: {
    resolve: async (_parent, { input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()
      
      const newDevice = await db
        .insert(tables.device)
        .values({
          appId: input.appId,
          token: input.token,
          platform: input.platform.toLowerCase(),
          status: 'active',
          userId: input.userId,
          metadata: input.metadata,
          lastSeenAt: new Date()
        })
        .returning()
      
      return newDevice[0]
    }
  },
  
  updateDevice: {
    resolve: async (_parent, { id, input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()
      
      const updatedDevice = await db
        .update(tables.device)
        .set({
          ...input,
          updatedAt: new Date()
        })
        .where(eq(tables.device.id, id))
        .returning()
      
      if (updatedDevice.length === 0) {
        throw createError({
          statusCode: 404,
          message: 'Device not found'
        })
      }
      
      return updatedDevice[0]
    }
  },
  
  deleteDevice: {
    resolve: async (_parent, { id }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()
      
      await db
        .delete(tables.device)
        .where(eq(tables.device.id, id))
      
      return true
    }
  }
})