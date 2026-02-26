<script setup lang="ts">
import type { NodeProps } from '@vue-flow/core'
import type { FilterNodeData } from '../types'
import { Handle, Position } from '@vue-flow/core'
import { Badge } from '~/components/ui/badge'

defineProps<NodeProps<FilterNodeData>>()
</script>

<template>
  <div class="relative min-w-[220px]">
    <Handle
      type="target"
      :position="Position.Left"
      class="!w-3.5 !h-3.5 !rounded-full !bg-white !border-2 !border-teal-400 hover:!border-teal-600 hover:!scale-125 !transition-all"
    />

    <div class="rounded-xl border border-l-[3px] border-l-teal-500 bg-card shadow-sm px-4 py-3 flex items-center gap-3">
      <div class="size-9 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 text-xl leading-none">
        🔀
      </div>
      <div class="min-w-0 flex-1 space-y-0.5">
        <Badge variant="secondary" class="text-[10px] h-4 px-1.5 uppercase tracking-wider font-semibold text-teal-700 bg-teal-100 border-0">
          Filter
        </Badge>
        <p class="text-sm font-semibold text-card-foreground truncate leading-tight">
          {{ data.label || 'Set condition…' }}
        </p>
      </div>
    </div>

    <Handle
      type="source"
      :position="Position.Right"
      class="!w-3.5 !h-3.5 !rounded-full !bg-white !border-2 !border-teal-400 hover:!border-teal-600 hover:!scale-125 !transition-all"
    />
  </div>
</template>
