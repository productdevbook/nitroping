<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from 'abckit/shadcn/alert'
import { Badge } from 'abckit/shadcn/badge'
import { Button } from 'abckit/shadcn/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'abckit/shadcn/card'
import { Label } from 'abckit/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'abckit/shadcn/select'
import { NitroPingClient } from 'nitroping'

const { success: successToast, error: errorToast } = useToast()

// App selection state
const apps = ref<Array<{ id: string, name: string, slug: string, vapidPublicKey: string | null }>>([])
const selectedAppId = ref<string>('')
const isLoadingApps = ref(true)

// Push subscription state
const isLoading = ref(false)
const error = ref('')
const permissionStatus = ref<NotificationPermission>('default')
const isSubscribed = ref(false)
const subscriptionData = ref<any>(null)
const showSubscriptionDetails = ref(false)

// NitroPing client (initialized when app is selected)
let nitroPingClient: NitroPingClient | null = null

// Selected app computed
const selectedApp = computed(() => {
  return apps.value.find(app => app.id === selectedAppId.value)
})

// Check if selected app has WebPush configured
const hasWebPushConfig = computed(() => {
  return selectedApp.value?.vapidPublicKey != null
})

// Browser support check
const isSupported = computed(() => {
  if (typeof window === 'undefined')
    return false
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
})

// Fetch apps on mount
onMounted(async () => {
  await fetchApps()
  if (isSupported.value) {
    permissionStatus.value = Notification.permission
  }
})

// Watch for app selection changes
watch(selectedAppId, async (newAppId) => {
  if (newAppId && hasWebPushConfig.value) {
    initializeClient()
    await checkSubscription()
  }
  else {
    nitroPingClient = null
    isSubscribed.value = false
    subscriptionData.value = null
  }
})

async function fetchApps() {
  isLoadingApps.value = true
  try {
    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query { apps { id name slug vapidPublicKey } }`,
      }),
    })
    const result = await response.json()
    apps.value = result.data?.apps || []

    // Auto-select first app with WebPush configured
    const appWithWebPush = apps.value.find(app => app.vapidPublicKey)
    if (appWithWebPush) {
      selectedAppId.value = appWithWebPush.id
    }
  }
  catch (err) {
    console.error('Failed to fetch apps:', err)
    errorToast('Error', 'Failed to load apps')
  }
  finally {
    isLoadingApps.value = false
  }
}

function initializeClient() {
  if (!selectedApp.value?.vapidPublicKey)
    return

  nitroPingClient = new NitroPingClient({
    appId: selectedApp.value.id,
    vapidPublicKey: selectedApp.value.vapidPublicKey,
    apiUrl: window.location.origin,
  })
}

async function checkSubscription() {
  if (!isSupported.value || !nitroPingClient)
    return

  try {
    const status = await nitroPingClient.getSubscriptionStatus()
    isSubscribed.value = status.isSubscribed
    subscriptionData.value = status.subscription
  }
  catch (err) {
    console.error('Failed to check subscription:', err)
  }
}

async function subscribeToPush() {
  if (!isSupported.value || !nitroPingClient)
    return

  isLoading.value = true
  error.value = ''

  try {
    const device = await nitroPingClient.subscribe({
      userId: 'test-user-web',
      tags: ['web-test'],
    })

    permissionStatus.value = Notification.permission
    isSubscribed.value = true

    const status = await nitroPingClient.getSubscriptionStatus()
    subscriptionData.value = status.subscription

    successToast('Successfully subscribed', `Device registered with ID: ${device.id}`)
  }
  catch (err) {
    error.value = `Failed to subscribe: ${(err as Error).message}`
    console.error('Subscription failed:', err)
  }
  finally {
    isLoading.value = false
  }
}

async function unsubscribeFromPush() {
  if (!nitroPingClient)
    return

  isLoading.value = true
  error.value = ''

  try {
    await nitroPingClient.unsubscribe()

    // Clear local storage for this app
    const storageKey = `nitroping_${selectedAppId.value}`
    localStorage.removeItem(storageKey)
    localStorage.removeItem(`${storageKey}_userId`)

    isSubscribed.value = false
    subscriptionData.value = null

    successToast('Unsubscribed', 'Successfully unsubscribed from push notifications')
  }
  catch (err) {
    error.value = `Failed to unsubscribe: ${(err as Error).message}`
    console.error('Unsubscribe failed:', err)
  }
  finally {
    isLoading.value = false
  }
}

async function sendTestNotification() {
  if (!isSubscribed.value || !selectedAppId.value)
    return

  isLoading.value = true
  error.value = ''

  try {
    // Send notification via GraphQL
    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation SendNotification($input: SendNotificationInput!) {
            sendNotification(input: $input) {
              id
              title
              totalSent
              totalFailed
            }
          }
        `,
        variables: {
          input: {
            appId: selectedAppId.value,
            title: 'Test Notification',
            body: 'This is a test notification from NitroPing!',
            platforms: ['WEB'],
          },
        },
      }),
    })

    const result = await response.json()

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'Failed to send notification')
    }

    const notification = result.data?.sendNotification
    successToast('Notification Sent', `Sent: ${notification.totalSent}, Failed: ${notification.totalFailed}`)
  }
  catch (err) {
    error.value = `Failed to send notification: ${(err as Error).message}`
    errorToast('Error', (err as Error).message)
  }
  finally {
    isLoading.value = false
  }
}

