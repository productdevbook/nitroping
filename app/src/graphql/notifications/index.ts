import type { ChannelType } from '#graphql/nitro-graphql-client'
import type { Ref } from 'vue'
import { useMutation, useQuery } from '@pinia/colada'
import { unref } from 'vue'
import { $sdk } from '../default/ofetch'

// Notification queries
export function useNotificationApi(appId: Ref<string> | string) {
  return useQuery({
    key: () => ['notifications', unref(appId)],
    query: async () => {
      const result = await $sdk.notifications({ appId: unref(appId) })
      return result.data?.notifications || []
    },
  })
}

export function useRecentNotifications() {
  return useQuery({
    key: () => ['notifications', 'recent'],
    query: async () => {
      const result = await $sdk.notifications({})
      return result.data?.notifications?.slice(0, 5) || []
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useNotification(id: Ref<string> | string) {
  return useQuery({
    key: () => ['notification', unref(id)],
    query: async () => {
      const result = await $sdk.notification({ id: unref(id) })
      return result.data?.notification || null
    },
  })
}

export function useDeliveryLogs(notificationId: Ref<string> | string) {
  return useQuery({
    key: () => ['deliveryLogs', unref(notificationId)],
    query: async () => {
      const result = await $sdk.deliveryLogs({ notificationId: unref(notificationId) })
      return result.data?.deliveryLogs || []
    },
  })
}

// Notification mutations
export function useSendNotification() {
  return useMutation({
    mutation: async (input: {
      appId: string
      title: string
      body: string
      data?: any
      targetDevices?: string[]
      platforms?: string[]
      scheduledAt?: string
      imageUrl?: string
      clickAction?: string
      sound?: string
      badge?: number
      channelType?: ChannelType
      channelId?: string
      contactIds?: string[]
    }) => {
      const result = await $sdk.sendNotification({ input })
      return result.data?.sendNotification || null
    },
  })
}
