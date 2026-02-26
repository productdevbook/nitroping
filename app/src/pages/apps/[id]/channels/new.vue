<script setup lang="ts">
import { MDC } from 'mdc-syntax/vue'
import { usePush } from 'notivue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { docsComponents, mdcOptions } from '~/composables/useDocsComponents'
import { useCreateChannel } from '~/graphql/channels'

const route = useRoute()
const router = useRouter()
const appId = computed(() => route.params.id as string)
const push = usePush()

const { mutateAsync: createChannel, isLoading: isCreating } = useCreateChannel()

const form = ref({
  name: '',
  type: 'TELEGRAM',
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

// ── Channel type metadata ─────────────────────────────────────────────────

const channelTypes = [
  { value: 'EMAIL', label: 'Email', icon: '✉️', description: 'Send emails via SMTP' },
  { value: 'TELEGRAM', label: 'Telegram', icon: '✈️', description: 'Send messages via a Telegram bot' },
  { value: 'DISCORD', label: 'Discord', icon: '🎮', description: 'Post to a Discord channel via webhook' },
  { value: 'SMS', label: 'SMS', icon: '💬', description: 'Send SMS via Twilio' },
  { value: 'PUSH', label: 'Push', icon: '🔔', description: 'Native push via APNS / FCM / WebPush' },
  { value: 'IN_APP', label: 'In-App', icon: '📱', description: 'In-app notification inbox via SDK' },
]

const typeDocMap: Record<string, string> = {
  EMAIL: 'email',
  TELEGRAM: 'telegram',
  DISCORD: 'discord',
  SMS: 'sms',
  PUSH: 'push',
  IN_APP: 'in-app',
}

// ── Help doc dynamic loader ────────────────────────────────────────────────

const docModules = import.meta.glob('../../../../docs/channels/*.md', { query: '?raw', import: 'default' })

const helpContent = ref('')

async function loadHelp(type: string) {
  const docSlug = typeDocMap[type]
  if (!docSlug)
    return
  const key = `../../../../docs/channels/${docSlug}.md`
  if (docModules[key]) {
    helpContent.value = await docModules[key]() as string
  }
}

watch(() => form.value.type, loadHelp, { immediate: true })

// ── Form ──────────────────────────────────────────────────────────────────

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
  <div class="flex gap-8 items-start">
    <!-- ── Left: Form ── -->
    <div class="w-[420px] shrink-0">
      <div class="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" @click="router.push(`/apps/${appId}/channels`)">
          ← Back
        </Button>
        <div>
          <h2 class="text-xl font-semibold">
            Add Channel
          </h2>
          <p class="text-sm text-muted-foreground">
            Configure a new delivery channel
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
          <!-- Channel Name -->
          <div>
            <Label>Channel Name</Label>
            <Input v-model="form.name" placeholder="My Channel" class="mt-1" />
          </div>

          <!-- Type selector as cards -->
          <div>
            <Label class="mb-2 block">Type</Label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="ct in channelTypes"
                :key="ct.value"
                type="button"
                class="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-all"
                :class="form.type === ct.value
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border text-muted-foreground hover:border-border/80 hover:bg-muted/40'"
                @click="form.type = ct.value"
              >
                <span class="text-base shrink-0">{{ ct.icon }}</span>
                <div class="min-w-0">
                  <div class="font-medium leading-tight">
                    {{ ct.label }}
                  </div>
                  <div class="text-[11px] text-muted-foreground truncate mt-0.5">
                    {{ ct.description }}
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- EMAIL: SMTP -->
          <template v-if="form.type === 'EMAIL'">
            <div class="rounded-lg border border-border p-4 space-y-3 bg-muted/20">
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                SMTP Configuration
              </p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <Label class="text-xs">Host</Label>
                  <Input v-model="form.smtpHost" placeholder="smtp.gmail.com" class="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label class="text-xs">Port</Label>
                  <Input v-model="form.smtpPort" placeholder="587" class="mt-1 h-8 text-sm" />
                </div>
              </div>
              <div>
                <Label class="text-xs">Username</Label>
                <Input v-model="form.smtpUser" placeholder="user@gmail.com" class="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label class="text-xs">Password</Label>
                <Input v-model="form.smtpPass" type="password" class="mt-1 h-8 text-sm" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <Label class="text-xs">From Address</Label>
                  <Input v-model="form.smtpFrom" placeholder="no-reply@myapp.com" class="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label class="text-xs">From Name</Label>
                  <Input v-model="form.smtpFromName" placeholder="My App" class="mt-1 h-8 text-sm" />
                </div>
              </div>
            </div>
          </template>

          <!-- DISCORD -->
          <template v-if="form.type === 'DISCORD'">
            <div class="rounded-lg border border-border p-4 space-y-3 bg-muted/20">
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Webhook Configuration
              </p>
              <div>
                <Label class="text-xs">Webhook URL</Label>
                <Input v-model="form.discordWebhookUrl" placeholder="https://discord.com/api/webhooks/..." class="mt-1 h-8 text-sm" />
              </div>
            </div>
          </template>

          <!-- TELEGRAM -->
          <template v-if="form.type === 'TELEGRAM'">
            <div class="rounded-lg border border-border p-4 space-y-3 bg-muted/20">
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bot Configuration
              </p>
              <div>
                <Label class="text-xs">Bot Token</Label>
                <Input v-model="form.telegramBotToken" type="password" placeholder="1234567890:AAF-..." class="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label class="text-xs">Chat ID</Label>
                <Input v-model="form.telegramChatId" placeholder="-1001234567890" class="mt-1 h-8 text-sm" />
              </div>
            </div>
          </template>

          <!-- SMS: Twilio -->
          <template v-if="form.type === 'SMS'">
            <div class="rounded-lg border border-border p-4 space-y-3 bg-muted/20">
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Twilio Configuration
              </p>
              <div>
                <Label class="text-xs">Account SID</Label>
                <Input v-model="form.twilioAccountSid" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" class="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label class="text-xs">Auth Token</Label>
                <Input v-model="form.twilioAuthToken" type="password" class="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label class="text-xs">From Number</Label>
                <Input v-model="form.twilioFrom" placeholder="+1234567890" class="mt-1 h-8 text-sm" />
              </div>
            </div>
          </template>

          <!-- PUSH / IN_APP — no config needed -->
          <template v-if="form.type === 'PUSH' || form.type === 'IN_APP'">
            <div class="rounded-lg border border-border p-4 bg-muted/20">
              <p class="text-xs text-muted-foreground">
                No additional configuration required. See the setup guide →
              </p>
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

    <!-- ── Right: Help doc ── -->
    <div class="flex-1 min-w-0 hidden lg:block">
      <div class="sticky top-4 rounded-lg border border-border overflow-hidden">
        <!-- Header -->
        <div class="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
          <svg class="size-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <span class="text-xs font-medium text-muted-foreground">Setup Guide</span>
        </div>
        <!-- Scrollable content -->
        <div class="overflow-y-auto max-h-[calc(100vh-180px)] px-5 py-4">
          <Suspense>
            <MDC v-if="helpContent" :markdown="helpContent" :options="mdcOptions" :components="docsComponents" />
          </Suspense>
        </div>
      </div>
    </div>
  </div>
</template>
