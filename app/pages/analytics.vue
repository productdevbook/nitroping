<script setup lang="ts">
import { BarChart3, CheckCircle, RefreshCw, Send, Smartphone, XCircle } from 'lucide-vue-next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

definePageMeta({
  layout: 'default',
})

// API queries
const { data: appsData, isLoading: _appsLoading } = useApps()
const apps = computed(() => appsData.value || [])

// Reactive data
const selectedApp = ref('all')
const timeRange = ref('7d')
const recentNotifications = ref<any[]>([])

const metrics = ref({
  totalSent: 25847,
  delivered: 25203,
  failed: 644,
  activeDevices: 1250,
  sentChange: 12.5,
  deviceChange: 23,
})

const platformStats = ref([
  { name: 'Android', count: 15430, percentage: 59.7, color: '#10B981' },
  { name: 'iOS', count: 8521, percentage: 33.0, color: '#3B82F6' },
  { name: 'Web', count: 1896, percentage: 7.3, color: '#8B5CF6' },
])

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

// Methods

async function loadRecentNotifications() {
  try {
    // TODO: Load from API with filters
    recentNotifications.value = [
      {
        id: '1',
        title: 'Welcome to our app!',
        body: 'Thanks for downloading our app. Get started now!',
        appName: 'Mobile App',
        status: 'sent',
        totalTargets: 150,
        totalSent: 147,
        totalFailed: 3,
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: '2',
        title: 'New feature available',
        body: 'Check out our latest update with amazing new features.',
        appName: 'Mobile App',
        status: 'sent',
        totalTargets: 1200,
        totalSent: 1180,
        totalFailed: 20,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      {
        id: '3',
        title: 'System maintenance',
        body: 'We will be performing scheduled maintenance tonight.',
        appName: 'Web Dashboard',
        status: 'failed',
        totalTargets: 45,
        totalSent: 12,
        totalFailed: 33,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      },
    ]
  }
  catch (error) {
    console.error('Error loading recent notifications:', error)
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'sent': return 'default'
    case 'failed': return 'destructive'
    case 'pending': return 'secondary'
    default: return 'outline'
  }
}

function formatDate(date: Date) {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.round((date.getTime() - Date.now()) / (1000 * 60)),
    'minute',
  )
}

// Watch for filter changes
watch([selectedApp, timeRange], () => {
  // TODO: Reload data when filters change
  console.log('Filters changed:', { app: selectedApp.value, range: timeRange.value })
})

// Load data on mount
onMounted(() => {
  loadRecentNotifications()
})
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
            <span :class="metrics.sentChange >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ metrics.sentChange >= 0 ? '+' : '' }}{{ metrics.sentChange }}%
            </span>
            from last period
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
            {{ ((metrics.delivered / metrics.totalSent) * 100).toFixed(1) }}% delivery rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Failed</CardTitle>
          <XCircle class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ metrics.failed.toLocaleString() }}</div>
          <p class="text-xs text-muted-foreground">
            {{ ((metrics.failed / metrics.totalSent) * 100).toFixed(1) }}% failure rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Active Devices</CardTitle>
          <Smartphone class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ metrics.activeDevices.toLocaleString() }}</div>
          <p class="text-xs text-muted-foreground">
            <span :class="metrics.deviceChange >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ metrics.deviceChange >= 0 ? '+' : '' }}{{ metrics.deviceChange }}
            </span>
            new this period
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
                <div class="text-sm text-muted-foreground">{{ platform.percentage }}%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Recent Notifications -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Latest sent notifications and their status</CardDescription>
          </div>
          <Button variant="outline" @click="loadRecentNotifications">
            <RefreshCw class="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div v-for="notification in recentNotifications" :key="notification.id" class="flex items-center justify-between p-4 border rounded-lg">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <h4 class="font-medium">{{ notification.title }}</h4>
                <Badge :variant="getStatusVariant(notification.status)">
                  {{ notification.status }}
                </Badge>
              </div>
              <p class="text-sm text-muted-foreground mb-2">{{ notification.body }}</p>
              <div class="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>{{ notification.appName }}</span>
                <span>•</span>
                <span>{{ formatDate(notification.createdAt) }}</span>
                <span>•</span>
                <span>{{ notification.totalTargets }} targets</span>
              </div>
            </div>
            <div class="text-right space-y-1">
              <div class="text-sm">
                <span class="text-green-600">{{ notification.totalSent }}</span> sent
              </div>
              <div class="text-sm">
                <span class="text-red-600">{{ notification.totalFailed }}</span> failed
              </div>
              <div class="text-xs text-muted-foreground">
                {{ ((notification.totalSent / notification.totalTargets) * 100).toFixed(1) }}% rate
              </div>
            </div>
          </div>
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
