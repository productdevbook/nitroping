<script setup lang="ts">
import type { DevicePlatform } from '#graphql/client'
import { Badge } from 'abckit/shadcn/badge'
import { Button } from 'abckit/shadcn/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'abckit/shadcn/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from 'abckit/shadcn/dialog'
import { Input } from 'abckit/shadcn/input'
import { Label } from 'abckit/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'abckit/shadcn/select'
import { Textarea } from 'abckit/shadcn/textarea'
import { CheckCircle, Loader2, RefreshCw, Search, Send, Smartphone, XCircle } from 'lucide-vue-next'

definePageMeta({
  layout: 'default',
})

// API queries
const { data: appsData, isLoading: _appsLoading } = useApps()
const apps = computed(() => appsData.value || [])
const { mutateAsync: registerDeviceMutation, isLoading: isRegisteringDevice } = useRegisterDevice()

// Reactive data
const recentDevices = ref<any[]>([])
const testLoading = ref(false)
const deviceTestLoading = ref(false)
const testResult = ref<any>(null)
const showTestDeviceDialog = ref(false)
const selectedDevice = ref<any>(null)

const registrationForm = ref({
  appId: '',
  token: '',
  platform: '',
  userId: '',
  metadata: '',
})

const testForm = ref({
  appId: '',
  token: '',
})

const deviceTestForm = ref({
  title: '',
  body: '',
})

// Methods

async function loadRecentDevices() {
  try {
    // TODO: Implement recent devices API
    recentDevices.value = [
      {
        id: '1',
        appName: 'Mobile App',
        platform: 'android',
        userId: 'user123',
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        lastSeenAt: new Date(),
      },
      {
        id: '2',
        appName: 'Web Dashboard',
        platform: 'web',
        userId: null,
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        lastSeenAt: new Date(Date.now() - 1000 * 60 * 10),
      },
    ]
  }
  catch (error) {
    console.error('Error loading recent devices:', error)
  }
}

async function registerDevice() {
  if (!registrationForm.value.appId || !registrationForm.value.token || !registrationForm.value.platform)
    return

  try {
    const payload = {
      appId: registrationForm.value.appId,
      token: registrationForm.value.token,
      platform: registrationForm.value.platform as DevicePlatform,
      userId: registrationForm.value.userId || undefined,
      metadata: registrationForm.value.metadata ? JSON.parse(registrationForm.value.metadata) : undefined,
    }

    await registerDeviceMutation(payload)

    console.log('Device registered successfully!')

    // Reset form
    registrationForm.value = {
      appId: '',
      token: '',
      platform: '',
      userId: '',
      metadata: '',
    }

    await loadRecentDevices()

    // TODO: Show success toast
  }
  catch (error) {
    console.error('Error registering device:', error)
    // TODO: Show error toast
  }
}

async function testToken() {
  if (!testForm.value.appId || !testForm.value.token)
    return

  testLoading.value = true
  testResult.value = null

  try {
    // TODO: Implement token validation API
    console.log('Would test token:', testForm.value)

    // Mock response
    await new Promise(resolve => setTimeout(resolve, 1000))

    testResult.value = {
      success: true,
      message: 'Device token is valid and registered',
      device: {
        id: 'device-123',
        platform: 'android',
        status: 'active',
        userId: 'user123',
        lastSeenAt: new Date(),
      },
    }
  }
  catch {
    testResult.value = {
      success: false,
      message: 'Device token not found or invalid',
    }
  }
  finally {
    testLoading.value = false
  }
}

function sendTestToDevice(device: any) {
  selectedDevice.value = device
  deviceTestForm.value = {
    title: 'Test Notification',
    body: 'This is a test notification from NitroPing',
  }
  showTestDeviceDialog.value = true
}

