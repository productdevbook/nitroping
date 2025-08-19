<script setup lang="ts">
import { AlertTriangle, Loader2 } from 'lucide-vue-next'
import { NitroPingClient } from 'nitroping'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

const { success: successToast } = useToast()

const isLoading = ref(false)
const error = ref('')
const permissionStatus = ref<NotificationPermission>('default')
const isSubscribed = ref(false)
const subscriptionData = ref<any>(null)

// Initialize NitroPing SDK
const nitroPingClient = new NitroPingClient({
  appId: '707bf3c9-5553-40da-9508-15a7bf371324',
  vapidPublicKey: 'BLtMMwTW0kW8BiCJHVD7wajMux0gl3dOhocLtFvTBRNovwgvrxJ5l-P67oBkAL4tgUlnr_QWb1S4CaYHszWrxM4',
  apiUrl: window.location.origin, // Use current origin
})

// Browser support check using SDK
const isSupported = computed(() => {
  return nitroPingClient.isSupported()
})

// Check current permission status and subscription
onMounted(async () => {
  if (isSupported.value) {
    permissionStatus.value = nitroPingClient.getPermissionStatus()

    // Auto-registration: If user granted permission but device is not registered
    if (permissionStatus.value === 'granted') {
      await autoRegisterIfNeeded()
    }

    await checkSubscription()
  }
})

async function autoRegisterIfNeeded() {
  try {
    // Check if browser has subscription
    const hasSubscription = await nitroPingClient.isSubscribed()

    if (hasSubscription) {
      // Check if we have local device record
      const status = await nitroPingClient.getSubscriptionStatus()

      if (!status.device) {
        // Browser has subscription but no device record
        // Perform silent re-registration
        await nitroPingClient.subscribe({
          userId: 'test-user-web',
          tags: ['web-test', 'auto-registered'],
        })
      }
    }
  }
  catch {
    // Silently skip auto-registration if it fails
    // User can manually subscribe if needed
  }
}

async function checkSubscription() {
  if (!isSupported.value)
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
  if (!isSupported.value)
    return

  isLoading.value = true
  error.value = ''

  try {
    // Use SDK to subscribe
    const device = await nitroPingClient.subscribe({
      userId: 'test-user-web',
      tags: ['web-test'],
    })

    // Update UI state
    permissionStatus.value = nitroPingClient.getPermissionStatus()
    isSubscribed.value = true

    // Get updated subscription status
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

async function sendTestNotification() {
  if (!isSubscribed.value || !subscriptionData.value)
    return

  isLoading.value = true
  error.value = ''

  try {
    console.log('Test notification sent')

    // Show browser notification for immediate feedback
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Test Notification', {
        body: 'This is a test notification from your app!',
        icon: '/favicon.ico',
      })
      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000)
    }
  }
  catch (err) {
    error.value = `Failed to send notification: ${(err as Error).message}`
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
        <h1 class="text-3xl font-bold mb-2">Web Push Test</h1>
        <p class="text-muted-foreground">Test web push notifications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Push Notification Test</CardTitle>
          <CardDescription>Test web push notifications with automatic configuration</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <p class="text-sm text-muted-foreground">
              App ID: <code class="bg-muted px-1 rounded">707bf3c9-5553-40da-9508-15a7bf371324</code>
            </p>
            <p class="text-sm text-muted-foreground">
              User ID: <code class="bg-muted px-1 rounded">test-user-web</code>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscribe to Notifications</CardTitle>
          <CardDescription>Enable push notifications for this device</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center space-x-4">
            <Button
              :disabled="isLoading || !isSupported || isSubscribed"
              @click="subscribeToPush"
            >
              <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
              {{ isSubscribed ? 'Subscribed' : 'Enable Notifications' }}
            </Button>
            <Badge :variant="isSubscribed ? 'default' : 'secondary'">
              {{ isSubscribed ? 'Active' : 'Not Active' }}
            </Badge>
          </div>

          <div v-if="isSubscribed" class="space-y-2">
            <h4 class="font-medium">Subscription Details:</h4>
            <div class="bg-muted p-3 rounded text-xs overflow-auto">
              <pre>{{ JSON.stringify(subscriptionData, null, 2) }}</pre>
            </div>
          </div>

          <Alert v-if="!isSupported">
            <AlertTriangle class="h-4 w-4" />
            <AlertTitle>Not Supported</AlertTitle>
            <AlertDescription>
              Your browser doesn't support push notifications or you're not using HTTPS.
            </AlertDescription>
          </Alert>

          <Alert v-if="error">
            <AlertTriangle class="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card v-if="isSubscribed">
        <CardHeader>
          <CardTitle>Send Test Notification</CardTitle>
          <CardDescription>Send a test notification to this device</CardDescription>
        </CardHeader>
        <CardContent>
          <Button :disabled="isLoading" @click="sendTestNotification">
            <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
            Send Test Notification
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
