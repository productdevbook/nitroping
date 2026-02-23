<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '~/components/common/Icon.vue'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { useApps, useDashboardStats, useRecentNotifications, useSendNotification } from '~/graphql'

const router = useRouter()

// API queries
const { data: statsData } = useDashboardStats()
const stats = computed(() => statsData.value)

const { data: appsData } = useApps()
const recentApps = computed(() => appsData.value?.slice(0, 3) || [])

const { data: recentNotificationsData } = useRecentNotifications()
const recentNotifications = computed(() => recentNotificationsData.value || [])

const showSendNotification = ref(false)

const testNotification = ref({
  title: '',
  body: '',
  appId: '',
})

// Methods

const { mutate: sendNotification, isLoading: isSending } = useSendNotification()

async function sendTestNotification() {
  if (!testNotification.value.appId || !testNotification.value.title || !testNotification.value.body) {
    return
  }

  try {
    await sendNotification({
      appId: testNotification.value.appId,
      title: testNotification.value.title,
      body: testNotification.value.body,
    })

    showSendNotification.value = false

    // Reset form
    testNotification.value = {
      title: '',
      body: '',
      appId: '',
    }

    // Refresh recent notifications
    recentNotificationsData.value = undefined
  }
  catch (error) {
    console.error('Error sending notification:', error)
  }
}

