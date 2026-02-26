<script setup lang="ts">
import type { NodeProps } from '@vue-flow/core'
import type { TriggerNodeData } from '../types'
import { Handle, Position } from '@vue-flow/core'
import { Badge } from '~/components/ui/badge'

defineProps<NodeProps<TriggerNodeData>>()
</script>

<template>
  <!--
    Outer div must NOT have overflow:hidden — VueFlow handles sit outside the
    card boundary and will be clipped otherwise.
  -->
  <div class="relative min-w-[220px]">
    <!-- Input handle: triggers have no incoming connection -->

    <!-- Card shell — left accent via border-l -->
    <div class="rounded-xl border border-l-[3px] border-l-indigo-500 bg-card shadow-sm px-4 py-3 flex items-center gap-3">
      <!-- Icon -->
      <div class="size-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 text-xl leading-none">
        ⚡
      </div>

      <!-- Content -->
      <div class="min-w-0 flex-1 space-y-0.5">
        <Badge variant="secondary" class="text-[10px] h-4 px-1.5 uppercase tracking-wider font-semibold text-indigo-700 bg-indigo-100 border-0">
          Trigger
        </Badge>
        <p class="text-sm font-semibold text-card-foreground truncate leading-tight">
          {{ data.label || data.triggerIdentifier || 'Start' }}
        </p>
      </div>
    </div>

    <!-- Output handle → right side -->
    <Handle
      type="source"
      :position="Position.Right"
      class="!w-3.5 !h-3.5 !rounded-full !bg-white !border-2 !border-indigo-400 hover:!border-indigo-600 hover:!scale-125 !transition-all"
    />
  </div>
</template>
