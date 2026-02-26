import type { Channel, ChannelMessage, ChannelResult } from './types'
import { getDatabase } from '#server/database/connection'
import * as tables from '#server/database/schema'

export interface InAppConfig {
  appId: string
}

export class InAppChannel implements Channel {
  readonly type = 'IN_APP' as const

  constructor(private readonly config: InAppConfig) {}

  async send(msg: ChannelMessage): Promise<ChannelResult> {
    try {
      const db = getDatabase()

      await db.insert(tables.inAppMessage).values({
        appId: this.config.appId,
        contactId: msg.to,
        title: msg.subject ?? msg.body.substring(0, 80),
        body: msg.body,
        data: msg.data,
      })

      return { success: true }
    }
    catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
