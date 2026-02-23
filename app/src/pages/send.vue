<script setup lang="ts">
import Icon from '~/components/common/Icon.vue'
import { ref, computed } from 'vue'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~/components/ui/collapsible'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { useApps, useSendNotification } from '~/graphql'

// API queries
const { data: appsData, isLoading: _appsLoading } = useApps()
const apps = computed(() => appsData.value || [])
const { mutateAsync: sendNotificationMutation, isLoading: isSendingNotification } = useSendNotification()

// Reactive data
const form = ref({
  appId: '',
  title: '',
  body: '',
  badge: undefined as number | undefined,
  sound: '',
  clickAction: '',
  icon: '',
  image: '',
  data: null,
})

const customData = ref('')
const targetType = ref('all')
const selectedPlatforms = ref<string[]>([])
const deviceIds = ref('')
const scheduleType = ref('now')
const scheduledAt = ref('')

// Computed
const selectedApp = computed(() => {
  return apps.value?.find((app: any) => app.id === form.value.appId)
})

// Methods

function getTargetDescription() {
  if (targetType.value === 'all')
    return 'All devices'
  if (targetType.value === 'platform') {
    return selectedPlatforms.value.length > 0
      ? selectedPlatforms.value.join(', ')
      : 'No platforms selected'
  }
  if (targetType.value === 'devices') {
    const deviceCount = deviceIds.value.split('\n').filter(id => id.trim()).length
    return `${deviceCount} specific devices`
  }
  return 'Unknown'
}

async function sendNotification() {
  if (!form.value.appId || !form.value.title || !form.value.body)
    return

  try {
    // Prepare payload
    const payload = {
      appId: form.value.appId,
      title: form.value.title,
      body: form.value.body,
      data: customData.value ? JSON.parse(customData.value) : undefined,
      targetDevices: targetType.value === 'devices'
        ? deviceIds.value.split('\n').filter(id => id.trim())
        : undefined,
      platforms: targetType.value === 'platform'
        ? selectedPlatforms.value
        : undefined,
      scheduledAt: scheduleType.value === 'later' ? scheduledAt.value : undefined,
    }

    await sendNotificationMutation(payload)

    console.log('Notification sent successfully!')
    // TODO: Show success toast and redirect to notification details
    resetForm()
  }
  catch (error) {
    console.error('Error sending notification:', error)
    // TODO: Show error toast
  }
}

function resetForm() {
  form.value = {
    appId: '',
    title: '',
    body: '',
    badge: undefined,
    sound: '',
    clickAction: '',
    icon: '',
    image: '',
    data: null,
  }
  customData.value = ''
  targetType.value = 'all'
  selectedPlatforms.value = []
  deviceIds.value = ''
  scheduleType.value = 'now'
  scheduledAt.value = ''
}

