import * as tables from '#server/database/schema'
import { useDatabase } from '#server/utils/useDatabase'
import { and, eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'

const KNOWN_KEYS = ['name', 'email', 'phone', 'locale'] as const

function extractKnownFields(metadata: Record<string, any> | null | undefined) {
  const known: Partial<Record<typeof KNOWN_KEYS[number], any>> = {}
  const remaining: Record<string, any> = {}

  for (const [k, v] of Object.entries(metadata ?? {})) {
    if ((KNOWN_KEYS as readonly string[]).includes(k)) {
      (known as any)[k] = v
    }
    else {
      remaining[k] = v
    }
  }
  return { known, remaining }
}

export const subscriberMutations = defineMutation({
  createContact: {
    resolve: async (_parent, { input }, ctx) => {
      const db = useDatabase()

      const { known, remaining } = extractKnownFields(input.metadata as Record<string, any> | undefined)

      const [row] = await db
        .insert(tables.contact)
        .values({
          appId: input.appId as string,
          externalId: input.externalId as string,
          name: (input.name as string | undefined) ?? known.name ?? undefined,
          email: (input.email as string | undefined) ?? known.email ?? undefined,
          phone: (input.phone as string | undefined) ?? known.phone ?? undefined,
          locale: (input.locale as string | undefined) ?? known.locale ?? undefined,
          metadata: Object.keys(remaining).length > 0 ? remaining : (input.metadata as any),
        })
        .returning()

      if (!row)
        throw new Error('Failed to create contact')
      return row
    },
  },

  updateContact: {
    resolve: async (_parent, { id, input }, ctx) => {
      const db = useDatabase()

      const { known, remaining } = extractKnownFields(input.metadata as Record<string, any> | undefined)

      const updates: Record<string, any> = { updatedAt: new Date().toISOString() }

      if (input.name !== undefined)
        updates.name = input.name as string
      else if (known.name !== undefined)
        updates.name = known.name

      if (input.email !== undefined)
        updates.email = input.email as string
      else if (known.email !== undefined)
        updates.email = known.email

      if (input.phone !== undefined)
        updates.phone = input.phone as string
      else if (known.phone !== undefined)
        updates.phone = known.phone

      if (input.locale !== undefined)
        updates.locale = input.locale as string
      else if (known.locale !== undefined)
        updates.locale = known.locale

      if (input.metadata !== undefined) {
        updates.metadata = Object.keys(remaining).length > 0 ? remaining : (input.metadata as any)
      }

      const [row] = await db
        .update(tables.contact)
        .set(updates)
        .where(eq(tables.contact.id, id as string))
        .returning()

      if (!row)
        throw new Error('Contact not found')
      return row
    },
  },

  deleteContact: {
    resolve: async (_parent, { id }, ctx) => {
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
