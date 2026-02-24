import { and, eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'

export const subscriberMutations = defineMutation({
  createSubscriber: {
    resolve: async (_parent, { input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const [row] = await db
        .insert(tables.subscriber)
        .values({
          appId: input.appId as string,
          externalId: input.externalId as string,
          email: input.email as string | undefined,
          phone: input.phone as string | undefined,
          locale: input.locale as string | undefined,
          metadata: input.metadata as any,
        })
        .returning()

      if (!row)
        throw new Error('Failed to create subscriber')
      return row
    },
  },

  updateSubscriber: {
    resolve: async (_parent, { id, input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const [row] = await db
        .update(tables.subscriber)
        .set({
          ...(input.email !== undefined ? { email: input.email as string } : {}),
          ...(input.phone !== undefined ? { phone: input.phone as string } : {}),
          ...(input.locale !== undefined ? { locale: input.locale as string } : {}),
          ...(input.metadata !== undefined ? { metadata: input.metadata as any } : {}),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tables.subscriber.id, id as string))
        .returning()

      if (!row)
        throw new Error('Subscriber not found')
      return row
    },
  },

  deleteSubscriber: {
    resolve: async (_parent, { id }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()
      await db.delete(tables.subscriber).where(eq(tables.subscriber.id, id as string))
      return true
    },
  },

  upsertSubscriberDevice: {
    resolve: async (_parent, { input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      // Check if already linked
      const existing = await db
        .select()
        .from(tables.subscriberDevice)
        .where(
          and(
            eq(tables.subscriberDevice.subscriberId, input.subscriberId as string),
            eq(tables.subscriberDevice.deviceId, input.deviceId as string),
          ),
        )
        .limit(1)

      if (!existing[0]) {
        await db.insert(tables.subscriberDevice).values({
          subscriberId: input.subscriberId as string,
          deviceId: input.deviceId as string,
        })

        // Also update device.subscriberId for convenience
        await db
          .update(tables.device)
          .set({ subscriberId: input.subscriberId as string })
          .where(eq(tables.device.id, input.deviceId as string))
      }

      return true
    },
  },

  updateSubscriberPreference: {
    resolve: async (_parent, { input }, { context }) => {
      const { useDatabase, tables } = context
      const db = useDatabase()

      const existing = await db
        .select()
        .from(tables.subscriberPreference)
        .where(
          and(
            eq(tables.subscriberPreference.subscriberId, input.subscriberId as string),
            eq(tables.subscriberPreference.category, input.category as string),
            eq(tables.subscriberPreference.channelType, input.channelType as any),
          ),
        )
        .limit(1)

      if (existing[0]) {
        const [row] = await db
          .update(tables.subscriberPreference)
          .set({ enabled: input.enabled as boolean, updatedAt: new Date().toISOString() })
          .where(eq(tables.subscriberPreference.id, existing[0].id))
          .returning()
        return row!
      }

      const [row] = await db
        .insert(tables.subscriberPreference)
        .values({
          subscriberId: input.subscriberId as string,
          category: input.category as string,
          channelType: input.channelType as any,
          enabled: input.enabled as boolean,
        })
        .returning()

      return row!
    },
  },
})
