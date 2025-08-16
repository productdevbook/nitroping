<script setup lang="ts">
import { Globe, Loader2, Smartphone } from 'lucide-vue-next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const appId = computed(() => route.params.id as string)

// API queries
const { data: appData } = useApp(appId)
const app = computed(() => appData.value)

// Methods
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
</script>

<template>
  <div v-if="app">
    <!-- App Header -->
    <AppDetailHeader :app="app" />

    <!-- Navigation -->
    <AppNavigation :app-id="appId" />

    <!-- Providers Content -->
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold mb-2">Push Providers</h2>
        <p class="text-muted-foreground">Configure your push notification providers to start sending notifications.</p>
      </div>

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

            <div v-else class="space-y-2">
              <p class="text-sm text-muted-foreground">Configure Firebase Cloud Messaging to send notifications to Android devices.</p>
            </div>

            <Button variant="outline" size="sm" class="w-full" @click="configureFCM">
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

            <div v-else class="space-y-2">
              <p class="text-sm text-muted-foreground">Configure Apple Push Notification service to send notifications to iOS devices.</p>
            </div>

            <Button variant="outline" size="sm" class="w-full" @click="configureAPNs">
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

            <div v-else class="space-y-2">
              <p class="text-sm text-muted-foreground">Configure Web Push to send notifications to web browsers.</p>
            </div>

            <Button variant="outline" size="sm" class="w-full" @click="configureWebPush">
              {{ app.vapidPublicKey ? 'Update' : 'Configure' }} Web Push
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Configuration Guide -->
      <Card>
        <CardHeader>
          <CardTitle>Configuration Guide</CardTitle>
          <CardDescription>Follow these steps to set up your push providers</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-2">
              <h4 class="font-medium text-orange-600">Firebase FCM</h4>
              <ol class="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Create a Firebase project</li>
                <li>Generate a service account key</li>
                <li>Upload the JSON file</li>
                <li>Test with Android devices</li>
              </ol>
            </div>
            <div class="space-y-2">
              <h4 class="font-medium text-blue-600">Apple APNs</h4>
              <ol class="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Create an Apple Developer account</li>
                <li>Generate APNs Auth Key</li>
                <li>Get your Team ID and Key ID</li>
                <li>Test with iOS devices</li>
              </ol>
            </div>
            <div class="space-y-2">
              <h4 class="font-medium text-green-600">Web Push</h4>
              <ol class="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Generate VAPID keys</li>
                <li>Set subject (email or URL)</li>
                <li>Configure service worker</li>
                <li>Test with browsers</li>
              </ol>
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
