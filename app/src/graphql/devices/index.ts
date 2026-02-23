import type { RegisterDeviceInput } from '#graphql/client'
import type { Ref } from 'vue'
import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { ref } from 'vue'
import { $sdk } from '../default/ofetch'

// Device queries
export function useDevices(appId: Ref<string | null> | string | null) {
  const appIdValue = ref(appId)

  return useQuery({
    key: () => ['devices', appIdValue.value],
    query: async () => {
      const result = await $sdk.devices({ appId: appIdValue.value || undefined })
      return result.data?.devices || []
    },
    enabled: () => !!appIdValue.value,
  })
}

export function useDevice(id: Ref<string | null> | string | null) {
  const deviceId = ref(id)

  return useQuery({
    key: () => ['device', deviceId.value],
    query: async () => {
      if (!deviceId.value)
        return null
      const result = await $sdk.device({ id: deviceId.value })
      return result.data?.device || null
    },
    enabled: () => !!deviceId.value && deviceId.value !== '',
  })
}

export function useDeviceByToken(token: Ref<string | null> | string | null) {
  const tokenValue = ref(token)

  return useQuery({
    key: () => ['device', 'by-token', tokenValue.value],
    query: async () => {
      if (!tokenValue.value)
        return null
      const result = await $sdk.deviceByToken({ token: tokenValue.value })
      return result.data?.deviceByToken || null
    },
    enabled: () => !!tokenValue.value && tokenValue.value !== '',
  })
}

// Device mutations
export function useRegisterDevice() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (input: RegisterDeviceInput) => {
      const result = await $sdk.registerDevice({ input })
      return result.data?.registerDevice || null
    },
    onSuccess: (_data, variables) => {
      queryCache.invalidateQueries({ key: ['devices', variables.appId] })
    },
  })
}

export function useUpdateDevice() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async ({ id, input }: { id: string, input: any }) => {
      const result = await $sdk.updateDevice({ id, input })
      return result.data?.updateDevice || null
    },
    onSuccess: (_data, { id, input }) => {
      queryCache.invalidateQueries({ key: ['device', id] })
      if (input.appId) {
        queryCache.invalidateQueries({ key: ['devices', input.appId] })
      }
    },
  })
}

export function useDeleteDevice() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (id: string) => {
      const result = await $sdk.deleteDevice({ id })
      return result.data?.deleteDevice || false
    },
    onSuccess: () => {
      queryCache.invalidateQueries({ key: ['devices'] })
    },
  })
}
