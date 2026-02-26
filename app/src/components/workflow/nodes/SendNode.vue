<script setup lang="ts">
import type { NodeProps } from '@vue-flow/core'
import type { ChannelType, SendNodeData } from '../types'
import { Handle, Position } from '@vue-flow/core'
import { Badge } from '~/components/ui/badge'

defineProps<NodeProps<SendNodeData>>()

const icons: Record<ChannelType, string> = {
  EMAIL: '✉️',
  SMS: '💬',
  PUSH: '🔔',
  IN_APP: '📱',
  DISCORD: '🎮',
  TELEGRAM: '✈️',
}

const style: Record<ChannelType, { accent: string, icon: string, badge: string }> = {
  EMAIL: { accent: 'border-l-blue-500', icon: 'bg-blue-100', badge: 'text-blue-700 bg-blue-100' },
  SMS: { accent: 'border-l-green-500', icon: 'bg-green-100', badge: 'text-green-700 bg-green-100' },
  PUSH: { accent: 'border-l-purple-500', icon: 'bg-purple-100', badge: 'text-purple-700 bg-purple-100' },
  IN_APP: { accent: 'border-l-orange-500', icon: 'bg-orange-100', badge: 'text-orange-700 bg-orange-100' },
  DISCORD: { accent: 'border-l-indigo-500', icon: 'bg-indigo-100', badge: 'text-indigo-700 bg-indigo-100' },
  TELEGRAM: { accent: 'border-l-cyan-500', icon: 'bg-cyan-100', badge: 'text-cyan-700 bg-cyan-100' },
}

const handles: Record<ChannelType, string> = {
  EMAIL: '!border-blue-400 hover:!border-blue-600',
  SMS: '!border-green-400 hover:!border-green-600',
  PUSH: '!border-purple-400 hover:!border-purple-600',
  IN_APP: '!border-orange-400 hover:!border-orange-600',
  DISCORD: '!border-indigo-400 hover:!border-indigo-600',
  TELEGRAM: '!border-cyan-400 hover:!border-cyan-600',
}

const fallbackStyle = { accent: 'border-l-blue-500', icon: 'bg-blue-100', badge: 'text-blue-700 bg-blue-100' }
const fallbackHandle = '!border-blue-400 hover:!border-blue-600'
</script>

<template>
  <div class="relative min-w-[220px]">
    <Handle
      type="target"
      :position="Position.Left"
      class="!w-3.5 !h-3.5 !rounded-full !bg-white !border-2 hover:!scale-125 !transition-all"
      :class="handles[data.channelType] ?? fallbackHandle"
    />

    <div
      class="rounded-xl border border-l-[3px] bg-card shadow-sm px-4 py-3 flex items-center gap-3"
      :class="(style[data.channelType] ?? fallbackStyle).accent"
    >
      <div
        class="size-9 rounded-lg flex items-center justify-center shrink-0 text-xl leading-none"
        :class="(style[data.channelType] ?? fallbackStyle).icon"
      >
        {{ icons[data.channelType] ?? '📨' }}
      </div>

      <div class="min-w-0 flex-1 space-y-0.5">
        <Badge
          variant="secondary"
          class="text-[10px] h-4 px-1.5 uppercase tracking-wider font-semibold border-0"
          :class="(style[data.channelType] ?? fallbackStyle).badge"
        >
          {{ data.channelType?.toLowerCase() ?? 'send' }}
        </Badge>
        <p class="text-sm font-semibold text-card-foreground truncate leading-tight">
          {{ data.label || data.templateName || 'Configure…' }}
        </p>
      </div>
    </div>

    <Handle
      type="source"
      :position="Position.Right"
      class="!w-3.5 !h-3.5 !rounded-full !bg-white !border-2 hover:!scale-125 !transition-all"
      :class="handles[data.channelType] ?? fallbackHandle"
    />
  </div>
</template>
