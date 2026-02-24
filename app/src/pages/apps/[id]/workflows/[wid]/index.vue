<script setup lang="ts">
import type { Edge, Node } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { VueFlow } from '@vue-flow/core'
import { computed, markRaw, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppDetailHeader from '~/components/app/AppDetailHeader.vue'
import AppNavigation from '~/components/app/AppNavigation.vue'
import DelayNode from '~/components/workflow/nodes/DelayNode.vue'
import FilterNode from '~/components/workflow/nodes/FilterNode.vue'
import SendNode from '~/components/workflow/nodes/SendNode.vue'
import TriggerNode from '~/components/workflow/nodes/TriggerNode.vue'
import StepConfigPanel from '~/components/workflow/panels/StepConfigPanel.vue'
import { Button } from '~/components/ui/button'
import { useApp } from '~/graphql'
import { useUpdateWorkflow, useWorkflow } from '~/graphql/workflows'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

const route = useRoute()
const router = useRouter()
const appId = computed(() => route.params.id as string)
const workflowId = computed(() => route.params.wid as string)

const { data: appData } = useApp(appId)
const app = computed(() => appData.value)
const { data: workflowData, isLoading } = useWorkflow(workflowId)
const workflow = computed(() => workflowData.value)

const { mutateAsync: updateWorkflow, isLoading: isSaving } = useUpdateWorkflow()

// Node types registration
const nodeTypes = {
  trigger: markRaw(TriggerNode),
  send: markRaw(SendNode),
  delay: markRaw(DelayNode),
  filter: markRaw(FilterNode),
}

// Canvas state
const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const selectedNode = ref<Node | null>(null)

// Initialize from saved workflow
watch(workflow, (wf) => {
  if (!wf)
    return

  const layout = wf.flowLayout as any
  if (layout?.nodes && layout?.edges) {
    nodes.value = layout.nodes
    edges.value = layout.edges
  }
  else {
    // Default: single trigger node
    nodes.value = [
      {
        id: 'trigger',
        type: 'trigger',
        position: { x: 250, y: 50 },
        data: { label: wf.triggerIdentifier, triggerIdentifier: wf.triggerIdentifier },
      },
    ]
    edges.value = []
  }
}, { immediate: true })

let stepCounter = 0

function addStep(type: 'send' | 'delay' | 'filter') {
  stepCounter++
  const id = `${type}-${stepCounter}`
  const lastNode = nodes.value[nodes.value.length - 1]
  const newNode: Node = {
    id,
    type,
    position: {
      x: lastNode?.position.x || 250,
      y: (lastNode?.position.y || 50) + 150,
    },
    data: {
      label: type === 'send' ? 'Send Message' : type === 'delay' ? '1 hour' : 'Filter',
    },
  }
  nodes.value = [...nodes.value, newNode]
  if (lastNode) {
    edges.value = [...edges.value, {
      id: `e-${lastNode.id}-${id}`,
      source: lastNode.id,
      target: id,
    }]
  }
}

function onNodeClick({ node }: { node: Node }) {
  selectedNode.value = node.type === 'trigger' ? null : node
}

function updateNodeData(nodeId: string, data: any) {
  nodes.value = nodes.value.map(n =>
    n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
  )
  if (selectedNode.value?.id === nodeId) {
    selectedNode.value = { ...selectedNode.value, data: { ...selectedNode.value.data, ...data } }
  }
}

async function saveWorkflow() {
  if (!workflow.value)
    return

  // Build step list from non-trigger nodes in position order
  const nonTriggerNodes = nodes.value
    .filter(n => n.type !== 'trigger')
    .sort((a, b) => a.position.y - b.position.y)

  const steps = nonTriggerNodes.map((n, i) => ({
    nodeId: n.id,
    type: n.type!.toUpperCase() as 'SEND' | 'DELAY' | 'FILTER' | 'DIGEST' | 'BRANCH',
    order: i,
    config: n.data,
  }))

  await updateWorkflow({
    id: workflow.value.id,
    appId: appId.value,
    input: {
      steps,
      flowLayout: { nodes: nodes.value, edges: edges.value },
    },
  })
}
</script>

<template>
  <div class="flex flex-col h-screen">
    <div class="flex-none px-6 pt-4 pb-0">
      <AppDetailHeader :app="app" />
      <AppNavigation :app-id="appId" />
    </div>

    <div class="flex-none px-6 py-3 flex items-center justify-between border-b">
      <div>
        <h2 class="font-semibold">
          {{ workflow?.name || 'Loading...' }}
        </h2>
        <p class="text-xs text-muted-foreground font-mono">
          {{ workflow?.triggerIdentifier }}
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="addStep('send')">
          + Send
        </Button>
        <Button variant="outline" size="sm" @click="addStep('delay')">
          + Delay
        </Button>
        <Button variant="outline" size="sm" @click="addStep('filter')">
          + Filter
        </Button>
        <Button variant="outline" size="sm" @click="router.push(`/apps/${appId}/workflows/${workflowId}/runs`)">
          Runs
        </Button>
        <Button size="sm" :disabled="isSaving" @click="saveWorkflow">
          {{ isSaving ? 'Saving...' : 'Save' }}
        </Button>
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <div class="flex-1">
        <VueFlow
          v-if="!isLoading"
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="nodeTypes"
          fit-view-on-init
          @node-click="onNodeClick"
        >
          <Background />
          <Controls />
          <MiniMap />
        </VueFlow>
        <div v-else class="flex items-center justify-center h-full text-muted-foreground">
          Loading workflow...
        </div>
      </div>
      <StepConfigPanel
        :selected-node="selectedNode"
        @update-node="updateNodeData"
      />
    </div>
  </div>
</template>
