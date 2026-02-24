import type { Ref } from 'vue'
import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { unref } from 'vue'
import { $sdk } from '../default/ofetch'

export function useContacts(appId: Ref<string> | string) {
  return useQuery({
    key: () => ['contacts', unref(appId)],
    query: async () => {
      const result = await $sdk.contacts({ appId: unref(appId) })
      return result.data?.contacts || []
    },
  })
}

export function useContact(id: Ref<string> | string) {
  return useQuery({
    key: () => ['contact', unref(id)],
    query: async () => {
      const result = await $sdk.contact({ id: unref(id) })
      return result.data?.contact || null
    },
  })
}

export function useCreateContact() {
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
      const result = await $sdk.createContact({ input })
      return result.data?.createContact || null
    },
    onSuccess: (_data, input) => {
      queryCache.invalidateQueries({ key: ['contacts', input.appId] })
    },
  })
}

export function useUpdateContact() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async ({ id, input }: { id: string, input: { email?: string, phone?: string, locale?: string, metadata?: any } }) => {
      const result = await $sdk.updateContact({ id, input })
      return result.data?.updateContact || null
    },
    onSuccess: (_data, { id }) => {
      queryCache.invalidateQueries({ key: ['contact', id] })
    },
  })
}

export function useDeleteContact() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async ({ id, appId }: { id: string, appId: string }) => {
      const result = await $sdk.deleteContact({ id })
      return result.data?.deleteContact || false
    },
    onSuccess: (_data, { appId }) => {
      queryCache.invalidateQueries({ key: ['contacts', appId] })
    },
  })
}

export function useUpdateContactPreference() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (input: {
      subscriberId: string
      category: string
      channelType: string
      enabled: boolean
    }) => {
      const result = await $sdk.updateContactPreference({ input })
      return result.data?.updateContactPreference || null
    },
    onSuccess: (_data, input) => {
      queryCache.invalidateQueries({ key: ['contact', input.subscriberId] })
    },
  })
}