async function sendTestToSelectedDevice() {
  if (!deviceTestForm.value.title || !deviceTestForm.value.body)
    return

  deviceTestLoading.value = true
  try {
    // TODO: Send test notification to specific device
    console.log('Would send test to device:', selectedDevice.value.id, deviceTestForm.value)

    await new Promise(resolve => setTimeout(resolve, 1000))

    showTestDeviceDialog.value = false
    deviceTestForm.value = { title: '', body: '' }

    // TODO: Show success toast
  }
  catch (error) {
    console.error('Error sending test notification:', error)
    // TODO: Show error toast
  }
  finally {
    deviceTestLoading.value = false
  }
}

function getPlatformBg(platform: string) {
  switch (platform) {
    case 'android': return 'bg-green-100 dark:bg-green-900'
    case 'ios': return 'bg-blue-100 dark:bg-blue-900'
    case 'web': return 'bg-purple-100 dark:bg-purple-900'
    default: return 'bg-gray-100 dark:bg-gray-900'
  }
}

function getPlatformText(platform: string) {
  switch (platform) {
    case 'android': return 'text-green-600'
    case 'ios': return 'text-blue-600'
    case 'web': return 'text-purple-600'
    default: return 'text-gray-600'
  }
}

function formatDate(date: Date) {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.round((date.getTime() - Date.now()) / (1000 * 60)),
    'minute',
  )
}

