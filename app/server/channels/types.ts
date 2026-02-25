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
  type: 'PUSH' | 'EMAIL' | 'SMS' | 'IN_APP' | 'DISCORD'
  send: (msg: ChannelMessage) => Promise<ChannelResult>
}
