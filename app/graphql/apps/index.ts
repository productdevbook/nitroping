import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { $sdk } from '../ofetch'

// Apps queries
export function useApps() {
  return useQuery({
    key: ['apps'],
    query: async () => {
      const result = await $sdk.apps()
      return result.data?.apps || []
    },
  })
}

export function useApp(id: Ref<string | null> | string | null) {
  const appId = ref(id)

  return useQuery({
    key: () => ['app', appId.value],
    query: async () => {
      if (!appId.value)
        return null
      const result = await $sdk.app({ id: appId.value })
      return result.data?.app || null
    },
    enabled: () => !!appId.value && appId.value !== '',
  })
}

export function useAppBySlug(slug: Ref<string | null> | string | null) {
  const appSlug = ref(slug)

  return useQuery({
    key: () => ['app', 'by-slug', appSlug.value],
    query: async () => {
      if (!appSlug.value)
        return null
      const result = await $sdk.appBySlug({ slug: appSlug.value })
      return result.data?.appBySlug || null
    },
    enabled: () => !!appSlug.value && appSlug.value !== '',
  })
}

export function useAppExists(slug: Ref<string> | string) {
  const appSlug = isRef(slug) ? slug : ref(slug)

  return useQuery({
    key: () => ['app', 'exists', appSlug.value],
    query: async () => {
      const result = await $sdk.appExists({ slug: appSlug.value })
      return result.data?.appExists || false
    },
    enabled: () => appSlug.value.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Apps mutations
export function useCreateApp() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (input: { name: string, slug: string, description?: string }) => {
      const result = await $sdk.createApp({ input })
      return result.data?.createApp || null
    },
    onSuccess: () => {
      queryCache.invalidateQueries({ key: ['apps'] })
    },
  })
}

export function useUpdateApp() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async ({ id, input }: { id: string, input: any }) => {
      const result = await $sdk.updateApp({ id, input })
      return result.data?.updateApp || null
    },
    onSuccess: (_data, { id }) => {
      queryCache.invalidateQueries({ key: ['apps'] })
      queryCache.invalidateQueries({ key: ['app', id] })
    },
  })
}

export function useDeleteApp() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (id: string) => {
      const result = await $sdk.deleteApp({ id })
      return result.data?.deleteApp || false
    },
    onSuccess: () => {
      queryCache.invalidateQueries({ key: ['apps'] })
    },
  })
}

export function useRegenerateApiKey() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (id: string) => {
      const result = await $sdk.regenerateApiKey({ id })
      return result.data?.regenerateApiKey || null
    },
    onSuccess: (_data, id) => {
      queryCache.invalidateQueries({ key: ['apps'] })
      queryCache.invalidateQueries({ key: ['app', id] })
    },
  })
}

export function useConfigureAPNs() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async ({ id, input }: { id: string, input: { keyId: string, teamId: string, privateKey: string, bundleId?: string, isProduction?: boolean } }) => {
      const result = await $sdk.configureAPNs({ id, input })
      return result.data?.configureAPNs || null
    },
    onSuccess: (_data, { id }) => {
      queryCache.invalidateQueries({ key: ['apps'] })
      queryCache.invalidateQueries({ key: ['app', id] })
    },
  })
}

export function useConfigureFCM() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async ({ id, input }: { id: string, input: { projectId: string, serviceAccount: string } }) => {
      const result = await $sdk.configureFCM({ id, input })
      return result.data?.configureFCM || null
    },
    onSuccess: (_data, { id }) => {
      queryCache.invalidateQueries({ key: ['apps'] })
      queryCache.invalidateQueries({ key: ['app', id] })
    },
  })
}

export function useConfigureWebPush() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async ({ id, input }: { id: string, input: { subject: string, publicKey: string, privateKey: string } }) => {
      const result = await $sdk.configureWebPush({ id, input })
      return result.data?.configureWebPush || null
    },
    onSuccess: (_data, { id }) => {
      queryCache.invalidateQueries({ key: ['apps'] })
      queryCache.invalidateQueries({ key: ['app', id] })
    },
  })
}

export function useGenerateVapidKeys() {
  return useMutation({
    mutation: async () => {
      const result = await $sdk.generateVapidKeys()
      return result.data?.generateVapidKeys || null
    },
  })
}
