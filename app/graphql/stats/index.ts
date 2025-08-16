import { useQuery } from '@pinia/colada'
import { $sdk } from '../ofetch'

// Stats queries
export function useDashboardStats() {
  return useQuery({
    key: ['stats', 'dashboard'],
    query: async () => {
      const result = await $sdk.dashboardStats()
      return result.data?.dashboardStats || null
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
