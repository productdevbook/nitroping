<script setup lang="ts">
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { VueFlow } from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'
import { computed, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '~/components/common/Icon.vue'
import { Button } from '~/components/ui/button'
import NodePalette from '~/components/workflow/NodePalette.vue'
import DelayNode from '~/components/workflow/nodes/DelayNode.vue'
import FilterNode from '~/components/workflow/nodes/FilterNode.vue'
import SendNode from '~/components/workflow/nodes/SendNode.vue'
import TriggerNode from '~/components/workflow/nodes/TriggerNode.vue'
import StepConfigPanel from '~/components/workflow/panels/StepConfigPanel.vue'
import { WORKFLOW_FLOW_ID, useWorkflowEditor } from '~/composables/useWorkflowEditor'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

const route = useRoute()
const router = useRouter()

const appId = computed(() => route.params.id as string)
const workflowId = computed(() => route.params.wid as string)

const {
  workflow,
  nodes,
  edges,
  selectedNode,
  isLoading,
  isSaving,
  onDrop,
  onNodeClick,
  onPaneClick,
  updateNodeData,
  saveWorkflow,
} = useWorkflowEditor(workflowId, appId)

const nodeTypes = {
  trigger: markRaw(TriggerNode),
  send: markRaw(SendNode),
  delay: markRaw(DelayNode),
  filter: markRaw(FilterNode),
}

function closePanel() {
  onPaneClick()
}
</script>

<template>
  <!-- Full-screen editor, outside DefaultLayout -->
  <div class="h-screen w-screen overflow-hidden flex flex-col bg-background">

    <!-- ── Top bar ─────────────────────────────────────────────────────────── -->
    <header class="h-12 flex-none flex items-center gap-3 px-3 border-b bg-white z-20">
      <!-- Back -->
      <Button
        variant="ghost"
        size="sm"
        class="gap-1.5 text-muted-foreground"
        @click="router.push(`/apps/${appId}/workflows`)"
      >
        <Icon name="lucide:arrow-left" class="size-4" />
        Workflows
      </Button>

      <div class="w-px h-5 bg-border" />

      <!-- Workflow name + trigger -->
      <div class="flex-1 min-w-0">
        <span class="font-semibold text-sm truncate">
          {{ workflow?.name ?? '…' }}
        </span>
        <span class="ml-2 text-xs text-muted-foreground font-mono">
          {{ workflow?.triggerIdentifier }}
        </span>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          @click="router.push(`/apps/${appId}/workflows/${workflowId}/runs`)"
        >
          <Icon name="lucide:history" class="size-4 mr-1.5" />
          Runs
        </Button>
        <Button size="sm" :disabled="isSaving" @click="saveWorkflow">
          <Icon name="lucide:save" class="size-4 mr-1.5" />
          {{ isSaving ? 'Saving…' : 'Save' }}
        </Button>
      </div>
    </header>

    <!-- ── Body ────────────────────────────────────────────────────────────── -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Left palette -->
      <NodePalette />

      <!-- Canvas + overlay config panel -->
      <div
        class="relative flex-1"
        @dragover.prevent
        @drop="onDrop"
      >
        <!-- VueFlow canvas -->
        <VueFlow
          v-if="!isLoading"
          :id="WORKFLOW_FLOW_ID"
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="nodeTypes"
          fit-view-on-init
          class="h-full w-full"
          @node-click="onNodeClick"
          @pane-click="onPaneClick"
        >
          <Background pattern-color="#e2e8f0" :gap="20" />
          <Controls />
          <MiniMap />
        </VueFlow>

        <div v-else class="flex h-full items-center justify-center text-sm text-muted-foreground">
          <Icon name="lucide:loader-2" class="size-5 mr-2 animate-spin" />
          Loading workflow…
        </div>

        <!-- Config panel — slides in from right, overlays canvas -->
        <Transition
          enter-from-class="translate-x-full opacity-0"
          enter-active-class="transition duration-200 ease-out"
          leave-to-class="translate-x-full opacity-0"
          leave-active-class="transition duration-150 ease-in"
        >
          <div
            v-if="selectedNode"
            class="absolute right-0 top-0 h-full w-80 z-10 flex flex-col bg-white border-l shadow-xl"
          >
            <!-- Panel header -->
            <div class="flex items-center justify-between px-4 py-3 border-b flex-none">
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  {{ selectedNode.type }} step
                </p>
                <p class="text-sm font-semibold truncate mt-0.5">
                  {{ selectedNode.data?.label || 'Configure' }}
                </p>
              </div>
              <Button variant="ghost" size="icon" class="size-8 ml-2 flex-none" @click="closePanel">
                <Icon name="lucide:x" class="size-4" />
              </Button>
            </div>

            <!-- Panel body -->
            <div class="flex-1 overflow-y-auto p-4">
              <StepConfigPanel
                :selected-node="selectedNode"
                @update-node="updateNodeData"
              />
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
