export interface ChannelMessage {
  to: string
  subject?: string
  body: string
  htmlBody?: string
  data?: any
}

export interface ChannelResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface Channel {
  type: 'PUSH' | 'EMAIL' | 'SMS' | 'IN_APP'
  send(msg: ChannelMessage): Promise<ChannelResult>
}
