<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

interface Props {
  app: any
}

const _props = defineProps<Props>()

const router = useRouter()

// Reactive data
const showSendTest = ref(false)
const testNotification = ref({
  title: '',
  body: '',
})

async function sendTestNotification() {
  try {
    // TODO: Implement test notification sending
    console.log('Send test notification:', testNotification.value)
    showSendTest.value = false
    testNotification.value = { title: '', body: '' }
  }
  catch (error) {
    console.error('Error sending test notification:', error)
  }
}
</script>

<template>
  <div class="flex items-center justify-between mb-8">
    <div class="flex items-center space-x-4">
      <Button variant="ghost" size="icon" @click="router.back()">
        <Icon name="lucide:arrow-left" class="size-4" />
      </Button>
      <div>
        <h1 class="text-3xl font-bold mb-1">{{ app.name }}</h1>
        <p class="text-muted-foreground">{{ app.slug }}</p>
      </div>
      <Badge :variant="app.isActive ? 'default' : 'secondary'">
        {{ app.isActive ? 'Active' : 'Inactive' }}
      </Badge>
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
        <Button variant="outline" @click="showSendTest = false">Cancel</Button>
        <Button @click="sendTestNotification">Send Test</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
