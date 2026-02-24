<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppDetailHeader from '~/components/app/AppDetailHeader.vue'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { useApp } from '~/graphql'
import { useCreateHook, useDeleteHook, useHooks } from '~/graphql/hooks'

const route = useRoute()
const appId = computed(() => route.params.id as string)

const { data: appData } = useApp(appId)
const app = computed(() => appData.value)
const { data: hooksData, isLoading } = useHooks(appId)
const hookList = computed(() => hooksData.value || [])

const { mutateAsync: createHook, isLoading: isCreating } = useCreateHook()
const { mutateAsync: deleteHook } = useDeleteHook()

const showCreate = ref(false)
const form = ref({
  name: '',
  url: '',
  secret: '',
  events: [] as string[],
})

const ALL_EVENTS = [
  'NOTIFICATION_SENT',
  'NOTIFICATION_DELIVERED',
  'NOTIFICATION_FAILED',
  'NOTIFICATION_CLICKED',
  'WORKFLOW_COMPLETED',
  'WORKFLOW_FAILED',
]

function toggleEvent(event: string) {
  const idx = form.value.events.indexOf(event)
  if (idx >= 0) {
    form.value.events.splice(idx, 1)
  }
  else {
    form.value.events.push(event)
  }
}

async function handleCreate() {
  await createHook({
    appId: appId.value,
    name: form.value.name,
    url: form.value.url,
    secret: form.value.secret || undefined,
    events: form.value.events,
  })
  showCreate.value = false
  form.value = { name: '', url: '', secret: '', events: [] }
}
</script>

<template>
  <div>
    <AppDetailHeader :app="app" />

    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold">
          Webhooks
        </h2>
        <p class="text-sm text-muted-foreground">
          HMAC-signed webhook endpoints for delivery events
        </p>
      </div>
      <Button @click="showCreate = true">
        Add Webhook
      </Button>
    </div>

    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Events</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading">
              <TableCell colspan="5" class="text-center py-8 text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
            <TableRow v-else-if="hookList.length === 0">
              <TableCell colspan="5" class="text-center py-8 text-muted-foreground">
                No webhooks configured
              </TableCell>
            </TableRow>
            <TableRow v-for="hook in hookList" :key="hook.id">
              <TableCell class="font-medium">
                {{ hook.name }}
              </TableCell>
              <TableCell class="font-mono text-xs">
                {{ hook.url }}
              </TableCell>
              <TableCell class="text-xs">
                {{ hook.events?.length ? (hook.events as string[]).join(', ') : 'All events' }}
              </TableCell>
              <TableCell>
                <span :class="hook.isActive ? 'text-green-600' : 'text-gray-400'" class="text-xs font-medium">
                  {{ hook.isActive ? 'Active' : 'Inactive' }}
                </span>
              </TableCell>
              <TableCell>
                <Button variant="destructive" size="sm" @click="deleteHook({ id: hook.id, appId })">
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog v-model:open="showCreate">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Webhook</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <Label>Name</Label>
            <Input v-model="form.name" placeholder="My Webhook" />
          </div>
          <div>
            <Label>URL</Label>
            <Input v-model="form.url" placeholder="https://myapp.com/webhooks/nitroping" />
          </div>
          <div>
            <Label>Secret (optional, for HMAC signing)</Label>
            <Input v-model="form.secret" type="password" placeholder="my-secret-key" />
          </div>
          <div>
            <Label class="mb-2 block">Events (empty = all events)</Label>
            <div class="space-y-2">
              <div v-for="event in ALL_EVENTS" :key="event" class="flex items-center gap-2">
                <Checkbox
                  :id="event"
                  :checked="form.events.includes(event)"
                  @update:checked="toggleEvent(event)"
                />
                <label :for="event" class="text-sm font-mono cursor-pointer">{{ event }}</label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showCreate = false">
            Cancel
          </Button>
          <Button :disabled="!form.name || !form.url || isCreating" @click="handleCreate">
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
