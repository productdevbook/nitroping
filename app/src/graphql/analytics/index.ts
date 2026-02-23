import { computed, unref } from 'vue'
import type { Ref } from 'vue'
import { useQuery } from '@pinia/colada'
import { $sdk } from '../default/ofetch'

export function useNotificationAnalytics(notificationId: Ref<string> | string) {
  return useQuery({
    key: () => ['notificationAnalytics', unref(notificationId)],
    query: async () => {
      const result = await $sdk.getNotificationAnalytics({ notificationId: unref(notificationId) })
      return result.data?.getNotificationAnalytics || null
    },
  })
}

export function useEngagementMetrics(appId: Ref<string> | string, timeRange: Ref<string> | string = '7d') {
  return useQuery({
    key: () => ['engagementMetrics', unref(appId), unref(timeRange)],
    query: async () => {
      const currentAppId = unref(appId)

      // Don't run query if appId is empty
      if (!currentAppId || currentAppId.trim() === '') {
        return null
      }

      const result = await $sdk.getEngagementMetrics({
        appId: currentAppId,
        timeRange: unref(timeRange),
      })
      return result.data?.getEngagementMetrics || null
    },
    enabled: () => {
      const currentAppId = unref(appId)
      return !!currentAppId && currentAppId.trim() !== ''
    },
  })
}

export function useAnalyticsSummary(appId: Ref<string> | string, timeRange: Ref<string> | string = '7d') {
  const { data: metrics, isLoading, error } = useEngagementMetrics(appId, timeRange)

  const summary = computed(() => {
    if (!metrics.value)
      return null

    return {
      totalNotifications: metrics.value.totalNotifications,
      totalSent: metrics.value.totalSent,
      totalDelivered: metrics.value.totalDelivered,
      totalOpened: metrics.value.totalOpened,
      totalClicked: metrics.value.totalClicked,
      deliveryRate: metrics.value.overallDeliveryRate,
      openRate: metrics.value.overallOpenRate,
      clickRate: metrics.value.overallClickRate,
      platformStats: metrics.value.platformBreakdown.map(platform => ({
        name: platform.platform,
        sent: platform.sent,
        delivered: platform.delivered,
        opened: platform.opened,
        clicked: platform.clicked,
        deliveryRate: platform.sent > 0 ? (platform.delivered / platform.sent) * 100 : 0,
        openRate: platform.delivered > 0 ? (platform.opened / platform.delivered) * 100 : 0,
        clickRate: platform.opened > 0 ? (platform.clicked / platform.opened) * 100 : 0,
      })),
    }
  })

  return {
    data: summary,
    isLoading,
    error,
  }
}
