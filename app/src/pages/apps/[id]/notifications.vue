<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { usePush } from 'notivue'
import Icon from '~/components/common/Icon.vue'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Textarea } from '~/components/ui/textarea'
import { useApp, useNotificationApi, useSendNotification } from '~/graphql'
import { useContacts } from '~/graphql/contacts'

const route = useRoute()
const router = useRouter()
const push = usePush()
const appId = computed(() => route.params.id as string)

// API queries
const { data: appData } = useApp(appId)
const app = computed(() => appData.value)

const { data: notificationsData, isLoading: notificationsLoading, refetch: refetchNotifications } = useNotificationApi(appId)
const notifications = computed(() => notificationsData.value || [])

// ── Send Notification Dialog ───────────────────────────────────────────────
const sendDialogOpen = ref(false)
const channelType = ref('PUSH')
const sendTitle = ref('')
const sendBody = ref('')
const contactTargetType = ref<'all' | 'specific'>('all')
const selectedContactIds = ref<string[]>([])
const scheduleType = ref<'now' | 'later'>('now')
const scheduledAt = ref('')

const { data: contactsData } = useContacts(appId)
const contacts = computed(() => contactsData.value || [])
const { mutateAsync: sendNotificationMutation, isLoading: isSending } = useSendNotification()

const isContactBased = computed(() => ['EMAIL', 'SMS', 'IN_APP'].includes(channelType.value))

const channelIcons: Record<string, string> = {
  PUSH: 'lucide:smartphone',
  EMAIL: 'lucide:mail',
  SMS: 'lucide:message-square',
  IN_APP: 'lucide:bell',
  DISCORD: 'lucide:message-circle',
}

watch(channelType, () => {
  contactTargetType.value = 'all'
  selectedContactIds.value = []
})

function toggleContact(id: string) {
  const idx = selectedContactIds.value.indexOf(id)
  if (idx === -1) selectedContactIds.value.push(id)
  else selectedContactIds.value.splice(idx, 1)
}

async function doSend() {
  if (!sendTitle.value || !sendBody.value) return
  try {
    const input: any = {
      appId: appId.value,
      title: sendTitle.value,
      body: sendBody.value,
      channelType: channelType.value === 'PUSH' ? undefined : channelType.value,
      scheduledAt: scheduleType.value === 'later' ? scheduledAt.value : undefined,
    }
    if (isContactBased.value && contactTargetType.value === 'specific' && selectedContactIds.value.length > 0) {
      input.contactIds = selectedContactIds.value
    }
    await sendNotificationMutation(input)
    push.success({ title: 'Notification sent!' })
    sendDialogOpen.value = false
    sendTitle.value = ''
    sendBody.value = ''
    selectedContactIds.value = []
    scheduleType.value = 'now'
    scheduledAt.value = ''
    refetchNotifications()
  }
  catch (error) {
    push.error({ title: 'Send failed', message: error instanceof Error ? error.message : 'Unknown error' })
  }
}

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
    acc.totalTargeted += notification.totalTargets || 0
    acc.totalDelivered += notification.totalSent || 0
    acc.totalFailed += notification.totalFailed || 0

    switch (notification.status) {
      case 'DELIVERED':
        acc.delivered++
        break
      case 'SENT':
        acc.sent++
        break
      case 'PENDING':
        acc.pending++
        break
      case 'SCHEDULED':
        acc.scheduled++
        break
      case 'FAILED':
        acc.failed++
        break
    }

    return acc
  }, {
    total: 0,
    delivered: 0,
    sent: 0,
    pending: 0,
    scheduled: 0,
    failed: 0,
    totalTargeted: 0,
    totalDelivered: 0,
    totalFailed: 0,
    deliveryRate: 0,
  })

  stats.deliveryRate = stats.totalTargeted > 0
    ? Math.round((stats.totalDelivered / stats.totalTargeted) * 100)
    : 0
  // totalDelivered here tracks totalSent (provider-level delivery)

  return stats
})

