<script setup lang="ts">
import { usePush } from 'notivue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { useChannels, useDeleteChannel } from '~/graphql/channels'

const route = useRoute()
const router = useRouter()
const appId = computed(() => route.params.id as string)
const push = usePush()

const { data: channelsData, isLoading } = useChannels(appId)
const channelList = computed(() => channelsData.value || [])

const { mutateAsync: deleteChannel } = useDeleteChannel()

const channelTypeColors: Record<string, string> = {
  EMAIL: 'bg-blue-100 text-blue-700',
  PUSH: 'bg-purple-100 text-purple-700',
  SMS: 'bg-green-100 text-green-700',
  IN_APP: 'bg-orange-100 text-orange-700',
  DISCORD: 'bg-indigo-100 text-indigo-700',
  TELEGRAM: 'bg-cyan-100 text-cyan-700',
}

async function handleDelete(id: string) {
  try {
    await deleteChannel({ id, appId: appId.value })
    push.success({ title: 'Channel deleted' })
  }
  catch (error) {
    push.error({ title: 'Failed to delete channel', message: error instanceof Error ? error.message : 'Unknown error' })
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold">
          Channels
        </h2>
        <p class="text-sm text-muted-foreground">
          Configure delivery channels (Email, SMS, Discord, Push)
        </p>
      </div>
      <Button @click="router.push(`/apps/${appId}/channels/new`)">
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
      <Button class="mt-4" @click="router.push(`/apps/${appId}/channels/new`)">
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
            <Button variant="destructive" size="sm" @click="handleDelete(ch.id)">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
