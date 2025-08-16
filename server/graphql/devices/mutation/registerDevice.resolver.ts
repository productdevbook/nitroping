export const registerDeviceMutation = defineMutation({
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
          lastSeenAt: new Date(),
        })
        .returning()

      return newDevice[0]
    },
  },
})
