<script setup lang="ts">
import {
  Activity,
  ArrowLeft,
  Copy,
  Download,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Send,
  Smartphone,
  TrendingUp,
} from 'lucide-vue-next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Textarea } from '~/components/ui/textarea'

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
const showSendTest = ref(false)
const testNotification = ref({
  title: '',
  body: '',
})

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

function configureFCM() {
  // TODO: Open FCM configuration dialog
  console.log('Configure FCM')
}

function configureAPNs() {
  // TODO: Open APNs configuration dialog
  console.log('Configure APNs')
}

function configureWebPush() {
  // TODO: Open Web Push configuration dialog
  console.log('Configure Web Push')
}

async function sendTestNotification() {
  try {
    // TODO: Implement test notification sending
    console.log('Send test notification:', testNotification.value)
    showSendTest.value = false
    testNotification.value = { title: '', body: '' }
  }
  catch (error) {
    console.error('Error sending test notification:', error)
  }
}
</script>

<template>
  <div v-if="app">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center space-x-4">
        <Button variant="ghost" size="icon" @click="$router.back()">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <div>
          <h1 class="text-3xl font-bold mb-1">{{ app.name }}</h1>
          <p class="text-muted-foreground">{{ app.slug }}</p>
        </div>
        <Badge :variant="app.isActive ? 'default' : 'secondary'">
          {{ app.isActive ? 'Active' : 'Inactive' }}
        </Badge>
      </div>
      <div class="flex space-x-2">
        <Button variant="outline" @click="showSendTest = true">
          <Send class="mr-2 h-4 w-4" />
          Send Test
        </Button>
        <Button variant="outline">
          <Download class="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>
    </div>

    <!-- Tabs -->
    <Tabs default-value="overview" class="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="providers">Push Providers</TabsTrigger>
        <TabsTrigger value="devices">Devices</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <!-- Overview Tab -->
      <TabsContent value="overview">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        <Card class="mb-6">
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
      </TabsContent>

      <!-- Push Providers Tab -->
      <TabsContent value="providers">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- FCM -->
          <Card>
            <CardHeader>
              <div class="flex items-center space-x-3">
                <div class="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                  <Smartphone class="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Firebase FCM</CardTitle>
                  <CardDescription>Android push notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent class="space-y-4">
              <Badge :variant="app.fcmProjectId ? 'default' : 'secondary'">
                {{ app.fcmProjectId ? 'Configured' : 'Not Configured' }}
              </Badge>

              <div v-if="app.fcmProjectId" class="space-y-2">
                <p class="text-sm"><strong>Project ID:</strong> {{ app.fcmProjectId }}</p>
                <p class="text-sm text-muted-foreground">Service account configured</p>
              </div>

              <Button variant="outline" size="sm" @click="configureFCM">
                {{ app.fcmProjectId ? 'Update' : 'Configure' }} FCM
              </Button>
            </CardContent>
          </Card>

          <!-- APNs -->
          <Card>
            <CardHeader>
              <div class="flex items-center space-x-3">
                <div class="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Smartphone class="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Apple APNs</CardTitle>
                  <CardDescription>iOS push notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent class="space-y-4">
              <Badge :variant="app.apnsKeyId ? 'default' : 'secondary'">
                {{ app.apnsKeyId ? 'Configured' : 'Not Configured' }}
              </Badge>

              <div v-if="app.apnsKeyId" class="space-y-2">
                <p class="text-sm"><strong>Key ID:</strong> {{ app.apnsKeyId }}</p>
                <p class="text-sm"><strong>Team ID:</strong> {{ app.apnsTeamId }}</p>
                <p class="text-sm text-muted-foreground">Private key configured</p>
              </div>

              <Button variant="outline" size="sm" @click="configureAPNs">
                {{ app.apnsKeyId ? 'Update' : 'Configure' }} APNs
              </Button>
            </CardContent>
          </Card>

          <!-- Web Push -->
          <Card>
            <CardHeader>
              <div class="flex items-center space-x-3">
                <div class="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Globe class="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Web Push</CardTitle>
                  <CardDescription>Browser notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent class="space-y-4">
              <Badge :variant="app.vapidPublicKey ? 'default' : 'secondary'">
                {{ app.vapidPublicKey ? 'Configured' : 'Not Configured' }}
              </Badge>

              <div v-if="app.vapidPublicKey" class="space-y-2">
                <p class="text-sm"><strong>Subject:</strong> {{ app.vapidSubject }}</p>
                <p class="text-sm text-muted-foreground">VAPID keys configured</p>
              </div>

              <Button variant="outline" size="sm" @click="configureWebPush">
                {{ app.vapidPublicKey ? 'Update' : 'Configure' }} Web Push
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <!-- Other tabs would be implemented similarly -->
      <TabsContent value="devices">
        <Card>
          <CardHeader>
            <CardTitle>Registered Devices</CardTitle>
            <CardDescription>Devices that can receive notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-muted-foreground">Device management coming soon...</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notification History</CardTitle>
            <CardDescription>Recent notifications and their delivery status</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-muted-foreground">Notification history coming soon...</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle>App Settings</CardTitle>
            <CardDescription>Configure your application settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-muted-foreground">Settings panel coming soon...</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <!-- Send Test Dialog -->
    <Dialog v-model:open="showSendTest">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Test Notification</DialogTitle>
          <DialogDescription>Send a test notification to {{ app.name }}</DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="test-title">Title</Label>
            <Input
              id="test-title"
              v-model="testNotification.title"
              placeholder="Hello World!"
            />
          </div>
          <div class="space-y-2">
            <Label for="test-body">Message</Label>
            <Textarea
              id="test-body"
              v-model="testNotification.body"
              placeholder="This is a test notification"
              rows="3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showSendTest = false">Cancel</Button>
          <Button @click="sendTestNotification">Send Test</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>

  <!-- Loading State -->
  <div v-else class="flex items-center justify-center h-64">
    <Loader2 class="h-8 w-8 animate-spin" />
  </div>
</template>
