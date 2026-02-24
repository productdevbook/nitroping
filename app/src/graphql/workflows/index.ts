import type { Ref } from 'vue'
import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { unref } from 'vue'
import { $sdk } from '../default/ofetch'

export function useWorkflows(appId: Ref<string> | string) {
  return useQuery({
    key: () => ['workflows', unref(appId)],
    query: async () => {
      const result = await $sdk.workflows({ appId: unref(appId) })
      return result.data?.workflows || []
    },
  })
}

export function useWorkflow(id: Ref<string> | string) {
  return useQuery({
    key: () => ['workflow', unref(id)],
    query: async () => {
      const result = await $sdk.workflow({ id: unref(id) })
      return result.data?.workflow || null
    },
  })
}

export function useWorkflowExecutions(workflowId: Ref<string> | string) {
  return useQuery({
    key: () => ['workflowExecutions', unref(workflowId)],
    query: async () => {
      const result = await $sdk.workflowExecutions({ workflowId: unref(workflowId) })
      return result.data?.workflowExecutions || []
    },
  })
}

export function useCreateWorkflow() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (input: {
      appId: string
      name: string
      triggerIdentifier: string
      triggerType?: string
      steps?: any[]
      flowLayout?: any
    }) => {
      const result = await $sdk.createWorkflow({ input: input as any })
      return result.data?.createWorkflow || null
    },
    onSuccess: (_data, input) => {
      queryCache.invalidateQueries({ key: ['workflows', input.appId] })
    },
  })
}

export function useUpdateWorkflow() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async ({ id, input }: { id: string, input: any, appId: string }) => {
      const result = await $sdk.updateWorkflow({ id, input })
      return result.data?.updateWorkflow || null
    },
    onSuccess: (_data, { id, appId }) => {
      queryCache.invalidateQueries({ key: ['workflow', id] })
      queryCache.invalidateQueries({ key: ['workflows', appId] })
    },
  })
}

export function useDeleteWorkflow() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async ({ id }: { id: string, appId: string }) => {
      const result = await $sdk.deleteWorkflow({ id })
      return result.data?.deleteWorkflow || false
    },
    onSuccess: (_data, { appId }) => {
      queryCache.invalidateQueries({ key: ['workflows', appId] })
    },
  })
}

export function useTriggerWorkflow() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (input: {
      workflowId: string
      subscriberId?: string
      payload?: any
    }) => {
      const result = await $sdk.triggerWorkflow({ input })
      return result.data?.triggerWorkflow || null
    },
    onSuccess: (_data, input) => {
      queryCache.invalidateQueries({ key: ['workflowExecutions', input.workflowId] })
    },
  })
}
