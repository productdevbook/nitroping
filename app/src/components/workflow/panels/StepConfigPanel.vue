<script setup lang="ts">
import DelayConfigPanel from './DelayConfigPanel.vue'
import FilterConfigPanel from './FilterConfigPanel.vue'
import SendConfigPanel from './SendConfigPanel.vue'

const props = defineProps<{
  selectedNode: any | null
}>()

const emit = defineEmits<{ (e: 'update-node', id: string, data: any): void }>()

function handleUpdate(data: any) {
  if (props.selectedNode) {
    emit('update-node', props.selectedNode.id, data)
  }
}
</script>

<template>
  <div class="w-72 border-l bg-white p-4 flex flex-col gap-4 overflow-y-auto">
    <div v-if="!selectedNode" class="text-sm text-muted-foreground text-center mt-8">
      Select a node to configure it
    </div>

    <template v-else>
      <div>
        <p class="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          {{ selectedNode.type?.toUpperCase() }} Step
        </p>
        <p class="font-semibold text-sm mt-0.5">
          {{ selectedNode.data?.label || 'Configure' }}
        </p>
      </div>

      <SendConfigPanel
        v-if="selectedNode.type === 'send'"
        :node-data="selectedNode.data"
        @update="handleUpdate"
      />

      <DelayConfigPanel
        v-else-if="selectedNode.type === 'delay'"
        :node-data="selectedNode.data"
        @update="handleUpdate"
      />

      <FilterConfigPanel
        v-else-if="selectedNode.type === 'filter'"
        :node-data="selectedNode.data"
        @update="handleUpdate"
      />

      <div v-else class="text-sm text-muted-foreground">
        No configuration for trigger nodes.
      </div>
    </template>
  </div>
</template>
