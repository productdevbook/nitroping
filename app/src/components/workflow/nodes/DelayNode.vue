<script setup lang="ts">
import type { NodeProps } from '@vue-flow/core'
import { Handle, Position } from '@vue-flow/core'

defineProps<NodeProps>()

function formatDelay(ms: number): string {
  if (!ms)
    return '0s'
  const secs = Math.floor(ms / 1000)
  if (secs < 60)
    return `${secs}s`
  const mins = Math.floor(secs / 60)
  if (mins < 60)
    return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24)
    return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}
</script>

<template>
  <div class="bg-amber-50 border-2 border-amber-400 rounded-xl px-4 py-3 min-w-[160px] shadow-sm">
    <Handle type="target" :position="Position.Top" />
    <div class="flex items-center gap-2">
      <span class="text-lg">⏱</span>
      <div>
        <p class="text-xs font-semibold text-amber-700 uppercase tracking-wide">
          Delay
        </p>
        <p class="text-sm font-medium text-amber-900">
          {{ formatDelay(data?.delayMs) }}
        </p>
      </div>
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>