// Apps are automatically loaded by useApps() composable
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Send Notification</h1>
      <p class="text-muted-foreground">Send push notifications to your registered devices</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Form -->
      <div class="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Notification Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form class="space-y-6" @submit.prevent="sendNotification">
              <!-- App Selection -->
              <div class="space-y-2">
                <Label for="app">Application *</Label>
                <Select v-model="form.appId" required>
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

              <!-- Notification Content -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="title">Title *</Label>
                  <Input
                    id="title"
                    v-model="form.title"
                    placeholder="Notification title"
                    required
                  />
                </div>
                <div class="space-y-2">
                  <Label for="badge">Badge Count</Label>
                  <Input
                    id="badge"
                    v-model.number="form.badge"
                    type="number"
                    placeholder="1"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <Label for="body">Message *</Label>
                <Textarea
                  id="body"
                  v-model="form.body"
                  placeholder="Your notification message..."
                  required
                  rows="3"
                />
              </div>

              <!-- Advanced Options -->
              <Collapsible>
                <CollapsibleTrigger as-child>
                  <Button variant="ghost" class="w-full justify-between">
                    Advanced Options
                    <Icon name="lucide:chevron-down" class="size-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent class="space-y-4 pt-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <Label for="sound">Sound</Label>
                      <Input
                        id="sound"
                        v-model="form.sound"
                        placeholder="default"
                      />
                    </div>
                    <div class="space-y-2">
                      <Label for="clickAction">Click Action</Label>
                      <Input
                        id="clickAction"
                        v-model="form.clickAction"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <Label for="icon">Icon URL</Label>
                      <Input
                        id="icon"
                        v-model="form.icon"
                        placeholder="https://example.com/icon.png"
                      />
                    </div>
                    <div class="space-y-2">
                      <Label for="image">Image URL</Label>
                      <Input
                        id="image"
                        v-model="form.image"
                        placeholder="https://example.com/image.png"
                      />
                    </div>
                  </div>

                  <div class="space-y-2">
                    <Label for="data">Custom Data (JSON)</Label>
                    <Textarea
                      id="data"
                      v-model="customData"
                      placeholder="{&quot;key&quot;: &quot;value&quot;}"
                      rows="3"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <!-- Target Selection -->
              <div class="space-y-4">
                <Label>Target Audience</Label>
                <div class="space-y-3">
                  <div class="flex items-center space-x-2">
                    <Checkbox
                      id="all-devices"
                      :model-value="targetType === 'all'"
                      @update:model-value="targetType = 'all'"
                    />
                    <Label for="all-devices">All registered devices</Label>
                  </div>

                  <div class="flex items-center space-x-2">
                    <Checkbox
                      id="platform-filter"
                      :model-value="targetType === 'platform'"
                      @update:model-value="targetType = 'platform'"
                    />
                    <Label for="platform-filter">Filter by platform</Label>
                  </div>

                  <div v-if="targetType === 'platform'" class="ml-6 space-y-2">
                    <div class="flex space-x-4">
                      <div class="flex items-center space-x-2">
                        <Checkbox id="ios" :model-value="selectedPlatforms.includes('ios')" @update:model-value="(checked: any) => checked ? selectedPlatforms.push('ios') : selectedPlatforms.splice(selectedPlatforms.indexOf('ios'), 1)" />
                        <Label for="ios">iOS</Label>
                      </div>
                      <div class="flex items-center space-x-2">
                        <Checkbox id="android" :model-value="selectedPlatforms.includes('android')" @update:model-value="(checked: any) => checked ? selectedPlatforms.push('android') : selectedPlatforms.splice(selectedPlatforms.indexOf('android'), 1)" />
                        <Label for="android">Android</Label>
                      </div>
                      <div class="flex items-center space-x-2">
                        <Checkbox id="web" :model-value="selectedPlatforms.includes('web')" @update:model-value="(checked: any) => checked ? selectedPlatforms.push('web') : selectedPlatforms.splice(selectedPlatforms.indexOf('web'), 1)" />
                        <Label for="web">Web</Label>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center space-x-2">
                    <Checkbox
                      id="specific-devices"
                      :model-value="targetType === 'devices'"
                      @update:model-value="targetType = 'devices'"
                    />
                    <Label for="specific-devices">Specific devices</Label>
                  </div>

                  <div v-if="targetType === 'devices'" class="ml-6">
                    <Textarea
                      v-model="deviceIds"
                      placeholder="Enter device IDs, one per line"
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              <!-- Schedule -->
              <div class="space-y-2">
                <Label>Schedule</Label>
                <div class="flex items-center space-x-2">
                  <Checkbox
                    id="send-now"
                    :model-value="scheduleType === 'now'"
                    @update:model-value="scheduleType = 'now'"
                  />
                  <Label for="send-now">Send now</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox
                    id="schedule-later"
                    :model-value="scheduleType === 'later'"
                    @update:model-value="scheduleType = 'later'"
                  />
                  <Label for="schedule-later">Schedule for later</Label>
                </div>
                <div v-if="scheduleType === 'later'" class="ml-6">
                  <Input
                    v-model="scheduledAt"
                    type="datetime-local"
                    :min="new Date().toISOString().slice(0, 16)"
                  />
                </div>
              </div>

              <!-- Submit -->
              <div class="flex space-x-2">
                <Button type="submit" :disabled="!form.appId || !form.title || !form.body || isSendingNotification" class="flex-1">
                  <Icon v-if="isSendingNotification" name="lucide:loader-2" class="size-4 mr-2 animate-spin" />
                  <Icon name="lucide:send" class="size-4 mr-2" />
                  {{ scheduleType === 'now' ? 'Send Now' : 'Schedule' }}
                </Button>
                <Button type="button" variant="outline" @click="resetForm">
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <!-- Preview -->
      <div>
        <Card class="sticky top-4">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <!-- Mobile Preview -->
            <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div class="flex items-center space-x-2 text-xs text-muted-foreground">
                <Icon name="lucide:smartphone" class="h-3 w-3" />
                <span>Mobile Notification</span>
              </div>

              <div class="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm">
                <div class="flex items-start space-x-3">
                  <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <span class="text-xs text-primary-foreground font-bold">
                      {{ selectedApp?.name?.charAt(0) || 'A' }}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <p class="font-medium text-sm truncate">
                        {{ selectedApp?.name || 'App Name' }}
                      </p>
                      <span class="text-xs text-muted-foreground">now</span>
                    </div>
                    <p class="font-semibold text-sm mb-1">
                      {{ form.title || 'Notification Title' }}
                    </p>
                    <p class="text-sm text-muted-foreground line-clamp-2">
                      {{ form.body || 'Your notification message will appear here...' }}
                    </p>
                  </div>
                  <div v-if="form.badge" class="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span class="text-xs text-white font-bold">{{ form.badge }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Targeting Info -->
            <div class="mt-4 space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Target:</span>
                <span>{{ getTargetDescription() }}</span>
              </div>
              <div v-if="selectedApp" class="flex justify-between">
                <span class="text-muted-foreground">App:</span>
                <span>{{ selectedApp.name }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Schedule:</span>
                <span>{{ scheduleType === 'now' ? 'Send immediately' : 'Scheduled' }}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
