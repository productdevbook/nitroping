import type { Ref } from 'vue'
import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { unref } from 'vue'
import { $sdk } from '../default/ofetch'

export function useSubscribers(appId: Ref<string> | string) {
  return useQuery({
    key: () => ['subscribers', unref(appId)],
    query: async () => {
      const result = await $sdk.subscribers({ appId: unref(appId) })
      return result.data?.subscribers || []
    },
  })
}

export function useSubscriber(id: Ref<string> | string) {
  return useQuery({
    key: () => ['subscriber', unref(id)],
    query: async () => {
      const result = await $sdk.subscriber({ id: unref(id) })
      return result.data?.subscriber || null
    },
  })
}

export function useCreateSubscriber() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (input: {
      appId: string
      externalId: string
      email?: string
      phone?: string
      locale?: string
      metadata?: any
    }) => {
      const result = await $sdk.createSubscriber({ input })
      return result.data?.createSubscriber || null
    },
    onSuccess: (_data, input) => {
      queryCache.invalidateQueries({ key: ['subscribers', input.appId] })
    },
  })
}

export function useUpdateSubscriber() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async ({ id, input }: { id: string, input: { email?: string, phone?: string, locale?: string, metadata?: any } }) => {
      const result = await $sdk.updateSubscriber({ id, input })
      return result.data?.updateSubscriber || null
    },
    onSuccess: (_data, { id }) => {
      queryCache.invalidateQueries({ key: ['subscriber', id] })
    },
  })
}

export function useDeleteSubscriber() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async ({ id, appId }: { id: string, appId: string }) => {
      const result = await $sdk.deleteSubscriber({ id })
      return result.data?.deleteSubscriber || false
    },
    onSuccess: (_data, { appId }) => {
      queryCache.invalidateQueries({ key: ['subscribers', appId] })
    },
  })
}

export function useUpdateSubscriberPreference() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (input: {
      subscriberId: string
      category: string
      channelType: string
      enabled: boolean
    }) => {
      const result = await $sdk.updateSubscriberPreference({ input })
      return result.data?.updateSubscriberPreference || null
    },
    onSuccess: (_data, input) => {
      queryCache.invalidateQueries({ key: ['subscriber', input.subscriberId] })
    },
  })
}
