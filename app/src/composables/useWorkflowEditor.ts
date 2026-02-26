import type { Edge, Node } from '@vue-flow/core'
import type { Ref } from 'vue'
import type { TriggerNodeData, WorkflowNodeData, WorkflowStep } from '~/components/workflow/types'
import { useVueFlow } from '@vue-flow/core'
import { usePush } from 'notivue'
import { computed, ref, watch } from 'vue'
import { useUpdateWorkflow, useWorkflow } from '~/graphql/workflows'

// All VueFlow instances on the workflow editor page share this ID
export const WORKFLOW_FLOW_ID = 'workflow-editor'

export function useWorkflowEditor(workflowId: Ref<string>, appId: Ref<string>) {
  const push = usePush()
  const { screenToFlowCoordinate, addEdges, onConnect } = useVueFlow(WORKFLOW_FLOW_ID)

  // Without this, dragging handle-to-handle fires the connect event but
  // nothing gets added. addEdges() writes into the store which syncs back
  // to edges via v-model:edges.
  onConnect(params => addEdges([params]))

  const { data: workflowData, isLoading } = useWorkflow(workflowId)
  const { mutateAsync: updateWorkflow, isLoading: isSaving } = useUpdateWorkflow()

  const workflow = computed(() => workflowData.value)
  const nodes = ref<Node[]>([])
  const edges = ref<Edge[]>([])
  const selectedNode = ref<Node | null>(null)

  // Hydrate canvas from persisted flowLayout, or seed with a bare trigger node
  watch(workflow, (wf) => {
    if (!wf)
      return

    const layout = wf.flowLayout as { nodes: Node[], edges: Edge[] } | null

    if (layout?.nodes?.length) {
      nodes.value = layout.nodes.map(n =>
        n.type === 'trigger' ? { ...n, deletable: false } : n,
      )
      edges.value = layout.edges ?? []
    }
    else {
      nodes.value = [
        {
          id: 'trigger',
          type: 'trigger',
          position: { x: 250, y: 50 },
          data: {
            label: wf.triggerIdentifier,
            triggerIdentifier: wf.triggerIdentifier,
          } satisfies TriggerNodeData,
          deletable: false,
        },
      ]
      edges.value = []
    }
  }, { immediate: true })

  function onDrop(event: DragEvent) {
    event.preventDefault()

    const raw = event.dataTransfer?.getData('application/vueflow')
    if (!raw)
      return

    const { type, data } = JSON.parse(raw) as { type: string, data: WorkflowNodeData }
    const position = screenToFlowCoordinate({ x: event.clientX, y: event.clientY })

    nodes.value = [
      ...nodes.value,
      {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data,
      },
    ]
  }

  function onNodeClick({ node }: { node: Node }) {
    selectedNode.value = node.type === 'trigger' ? null : node
  }

  function onPaneClick() {
    selectedNode.value = null
  }

  function updateNodeData(nodeId: string, patch: Partial<WorkflowNodeData>) {
    nodes.value = nodes.value.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n,
    )
    if (selectedNode.value?.id === nodeId) {
      selectedNode.value = {
        ...selectedNode.value,
        data: { ...selectedNode.value.data, ...patch },
      }
    }
  }

  async function saveWorkflow() {
    if (!workflow.value)
      return

    try {
      const steps = bfsSteps(nodes.value, edges.value)
      await updateWorkflow({
        id: workflow.value.id,
        appId: appId.value,
        input: {
          steps,
          flowLayout: { nodes: nodes.value, edges: edges.value },
        },
      })
      push.success({ title: 'Workflow saved' })
    }
    catch {
      push.error({ title: 'Failed to save workflow' })
    }
  }

  return {
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
  }
}

/**
 * Topological BFS from the trigger node.
 * Returns non-trigger nodes in execution order.
 */
function bfsSteps(nodeList: Node[], edgeList: Edge[]): WorkflowStep[] {
  const adj = new Map<string, string[]>()
  for (const e of edgeList) {
    const children = adj.get(e.source) ?? []
    children.push(e.target)
    adj.set(e.source, children)
  }

  const result: WorkflowStep[] = []
  const visited = new Set<string>()
  const queue = ['trigger']

  while (queue.length) {
    const id = queue.shift()!
    if (visited.has(id))
      continue
    visited.add(id)

    const node = nodeList.find(n => n.id === id)
    if (node && node.type !== 'trigger') {
      result.push({
        nodeId: node.id,
        type: node.type!.toUpperCase() as WorkflowStep['type'],
        order: result.length,
        config: node.data,
      })
    }

    for (const child of adj.get(id) ?? [])
      queue.push(child)
  }

  return result
}
