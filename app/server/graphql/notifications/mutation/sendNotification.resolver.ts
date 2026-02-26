import * as tables from '#server/database/schema'
import { addSendNotificationJob } from '#server/queues/notification.queue'
import { useDatabase } from '#server/utils/useDatabase'
import { and, eq, inArray } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'

export const notificationMutations = defineMutation({
  sendNotification: {
    resolve: async (_parent, { input }, ctx) => {
      const db = useDatabase()

      // Create notification record immediately so the caller has an ID to track
      const [insertedNotification] = await db
        .insert(tables.notification)
        .values({
          appId: input.appId as string,
          title: input.title as string,
          body: input.body as string,
          data: input.data as any,
          imageUrl: input.imageUrl as string | undefined,
          clickAction: input.clickAction as string | undefined,
          sound: input.sound as string | undefined,
          badge: input.badge as number | undefined,
          status: (input.scheduledAt ? 'SCHEDULED' : 'PENDING') as 'SCHEDULED' | 'PENDING',
          scheduledAt: input.scheduledAt as string | undefined,
          totalTargets: 0,
          totalSent: 0,
          totalDelivered: 0,
          totalFailed: 0,
          totalClicked: 0,
        })
        .returning()

      if (!insertedNotification) {
        throw new Error('Failed to create notification record')
      }

      // Scheduled notifications are handled by the scheduler plugin
      if (input.scheduledAt) {
        return insertedNotification
      }

      const channelType = input.channelType as string | undefined

      // ── Channel-based delivery (EMAIL, SMS, DISCORD, IN_APP) ──────────────
      if (channelType && channelType !== 'PUSH') {
        const appId = input.appId as string
        const channelId = input.channelId as string | undefined
        const contactIds = input.contactIds as string[] | undefined

        const payload = {
          title: input.title as string,
          body: input.body as string,
          data: input.data as Record<string, any> | undefined,
        }

        if (channelType === 'DISCORD' || channelType === 'TELEGRAM') {
          // Discord/Telegram — single destination, no contact required
          const resolvedChannelId = channelId ?? await resolveChannelId(db, appId, channelType)

          await addSendNotificationJob({
            deliveryMode: 'channel',
            notificationId: insertedNotification.id,
            appId,
            channelId: resolvedChannelId,
            to: '',
            channelType: channelType as 'DISCORD' | 'TELEGRAM',
            payload,
          })

          await db
            .update(tables.notification)
            .set({ totalTargets: 1, status: 'SENT', sentAt: new Date().toISOString() })
            .where(eq(tables.notification.id, insertedNotification.id))

          return { ...insertedNotification, totalTargets: 1, status: 'SENT' }
        }

        // For EMAIL, SMS, IN_APP — resolve contacts
        let contacts: Array<typeof tables.contact.$inferSelect>

        if (contactIds && contactIds.length > 0) {
          contacts = await db
            .select()
            .from(tables.contact)
            .where(inArray(tables.contact.id, contactIds))
        }
        else {
          contacts = await db
            .select()
            .from(tables.contact)
            .where(eq(tables.contact.appId, appId))
        }

        const resolvedChannelId = channelId ?? await resolveChannelId(db, appId, channelType as 'EMAIL' | 'SMS' | 'IN_APP')

        const jobs = contacts
          .map((c) => {
            const to = channelType === 'EMAIL'
              ? c.email
              : channelType === 'SMS'
                ? c.phone
                : c.id // IN_APP uses contactId

            if (!to)
              return null

            return addSendNotificationJob({
              deliveryMode: 'channel',
              notificationId: insertedNotification.id,
              appId,
              channelId: resolvedChannelId,
              to,
              channelType: channelType as 'EMAIL' | 'SMS' | 'IN_APP',
              payload,
            })
          })
          .filter(Boolean)

        await Promise.all(jobs)

        await db
          .update(tables.notification)
          .set({ totalTargets: jobs.length, status: 'SENT', sentAt: new Date().toISOString() })
          .where(eq(tables.notification.id, insertedNotification.id))

        return { ...insertedNotification, totalTargets: jobs.length, status: 'SENT' }
      }

      // ── Device-based push delivery ─────────────────────────────────────────
      let targetDevices: Array<{ id: string, appId: string, token: string, platform: string, webPushP256dh: string | null, webPushAuth: string | null }>

      if (input.targetDevices && (input.targetDevices as string[]).length > 0) {
        targetDevices = await db
          .select()
          .from(tables.device)
          .where(inArray(tables.device.token, input.targetDevices as string[]))
      }
      else {
        const conditions = [eq(tables.device.appId, input.appId as string)]

        if (input.platforms && (input.platforms as string[]).length > 0) {
          conditions.push(inArray(tables.device.platform, input.platforms as any))
        }

        targetDevices = await db
          .select()
          .from(tables.device)
          .where(and(...conditions))
      }

      // Update target count before queuing
      await db
        .update(tables.notification)
        .set({ totalTargets: targetDevices.length })
        .where(eq(tables.notification.id, insertedNotification.id))

      // Enqueue one job per device
      await Promise.all(
        targetDevices.map(device =>
          addSendNotificationJob({
            deliveryMode: 'device',
            notificationId: insertedNotification.id,
            deviceId: device.id,
            appId: input.appId as string,
            platform: device.platform.toLowerCase() as 'ios' | 'android' | 'web',
            token: device.token,
            webPushP256dh: device.webPushP256dh ?? undefined,
            webPushAuth: device.webPushAuth ?? undefined,
            payload: {
              title: input.title as string,
              body: input.body as string,
              data: input.data as Record<string, any> | undefined,
              badge: input.badge as number | undefined,
              sound: input.sound as string | undefined,
              clickAction: input.clickAction as string | undefined,
              imageUrl: input.imageUrl as string | undefined,
            },
          }),
        ),
      )

      return {
        ...insertedNotification,
        totalTargets: targetDevices.length,
      }
    },
  },
})

async function resolveChannelId(
  db: ReturnType<typeof import('#server/utils/useDatabase').useDatabase>,
  appId: string,
  type: string,
): Promise<string> {
  const rows = await db
    .select()
    .from(tables.channel)
    .where(
      and(
        eq(tables.channel.appId, appId),
        eq(tables.channel.type, type as any),
        eq(tables.channel.isActive, true),
      ),
    )
    .limit(1)

  if (!rows[0]) {
    throw new Error(`No active ${type} channel configured for app ${appId}`)
  }

  return rows[0].id
}