function getStatusBadge(status: string) {
  switch (status) {
    case 'DELIVERED':
      return { variant: 'default' as const, iconName: 'lucide:check-circle', text: 'Delivered' }
    case 'SENT':
      return { variant: 'secondary' as const, iconName: 'lucide:send', text: 'Sent' }
    case 'PENDING':
      return { variant: 'outline' as const, iconName: 'lucide:loader-2', text: 'Pending' }
    case 'SCHEDULED':
      return { variant: 'outline' as const, iconName: 'lucide:calendar', text: 'Scheduled' }
    case 'FAILED':
      return { variant: 'destructive' as const, iconName: 'lucide:x-circle', text: 'Failed' }
    default:
      return { variant: 'secondary' as const, iconName: 'lucide:send', text: 'Unknown' }
  }
}

function formatDate(dateString: string | null | undefined) {
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
  if (notification.totalTargets === 0)
    return 0
  return Math.round((notification.totalSent / notification.totalTargets) * 100)
}


function refreshNotifications() {
  refetchNotifications()
}
</script>

<template>
  <div v-if="app">
    <!-- App Header -->

    <!-- Navigation -->

    <!-- Notifications Content -->
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold mb-2">
            Notification History
          </h2>
          <p class="text-muted-foreground">
            View and manage your sent notifications and their delivery status.
          </p>
        </div>
        <div class="flex space-x-2">
          <Button variant="outline" :disabled="notificationsLoading" @click="refreshNotifications">
            <Icon name="lucide:refresh-cw" :class="`mr-2 size-4${notificationsLoading ? ' animate-spin' : ''}`" />
            Refresh
          </Button>
          <Dialog v-model:open="sendDialogOpen">
            <DialogTrigger as-child>
              <Button>
                <Icon name="lucide:send" class="mr-2 size-4" />
                Send New
              </Button>
            </DialogTrigger>
            <DialogContent class="max-w-lg">
              <DialogHeader>
                <DialogTitle>Send Notification</DialogTitle>
              </DialogHeader>
              <div class="space-y-4 pt-2">
                <!-- Channel -->
                <div class="space-y-2">
                  <Label>Channel</Label>
                  <Select v-model="channelType">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUSH">
                        <div class="flex items-center gap-2">
                          <Icon name="lucide:smartphone" class="size-4" />
                          Push Notification
                        </div>
                      </SelectItem>
                      <SelectItem value="EMAIL">
                        <div class="flex items-center gap-2">
                          <Icon name="lucide:mail" class="size-4" />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="SMS">
                        <div class="flex items-center gap-2">
                          <Icon name="lucide:message-square" class="size-4" />
                          SMS
                        </div>
                      </SelectItem>
                      <SelectItem value="IN_APP">
                        <div class="flex items-center gap-2">
                          <Icon name="lucide:bell" class="size-4" />
                          In-App
                        </div>
                      </SelectItem>
                      <SelectItem value="DISCORD">
                        <div class="flex items-center gap-2">
                          <Icon name="lucide:message-circle" class="size-4" />
                          Discord
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <!-- Title -->
                <div class="space-y-2">
                  <Label>Title *</Label>
                  <Input v-model="sendTitle" placeholder="Notification title" />
                </div>

                <!-- Body -->
                <div class="space-y-2">
                  <Label>Body *</Label>
                  <Textarea v-model="sendBody" placeholder="Message content..." :rows="3" />
                </div>

                <!-- Recipients (contact-based channels) -->
                <div v-if="isContactBased" class="space-y-2">
                  <Label>Recipients</Label>
                  <div class="flex gap-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <Checkbox :model-value="contactTargetType === 'all'" @update:model-value="contactTargetType = 'all'" />
                      <span class="text-sm">All contacts ({{ contacts.length }})</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <Checkbox :model-value="contactTargetType === 'specific'" @update:model-value="contactTargetType = 'specific'" />
                      <span class="text-sm">Select contacts</span>
                    </label>
                  </div>
                  <div v-if="contactTargetType === 'specific'" class="border rounded-lg divide-y max-h-40 overflow-y-auto">
                    <label
                      v-for="contact in contacts"
                      :key="contact.id"
                      class="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50"
                    >
                      <Checkbox
                        :model-value="selectedContactIds.includes(contact.id)"
                        @update:model-value="toggleContact(contact.id)"
                      />
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium truncate">{{ contact.name || contact.externalId }}</p>
                        <p class="text-xs text-muted-foreground truncate">{{ contact.email || contact.phone || '—' }}</p>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- Schedule -->
                <div class="space-y-2">
                  <Label>Schedule</Label>
                  <div class="flex gap-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <Checkbox :model-value="scheduleType === 'now'" @update:model-value="scheduleType = 'now'" />
                      <span class="text-sm">Send now</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <Checkbox :model-value="scheduleType === 'later'" @update:model-value="scheduleType = 'later'" />
                      <span class="text-sm">Schedule</span>
                    </label>
                  </div>
                  <Input
                    v-if="scheduleType === 'later'"
                    v-model="scheduledAt"
                    type="datetime-local"
                    :min="new Date().toISOString().slice(0, 16)"
                  />
                </div>

                <!-- Submit -->
                <Button
                  class="w-full"
                  :disabled="!sendTitle || !sendBody || isSending"
                  @click="doSend"
                >
                  <Icon v-if="isSending" name="lucide:loader-2" class="mr-2 size-4 animate-spin" />
                  <Icon v-else :name="channelIcons[channelType] || 'lucide:send'" class="mr-2 size-4" />
                  {{ scheduleType === 'now' ? 'Send Now' : 'Schedule' }}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Total Sent
            </CardTitle>
            <Icon name="lucide:send" class="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ notificationStats.total }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Delivered
            </CardTitle>
            <Icon name="lucide:check-circle" class="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-green-600">
              {{ notificationStats.totalDelivered }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Failed
            </CardTitle>
            <Icon name="lucide:x-circle" class="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-red-600">
              {{ notificationStats.totalFailed }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Delivery Rate
            </CardTitle>
            <Icon name="lucide:calendar" class="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ notificationStats.deliveryRate }}%
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Filters -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <div class="relative">
                <Icon name="lucide:search" class="absolute left-3 top-3 size-4 text-muted-foreground" />
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
                <SelectItem value="all">
                  All status
                </SelectItem>
                <SelectItem value="DELIVERED">
                  Delivered
                </SelectItem>
                <SelectItem value="SENT">
                  Sent
                </SelectItem>
                <SelectItem value="PENDING">
                  Pending
                </SelectItem>
                <SelectItem value="SCHEDULED">
                  Scheduled
                </SelectItem>
                <SelectItem value="FAILED">
                  Failed
                </SelectItem>
              </SelectContent>
            </Select>
            <Select v-model="selectedTimeRange">
              <SelectTrigger class="w-full sm:w-32">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">
                  Last 24h
                </SelectItem>
                <SelectItem value="7d">
                  Last 7 days
                </SelectItem>
                <SelectItem value="30d">
                  Last 30 days
                </SelectItem>
                <SelectItem value="all">
                  All time
                </SelectItem>
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
            <Icon name="lucide:loader-2" class="h-6 w-6 animate-spin" />
          </div>

          <div v-else-if="filteredNotifications.length === 0" class="text-center py-8 text-muted-foreground">
            <Icon name="lucide:send" class="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p class="text-lg font-medium mb-2">
              No notifications found
            </p>
            <p class="text-sm">
              {{ notifications.length === 0 ? 'Send your first notification to get started.' : 'Try adjusting your search filters.' }}
            </p>
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
                    <p class="font-medium">
                      {{ notification.title }}
                    </p>
                    <p class="text-sm text-muted-foreground line-clamp-2">
                      {{ notification.body }}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge :variant="getStatusBadge(notification.status).variant">
                    <Icon :name="getStatusBadge(notification.status).iconName" class="mr-1 h-3 w-3" />
                    {{ getStatusBadge(notification.status).text }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="space-y-1">
                    <div class="flex items-center space-x-2">
                      <span class="text-sm font-medium">{{ getDeliveryRate(notification) }}%</span>
                      <span class="text-xs text-muted-foreground">({{ notification.totalSent }}/{{ notification.totalTargets }})</span>
                    </div>
                    <div v-if="notification.totalFailed > 0" class="text-xs text-red-600">
                      {{ notification.totalFailed }} failed
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
                  <Button
                    variant="ghost"
                    size="sm"
                    :as="RouterLink"
                    :to="`/apps/${appId}/notifications/${notification.id}`"
                  >
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
    <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin" />
  </div>
</template>
