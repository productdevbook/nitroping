import { eq, inArray } from 'drizzle-orm'
import { getProviderForApp } from '~~/server/providers'

export const notificationMutations = defineMutation({
  sendNotification: {
    resolve: async (_parent, { input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()
      // Create notification record
      const newNotification = await db
        .insert(tables.notification)
        .values({
          appId: input.appId,
          title: input.title,
          body: input.body,
          data: input.data,
          imageUrl: input.imageUrl,
          clickAction: input.clickAction,
          sound: input.sound,
          badge: input.badge,
          status: input.scheduledAt ? 'SCHEDULED' : 'PENDING',
          scheduledAt: input.scheduledAt,
          totalTargets: 0, // Will be calculated
          totalSent: 0,
          totalDelivered: 0,
          totalFailed: 0,
          totalClicked: 0,
        })
        .returning()

      // Get target devices
      let targetDevices = []

      if (input.targetDevices && input.targetDevices.length > 0) {
        // Specific devices
        targetDevices = await db
          .select()
          .from(tables.device)
          .where(inArray(tables.device.token, input.targetDevices))
      }
      else {
        // All devices for app (optionally filtered by platform)
        let query = db
          .select()
          .from(tables.device)
          .where(eq(tables.device.appId, input.appId))

        if (input.platforms && input.platforms.length > 0) {
          query = query.where(inArray(tables.device.platform, input.platforms))
        }

        targetDevices = await query
      }

      // Update notification with target count
      await db
        .update(tables.notification)
        .set({ totalTargets: targetDevices.length })
        .where(eq(tables.notification.id, newNotification[0].id))

      // Send notifications to devices
      let totalSent = 0
      let totalFailed = 0
      const deliveryLogs: Array<typeof tables.deliveryLog.$inferInsert> = []

      if (!input.scheduledAt && targetDevices.length > 0) {
        // Group devices by platform for efficient sending
        const devicesByPlatform = targetDevices.reduce((acc: Record<string, any[]>, device: any) => {
          const platform = device.platform.toLowerCase() as 'ios' | 'android' | 'web'
          if (!acc[platform])
            acc[platform] = []
          acc[platform].push(device)
          return acc
        }, {} as Record<string, any[]>)

        // Send to each platform
        for (const [platform, devices] of Object.entries(devicesByPlatform)) {
          try {
            const provider = await getProviderForApp(input.appId, platform as 'ios' | 'android' | 'web')

            for (const device of (devices as any[])) {
              try {
                const message = provider.convertNotificationPayload({
                  title: input.title,
                  body: input.body,
                  data: input.data ? JSON.parse(input.data) : undefined,
                  badge: input.badge,
                  sound: input.sound,
                  clickAction: input.clickAction,
                }, device.token, newNotification[0].id, device.id)

                const result = await (provider as any).sendMessage(message)

                if (result.success) {
                  totalSent++
                }
                else {
                  totalFailed++
                  console.error(`[Notification] Failed to send to device ${device.id}:`, result.error)
                }

                // Create delivery log
                deliveryLogs.push({
                  notificationId: newNotification[0].id,
                  deviceId: device.id,
                  status: result.success ? ('SENT' as const) : ('FAILED' as const),
                  errorMessage: result.error,
                  providerResponse: { messageId: result.messageId },
                  sentAt: result.success ? new Date().toISOString() : null,
                })
              }
              catch (deviceError) {
                totalFailed++
                console.error(`[Notification] Device error for ${device.id}:`, deviceError)
                deliveryLogs.push({
                  notificationId: newNotification[0].id,
                  deviceId: device.id,
                  status: 'FAILED' as const,
                  errorMessage: deviceError instanceof Error ? deviceError.message : 'Unknown error',
                  sentAt: null,
                })
              }
            }
          }
          catch (providerError) {
            // Provider creation failed, mark all devices for this platform as failed
            totalFailed += (devices as any[]).length
            console.error(`[Notification] Provider error for platform ${platform}:`, providerError)
            for (const device of (devices as any[])) {
              deliveryLogs.push({
                notificationId: newNotification[0].id,
                deviceId: device.id,
                status: 'FAILED' as const,
                errorMessage: `Provider error: ${providerError instanceof Error ? providerError.message : 'Unknown provider error'}`,
                sentAt: null,
              })
            }
          }
        }

        // Insert delivery logs
        if (deliveryLogs.length > 0) {
          await db.insert(tables.deliveryLog).values(deliveryLogs)
        }

        // Update notification statistics
        await db
          .update(tables.notification)
          .set({
            totalSent,
            totalFailed,
            status: 'SENT',
            sentAt: new Date().toISOString(),
          })
          .where(eq(tables.notification.id, newNotification[0].id))
      }

      return {
        ...newNotification[0],
        totalTargets: targetDevices.length,
        totalSent,
        totalFailed,
      }
    },
  },
})