definePageMeta({
  layout: 'default',
})
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 class="text-3xl font-bold mb-2">
          Web Push Test
        </h1>
        <p class="text-muted-foreground">
          Test web push notifications
        </p>
      </div>

      <!-- App Selection -->
      <Card>
        <CardHeader>
          <CardTitle>Select App</CardTitle>
          <CardDescription>Choose an app with WebPush configured</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <Label>App</Label>
              <Select v-model="selectedAppId" :disabled="isLoadingApps">
                <SelectTrigger>
                  <SelectValue placeholder="Select an app..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="app in apps"
                    :key="app.id"
                    :value="app.id"
                    :disabled="!app.vapidPublicKey"
                  >
                    {{ app.name }}
                    <span v-if="!app.vapidPublicKey" class="text-muted-foreground ml-2">(No WebPush)</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" :disabled="isLoadingApps" @click="fetchApps">
              <Icon name="lucide:refresh-cw" :class="{ 'animate-spin': isLoadingApps }" class="size-4" />
            </Button>
          </div>

          <div v-if="selectedApp" class="text-sm space-y-1">
            <p class="text-muted-foreground">
              App ID: <code class="bg-muted px-1 rounded">{{ selectedApp.id }}</code>
            </p>
            <p class="text-muted-foreground">
              Slug: <code class="bg-muted px-1 rounded">{{ selectedApp.slug }}</code>
            </p>
            <p v-if="selectedApp.vapidPublicKey" class="text-muted-foreground">
              VAPID Key: <code class="bg-muted px-1 rounded text-xs">{{ selectedApp.vapidPublicKey.slice(0, 20) }}...</code>
            </p>
          </div>

          <Alert v-if="apps.length === 0 && !isLoadingApps" variant="destructive">
            <Icon name="lucide:alert-triangle" class="size-4" />
            <AlertTitle>No Apps Found</AlertTitle>
            <AlertDescription>
              Create an app first and configure WebPush (VAPID keys).
            </AlertDescription>
          </Alert>

          <Alert v-if="selectedApp && !hasWebPushConfig">
            <Icon name="lucide:alert-triangle" class="size-4" />
            <AlertTitle>WebPush Not Configured</AlertTitle>
            <AlertDescription>
              This app doesn't have VAPID keys configured. Go to app settings to configure WebPush.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <!-- Subscribe Section -->
      <Card v-if="selectedApp && hasWebPushConfig">
        <CardHeader>
          <CardTitle>Subscribe to Notifications</CardTitle>
          <CardDescription>Enable push notifications for this device</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center space-x-4">
            <Button
              v-if="!isSubscribed"
              :disabled="isLoading || !isSupported"
              @click="subscribeToPush"
            >
              <Icon v-if="isLoading" name="lucide:loader-2" class="size-4 mr-2 animate-spin" />
              Enable Notifications
            </Button>
            <Button
              v-else
              variant="destructive"
              :disabled="isLoading"
              @click="unsubscribeFromPush"
            >
              <Icon v-if="isLoading" name="lucide:loader-2" class="size-4 mr-2 animate-spin" />
              Unsubscribe
            </Button>
            <Badge :variant="isSubscribed ? 'default' : 'secondary'">
              {{ isSubscribed ? 'Active' : 'Not Active' }}
            </Badge>
          </div>

          <div v-if="isSubscribed" class="space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="font-medium">
                Subscription Details:
              </h4>
              <Button variant="ghost" size="sm" @click="showSubscriptionDetails = !showSubscriptionDetails">
                <Icon :name="showSubscriptionDetails ? 'lucide:eye-off' : 'lucide:eye'" class="size-4 mr-1" />
                {{ showSubscriptionDetails ? 'Hide' : 'Show' }}
              </Button>
            </div>
            <div v-if="showSubscriptionDetails" class="bg-muted p-3 rounded text-xs overflow-auto max-h-40">
              <pre>{{ JSON.stringify(subscriptionData, null, 2) }}</pre>
            </div>
            <div v-else class="bg-muted p-3 rounded text-xs text-muted-foreground">
              ••••••••••••••••••••
            </div>
          </div>

          <Alert v-if="!isSupported">
            <Icon name="lucide:alert-triangle" class="size-4" />
            <AlertTitle>Not Supported</AlertTitle>
            <AlertDescription>
              Your browser doesn't support push notifications or you're not using HTTPS.
            </AlertDescription>
          </Alert>

          <Alert v-if="error" variant="destructive">
            <Icon name="lucide:alert-triangle" class="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <!-- Send Test Notification -->
      <Card v-if="isSubscribed">
        <CardHeader>
          <CardTitle>Send Test Notification</CardTitle>
          <CardDescription>Send a real push notification to all subscribed devices</CardDescription>
        </CardHeader>
        <CardContent>
          <Button :disabled="isLoading" @click="sendTestNotification">
            <Icon v-if="isLoading" name="lucide:loader-2" class="size-4 mr-2 animate-spin" />
            Send Test Notification
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