// Stats are automatically loaded by useStats() composable
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-3xl sm:text-4xl font-bold mb-2">
            Welcome to NitroPing
          </h1>
          <p class="text-muted-foreground">
            Manage your push notifications with ease
          </p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" @click="router.push('/apps')">
            <Icon name="lucide:activity" class="mr-2 size-4" />
            View Apps
          </Button>
          <Button @click="router.push('/apps/create')">
            <Icon name="lucide:plus" class="mr-2 size-4" />
            Create App
          </Button>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Total Apps
          </CardTitle>
          <Icon name="lucide:activity" class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ stats?.totalApps || 0 }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Active Devices
          </CardTitle>
          <Icon name="lucide:smartphone" class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ stats?.activeDevices || 0 }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Notifications Sent
          </CardTitle>
          <Icon name="lucide:send" class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ stats?.notificationsSent || 0 }}
          </div>
          <p class="text-xs text-muted-foreground">
            Last 24 hours
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Delivery Rate
          </CardTitle>
          <Icon name="lucide:trending-up" class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ stats?.deliveryRate || 0 }}%
          </div>
          <p class="text-xs text-muted-foreground">
            Last 24 hours
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Recent Apps -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Recent Apps</CardTitle>
            <CardDescription>Your recently created applications</CardDescription>
          </div>
          <Button variant="outline" size="sm" @click="router.push('/apps')">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div v-if="recentApps.length > 0" class="space-y-4">
            <div v-for="app in recentApps" :key="app.id" class="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer" @click="router.push(`/apps/${app.id}`)">
              <div class="flex items-center space-x-3">
                <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon name="lucide:activity" class="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p class="font-medium">
                    {{ app.name }}
                  </p>
                  <p class="text-sm text-muted-foreground">
                    {{ app.description || 'No description' }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <div class="w-2 h-2 rounded-full" :class="app.isActive ? 'bg-green-500' : 'bg-gray-400'" />
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <Icon name="lucide:activity" class="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p class="text-sm text-muted-foreground">
              No apps created yet
            </p>
            <Button variant="outline" size="sm" class="mt-2" @click="router.push('/apps/create')">
              Create First App
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Recent Notifications -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Latest notifications sent</CardDescription>
          </div>
          <Button variant="outline" size="sm" @click="router.push('/notifications')">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div v-if="recentNotifications.length > 0" class="space-y-4">
            <div v-for="notification in recentNotifications" :key="notification.id" class="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50">
              <div class="flex-shrink-0">
                <div
                  class="h-8 w-8 rounded-lg flex items-center justify-center" :class="{
                    'bg-green-100 text-green-600': notification.status === 'DELIVERED',
                    'bg-blue-100 text-blue-600': notification.status === 'SENT',
                    'bg-yellow-100 text-yellow-600': notification.status === 'PENDING',
                    'bg-purple-100 text-purple-600': notification.status === 'SCHEDULED',
                    'bg-red-100 text-red-600': notification.status === 'FAILED',
                  }"
                >
                  <Icon name="lucide:send" class="size-4" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate">
                  {{ notification.title }}
                </p>
                <p class="text-sm text-muted-foreground truncate">
                  {{ notification.body }}
                </p>
                <div class="flex items-center space-x-2 mt-1">
                  <span
                    class="text-xs px-2 py-1 rounded-full" :class="{
                      'bg-green-100 text-green-600': notification.status === 'DELIVERED',
                      'bg-blue-100 text-blue-600': notification.status === 'SENT',
                      'bg-yellow-100 text-yellow-600': notification.status === 'PENDING',
                      'bg-purple-100 text-purple-600': notification.status === 'SCHEDULED',
                      'bg-red-100 text-red-600': notification.status === 'FAILED',
                    }"
                  >
                    {{ notification.status }}
                  </span>
                  <span class="text-xs text-muted-foreground">
                    {{ new Intl.DateTimeFormat('en', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(notification.createdAt)) }}
                  </span>
                </div>
              </div>
              <div class="text-right text-xs text-muted-foreground">
                {{ notification.totalDelivered }}/{{ notification.totalTargets }}
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <Icon name="lucide:send" class="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p class="text-sm text-muted-foreground">
              No notifications sent yet
            </p>
            <Button variant="outline" size="sm" class="mt-2" @click="showSendNotification = true">
              Send First Notification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Getting Started Section -->
    <Card>
      <CardHeader>
        <CardTitle>Getting Started</CardTitle>
        <CardDescription>Quick guide to set up push notifications</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-start space-x-4">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            1
          </div>
          <div>
            <h4 class="font-medium">
              Create an App
            </h4>
            <p class="text-sm text-muted-foreground">
              Register your application and get API credentials
            </p>
          </div>
        </div>
        <div class="flex items-start space-x-4">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            2
          </div>
          <div>
            <h4 class="font-medium">
              Configure Providers
            </h4>
            <p class="text-sm text-muted-foreground">
              Set up FCM, APNs, or Web Push credentials
            </p>
          </div>
        </div>
        <div class="flex items-start space-x-4">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            3
          </div>
          <div>
            <h4 class="font-medium">
              Register Devices
            </h4>
            <p class="text-sm text-muted-foreground">
              Use the API to register user devices
            </p>
          </div>
        </div>
        <div class="flex items-start space-x-4">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            4
          </div>
          <div>
            <h4 class="font-medium">
              Send Notifications
            </h4>
            <p class="text-sm text-muted-foreground">
              Start sending push notifications to your users
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Send Notification Dialog -->
    <Dialog v-model:open="showSendNotification">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Test Notification</DialogTitle>
          <DialogDescription>Send a test notification to check your setup</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="notification-app">Select App</Label>
            <Select v-model="testNotification.appId">
              <SelectTrigger>
                <SelectValue placeholder="Choose an app" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="app in appsData" :key="app.id" :value="app.id">
                  {{ app.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-2">
            <Label for="notification-title">Title</Label>
            <Input
              id="notification-title"
              v-model="testNotification.title"
              placeholder="Hello World!"
            />
          </div>
          <div class="grid gap-2">
            <Label for="notification-body">Message</Label>
            <Textarea
              id="notification-body"
              v-model="testNotification.body"
              placeholder="This is a test notification from NitroPing"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showSendNotification = false">
            Cancel
          </Button>
          <Button
            :disabled="!testNotification.appId || !testNotification.title || !testNotification.body || isSending"
            @click="sendTestNotification"
          >
            <Icon v-if="!isSending" name="lucide:send" class="mr-2 size-4" />
            <div v-else class="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {{ isSending ? 'Sending...' : 'Send Notification' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
