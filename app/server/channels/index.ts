import type { Channel } from './types'
import type { ChannelType } from '#server/database/schema/enums'
import { getDatabase } from '#server/database/connection'
import * as tables from '#server/database/schema'
import { decryptSensitiveData, isDataEncrypted } from '#server/utils/crypto'
import { and, eq } from 'drizzle-orm'
import { DiscordChannel } from './discord.channel'
import { EmailChannel } from './email.channel'
import { InAppChannel } from './inapp.channel'
import { SmsChannel } from './sms.channel'
import { TelegramChannel } from './telegram.channel'

export { DiscordChannel } from './discord.channel'
export { EmailChannel } from './email.channel'
export { InAppChannel } from './inapp.channel'
export { PushChannel } from './push.channel'
export { SmsChannel } from './sms.channel'
export { TelegramChannel } from './telegram.channel'
export type { Channel, ChannelMessage, ChannelResult } from './types'

/**
 * Load a channel by its DB id and return a ready-to-use Channel instance.
 */
export async function getChannelById(channelId: string): Promise<Channel> {
  const db = getDatabase()

  const rows = await db
    .select()
    .from(tables.channel)
    .where(eq(tables.channel.id, channelId))
    .limit(1)

  if (!rows[0]) {
    throw new Error(`Channel not found: ${channelId}`)
  }

  return buildChannel(rows[0])
}

/**
 * Load the first active channel of a given type for an app.
 */
export async function getChannelForApp(
  appId: string,
  type: ChannelType,
): Promise<Channel> {
  const db = getDatabase()

  const rows = await db
    .select()
    .from(tables.channel)
    .where(
      and(
        eq(tables.channel.appId, appId),
        eq(tables.channel.type, type),
        eq(tables.channel.isActive, true),
      ),
    )
    .limit(1)

  if (!rows[0]) {
    throw new Error(`No active ${type} channel configured for app ${appId}`)
  }

  return buildChannel(rows[0])
}

function buildChannel(row: typeof tables.channel.$inferSelect): Channel {
  const rawConfig = row.config as any

  switch (row.type) {
    case 'EMAIL': {
      if (!rawConfig) {
        throw new Error('Email channel is missing config')
      }

      const config = { ...rawConfig }
      if (config.pass && isDataEncrypted(config.pass)) {
        config.pass = decryptSensitiveData(config.pass)
      }
      if (config.apiKey && isDataEncrypted(config.apiKey)) {
        config.apiKey = decryptSensitiveData(config.apiKey)
      }

      return new EmailChannel(config)
    }

    case 'DISCORD': {
      if (!rawConfig) {
        throw new Error('Discord channel is missing config')
      }

      const config = { ...rawConfig }
      if (config.webhookUrl && isDataEncrypted(config.webhookUrl)) {
        config.webhookUrl = decryptSensitiveData(config.webhookUrl)
      }

      return new DiscordChannel(config)
    }

    case 'SMS': {
      if (!rawConfig) {
        throw new Error('SMS channel is missing config')
      }

      const config = { ...rawConfig }
      if (config.accountSid && isDataEncrypted(config.accountSid)) {
        config.accountSid = decryptSensitiveData(config.accountSid)
      }
      if (config.authToken && isDataEncrypted(config.authToken)) {
        config.authToken = decryptSensitiveData(config.authToken)
      }

      return new SmsChannel(config)
    }

    case 'IN_APP': {
      const config = rawConfig ?? {}
      // appId comes from the channel row itself
      if (!config.appId) {
        config.appId = row.appId
      }

      return new InAppChannel(config)
    }

    case 'TELEGRAM': {
      if (!rawConfig) {
        throw new Error('Telegram channel is missing config')
      }

      const config = { ...rawConfig }
      if (config.botToken && isDataEncrypted(config.botToken)) {
        config.botToken = decryptSensitiveData(config.botToken)
      }

      return new TelegramChannel(config)
    }

    default:
      throw new Error(`Cannot instantiate channel of type ${row.type} via this factory`)
  }
}
