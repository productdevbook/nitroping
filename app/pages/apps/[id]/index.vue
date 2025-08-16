<script setup lang="ts">
import {
  Activity,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Send,
  Smartphone,
  TrendingUp,
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const appId = computed(() => route.params.id as string)

// API queries
const { data: appData } = useApp(appId)
const app = computed(() => appData.value)

// Reactive data
const stats = computed(() => (app as any)?.stats || {
  totalDevices: 0,
  newDevicesToday: 0,
  sentToday: 0,
  deliveryRate: 0,
  apiCalls: 0,
})
const recentActivity = ref<any[]>([])
const showApiKey = ref(false)

// Methods
function _initializeRecentActivity() {
  // Mock recent activity for now
  recentActivity.value = [
    {
      id: 1,
      type: 'notification',
      message: 'Notification sent to 150 devices',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: 2,
      type: 'device',
      message: '5 new devices registered',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: 3,
      type: 'config',
      message: 'FCM configuration updated',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    },
  ]
}

function getActivityColor(type: string) {
  switch (type) {
    case 'notification': return 'bg-blue-500'
    case 'device': return 'bg-green-500'
    case 'config': return 'bg-orange-500'
    default: return 'bg-gray-500'
  }
}

function formatTime(timestamp: Date) {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.round((timestamp.getTime() - Date.now()) / (1000 * 60)),
    'minute',
  )
}

async function copyApiKey() {
  try {
    await navigator.clipboard.writeText((app as any)?.apiKey || '')
    // TODO: Show success toast
  }
  catch (error) {
    console.error('Failed to copy API key:', error)
  }
}

onMounted(() => {
  _initializeRecentActivity()
})
</script>

<template>
  <div v-if="app">
    <!-- App Header -->
    <AppDetailHeader :app="app" />

    <!-- Navigation -->
    <AppNavigation :app-id="appId" />

    <!-- Overview Content -->
    <div class="space-y-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Devices</CardTitle>
            <Smartphone class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stats.totalDevices }}</div>
            <p class="text-xs text-muted-foreground">
              <span class="text-green-600">+{{ stats.newDevicesToday }}</span> today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Notifications Sent</CardTitle>
            <Send class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stats.sentToday }}</div>
            <p class="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Delivery Rate</CardTitle>
            <TrendingUp class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stats.deliveryRate }}%</div>
            <p class="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">API Calls</CardTitle>
            <Activity class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stats.apiCalls }}</div>
            <p class="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      <!-- API Key -->
      <Card>
        <CardHeader>
          <CardTitle>API Key</CardTitle>
          <CardDescription>Use this key to authenticate API requests for this app</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-center space-x-2">
            <Input
              :model-value="showApiKey ? app.apiKey : '•'.repeat(32)"
              readonly
              class="font-mono"
            />
            <Button variant="outline" size="icon" @click="showApiKey = !showApiKey">
              <Eye v-if="!showApiKey" class="h-4 w-4" />
              <EyeOff v-else class="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" @click="copyApiKey">
              <Copy class="h-4 w-4" />
            </Button>
          </div>
          <p class="text-xs text-muted-foreground mt-2">
            Use as: <code class="bg-muted px-1 rounded">Authorization: ApiKey {{ app.apiKey?.substring(0, 8) }}...</code>
          </p>
        </CardContent>
      </Card>

      <!-- Recent Activity -->
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-for="activity in recentActivity" :key="activity.id" class="flex items-center space-x-4 text-sm">
              <div class="w-2 h-2 rounded-full" :class="getActivityColor(activity.type)"></div>
              <div class="flex-1">
                <p>{{ activity.message }}</p>
                <p class="text-muted-foreground">{{ formatTime(activity.timestamp) }}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>

  <!-- Loading State -->
  <div v-else class="flex items-center justify-center h-64">
    <Loader2 class="h-8 w-8 animate-spin" />
  </div>
</template>
