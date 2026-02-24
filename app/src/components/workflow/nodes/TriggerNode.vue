<script setup lang="ts">
import type { NodeProps } from '@vue-flow/core'
import { Handle, Position } from '@vue-flow/core'

defineProps<NodeProps>()
</script>

<template>
  <div class="bg-indigo-50 border-2 border-indigo-400 rounded-xl px-4 py-3 min-w-[160px] shadow-sm">
    <div class="flex items-center gap-2">
      <span class="text-lg">⚡</span>
      <div>
        <p class="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
          Trigger
        </p>
        <p class="text-sm font-medium text-indigo-900">
          {{ data?.label || data?.triggerIdentifier || 'Start' }}
        </p>
      </div>
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>
