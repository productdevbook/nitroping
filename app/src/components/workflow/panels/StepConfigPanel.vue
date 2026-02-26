<script setup lang="ts">
import type { Node } from '@vue-flow/core'
import type { WorkflowNodeData } from '../types'
import DelayConfigPanel from './DelayConfigPanel.vue'
import FilterConfigPanel from './FilterConfigPanel.vue'
import SendConfigPanel from './SendConfigPanel.vue'

const props = defineProps<{
  selectedNode: Node | null
}>()

const emit = defineEmits<{
  (e: 'updateNode', id: string, data: Partial<WorkflowNodeData>): void
}>()

function onUpdate(data: Partial<WorkflowNodeData>) {
  if (props.selectedNode)
    emit('updateNode', props.selectedNode.id, data)
}
</script>

<template>
  <!-- :key forces form remount when switching between nodes of the same type -->
  <SendConfigPanel
    v-if="selectedNode?.type === 'send'"
    :key="selectedNode.id"
    :node-data="selectedNode.data"
    @update="onUpdate"
  />
  <DelayConfigPanel
    v-else-if="selectedNode?.type === 'delay'"
    :key="selectedNode.id"
    :node-data="selectedNode.data"
    @update="onUpdate"
  />
  <FilterConfigPanel
    v-else-if="selectedNode?.type === 'filter'"
    :key="selectedNode.id"
    :node-data="selectedNode.data"
    @update="onUpdate"
  />
</template>
