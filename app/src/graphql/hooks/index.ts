import type { Ref } from 'vue'
import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { unref } from 'vue'
import { $sdk } from '../default/ofetch'

export function useHooks(appId: Ref<string> | string) {
  return useQuery({
    key: () => ['hooks', unref(appId)],
    query: async () => {
      const result = await $sdk.hooks({ appId: unref(appId) })
      return result.data?.hooks || []
    },
  })
}

export function useCreateHook() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (input: {
      appId: string
      name: string
      url: string
      secret?: string
      events?: string[]
    }) => {
      const result = await $sdk.createHook({ input })
      return result.data?.createHook || null
    },
    onSuccess: (_data, input) => {
      queryCache.invalidateQueries({ key: ['hooks', input.appId] })
    },
  })
}

export function useUpdateHook() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async ({ id, input, appId }: { id: string, input: any, appId: string }) => {
      const result = await $sdk.updateHook({ id, input })
      return result.data?.updateHook || null
    },
    onSuccess: (_data, { appId }) => {
      queryCache.invalidateQueries({ key: ['hooks', appId] })
    },
  })
}

export function useDeleteHook() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async ({ id, appId }: { id: string, appId: string }) => {
      const result = await $sdk.deleteHook({ id })
      return result.data?.deleteHook || false
    },
    onSuccess: (_data, { appId }) => {
      queryCache.invalidateQueries({ key: ['hooks', appId] })
    },
  })
}
