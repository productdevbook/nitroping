<script setup lang="ts">
import type { NodeProps } from '@vue-flow/core'
import { Handle, Position } from '@vue-flow/core'

defineProps<NodeProps>()

const channelIcons: Record<string, string> = {
  EMAIL: '✉️',
  PUSH: '🔔',
  SMS: '💬',
  IN_APP: '📱',
}
</script>

<template>
  <div class="bg-white border-2 border-blue-400 rounded-xl px-4 py-3 min-w-[160px] shadow-sm">
    <Handle type="target" :position="Position.Top" />
    <div class="flex items-center gap-2">
      <span class="text-lg">{{ channelIcons[data?.channelType] || '📨' }}</span>
      <div>
        <p class="text-xs font-semibold text-blue-700 uppercase tracking-wide">
          Send
        </p>
        <p class="text-sm font-medium text-gray-900">
          {{ data?.label || data?.templateName || 'Message' }}
        </p>
      </div>
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>
