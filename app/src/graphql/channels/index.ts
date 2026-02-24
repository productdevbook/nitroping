import type { Ref } from 'vue'
import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { unref } from 'vue'
import { $sdk } from '../default/ofetch'

export function useChannels(appId: Ref<string> | string) {
  return useQuery({
    key: () => ['channels', unref(appId)],
    query: async () => {
      const result = await $sdk.channels({ appId: unref(appId) })
      return result.data?.channels || []
    },
  })
}

export function useChannel(id: Ref<string> | string) {
  return useQuery({
    key: () => ['channel', unref(id)],
    query: async () => {
      const result = await $sdk.channel({ id: unref(id) })
      return result.data?.channel || null
    },
  })
}

export function useCreateChannel() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (input: {
      appId: string
      name: string
      type: string // ChannelType
      config?: any
    }) => {
      const result = await $sdk.createChannel({ input: input as any })
      return result.data?.createChannel || null
    },
    onSuccess: (_data, input) => {
      queryCache.invalidateQueries({ key: ['channels', input.appId] })
    },
  })
}

export function useUpdateChannel() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async ({ id, input }: { id: string, input: any, appId: string }) => {
      const result = await $sdk.updateChannel({ id, input })
      return result.data?.updateChannel || null
    },
    onSuccess: (_data, { appId }) => {
      queryCache.invalidateQueries({ key: ['channels', appId] })
    },
  })
}

export function useDeleteChannel() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async ({ id }: { id: string, appId: string }) => {
      const result = await $sdk.deleteChannel({ id })
      return result.data?.deleteChannel || false
    },
    onSuccess: (_data, { appId }) => {
      queryCache.invalidateQueries({ key: ['channels', appId] })
    },
  })
}
