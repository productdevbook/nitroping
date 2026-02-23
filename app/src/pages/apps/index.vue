<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '~/components/common/Icon.vue'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { useApps } from '~/graphql'

const router = useRouter()

// API queries
const { data: appsData } = useApps()
const apps = computed(() => appsData.value || [])

// Reactive data
const testLoading = ref(false)
const showTestDialog = ref(false)
const selectedApp = ref(null)

const testNotification = ref({
  title: '',
  body: '',
})

// Methods

function sendTestNotification(app: any) {
  selectedApp.value = app
  testNotification.value = {
    title: '',
    body: '',
  }
  showTestDialog.value = true
}

async function sendTest() {
  if (!testNotification.value.title || !testNotification.value.body)
    return

  testLoading.value = true
  try {
    // TODO: Implement with proper app API key
    console.log('Would send test notification to:', (selectedApp.value as any)?.name, testNotification.value)
    showTestDialog.value = false

    // TODO: Show success toast
  }
  catch (error) {
    console.error('Error sending test notification:', error)
    // TODO: Show error toast
  }
  finally {
    testLoading.value = false
  }
}

// Apps are automatically loaded by useApps() composable
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold mb-2">
          Applications
        </h1>
        <p class="text-muted-foreground">
          Manage your push notification applications
        </p>
      </div>
      <Button @click="router.push('/apps/create')">
        <Icon name="lucide:plus" class="mr-2 size-4" />
        Create App
      </Button>
    </div>

    <!-- Apps Grid -->
    <div v-if="apps && apps.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card v-for="app in (apps || [])" :key="app.id" class="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="h-10 w-10 rounded-lg bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
                <Icon name="lucide:package" class="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle class="text-lg">
                  {{ app.name }}
                </CardTitle>
                <p class="text-sm text-muted-foreground">
                  {{ app.slug }}
                </p>
              </div>
            </div>
            <Badge :variant="app.isActive ? 'default' : 'secondary'">
              {{ app.isActive ? 'Active' : 'Inactive' }}
            </Badge>
          </div>
          <CardDescription v-if="app.description">
            {{ app.description }}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div class="space-y-3">
            <!-- Quick Stats -->
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-muted-foreground">
                  Devices
                </p>
                <p class="font-semibold">
                  {{ app.stats?.totalDevices || 0 }}
                </p>
              </div>
              <div>
                <p class="text-muted-foreground">
                  Sent Today
                </p>
                <p class="font-semibold">
                  {{ app.stats?.sentToday || 0 }}
                </p>
              </div>
            </div>

            <!-- Provider Status -->
            <div class="space-y-2">
              <p class="text-sm font-medium">
                Configured Providers
              </p>
              <div class="flex space-x-2">
                <Badge v-if="app.fcmProjectId" variant="outline" class="text-xs">
                  <Icon name="lucide:smartphone" class="w-3 h-3 mr-1" />
                  FCM
                </Badge>
                <Badge v-if="app.apnsKeyId" variant="outline" class="text-xs">
                  <Icon name="lucide:smartphone" class="w-3 h-3 mr-1" />
                  APNs
                </Badge>
                <Badge v-if="app.vapidPublicKey" variant="outline" class="text-xs">
                  <Icon name="lucide:globe" class="w-3 h-3 mr-1" />
                  Web Push
                </Badge>
                <Badge v-if="!app.fcmProjectId && !app.apnsKeyId && !app.vapidPublicKey" variant="secondary" class="text-xs">
                  Not Configured
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>

        <CardContent class="pt-0">
          <div class="flex space-x-2">
            <Button variant="outline" size="sm" as-child class="flex-1">
              <RouterLink :to="`/apps/${app.id}`">
                <Icon name="lucide:settings" class="size-4 mr-2" />
                Manage
              </RouterLink>
            </Button>
            <Button variant="outline" size="sm" @click="sendTestNotification(app)">
              <Icon name="lucide:send" class="size-4 mr-2" />
              Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <Icon name="lucide:package" class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 class="text-lg font-medium mb-2">
        No applications yet
      </h3>
      <p class="text-muted-foreground mb-6">
        Create your first app to start sending push notifications
      </p>
      <Button @click="router.push('/apps/create')">
        <Icon name="lucide:plus" class="mr-2 size-4" />
        Create Your First App
      </Button>
    </div>

    <!-- Test Notification Dialog -->
    <Dialog v-model:open="showTestDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Test Notification</DialogTitle>
          <DialogDescription>Send a test notification to {{ (selectedApp as any)?.name }}</DialogDescription>
        </DialogHeader>

        <form class="space-y-4" @submit.prevent="sendTest">
          <div class="space-y-2">
            <Label for="test-title">Title *</Label>
            <Input
              id="test-title"
              v-model="testNotification.title"
              placeholder="Hello World!"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="test-body">Message *</Label>
            <Textarea
              id="test-body"
              v-model="testNotification.body"
              placeholder="This is a test notification"
              required
              rows="3"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" @click="showTestDialog = false">
              Cancel
            </Button>
            <Button type="submit" :disabled="!testNotification.title || !testNotification.body || testLoading">
              <Icon v-if="testLoading" name="lucide:loader-2" class="size-4 mr-2 animate-spin" />
              <Icon name="lucide:send" class="size-4 mr-2" />
              Send Test
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
