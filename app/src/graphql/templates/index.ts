import type { Ref } from 'vue'
import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { unref } from 'vue'
import { $sdk } from '../default/ofetch'

export function useTemplates(appId: Ref<string> | string, channelType?: Ref<string> | string) {
  return useQuery({
    key: () => ['templates', unref(appId), unref(channelType) ?? null],
    query: async () => {
      const result = await $sdk.templates({
        appId: unref(appId),
        channelType: unref(channelType) as any,
      })
      return result.data?.templates || []
    },
  })
}

export function useTemplate(id: Ref<string> | string) {
  return useQuery({
    key: () => ['template', unref(id)],
    query: async () => {
      const result = await $sdk.template({ id: unref(id) })
      return result.data?.template || null
    },
  })
}

export function useCreateTemplate() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (input: {
      appId: string
      channelId?: string
      name: string
      channelType: string
      subject?: string
      body: string
      htmlBody?: string
    }) => {
      const result = await $sdk.createTemplate({ input })
      return result.data?.createTemplate || null
    },
    onSuccess: (_data, input) => {
      queryCache.invalidateQueries({ key: ['templates', input.appId] })
    },
  })
}

export function useUpdateTemplate() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async ({ id, input, appId }: { id: string, input: any, appId: string }) => {
      const result = await $sdk.updateTemplate({ id, input })
      return result.data?.updateTemplate || null
    },
    onSuccess: (_data, { id, appId }) => {
      queryCache.invalidateQueries({ key: ['template', id] })
      queryCache.invalidateQueries({ key: ['templates', appId] })
    },
  })
}

export function useDeleteTemplate() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async ({ id, appId }: { id: string, appId: string }) => {
      const result = await $sdk.deleteTemplate({ id })
      return result.data?.deleteTemplate || false
    },
    onSuccess: (_data, { appId }) => {
      queryCache.invalidateQueries({ key: ['templates', appId] })
    },
  })
}
