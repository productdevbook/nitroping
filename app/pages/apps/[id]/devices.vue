<script setup lang="ts">
import type { DevicePlatform } from '#graphql/client'
import { CheckCircle, Loader2, Plus, RefreshCw, Search, Smartphone, XCircle } from 'lucide-vue-next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const appId = computed(() => route.params.id as string)

// API queries
const { data: appData } = useApp(appId)
const app = computed(() => appData.value)

const { data: devicesData, isLoading: devicesLoading } = useDevices(appId)
const devices = computed(() => devicesData.value || [])

const { mutateAsync: registerDeviceMutation, isLoading: isRegisteringDevice } = useRegisterDevice()

// Reactive data
const searchQuery = ref('')
const selectedPlatform = ref('all')
const showRegisterDevice = ref(false)
const deviceForm = ref({
  token: '',
  platform: 'WEB',
  userId: '',
})

// Filtered devices
const filteredDevices = computed(() => {
  let filtered = devices.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(device =>
      device.token.toLowerCase().includes(query)
      || device.platform.toLowerCase().includes(query)
      || device.userId?.toLowerCase().includes(query),
    )
  }

  if (selectedPlatform.value !== 'all') {
    filtered = filtered.filter(device => device.platform === selectedPlatform.value)
  }

  return filtered
})

// Device stats
const deviceStats = computed(() => {
  const stats = devices.value.reduce((acc, device) => {
    acc.total++
    if (device.status === 'ACTIVE')
      acc.active++
    if (device.lastSeenAt && new Date(device.lastSeenAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      acc.seenToday++
    }
    return acc
  }, { total: 0, active: 0, seenToday: 0 })

  return stats
})

function formatLastSeen(date: string | null | undefined) {
  if (!date)
    return 'Never'
  const now = new Date()
  const lastSeen = new Date(date)
  const diffMs = now.getTime() - lastSeen.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1)
    return 'Just now'
  if (diffMinutes < 60)
    return `${diffMinutes}m ago`
  if (diffHours < 24)
    return `${diffHours}h ago`
  if (diffDays === 1)
    return 'Yesterday'
  return `${diffDays}d ago`
}

function getPlatformIcon(platform: string) {
  switch (platform.toUpperCase()) {
    case 'IOS': return '🍎'
    case 'ANDROID': return '🤖'
    case 'WEB': return '🌐'
    default: return '📱'
  }
}

async function registerDevice() {
  try {
    await registerDeviceMutation({
      appId: appId.value,
      token: deviceForm.value.token,
      platform: deviceForm.value.platform as DevicePlatform,
      userId: deviceForm.value.userId || undefined,
    })

    showRegisterDevice.value = false
    deviceForm.value = { token: '', platform: 'WEB', userId: '' }
  }
  catch (error) {
    console.error('Error registering device:', error)
  }
}

function deleteDevice(deviceId: string) {
  // TODO: Implement device deletion
  console.log('Delete device:', deviceId)
}

function refreshDevices() {
  // TODO: Refresh devices list
  console.log('Refresh devices')
}
</script>

<template>
  <div v-if="app">
    <!-- App Header -->
    <AppDetailHeader :app="app" />

    <!-- Navigation -->
    <AppNavigation :app-id="appId" />

    <!-- Devices Content -->
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold mb-2">Registered Devices</h2>
          <p class="text-muted-foreground">Manage devices that can receive push notifications.</p>
        </div>
        <div class="flex space-x-2">
          <Button variant="outline" :disabled="devicesLoading" @click="refreshDevices">
            <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': devicesLoading }" />
            Refresh
          </Button>
          <Button @click="showRegisterDevice = true">
            <Plus class="mr-2 h-4 w-4" />
            Register Device
          </Button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Devices</CardTitle>
            <Smartphone class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ deviceStats.total }}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Active Devices</CardTitle>
            <CheckCircle class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ deviceStats.active }}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Seen Today</CardTitle>
            <RefreshCw class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ deviceStats.seenToday }}</div>
          </CardContent>
        </Card>
      </div>

      <!-- Filters -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <div class="relative">
                <Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  v-model="searchQuery"
                  placeholder="Search devices by token, platform, or user ID..."
                  class="pl-10"
                />
              </div>
            </div>
            <Select v-model="selectedPlatform">
              <SelectTrigger class="w-full sm:w-48">
                <SelectValue placeholder="All platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                <SelectItem value="WEB">Web</SelectItem>
                <SelectItem value="IOS">iOS</SelectItem>
                <SelectItem value="ANDROID">Android</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <!-- Devices Table -->
      <Card>
        <CardHeader>
          <CardTitle>Devices ({{ filteredDevices.length }})</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="devicesLoading" class="flex items-center justify-center py-8">
            <Loader2 class="h-6 w-6 animate-spin" />
          </div>

          <div v-else-if="filteredDevices.length === 0" class="text-center py-8 text-muted-foreground">
            <Smartphone class="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p class="text-lg font-medium mb-2">No devices found</p>
            <p class="text-sm">{{ devices.length === 0 ? 'Register your first device to get started.' : 'Try adjusting your search filters.' }}</p>
          </div>

          <Table v-else>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="device in filteredDevices" :key="device.id">
                <TableCell>
                  <div class="flex items-center space-x-2">
                    <span class="text-lg">{{ getPlatformIcon(device.platform) }}</span>
                    <span class="capitalize">{{ device.platform }}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <code class="text-xs bg-muted px-1 rounded">{{ device.token.substring(0, 20) }}...</code>
                </TableCell>
                <TableCell>
                  <span v-if="device.userId" class="text-sm">{{ device.userId }}</span>
                  <span v-else class="text-muted-foreground text-sm">Anonymous</span>
                </TableCell>
                <TableCell>
                  <Badge :variant="device.status === 'ACTIVE' ? 'default' : 'secondary'">
                    <CheckCircle v-if="device.status === 'ACTIVE'" class="mr-1 h-3 w-3" />
                    <XCircle v-else class="mr-1 h-3 w-3" />
                    {{ device.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span class="text-sm">{{ formatLastSeen(device.lastSeenAt) }}</span>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" @click="deleteDevice(device.id)">
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>

    <!-- Register Device Dialog -->
    <Dialog v-model:open="showRegisterDevice">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register New Device</DialogTitle>
          <DialogDescription>Add a new device to receive push notifications</DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="registerDevice">
          <div class="space-y-2">
            <Label for="device-token">Device Token *</Label>
            <Input
              id="device-token"
              v-model="deviceForm.token"
              placeholder="Device push token..."
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="device-platform">Platform *</Label>
            <Select v-model="deviceForm.platform" required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEB">Web</SelectItem>
                <SelectItem value="IOS">iOS</SelectItem>
                <SelectItem value="ANDROID">Android</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="device-user-id">User ID (Optional)</Label>
            <Input
              id="device-user-id"
              v-model="deviceForm.userId"
              placeholder="user123"
            />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" @click="showRegisterDevice = false">Cancel</Button>
          <Button :disabled="isRegisteringDevice || !deviceForm.token" @click="registerDevice">
            <Loader2 v-if="isRegisteringDevice" class="mr-2 h-4 w-4 animate-spin" />
            Register Device
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>

  <!-- Loading State -->
  <div v-else class="flex items-center justify-center h-64">
    <Loader2 class="h-8 w-8 animate-spin" />
  </div>
</template>
