<script setup lang="ts">
import { BarChart3, CheckCircle, RefreshCw, Send, XCircle } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useAnalyticsSummary } from '~/graphql/analytics'

definePageMeta({
  layout: 'default',
})

// API queries
const { data: appsData, isLoading: _appsLoading } = useApps()
const apps = computed(() => appsData.value || [])

// Reactive data
const selectedApp = ref('all')
const timeRange = ref('7d')

// Get analytics data
const selectedAppId = computed(() => {
  // Wait for apps to load before selecting an app
  if (!apps.value?.length) {
    return ''
  }
  
  if (selectedApp.value === 'all') {
    return apps.value[0]?.id || ''
  }
  return selectedApp.value
})

const { data: analyticsData, isLoading: _analyticsLoading } = useAnalyticsSummary(
  selectedAppId,
  timeRange,
)

// Computed metrics
const metrics = computed(() => {
  if (!analyticsData.value) {
    return {
      totalSent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
      activeDevices: 0,
    }
  }

  return {
    totalSent: analyticsData.value.totalSent,
    delivered: Math.round(analyticsData.value.totalSent * analyticsData.value.deliveryRate / 100),
    opened: Math.round(analyticsData.value.totalSent * analyticsData.value.openRate / 100),
    clicked: Math.round(analyticsData.value.totalSent * analyticsData.value.clickRate / 100),
    deliveryRate: analyticsData.value.deliveryRate,
    openRate: analyticsData.value.openRate,
    clickRate: analyticsData.value.clickRate,
    activeDevices: analyticsData.value.platformStats?.reduce((sum, platform) => sum + platform.sent, 0) || 0,
  }
})

const platformStats = computed(() => {
  if (!analyticsData.value?.platformStats)
    return []

  const colors = {
    android: '#10B981',
    ios: '#3B82F6',
    web: '#8B5CF6',
  }

  return analyticsData.value.platformStats.map(platform => ({
    name: platform.name.charAt(0).toUpperCase() + platform.name.slice(1).toLowerCase(),
    count: platform.sent,
    delivered: platform.delivered,
    opened: platform.opened,
    clicked: platform.clicked,
    deliveryRate: platform.deliveryRate,
    openRate: platform.openRate,
    clickRate: platform.clickRate,
    color: colors[platform.name.toLowerCase() as keyof typeof colors] || '#6B7280',
  }))
})

const commonErrors = ref([
  {
    type: 'invalid_token',
    message: 'Invalid Registration Token',
    description: 'Device token is no longer valid',
    count: 342,
  },
  {
    type: 'quota_exceeded',
    message: 'Message Rate Exceeded',
    description: 'Too many messages sent to device',
    count: 156,
  },
  {
    type: 'invalid_package',
    message: 'Package Name Mismatch',
    description: 'App package name does not match',
    count: 89,
  },
])

// Refresh function for manual reload
function refreshData() {
  // The reactive queries will automatically refresh when dependencies change
  console.log('Refreshing analytics data...')
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold mb-2">Analytics</h1>
        <p class="text-muted-foreground">Track notification performance and delivery metrics</p>
      </div>
      <div class="flex space-x-2">
        <Select v-model="selectedApp">
          <SelectTrigger class="w-48">
            <SelectValue placeholder="All apps" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All apps</SelectItem>
            <SelectItem v-for="app in (apps || [])" :key="app.id" :value="app.id">
              {{ app.name }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="timeRange">
          <SelectTrigger class="w-32">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Sent</CardTitle>
          <Send class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ metrics.totalSent.toLocaleString() }}</div>
          <p class="text-xs text-muted-foreground">
            Total notifications sent
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Delivered</CardTitle>
          <CheckCircle class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ metrics.delivered.toLocaleString() }}</div>
          <p class="text-xs text-muted-foreground">
            {{ metrics.deliveryRate.toFixed(1) }}% delivery rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Opened</CardTitle>
          <CheckCircle class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ metrics.opened.toLocaleString() }}</div>
          <p class="text-xs text-muted-foreground">
            {{ metrics.openRate.toFixed(1) }}% open rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Clicked</CardTitle>
          <XCircle class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ metrics.clicked.toLocaleString() }}</div>
          <p class="text-xs text-muted-foreground">
            {{ metrics.clickRate.toFixed(1) }}% click rate
          </p>
        </CardContent>
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Delivery Chart -->
      <Card>
        <CardHeader>
          <CardTitle>Delivery Trends</CardTitle>
          <CardDescription>Notification delivery over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="h-80 flex items-center justify-center text-muted-foreground">
            <div class="text-center">
              <BarChart3 class="h-12 w-12 mx-auto mb-4" />
              <p>Chart visualization would go here</p>
              <p class="text-sm">Integration with chart library needed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Platform Breakdown -->
      <Card>
        <CardHeader>
          <CardTitle>Platform Distribution</CardTitle>
          <CardDescription>Notifications by platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-for="platform in platformStats" :key="platform.name" class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-4 h-4 rounded" :style="{ backgroundColor: platform.color }"></div>
                <span class="font-medium">{{ platform.name }}</span>
              </div>
              <div class="text-right">
                <div class="font-bold">{{ platform.count.toLocaleString() }}</div>
                <div class="text-sm text-muted-foreground">
                  {{ platform.deliveryRate.toFixed(1) }}% delivery • {{ platform.openRate.toFixed(1) }}% open
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Recent Notifications - Coming Soon -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Latest sent notifications and their status</CardDescription>
          </div>
          <Button variant="outline" @click="refreshData">
            <RefreshCw class="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div class="text-center py-8 text-muted-foreground">
          <BarChart3 class="h-12 w-12 mx-auto mb-4" />
          <p>Recent notifications feature</p>
          <p class="text-sm">Coming soon...</p>
        </div>
      </CardContent>
    </Card>

    <!-- Error Analysis -->
    <Card class="mt-6">
      <CardHeader>
        <CardTitle>Common Errors</CardTitle>
        <CardDescription>Most frequent delivery errors</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <div v-for="error in commonErrors" :key="error.type" class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
            <div>
              <p class="font-medium text-red-900 dark:text-red-100">{{ error.message }}</p>
              <p class="text-sm text-red-700 dark:text-red-300">{{ error.description }}</p>
            </div>
            <div class="text-right">
              <div class="font-bold text-red-900 dark:text-red-100">{{ error.count }}</div>
              <div class="text-xs text-red-700 dark:text-red-300">occurrences</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
