<script setup lang="ts">
import { usePush } from 'notivue'
import Icon from '~/components/common/Icon.vue'
import AppDetailHeader from '~/components/app/AppDetailHeader.vue'
import AppNavigation from '~/components/app/AppNavigation.vue'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useApp } from '~/graphql'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'

const route = useRoute()
const appId = computed(() => route.params.id as string)
const push = usePush()

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
const isApiKeyCopied = ref(false)

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
    await navigator.clipboard.writeText((app as any).value?.apiKey || '')

    push.success('API key copied to clipboard!')

    isApiKeyCopied.value = true

    setTimeout(() => {
      isApiKeyCopied.value = false
    }, 2000)
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
            <Icon name="lucide:smartphone" class="size-4 text-muted-foreground" />
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
            <Icon name="lucide:send" class="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stats.sentToday }}</div>
            <p class="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Delivery Rate</CardTitle>
            <Icon name="lucide:trending-up" class="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stats.deliveryRate }}%</div>
            <p class="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">API Calls</CardTitle>
            <Icon name="lucide:activity" class="size-4 text-muted-foreground" />
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
            <Input :model-value="showApiKey ? app.apiKey : '•'.repeat(32)" readonly class="font-mono" />
            <Button variant="outline" size="icon" @click="showApiKey = !showApiKey">
              <Icon v-if="!showApiKey" name="lucide:eye" class="size-4" />
              <Icon v-else name="lucide:eye-off" class="size-4" />
            </Button>
            <Button
              variant="outline" size="icon" :class="isApiKeyCopied ? 'text-green-600 border-green-600' : ''"
              @click="copyApiKey"
            >
              <Icon v-if="isApiKeyCopied" name="lucide:check" class="size-4" />
              <Icon v-else name="lucide:copy" class="size-4" />
            </Button>
          </div>
          <p class="text-xs text-muted-foreground mt-2">
            Use as: <code class="bg-muted px-1 rounded">
              Authorization: ApiKey {{ app.apiKey?.substring(0, 8) }}...
            </code>
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
    <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin" />
  </div>
</template>
