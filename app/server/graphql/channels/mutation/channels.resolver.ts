import * as tables from '#server/database/schema'
import { encryptSensitiveData } from '#server/utils/crypto'
import { useDatabase } from '#server/utils/useDatabase'
import { eq } from 'drizzle-orm'
import { defineMutation } from 'nitro-graphql/define'

function encryptChannelConfig(config: any): any {
  if (!config)
    return config
  const encrypted = { ...config }
  // Encrypt sensitive fields
  if (encrypted.pass)
    encrypted.pass = encryptSensitiveData(String(encrypted.pass))
  if (encrypted.apiKey)
    encrypted.apiKey = encryptSensitiveData(String(encrypted.apiKey))
  // Discord
  if (encrypted.webhookUrl)
    encrypted.webhookUrl = encryptSensitiveData(String(encrypted.webhookUrl))
  // Telegram
  if (encrypted.botToken)
    encrypted.botToken = encryptSensitiveData(String(encrypted.botToken))
  // SMS / Twilio
  if (encrypted.accountSid)
    encrypted.accountSid = encryptSensitiveData(String(encrypted.accountSid))
  if (encrypted.authToken)
    encrypted.authToken = encryptSensitiveData(String(encrypted.authToken))
  return encrypted
}

export const channelMutations = defineMutation({
  createChannel: {
    resolve: async (_parent, { input }, _ctx) => {
      const db = useDatabase()

      const config = encryptChannelConfig(input.config as any)

      const [row] = await db
        .insert(tables.channel)
        .values({
          appId: input.appId as string,
          name: input.name as string,
          type: input.type as any,
          config,
        })
        .returning()

      if (!row)
        throw new Error('Failed to create channel')

      // Never expose config
      return { ...row, config: null }
    },
  },

  updateChannel: {
    resolve: async (_parent, { id, input }, _ctx) => {
      const db = useDatabase()

      const updates: any = { updatedAt: new Date().toISOString() }
      if (input.name !== undefined)
        updates.name = input.name
      if (input.isActive !== undefined)
        updates.isActive = input.isActive
      if (input.config !== undefined)
        updates.config = encryptChannelConfig(input.config as any)

      const [row] = await db
        .update(tables.channel)
        .set(updates)
        .where(eq(tables.channel.id, id as string))
        .returning()

      if (!row)
        throw new Error('Channel not found')

      return { ...row, config: null }
    },
  },

  deleteChannel: {
    resolve: async (_parent, { id }, _ctx) => {
      const db = useDatabase()
      await db.delete(tables.channel).where(eq(tables.channel.id, id as string))
      return true
    },
  },
})
