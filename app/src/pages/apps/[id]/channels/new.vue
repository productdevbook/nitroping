<script setup lang="ts">
import { usePush } from 'notivue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useCreateChannel } from '~/graphql/channels'

const route = useRoute()
const router = useRouter()
const appId = computed(() => route.params.id as string)
const push = usePush()

const { mutateAsync: createChannel, isLoading: isCreating } = useCreateChannel()

const form = ref({
  name: '',
  type: 'EMAIL',
  smtpHost: '',
  smtpPort: '587',
  smtpUser: '',
  smtpPass: '',
  smtpFrom: '',
  smtpFromName: '',
  discordWebhookUrl: '',
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioFrom: '',
  telegramBotToken: '',
  telegramChatId: '',
})

function buildConfig() {
  switch (form.value.type) {
    case 'EMAIL':
      return {
        provider: 'smtp',
        host: form.value.smtpHost,
        port: Number(form.value.smtpPort),
        user: form.value.smtpUser,
        pass: form.value.smtpPass,
        from: form.value.smtpFrom,
        fromName: form.value.smtpFromName,
      }
    case 'DISCORD':
      return { webhookUrl: form.value.discordWebhookUrl }
    case 'TELEGRAM':
      return { botToken: form.value.telegramBotToken, chatId: form.value.telegramChatId }
    case 'SMS':
      return {
        provider: 'twilio',
        accountSid: form.value.twilioAccountSid,
        authToken: form.value.twilioAuthToken,
        from: form.value.twilioFrom,
      }
    default:
      return undefined
  }
}

async function handleCreate() {
  try {
    const config = buildConfig()
    await createChannel({ appId: appId.value, name: form.value.name, type: form.value.type, config })
    push.success({ title: 'Channel created successfully' })
    router.push(`/apps/${appId.value}/channels`)
  }
  catch (error) {
    push.error({ title: 'Failed to create channel', message: error instanceof Error ? error.message : 'Unknown error' })
  }
}
</script>

<template>
  <div class="max-w-xl">
    <div class="flex items-center gap-3 mb-6">
      <Button variant="ghost" size="sm" @click="router.push(`/apps/${appId}/channels`)">
        ← Back
      </Button>
      <div>
        <h2 class="text-xl font-semibold">
          Add Channel
        </h2>
        <p class="text-sm text-muted-foreground">
          Configure a new delivery channel for this app
        </p>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">
          Channel Details
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div>
          <Label>Channel Name</Label>
          <Input v-model="form.name" placeholder="My Channel" class="mt-1" />
        </div>

        <div>
          <Label>Type</Label>
          <Select v-model="form.type" class="mt-1">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="PUSH">Push</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
              <SelectItem value="IN_APP">In-App</SelectItem>
              <SelectItem value="DISCORD">Discord</SelectItem>
              <SelectItem value="TELEGRAM">Telegram</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- EMAIL: SMTP configuration -->
        <template v-if="form.type === 'EMAIL'">
          <div class="border rounded-lg p-4 space-y-3">
            <p class="text-sm font-medium">
              SMTP Configuration
            </p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <Label class="text-xs">Host</Label>
                <Input v-model="form.smtpHost" placeholder="smtp.gmail.com" class="mt-1" />
              </div>
              <div>
                <Label class="text-xs">Port</Label>
                <Input v-model="form.smtpPort" placeholder="587" class="mt-1" />
              </div>
            </div>
            <div>
              <Label class="text-xs">Username</Label>
              <Input v-model="form.smtpUser" placeholder="user@gmail.com" class="mt-1" />
            </div>
            <div>
              <Label class="text-xs">Password</Label>
              <Input v-model="form.smtpPass" type="password" class="mt-1" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <Label class="text-xs">From Address</Label>
                <Input v-model="form.smtpFrom" placeholder="no-reply@myapp.com" class="mt-1" />
              </div>
              <div>
                <Label class="text-xs">From Name</Label>
                <Input v-model="form.smtpFromName" placeholder="My App" class="mt-1" />
              </div>
            </div>
          </div>
        </template>

        <!-- DISCORD -->
        <template v-if="form.type === 'DISCORD'">
          <div class="border rounded-lg p-4 space-y-3">
            <p class="text-sm font-medium">
              Discord Webhook Configuration
            </p>
            <div>
              <Label class="text-xs">Webhook URL</Label>
              <Input v-model="form.discordWebhookUrl" placeholder="https://discord.com/api/webhooks/..." class="mt-1" />
            </div>
          </div>
        </template>

        <!-- TELEGRAM -->
        <template v-if="form.type === 'TELEGRAM'">
          <div class="border rounded-lg p-4 space-y-3">
            <p class="text-sm font-medium">
              Telegram Bot Configuration
            </p>
            <div>
              <Label class="text-xs">Bot Token</Label>
              <Input v-model="form.telegramBotToken" type="password" placeholder="123456:ABC-DEF..." class="mt-1" />
            </div>
            <div>
              <Label class="text-xs">Chat ID</Label>
              <Input v-model="form.telegramChatId" placeholder="-1001234567890" class="mt-1" />
            </div>
          </div>
        </template>

        <!-- SMS: Twilio -->
        <template v-if="form.type === 'SMS'">
          <div class="border rounded-lg p-4 space-y-3">
            <p class="text-sm font-medium">
              Twilio Configuration
            </p>
            <div>
              <Label class="text-xs">Account SID</Label>
              <Input v-model="form.twilioAccountSid" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" class="mt-1" />
            </div>
            <div>
              <Label class="text-xs">Auth Token</Label>
              <Input v-model="form.twilioAuthToken" type="password" class="mt-1" />
            </div>
            <div>
              <Label class="text-xs">From Number</Label>
              <Input v-model="form.twilioFrom" placeholder="+1234567890" class="mt-1" />
            </div>
          </div>
        </template>

        <div class="flex gap-2 pt-2">
          <Button variant="outline" @click="router.push(`/apps/${appId}/channels`)">
            Cancel
          </Button>
          <Button :disabled="!form.name || isCreating" @click="handleCreate">
            {{ isCreating ? 'Creating…' : 'Create Channel' }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
