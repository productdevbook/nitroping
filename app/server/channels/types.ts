import type { ChannelType } from '#server/database/schema/enums'

export type { ChannelType }

export interface ChannelMessage {
  to: string
  subject?: string
  body: string
  htmlBody?: string
  data?: any
  /** deliveryLog UUID — used by email channel to embed tracking pixel & wrap links */
  trackingId?: string
  /** Fully-qualified base URL, e.g. https://app.example.com */
  trackingBaseUrl?: string
}

export interface ChannelResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface Channel {
  type: ChannelType
  send: (msg: ChannelMessage) => Promise<ChannelResult>
}
