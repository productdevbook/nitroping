<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold mb-2">NitroPing Dashboard</h1>
      <p class="text-muted-foreground">Self-hosted push notification service</p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Apps</CardTitle>
          <Activity class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats?.totalApps || 0 }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Active Devices</CardTitle>
          <Smartphone class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats?.activeDevices || 0 }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Notifications Sent</CardTitle>
          <Send class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats?.notificationsSent || 0 }}</div>
          <p class="text-xs text-muted-foreground">Last 24 hours</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Delivery Rate</CardTitle>
          <TrendingUp class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats?.deliveryRate || 0 }}%</div>
          <p class="text-xs text-muted-foreground">Last 24 hours</p>
        </CardContent>
      </Card>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New App</CardTitle>
          <CardDescription>Register a new application to start sending notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <Button @click="navigateTo('/apps/create')" class="w-full">
            <Plus class="mr-2 h-4 w-4" />
            Create App
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send Notification</CardTitle>
          <CardDescription>Send a test notification to your devices</CardDescription>
        </CardHeader>
        <CardContent>
          <Button @click="showSendNotification = true" class="w-full">
            <Send class="mr-2 h-4 w-4" />
            Send Test
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>View Analytics</CardTitle>
          <CardDescription>Check delivery reports and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Button @click="navigateTo('/analytics')" class="w-full">
            <BarChart3 class="mr-2 h-4 w-4" />
            View Analytics
          </Button>
        </CardContent>
      </Card>
    </div>

    <!-- Getting Started -->
    <Card>
      <CardHeader>
        <CardTitle>Getting Started</CardTitle>
        <CardDescription>Quick guide to set up your first push notification</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-start space-x-4">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">1</div>
          <div>
            <h4 class="font-medium">Create an App</h4>
            <p class="text-sm text-muted-foreground">Register your application and get API credentials</p>
          </div>
        </div>
        <div class="flex items-start space-x-4">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">2</div>
          <div>
            <h4 class="font-medium">Configure Providers</h4>
            <p class="text-sm text-muted-foreground">Set up FCM, APNs, or Web Push credentials</p>
          </div>
        </div>
        <div class="flex items-start space-x-4">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">3</div>
          <div>
            <h4 class="font-medium">Register Devices</h4>
            <p class="text-sm text-muted-foreground">Use the API to register user devices</p>
          </div>
        </div>
        <div class="flex items-start space-x-4">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">4</div>
          <div>
            <h4 class="font-medium">Send Notifications</h4>
            <p class="text-sm text-muted-foreground">Start sending push notifications to your users</p>
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
          <Button @click="showSendNotification = false" variant="outline">Cancel</Button>
          <Button @click="sendTestNotification" :disabled="!testNotification.title || !testNotification.body">
            Send Notification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Activity, Smartphone, Send, TrendingUp, Plus, BarChart3, Loader2 } from 'lucide-vue-next'

// API queries
const { data: statsData } = useDashboardStats()
const stats = computed(() => statsData.value)

const showSendNotification = ref(false)

const testNotification = ref({
  title: '',
  body: ''
})

// Methods

async function sendTestNotification() {
  try {
    // This would need an API key from a created app
    console.log('Would send notification:', testNotification.value)
    showSendNotification.value = false
    
    // Reset form
    testNotification.value = {
      title: '',
      body: ''
    }
    
    // TODO: Implement actual sending with proper auth
  } catch (error) {
    console.error('Error sending notification:', error)
  }
}

// Stats are automatically loaded by useStats() composable
</script>