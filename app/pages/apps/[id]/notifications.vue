<script setup lang="ts">
import { Calendar, CheckCircle, Loader2, Search, Send, XCircle } from 'lucide-vue-next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const appId = computed(() => route.params.id as string)

// API queries
const { data: appData } = useApp(appId)
const app = computed(() => appData.value)

// TODO: Add notifications GraphQL query
// const { data: notificationsData, isLoading: notificationsLoading } = useNotifications(appId)
// const notifications = computed(() => notificationsData.value || [])

// Mock data for now
const notificationsLoading = ref(false)
const notifications = ref([
  {
    id: '1',
    title: 'Welcome to NitroPing!',
    body: 'Thanks for registering. You can now receive push notifications.',
    status: 'delivered',
    targetCount: 150,
    deliveredCount: 148,
    failedCount: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    sentAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: '2',
    title: 'New Feature Available',
    body: 'Check out our latest update with enhanced notification targeting.',
    status: 'sending',
    targetCount: 200,
    deliveredCount: 120,
    failedCount: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    title: 'Server Maintenance',
    body: 'Scheduled maintenance will occur tonight from 2-4 AM UTC.',
    status: 'failed',
    targetCount: 100,
    deliveredCount: 0,
    failedCount: 100,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    sentAt: null,
  },
])

// Reactive data
const searchQuery = ref('')
const selectedStatus = ref('all')
const selectedTimeRange = ref('7d')

// Filtered notifications
const filteredNotifications = computed(() => {
  let filtered = notifications.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(notification =>
      notification.title.toLowerCase().includes(query)
      || notification.body.toLowerCase().includes(query),
    )
  }

  if (selectedStatus.value !== 'all') {
    filtered = filtered.filter(notification => notification.status === selectedStatus.value)
  }

  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

// Notification stats
const notificationStats = computed(() => {
  const stats = notifications.value.reduce((acc, notification) => {
    acc.total++
    acc.totalTargeted += notification.targetCount
    acc.totalDelivered += notification.deliveredCount
    acc.totalFailed += notification.failedCount

    switch (notification.status) {
      case 'delivered': acc.delivered++; break
      case 'sending': acc.sending++; break
      case 'failed': acc.failed++; break
    }

    return acc
  }, {
    total: 0,
    delivered: 0,
    sending: 0,
    failed: 0,
    totalTargeted: 0,
    totalDelivered: 0,
    totalFailed: 0,
  })

  stats.deliveryRate = stats.totalTargeted > 0
    ? Math.round((stats.totalDelivered / stats.totalTargeted) * 100)
    : 0

  return stats
})

function getStatusBadge(status: string) {
  switch (status) {
    case 'delivered':
      return { variant: 'default' as const, icon: CheckCircle, text: 'Delivered' }
    case 'sending':
      return { variant: 'secondary' as const, icon: Send, text: 'Sending' }
    case 'failed':
      return { variant: 'destructive' as const, icon: XCircle, text: 'Failed' }
    default:
      return { variant: 'secondary' as const, icon: Send, text: 'Unknown' }
  }
}

function formatDate(dateString: string | null) {
  if (!dateString)
    return 'Not sent'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

function formatTimeAgo(dateString: string) {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1)
    return 'Just now'
  if (diffMinutes < 60)
    return `${diffMinutes}m ago`
  if (diffHours < 24)
    return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function getDeliveryRate(notification: any) {
  if (notification.targetCount === 0)
    return 0
  return Math.round((notification.deliveredCount / notification.targetCount) * 100)
}

function viewNotificationDetails(notificationId: string) {
  // TODO: Navigate to notification details page
  navigateTo(`/apps/${appId.value}/notifications/${notificationId}`)
}

function refreshNotifications() {
  // TODO: Refresh notifications list
  console.log('Refresh notifications')
}
</script>

<template>
  <div v-if="app">
    <!-- App Header -->
    <AppDetailHeader :app="app" />

    <!-- Navigation -->
    <AppNavigation :app-id="appId" />

    <!-- Notifications Content -->
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold mb-2">Notification History</h2>
          <p class="text-muted-foreground">View and manage your sent notifications and their delivery status.</p>
        </div>
        <div class="flex space-x-2">
          <Button variant="outline" :disabled="notificationsLoading" @click="refreshNotifications">
            <Send class="mr-2 h-4 w-4" :class="{ 'animate-pulse': notificationsLoading }" />
            Refresh
          </Button>
          <Button @click="navigateTo('/send')">
            <Send class="mr-2 h-4 w-4" />
            Send New
          </Button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Sent</CardTitle>
            <Send class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ notificationStats.total }}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-green-600">{{ notificationStats.totalDelivered }}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Failed</CardTitle>
            <XCircle class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-red-600">{{ notificationStats.totalFailed }}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Delivery Rate</CardTitle>
            <Calendar class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ notificationStats.deliveryRate }}%</div>
          </CardContent>
        </Card>
      </div>

      <!-- Filters -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <div class="relative">
                <Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  v-model="searchQuery"
                  placeholder="Search notifications by title or content..."
                  class="pl-10"
                />
              </div>
            </div>
            <Select v-model="selectedStatus">
              <SelectTrigger class="w-full sm:w-40">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select v-model="selectedTimeRange">
              <SelectTrigger class="w-full sm:w-32">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <!-- Notifications Table -->
      <Card>
        <CardHeader>
          <CardTitle>Notifications ({{ filteredNotifications.length }})</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="notificationsLoading" class="flex items-center justify-center py-8">
            <Loader2 class="h-6 w-6 animate-spin" />
          </div>

          <div v-else-if="filteredNotifications.length === 0" class="text-center py-8 text-muted-foreground">
            <Send class="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p class="text-lg font-medium mb-2">No notifications found</p>
            <p class="text-sm">{{ notifications.length === 0 ? 'Send your first notification to get started.' : 'Try adjusting your search filters.' }}</p>
          </div>

          <Table v-else>
            <TableHeader>
              <TableRow>
                <TableHead>Notification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="notification in filteredNotifications" :key="notification.id">
                <TableCell>
                  <div class="space-y-1">
                    <p class="font-medium">{{ notification.title }}</p>
                    <p class="text-sm text-muted-foreground line-clamp-2">{{ notification.body }}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge :variant="getStatusBadge(notification.status).variant">
                    <component :is="getStatusBadge(notification.status).icon" class="mr-1 h-3 w-3" />
                    {{ getStatusBadge(notification.status).text }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="space-y-1">
                    <div class="flex items-center space-x-2">
                      <span class="text-sm font-medium">{{ getDeliveryRate(notification) }}%</span>
                      <span class="text-xs text-muted-foreground">({{ notification.deliveredCount }}/{{ notification.targetCount }})</span>
                    </div>
                    <div v-if="notification.failedCount > 0" class="text-xs text-red-600">
                      {{ notification.failedCount }} failed
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span class="text-sm">{{ formatDate(notification.sentAt) }}</span>
                </TableCell>
                <TableCell>
                  <span class="text-sm text-muted-foreground">{{ formatTimeAgo(notification.createdAt) }}</span>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" @click="viewNotificationDetails(notification.id)">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>

  <!-- Loading State -->
  <div v-else class="flex items-center justify-center h-64">
    <Loader2 class="h-8 w-8 animate-spin" />
  </div>
</template>
