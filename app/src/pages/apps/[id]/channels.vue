<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppDetailHeader from '~/components/app/AppDetailHeader.vue'
import AppNavigation from '~/components/app/AppNavigation.vue'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useApp } from '~/graphql'
import { useChannels, useCreateChannel, useDeleteChannel } from '~/graphql/channels'

const route = useRoute()
const appId = computed(() => route.params.id as string)

const { data: appData } = useApp(appId)
const app = computed(() => appData.value)
const { data: channelsData, isLoading } = useChannels(appId)
const channelList = computed(() => channelsData.value || [])

const { mutateAsync: createChannel, isLoading: isCreating } = useCreateChannel()
const { mutateAsync: deleteChannel } = useDeleteChannel()

const showCreate = ref(false)
const form = ref({
  name: '',
  type: 'EMAIL',
  // SMTP config
  smtpHost: '',
  smtpPort: '587',
  smtpUser: '',
  smtpPass: '',
  smtpFrom: '',
  smtpFromName: '',
})

const channelTypeColors: Record<string, string> = {
  EMAIL: 'bg-blue-100 text-blue-700',
  PUSH: 'bg-purple-100 text-purple-700',
  SMS: 'bg-green-100 text-green-700',
  IN_APP: 'bg-orange-100 text-orange-700',
}

async function handleCreate() {
  const config = form.value.type === 'EMAIL'
    ? {
        provider: 'smtp',
        host: form.value.smtpHost,
        port: Number(form.value.smtpPort),
        user: form.value.smtpUser,
        pass: form.value.smtpPass,
        from: form.value.smtpFrom,
        fromName: form.value.smtpFromName,
      }
    : undefined

  await createChannel({ appId: appId.value, name: form.value.name, type: form.value.type, config })
  showCreate.value = false
  form.value = { name: '', type: 'EMAIL', smtpHost: '', smtpPort: '587', smtpUser: '', smtpPass: '', smtpFrom: '', smtpFromName: '' }
}
</script>

<template>
  <div>
    <AppDetailHeader :app="app" />
    <AppNavigation :app-id="appId" />

    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold">
          Channels
        </h2>
        <p class="text-sm text-muted-foreground">
          Configure delivery channels (Email, SMS, Push)
        </p>
      </div>
      <Button @click="showCreate = true">
        Add Channel
      </Button>
    </div>

    <div v-if="isLoading" class="text-center py-12 text-muted-foreground">
      Loading...
    </div>

    <div v-else-if="channelList.length === 0" class="text-center py-12">
      <p class="text-muted-foreground">
        No channels configured yet
      </p>
      <Button class="mt-4" @click="showCreate = true">
        Add your first channel
      </Button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card v-for="ch in channelList" :key="ch.id">
        <CardHeader>
          <div class="flex items-start justify-between">
            <CardTitle class="text-base">
              {{ ch.name }}
            </CardTitle>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="channelTypeColors[ch.type] || 'bg-gray-100 text-gray-700'">
              {{ ch.type }}
            </span>
          </div>
          <CardDescription>
            {{ ch.isActive ? 'Active' : 'Inactive' }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="text-xs text-muted-foreground">
            Created {{ new Date(ch.createdAt).toLocaleDateString() }}
          </div>
          <div class="mt-3 flex gap-2">
            <Button variant="destructive" size="sm" @click="deleteChannel({ id: ch.id, appId })">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <Dialog v-model:open="showCreate">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Channel</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <Label>Channel Name</Label>
            <Input v-model="form.name" placeholder="My Email Channel" />
          </div>
          <div>
            <Label>Type</Label>
            <Select v-model="form.type">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMAIL">
                  Email
                </SelectItem>
                <SelectItem value="PUSH">
                  Push
                </SelectItem>
                <SelectItem value="SMS">
                  SMS
                </SelectItem>
                <SelectItem value="IN_APP">
                  In-App
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <template v-if="form.type === 'EMAIL'">
            <div class="border rounded-lg p-4 space-y-3">
              <p class="text-sm font-medium">
                SMTP Configuration
              </p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <Label class="text-xs">Host</Label>
                  <Input v-model="form.smtpHost" placeholder="smtp.gmail.com" />
                </div>
                <div>
                  <Label class="text-xs">Port</Label>
                  <Input v-model="form.smtpPort" placeholder="587" />
                </div>
              </div>
              <div>
                <Label class="text-xs">Username</Label>
                <Input v-model="form.smtpUser" placeholder="user@gmail.com" />
              </div>
              <div>
                <Label class="text-xs">Password</Label>
                <Input v-model="form.smtpPass" type="password" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <Label class="text-xs">From Address</Label>
                  <Input v-model="form.smtpFrom" placeholder="no-reply@myapp.com" />
                </div>
                <div>
                  <Label class="text-xs">From Name</Label>
                  <Input v-model="form.smtpFromName" placeholder="My App" />
                </div>
              </div>
            </div>
          </template>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showCreate = false">
            Cancel
          </Button>
          <Button :disabled="!form.name || isCreating" @click="handleCreate">
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