// Load data on mount
onMounted(() => {
  loadRecentDevices()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Device Testing</h1>
      <p class="text-muted-foreground">Test device registration and token validation</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Device Registration -->
      <Card>
        <CardHeader>
          <CardTitle>Register Test Device</CardTitle>
          <CardDescription>Register a device to test push notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <form class="space-y-4" @submit.prevent="registerDevice">
            <div class="space-y-2">
              <Label for="app">Application *</Label>
              <Select v-model="registrationForm.appId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select an app" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="app in (apps || [])" :key="app.id" :value="app.id">
                    {{ app.name }} ({{ app.slug }})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label for="token">Device Token *</Label>
              <Textarea
                id="token"
                v-model="registrationForm.token"
                placeholder="Device push token..."
                required
                rows="3"
              />
              <p class="text-xs text-muted-foreground">
                FCM token, APNs device token, or Web Push endpoint
              </p>
            </div>

            <div class="space-y-2">
              <Label for="platform">Platform *</Label>
              <Select v-model="registrationForm.platform" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="android">Android (FCM)</SelectItem>
                  <SelectItem value="ios">iOS (APNs)</SelectItem>
                  <SelectItem value="web">Web (Web Push)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label for="userId">User ID (Optional)</Label>
              <Input
                id="userId"
                v-model="registrationForm.userId"
                placeholder="user123"
              />
            </div>

            <div class="space-y-2">
              <Label for="metadata">Metadata (JSON, Optional)</Label>
              <Textarea
                id="metadata"
                v-model="registrationForm.metadata"
                placeholder="{&quot;deviceName&quot;: &quot;iPhone 15&quot;, &quot;appVersion&quot;: &quot;1.0.0&quot;}"
                rows="3"
              />
            </div>

            <Button type="submit" :disabled="!registrationForm.appId || !registrationForm.token || !registrationForm.platform || isRegisteringDevice" class="w-full">
              <Loader2 v-if="isRegisteringDevice" class="w-4 h-4 mr-2 animate-spin" />
              <Smartphone class="w-4 h-4 mr-2" />
              Register Device
            </Button>
          </form>
        </CardContent>
      </Card>

      <!-- Quick Test -->
      <Card>
        <CardHeader>
          <CardTitle>Quick Token Test</CardTitle>
          <CardDescription>Test if a device token is valid and registered</CardDescription>
        </CardHeader>
        <CardContent>
          <form class="space-y-4" @submit.prevent="testToken">
            <div class="space-y-2">
              <Label for="test-app">Application *</Label>
              <Select v-model="testForm.appId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select an app" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="app in (apps || [])" :key="app.id" :value="app.id">
                    {{ app.name }} ({{ app.slug }})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label for="test-token">Device Token *</Label>
              <Textarea
                id="test-token"
                v-model="testForm.token"
                placeholder="Device push token to test..."
                required
                rows="3"
              />
            </div>

            <Button type="submit" :disabled="!testForm.appId || !testForm.token || testLoading" class="w-full">
              <Loader2 v-if="testLoading" class="w-4 h-4 mr-2 animate-spin" />
              <Search class="w-4 h-4 mr-2" />
              Test Token
            </Button>
          </form>

          <!-- Test Results -->
          <div v-if="testResult" class="mt-4 p-4 rounded-lg" :class="testResult.success ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'">
            <div class="flex items-center space-x-2 mb-2">
              <CheckCircle v-if="testResult.success" class="h-5 w-5 text-green-600" />
              <XCircle v-else class="h-5 w-5 text-red-600" />
              <span class="font-medium">{{ testResult.success ? 'Token Valid' : 'Token Invalid' }}</span>
            </div>
            <p class="text-sm text-muted-foreground">{{ testResult.message }}</p>
            <div v-if="testResult.success && testResult.device" class="mt-3 space-y-1 text-sm">
              <p><strong>Device ID:</strong> {{ testResult.device.id }}</p>
              <p><strong>Platform:</strong> {{ testResult.device.platform }}</p>
              <p><strong>Status:</strong> {{ testResult.device.status }}</p>
              <p v-if="testResult.device.userId"><strong>User ID:</strong> {{ testResult.device.userId }}</p>
              <p><strong>Last Seen:</strong> {{ formatDate(testResult.device.lastSeenAt) }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Recently Registered Devices -->
    <Card class="mt-6">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Recently Registered Devices</CardTitle>
            <CardDescription>Latest device registrations across all apps</CardDescription>
          </div>
          <Button variant="outline" @click="loadRecentDevices">
            <RefreshCw class="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="recentDevices.length > 0" class="space-y-4">
          <div v-for="device in recentDevices" :key="device.id" class="flex items-center justify-between p-4 border rounded-lg">
            <div class="flex items-center space-x-4">
              <div class="h-10 w-10 rounded-lg flex items-center justify-center" :class="getPlatformBg(device.platform)">
                <Smartphone class="h-5 w-5" :class="getPlatformText(device.platform)" />
              </div>
              <div>
                <p class="font-medium">{{ device.appName }}</p>
                <p class="text-sm text-muted-foreground">{{ device.platform }} • {{ device.userId || 'Anonymous' }}</p>
                <p class="text-xs text-muted-foreground">Registered {{ formatDate(device.createdAt) }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <Badge :variant="device.status === 'active' ? 'default' : 'secondary'">
                {{ device.status }}
              </Badge>
              <Button variant="outline" size="sm" @click="sendTestToDevice(device)">
                <Send class="w-4 h-4 mr-1" />
                Test
              </Button>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8">
          <Smartphone class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p class="text-muted-foreground">No devices registered yet</p>
        </div>
      </CardContent>
    </Card>

    <!-- Send Test to Device Dialog -->
    <Dialog v-model:open="showTestDeviceDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Test Notification</DialogTitle>
          <DialogDescription>Send a test notification to {{ selectedDevice?.appName }} device</DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="sendTestToSelectedDevice">
          <div class="space-y-2">
            <Label for="device-test-title">Title *</Label>
            <Input
              id="device-test-title"
              v-model="deviceTestForm.title"
              placeholder="Test Notification"
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="device-test-body">Message *</Label>
            <Textarea
              id="device-test-body"
              v-model="deviceTestForm.body"
              placeholder="This is a test notification"
              required
              rows="3"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showTestDeviceDialog = false">Cancel</Button>
            <Button type="submit" :disabled="!deviceTestForm.title || !deviceTestForm.body || deviceTestLoading">
              <Loader2 v-if="deviceTestLoading" class="w-4 h-4 mr-2 animate-spin" />
              Send Test
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
