<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '~/components/common/Icon.vue'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { useNotification } from '~/graphql'

const route = useRoute()
const notificationId = computed(() => route.params.notificationId as string)

const { data: notificationData, isLoading } = useNotification(notificationId)
const notif = computed(() => notificationData.value)

const logs = computed(() => notif.value?.deliveryLogs ?? [])

const stats = computed(() => {
  const n = notif.value
  if (!n)
    return null
  const rate = n.totalTargets > 0 ? Math.round((n.totalSent / n.totalTargets) * 100) : 0
  const openRate = n.totalSent > 0 ? Math.round((n.totalOpened / n.totalSent) * 100) : 0
  const clickRate = n.totalSent > 0 ? Math.round((n.totalClicked / n.totalSent) * 100) : 0
  return { rate, openRate, clickRate }
})

function statusVariant(status: string) {
  const map: Record<string, string> = {
    SENT: 'default',
    DELIVERED: 'success',
    FAILED: 'destructive',
    PENDING: 'secondary',
    CLICKED: 'outline',
  }
  return map[status] ?? 'secondary'
}

function statusIcon(status: string) {
  const map: Record<string, string> = {
    SENT: 'mail-send-01',
    DELIVERED: 'checkmark-circle-01',
    FAILED: 'alert-circle',
    PENDING: 'clock-01',
    CLICKED: 'cursor-01',
  }
  return map[status] ?? 'circle'
}

function fmt(ts?: string | null) {
  if (!ts)
    return '—'
  return new Date(ts).toLocaleString()
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Loading -->
    <div v-if="isLoading" class="text-muted-foreground text-sm">
      Loading...
    </div>

    <template v-else-if="notif">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <h1 class="text-xl font-semibold">
            {{ notif.title }}
          </h1>
          <p class="text-muted-foreground text-sm">
            {{ notif.body }}
          </p>
        </div>
        <Badge :variant="statusVariant(notif.status) as any">
          {{ notif.status }}
        </Badge>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader class="pb-1 pt-4 px-4">
            <CardTitle class="text-xs text-muted-foreground font-normal">
              Targets
            </CardTitle>
          </CardHeader>
          <CardContent class="px-4 pb-4">
            <span class="text-2xl font-bold">{{ notif.totalTargets }}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-1 pt-4 px-4">
            <CardTitle class="text-xs text-muted-foreground font-normal">
              Sent
            </CardTitle>
          </CardHeader>
          <CardContent class="px-4 pb-4">
            <span class="text-2xl font-bold">{{ notif.totalSent }}</span>
            <span v-if="stats" class="text-xs text-muted-foreground ml-1">{{ stats.rate }}%</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-1 pt-4 px-4">
            <CardTitle class="text-xs text-muted-foreground font-normal">
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent class="px-4 pb-4">
            <span class="text-2xl font-bold text-destructive">{{ notif.totalFailed }}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-1 pt-4 px-4">
            <CardTitle class="text-xs text-muted-foreground font-normal">
              Opened
            </CardTitle>
          </CardHeader>
          <CardContent class="px-4 pb-4">
            <span class="text-2xl font-bold">{{ notif.totalOpened }}</span>
            <span v-if="stats" class="text-xs text-muted-foreground ml-1">{{ stats.openRate }}%</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-1 pt-4 px-4">
            <CardTitle class="text-xs text-muted-foreground font-normal">
              Clicked
            </CardTitle>
          </CardHeader>
          <CardContent class="px-4 pb-4">
            <span class="text-2xl font-bold">{{ notif.totalClicked }}</span>
            <span v-if="stats" class="text-xs text-muted-foreground ml-1">{{ stats.clickRate }}%</span>
          </CardContent>
        </Card>
      </div>

      <!-- Delivery Logs -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">
            Delivery Logs
            <span class="text-muted-foreground font-normal text-sm ml-1">({{ logs.length }})</span>
          </CardTitle>
        </CardHeader>
        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead>Clicked</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="log in logs" :key="log.id">
                <TableCell class="font-mono text-xs">
                  {{ log.to || log.deviceId || '—' }}
                </TableCell>
                <TableCell>
                  <Badge :variant="statusVariant(log.status) as any" class="gap-1">
                    <Icon :name="statusIcon(log.status)" class="size-3" />
                    {{ log.status }}
                  </Badge>
                </TableCell>
                <TableCell class="text-xs text-muted-foreground">
                  {{ fmt(log.sentAt) }}
                </TableCell>
                <TableCell class="text-xs">
                  <span v-if="log.openedAt" class="text-green-600">{{ fmt(log.openedAt) }}</span>
                  <span v-else class="text-muted-foreground">—</span>
                </TableCell>
                <TableCell class="text-xs">
                  <span v-if="log.clickedAt" class="text-blue-600">{{ fmt(log.clickedAt) }}</span>
                  <span v-else class="text-muted-foreground">—</span>
                </TableCell>
                <TableCell class="text-xs text-destructive max-w-48 truncate">
                  {{ log.errorMessage || '—' }}
                </TableCell>
              </TableRow>
              <TableRow v-if="logs.length === 0">
                <TableCell colspan="6" class="text-center text-muted-foreground py-8">
                  No delivery logs yet
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
