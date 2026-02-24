<script setup lang="ts">
import type { NodeProps } from '@vue-flow/core'
import { Handle, Position } from '@vue-flow/core'

defineProps<NodeProps>()
</script>

<template>
  <div class="bg-green-50 border-2 border-green-400 rounded-xl px-4 py-3 min-w-[160px] shadow-sm">
    <Handle type="target" :position="Position.Top" />
    <div class="flex items-center gap-2">
      <span class="text-lg">🔀</span>
      <div>
        <p class="text-xs font-semibold text-green-700 uppercase tracking-wide">
          Filter
        </p>
        <p class="text-sm font-medium text-green-900 truncate max-w-[120px]">
          {{ data?.label || `${data?.field} ${data?.operator} ${data?.value}` || 'Condition' }}
        </p>
      </div>
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>
