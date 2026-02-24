import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'
import { and, eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'

export const subscriberMutations = defineMutation({
  createContact: {
    resolve: async (_parent, { input }, _ctx) => {
      const db = useDatabase()

      const [row] = await db
        .insert(tables.contact)
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
        throw new Error('Failed to create contact')
      return row
    },
  },

  updateContact: {
    resolve: async (_parent, { id, input }, _ctx) => {
      const db = useDatabase()

      const [row] = await db
        .update(tables.contact)
        .set({
          ...(input.email !== undefined ? { email: input.email as string } : {}),
          ...(input.phone !== undefined ? { phone: input.phone as string } : {}),
          ...(input.locale !== undefined ? { locale: input.locale as string } : {}),
          ...(input.metadata !== undefined ? { metadata: input.metadata as any } : {}),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tables.contact.id, id as string))
        .returning()

      if (!row)
        throw new Error('Contact not found')
      return row
    },
  },

  deleteContact: {
    resolve: async (_parent, { id }, _ctx) => {
      const db = useDatabase()
      await db.delete(tables.contact).where(eq(tables.contact.id, id as string))
      return true
    },
  },

  upsertContactDevice: {
    resolve: async (_parent, { input }, _ctx) => {
      const db = useDatabase()

      // Check if already linked
      const existing = await db
        .select()
        .from(tables.contactDevice)
        .where(
          and(
            eq(tables.contactDevice.subscriberId, input.subscriberId as string),
            eq(tables.contactDevice.deviceId, input.deviceId as string),
          ),
        )
        .limit(1)

      if (!existing[0]) {
        await db.insert(tables.contactDevice).values({
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

  updateContactPreference: {
    resolve: async (_parent, { input }, _ctx) => {
      const db = useDatabase()

      const existing = await db
        .select()
        .from(tables.contactPreference)
        .where(
          and(
            eq(tables.contactPreference.subscriberId, input.subscriberId as string),
            eq(tables.contactPreference.category, input.category as string),
            eq(tables.contactPreference.channelType, input.channelType as any),
          ),
        )
        .limit(1)

      if (existing[0]) {
        const [row] = await db
          .update(tables.contactPreference)
          .set({ enabled: input.enabled as boolean, updatedAt: new Date().toISOString() })
          .where(eq(tables.contactPreference.id, existing[0].id))
          .returning()
        return row!
      }

      const [row] = await db
        .insert(tables.contactPreference)
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
