<script setup lang="ts">
import { usePush } from 'notivue'
import { computed, ref, watch } from 'vue'
import Icon from '~/components/common/Icon.vue'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { useApps, useSendNotification } from '~/graphql'
import { useContacts } from '~/graphql/contacts'

const push = usePush()

const { data: appsData } = useApps()
const apps = computed(() => appsData.value || [])
const { mutateAsync: sendNotificationMutation, isLoading: isSendingNotification } = useSendNotification()

const appId = ref('')
const channelType = ref('PUSH')
const title = ref('')
const body = ref('')
const toEmail = ref('')
const contactTargetType = ref('all') // 'all' | 'specific'
const selectedContactIds = ref<string[]>([])
const scheduleType = ref('now')
const scheduledAt = ref('')

const selectedApp = computed(() => apps.value.find((a: any) => a.id === appId.value))

// Load contacts when app is selected and channel is email/sms/inapp
const contactsAppId = computed(() => appId.value)
const { data: contactsData } = useContacts(contactsAppId)
const contacts = computed(() => contactsData.value || [])

const isChannelBased = computed(() => ['EMAIL', 'SMS', 'IN_APP', 'DISCORD'].includes(channelType.value))
const isContactBased = computed(() => ['EMAIL', 'SMS', 'IN_APP'].includes(channelType.value))

// Reset targeting when channel changes
watch(channelType, () => {
  contactTargetType.value = 'all'
  selectedContactIds.value = []
  toEmail.value = ''
})

function toggleContact(id: string) {
  const idx = selectedContactIds.value.indexOf(id)
  if (idx === -1)
    selectedContactIds.value.push(id)
  else
    selectedContactIds.value.splice(idx, 1)
}

function getChannelIcon() {
  const icons: Record<string, string> = {
    PUSH: 'lucide:smartphone',
    EMAIL: 'lucide:mail',
    SMS: 'lucide:message-square',
    IN_APP: 'lucide:bell',
    DISCORD: 'lucide:message-circle',
  }
  return icons[channelType.value] || 'lucide:send'
}

function getTargetSummary() {
  if (channelType.value === 'PUSH')
    return 'All registered devices'
  if (channelType.value === 'DISCORD')
    return 'Discord webhook'
  if (contactTargetType.value === 'all')
    return `All contacts (${contacts.value.length})`
  return `${selectedContactIds.value.length} selected contact(s)`
}

