export const registerDeviceMutation = defineMutation({
  registerDevice: {
    resolve: async (_parent, { input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      // Validate and clean FCM token
      let cleanToken = input.token.trim()

      // Remove any spaces from the token (common copy/paste issue)
      if (input.platform === 'ANDROID' || input.platform === 'IOS') {
        cleanToken = cleanToken.replace(/\s+/g, '')

        // Basic FCM token validation
        if (cleanToken.length < 140 || cleanToken.length > 200) {
          throw createError({
            statusCode: 400,
            message: `Invalid FCM token length: ${cleanToken.length}. Expected 140-200 characters.`,
          })
        }

        // FCM tokens should not contain spaces or special characters except - and _
        if (!/^[\w-]+$/.test(cleanToken)) {
          throw createError({
            statusCode: 400,
            message: 'Invalid FCM token format. Token contains invalid characters.',
          })
        }
      }

      const newDevice = await db
        .insert(tables.device)
        .values({
          appId: input.appId,
          token: cleanToken,
          platform: input.platform,
          status: 'ACTIVE',
          userId: input.userId,
          metadata: input.metadata,
          lastSeenAt: new Date().toISOString(),
        })
        .returning()

      return newDevice[0]
    },
  },
})
