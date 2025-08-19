export const registerDeviceMutation = defineMutation({
  registerDevice: {
    resolve: async (_parent, { input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      // Validate and clean push token based on platform
      let cleanToken = input.token.trim()

      // Remove any spaces from the token (common copy/paste issue)
      cleanToken = cleanToken.replace(/\s+/g, '')

      // Platform-specific token validation
      if (input.platform === 'IOS') {
        // APNS token validation (64 characters, hex string)
        if (cleanToken.length !== 64) {
          throw createError({
            statusCode: 400,
            message: `Invalid APNS token length: ${cleanToken.length}. Expected 64 characters.`,
          })
        }

        // APNS tokens are hex strings
        if (!/^[0-9a-f]+$/i.test(cleanToken)) {
          throw createError({
            statusCode: 400,
            message: 'Invalid APNS token format. Token should be a 64-character hex string.',
          })
        }
      }
      else if (input.platform === 'ANDROID') {
        // FCM token validation for Android
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
      else if (input.platform === 'WEB') {
        // Web push endpoint validation - should be a valid URL
        try {
          const url = new URL(cleanToken)
          if (!['http:', 'https:'].includes(url.protocol)) {
            throw createError({
              statusCode: 400,
              message: 'Web push endpoint must be a valid HTTP/HTTPS URL.',
            })
          }
        }
        catch {
          throw createError({
            statusCode: 400,
            message: 'Invalid web push endpoint URL format.',
          })
        }
      }

      // Use upsert with ON CONFLICT to handle unique constraint
      const device = await db
        .insert(tables.device)
        .values({
          appId: input.appId,
          token: cleanToken,
          category: input.category,
          platform: input.platform,
          status: 'ACTIVE',
          userId: input.userId,
          metadata: input.metadata,
          lastSeenAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: [tables.device.appId, tables.device.token, tables.device.userId],
          set: {
            category: input.category,
            metadata: input.metadata,
            status: 'ACTIVE',
            lastSeenAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })
        .returning()

      return device[0]
    },
  },
})