async function sendNotification() {
  if (!appId.value || !title.value || !body.value)
    return

  try {
    const input: any = {
      appId: appId.value,
      title: title.value,
      body: body.value,
      scheduledAt: scheduleType.value === 'later' ? scheduledAt.value : undefined,
    }

    if (isChannelBased.value) {
      input.channelType = channelType.value
      if (isContactBased.value && contactTargetType.value === 'specific' && selectedContactIds.value.length > 0) {
        input.contactIds = selectedContactIds.value
      }
    }

    await sendNotificationMutation(input)
    push.success({ title: 'Notification sent successfully' })
    title.value = ''
    body.value = ''
    selectedContactIds.value = []
    scheduleType.value = 'now'
    scheduledAt.value = ''
  }
  catch (error) {
    push.error({ title: 'Failed to send', message: error instanceof Error ? error.message : 'Unknown error' })
  }
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">
        Send Notification
      </h1>
      <p class="text-muted-foreground">
        Send notifications via Push, Email, SMS, Discord or In-App
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4">
        <!-- App + Channel -->
        <Card>
          <CardHeader>
            <CardTitle>Delivery</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Application *</Label>
                <Select v-model="appId">
                  <SelectTrigger>
                    <SelectValue placeholder="Select app" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="app in apps" :key="app.id" :value="app.id">
                      {{ app.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-2">
                <Label>Channel *</Label>
                <Select v-model="channelType">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUSH">
                      Push Notification
                    </SelectItem>
                    <SelectItem value="EMAIL">
                      Email
                    </SelectItem>
                    <SelectItem value="SMS">
                      SMS
                    </SelectItem>
                    <SelectItem value="IN_APP">
                      In-App
                    </SelectItem>
                    <SelectItem value="DISCORD">
                      Discord
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Message -->
        <Card>
          <CardHeader>
            <CardTitle>Message</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label>Title *</Label>
              <Input v-model="title" placeholder="Notification title" />
            </div>
            <div class="space-y-2">
              <Label>Body *</Label>
              <Textarea v-model="body" placeholder="Message content..." rows="4" />
            </div>
          </CardContent>
        </Card>

        <!-- Targeting -->
        <Card v-if="isContactBased && appId">
          <CardHeader>
            <CardTitle>Recipients</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex gap-4">
              <div class="flex items-center gap-2">
                <Checkbox
                  id="target-all"
                  :model-value="contactTargetType === 'all'"
                  @update:model-value="contactTargetType = 'all'"
                />
                <Label for="target-all">All contacts</Label>
              </div>
              <div class="flex items-center gap-2">
                <Checkbox
                  id="target-specific"
                  :model-value="contactTargetType === 'specific'"
                  @update:model-value="contactTargetType = 'specific'"
                />
                <Label for="target-specific">Select contacts</Label>
              </div>
            </div>

            <div v-if="contactTargetType === 'specific'" class="border rounded-lg divide-y max-h-64 overflow-y-auto">
              <div
                v-if="contacts.length === 0"
                class="py-8 text-center text-sm text-muted-foreground"
              >
                No contacts found for this app
              </div>
              <label
                v-for="contact in contacts"
                :key="contact.id"
                class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/50"
              >
                <Checkbox
                  :model-value="selectedContactIds.includes(contact.id)"
                  @update:model-value="toggleContact(contact.id)"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">
                    {{ contact.name || contact.externalId }}
                  </p>
                  <p class="text-xs text-muted-foreground truncate">
                    {{ contact.email || contact.phone || contact.externalId }}
                  </p>
                </div>
                <Badge v-if="selectedContactIds.includes(contact.id)" variant="default" class="text-xs">
                  Selected
                </Badge>
              </label>
            </div>
          </CardContent>
        </Card>

        <!-- Schedule -->
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="flex gap-4">
              <div class="flex items-center gap-2">
                <Checkbox
                  id="send-now"
                  :model-value="scheduleType === 'now'"
                  @update:model-value="scheduleType = 'now'"
                />
                <Label for="send-now">Send now</Label>
              </div>
              <div class="flex items-center gap-2">
                <Checkbox
                  id="send-later"
                  :model-value="scheduleType === 'later'"
                  @update:model-value="scheduleType = 'later'"
                />
                <Label for="send-later">Schedule for later</Label>
              </div>
            </div>
            <div v-if="scheduleType === 'later'">
              <Input
                v-model="scheduledAt"
                type="datetime-local"
                :min="new Date().toISOString().slice(0, 16)"
              />
            </div>
          </CardContent>
        </Card>

        <div class="flex gap-2">
          <Button
            class="flex-1"
            :disabled="!appId || !title || !body || isSendingNotification"
            @click="sendNotification"
          >
            <Icon v-if="isSendingNotification" name="lucide:loader-2" class="size-4 mr-2 animate-spin" />
            <Icon v-else :name="getChannelIcon()" class="size-4 mr-2" />
            {{ scheduleType === 'now' ? 'Send Now' : 'Schedule' }}
          </Button>
        </div>
      </div>

      <!-- Summary -->
      <div>
        <Card class="sticky top-4">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- Preview -->
            <div class="bg-muted rounded-lg p-4 space-y-2">
              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon :name="getChannelIcon()" class="size-3" />
                <span>{{ channelType }}</span>
              </div>
              <div class="bg-background rounded-lg p-3 shadow-sm">
                <p class="font-semibold text-sm mb-1">
                  {{ title || 'Notification Title' }}
                </p>
                <p class="text-sm text-muted-foreground line-clamp-3">
                  {{ body || 'Message will appear here...' }}
                </p>
              </div>
            </div>

            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">App:</span>
                <span class="font-medium">{{ selectedApp?.name || '—' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Channel:</span>
                <span class="font-medium">{{ channelType }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Target:</span>
                <span class="font-medium">{{ getTargetSummary() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Schedule:</span>
                <span class="font-medium">{{ scheduleType === 'now' ? 'Immediately' : 'Scheduled' }}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
