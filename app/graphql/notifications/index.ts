import { useMutation } from '@pinia/colada'
import { $sdk } from '../ofetch'

// Notification mutations
export function useSendNotification() {
  return useMutation({
    mutation: async (input: {
      appId: string,
      title: string,
      body: string,
      data?: any,
      targetDevices?: string[],
      platforms?: string[],
      scheduledAt?: string,
      imageUrl?: string,
      clickAction?: string,
      sound?: string,
      badge?: number
    }) => {
      const result = await $sdk.sendNotification({ input })
      return result.data?.sendNotification || null
    },
  })
}