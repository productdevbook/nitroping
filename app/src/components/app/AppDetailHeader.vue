<script setup lang="ts">
import { usePush } from 'notivue'
import { ref } from 'vue'
import Icon from '~/components/common/Icon.vue'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { useSendNotification } from '~/graphql'

interface Props {
  app: any
}

const props = defineProps<Props>()

const push = usePush()
const { mutateAsync: sendNotificationMutation, isLoading: isSendingTest } = useSendNotification()

// Reactive data
const showSendTest = ref(false)
const testNotification = ref({
  title: '',
  body: '',
})

async function sendTestNotification() {
  try {
    await sendNotificationMutation({
      appId: props.app.id,
      title: testNotification.value.title || 'Test Notification',
      body: testNotification.value.body || 'This is a test notification from NitroPing',
    })
    showSendTest.value = false
    testNotification.value = { title: '', body: '' }
    push.success({ title: 'Test notification sent successfully' })
  }
  catch (error) {
    push.error({ title: 'Failed to send test', message: error instanceof Error ? error.message : 'Unknown error' })
  }
}
</script>

<template>
  <div class="flex items-center justify-between mb-8">
    <div class="flex items-center gap-3">
      <div>
        <div class="flex items-center gap-2 mb-0.5">
          <h1 class="text-2xl font-bold">
            {{ app.name }}
          </h1>
          <Badge :variant="app.isActive ? 'default' : 'secondary'">
            {{ app.isActive ? 'Active' : 'Inactive' }}
          </Badge>
        </div>
        <p class="text-sm text-muted-foreground">
          {{ app.slug }}
        </p>
      </div>
    </div>
    <div class="flex space-x-2">
      <Button variant="outline" @click="showSendTest = true">
        <Icon name="lucide:send" class="mr-2 size-4" />
        Send Test
      </Button>
      <Button variant="outline">
        <Icon name="lucide:download" class="mr-2 size-4" />
        Export Data
      </Button>
    </div>
  </div>

  <!-- Send Test Dialog -->
  <Dialog v-model:open="showSendTest">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Send Test Notification</DialogTitle>
        <DialogDescription>Send a test notification to {{ app.name }}</DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="test-title">Title</Label>
          <Input
            id="test-title"
            v-model="testNotification.title"
            placeholder="Hello World!"
          />
        </div>
        <div class="space-y-2">
          <Label for="test-body">Message</Label>
          <Textarea
            id="test-body"
            v-model="testNotification.body"
            placeholder="This is a test notification"
            rows="3"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="showSendTest = false">
          Cancel
        </Button>
        <Button :disabled="isSendingTest" @click="sendTestNotification">
          <Icon v-if="isSendingTest" name="lucide:loader-2" class="mr-2 size-4 animate-spin" />
          Send Test
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
