export type ChannelType = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP' | 'DISCORD' | 'TELEGRAM'
export type FilterOperator = 'eq' | 'neq' | 'contains'

export interface TriggerNodeData {
  label: string
  triggerIdentifier: string
}

export interface SendNodeData {
  channelType: ChannelType
  label: string
  channelId?: string
  templateId?: string
  templateName?: string
}

export interface DelayNodeData {
  label: string
  delayMs: number
}

export interface FilterNodeData {
  label: string
  field?: string
  operator?: FilterOperator
  value?: string
}

export type WorkflowNodeData = TriggerNodeData | SendNodeData | DelayNodeData | FilterNodeData

export interface WorkflowStep {
  nodeId: string
  type: 'SEND' | 'DELAY' | 'FILTER' | 'DIGEST' | 'BRANCH'
  order: number
  config: WorkflowNodeData
}
