<script setup lang="ts">
import type { NodeProps } from '@vue-flow/core'
import type { DelayNodeData } from '../types'
import { Handle, Position } from '@vue-flow/core'
import { Badge } from '~/components/ui/badge'

defineProps<NodeProps<DelayNodeData>>()

function fmt(ms: number): string {
  if (!ms)
    return '—'
  const s = ms / 1000
  if (s < 60)
    return `${s}s`
  const m = s / 60
  if (m < 60)
    return `${m}m`
  const h = m / 60
  if (h < 24)
    return `${h}h`
  return `${Math.floor(h / 24)}d`
}
</script>

<template>
  <div class="relative min-w-[220px]">
    <Handle
      type="target"
      :position="Position.Left"
      class="!w-3.5 !h-3.5 !rounded-full !bg-white !border-2 !border-amber-400 hover:!border-amber-600 hover:!scale-125 !transition-all"
    />

    <div class="rounded-xl border border-l-[3px] border-l-amber-500 bg-card shadow-sm px-4 py-3 flex items-center gap-3">
      <div class="size-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-xl leading-none">
        ⏱
      </div>
      <div class="min-w-0 flex-1 space-y-0.5">
        <Badge variant="secondary" class="text-[10px] h-4 px-1.5 uppercase tracking-wider font-semibold text-amber-700 bg-amber-100 border-0">
          Delay
        </Badge>
        <p class="text-sm font-semibold text-card-foreground truncate leading-tight">
          {{ data.label || fmt(data.delayMs) }}
        </p>
      </div>
    </div>

    <Handle
      type="source"
      :position="Position.Right"
      class="!w-3.5 !h-3.5 !rounded-full !bg-white !border-2 !border-amber-400 hover:!border-amber-600 hover:!scale-125 !transition-all"
    />
  </div>
</template>
