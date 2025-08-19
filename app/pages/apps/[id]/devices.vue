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
    if (selectedPlatform.value === 'WEB') {
      // All web platforms
      filtered = filtered.filter(device => device.platform === 'WEB')
    }
    else if (['CHROME', 'FIREFOX', 'SAFARI', 'EDGE', 'OPERA'].includes(selectedPlatform.value)) {
      // Filter by browser category
      filtered = filtered.filter(device => device.category === selectedPlatform.value)
    }
    else {
      // Direct platform filtering (IOS, ANDROID)
      filtered = filtered.filter(device => device.platform === selectedPlatform.value)
    }
  }

  // Sort by platform type, then by creation date
  return filtered.sort((a, b) => {
    // Group by platform type
    const platformOrder = { IOS: 1, ANDROID: 2, WEB: 3 }
    const aOrder = platformOrder[a.platform as keyof typeof platformOrder] || 4
    const bOrder = platformOrder[b.platform as keyof typeof platformOrder] || 4

    if (aOrder !== bOrder) {
      return aOrder - bOrder
    }

    // Within same platform group, sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
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

    // Platform breakdown
    if (device.platform === 'IOS') {
      acc.ios++
    }
    else if (device.platform === 'ANDROID') {
      acc.android++
    }
    else if (device.platform === 'WEB') {
      acc.web++

      // Browser breakdown using category field
      if (device.category) {
        switch (device.category.toUpperCase()) {
          case 'CHROME':
            acc.chrome++
            break
          case 'FIREFOX':
            acc.firefox++
            break
          case 'SAFARI':
            acc.safari++
            break
          case 'EDGE':
            acc.edge++
            break
          case 'OPERA':
            acc.opera++
            break
          default:
            acc.unknownWeb++
        }
      }
      else {
        // Legacy: no category, try metadata
        try {
          const data = JSON.parse(device.metadata || '{}')
          const browser = data.browser?.toLowerCase()
          if (browser === 'chrome')
            acc.chrome++
          else if (browser === 'firefox')
            acc.firefox++
          else if (browser === 'safari')
            acc.safari++
          else if (browser === 'edge')
            acc.edge++
          else if (browser === 'opera')
            acc.opera++
          else acc.unknownWeb++
        }
        catch {
          acc.unknownWeb++
        }
      }
    }

    return acc
  }, {
    total: 0,
    active: 0,
    seenToday: 0,
    ios: 0,
    android: 0,
    web: 0,
    chrome: 0,
    firefox: 0,
    safari: 0,
    edge: 0,
    opera: 0,
    unknownWeb: 0,
  })

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

function getPlatformIcon(category: string | null, platform: string, metadata?: string) {
  // Use category first if available
  if (category) {
    switch (category.toUpperCase()) {
      case 'CHROME': return '🌐'
      case 'FIREFOX': return '🦊'
      case 'SAFARI': return '🧭'
      case 'EDGE': return '🌊'
      case 'OPERA': return '🎭'
      default: return '🌐'
    }
  }

  // Fallback to platform
  switch (platform.toUpperCase()) {
    case 'IOS': return '🍎'
    case 'ANDROID': return '🤖'
    case 'WEB': {
      // For web without category, try to parse from metadata (legacy)
      if (metadata) {
        try {
          const data = JSON.parse(metadata)
          const browser = data.browser?.toLowerCase()
          switch (browser) {
            case 'chrome': return '🌐'
            case 'firefox': return '🦊'
            case 'safari': return '🧭'
            case 'edge': return '🌊'
            case 'opera': return '🎭'
            default: return '🌐'
          }
        }
        catch {
          return '🌐'
        }
      }
      return '🌐'
    }
    default: return '📱'
  }
}

function getPlatformDescription(platform: string, metadata?: string): string {
  switch (platform.toUpperCase()) {
    case 'IOS':
      return 'Apple Push Notification service'
    case 'ANDROID':
      return 'Firebase Cloud Messaging'
    case 'WEB': {
      if (metadata) {
        try {
          const data = JSON.parse(metadata)
          const browser = data.browser?.toLowerCase()
          switch (browser) {
            case 'chrome':
              return 'Chrome Web Push'
            case 'firefox':
              return 'Mozilla Push Service'
            case 'safari':
              return 'Safari Web Push'
            case 'edge':
              return 'Microsoft Edge Web Push'
            case 'opera':
              return 'Opera Web Push'
            default:
              return 'Web Push API'
          }
        }
        catch {
          return 'Web Push API'
        }
      }
      return 'Web Push API'
    }
    default:
      return 'Unknown platform'
  }
}

function getTokenType(platform: string): string {
  switch (platform.toUpperCase()) {
    case 'IOS':
      return 'APNs Device Token'
    case 'ANDROID':
      return 'FCM Registration Token'
    case 'WEB':
      return 'Web Push Endpoint'
    default:
      return 'Push Token'
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getOSInfo(metadata?: string): string | null {
  if (!metadata)
    return null

  try {
    const data = JSON.parse(metadata)
    const os = data.os

    if (os) {
      switch (os.toLowerCase()) {
        case 'mac':
        case 'macos':
          return 'macOS'
        case 'windows':
        case 'win':
          return 'Windows'
        case 'linux':
          return 'Linux'
        case 'android':
          return 'Android'
        case 'ios':
          return 'iOS'
        default:
          return os.charAt(0).toUpperCase() + os.slice(1)
      }
    }

    return null
  }
  catch {
    return null
  }
}

function getBasePlatformName(platform: string): string {
  switch (platform.toUpperCase()) {
    case 'IOS':
      return 'iOS'
    case 'ANDROID':
      return 'Android'
    case 'WEB':
      return 'Web'
    default:
      return 'Unknown'
  }
}

function getBrowserVersion(metadata?: string): string | null {
  if (!metadata)
    return null

  try {
    const data = JSON.parse(metadata)
    const version = data.browserVersion
    return version ? `v${version.split('.')[0]}` : null
  }
  catch {
    return null
  }
}

function getBrowserDisplayName(category: string | null, platform: string, metadata?: string): string {
  // For web platforms, show browser type
  if (platform === 'WEB') {
    if (category) {
      // Use category for browser name
      switch (category.toUpperCase()) {
        case 'CHROME':
          return 'Chrome'
        case 'FIREFOX':
          return 'Firefox'
        case 'SAFARI':
          return 'Safari'
        case 'EDGE':
          return 'Edge'
        case 'OPERA':
          return 'Opera'
        default:
          return category
      }
    }
    else {
      // Fallback: try to get from metadata
      if (metadata) {
        try {
          const data = JSON.parse(metadata)
          if (data.browser) {
            return data.browser.charAt(0).toUpperCase() + data.browser.slice(1)
          }
        }
        catch {
          // ignore
        }
      }
      return 'Web Browser'
    }
  }

  // For non-web platforms, show OS/Platform name
  switch (platform.toUpperCase()) {
    case 'IOS':
      return 'iOS'
    case 'ANDROID':
      return 'Android'
    default:
      return platform || 'Unknown'
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
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Devices</CardTitle>
            <Smartphone class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ deviceStats.total }}</div>
            <div class="text-xs text-muted-foreground mt-1">
              🍎{{ deviceStats.ios }} 🤖{{ deviceStats.android }} 🌐{{ deviceStats.web }}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Active Devices</CardTitle>
            <CheckCircle class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ deviceStats.active }}</div>
            <div class="text-xs text-muted-foreground mt-1">
              {{ Math.round((deviceStats.active / deviceStats.total) * 100) || 0 }}% active rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Seen Today</CardTitle>
            <RefreshCw class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ deviceStats.seenToday }}</div>
            <div class="text-xs text-muted-foreground mt-1">
              Last 24 hours
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Platform Mix</CardTitle>
            <Smartphone class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="space-y-1">
              <div class="flex justify-between text-sm">
                <span class="flex items-center"><span class="mr-1">🍎</span>iOS</span>
                <span class="font-medium">{{ deviceStats.ios }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="flex items-center"><span class="mr-1">🤖</span>Android</span>
                <span class="font-medium">{{ deviceStats.android }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="flex items-center"><span class="mr-1">🌐</span>Web Total</span>
                <span class="font-medium">{{ deviceStats.web }}</span>
              </div>
              <!-- Browser breakdown -->
              <div v-if="deviceStats.chrome > 0" class="flex justify-between text-xs text-muted-foreground pl-4">
                <span class="flex items-center"><span class="mr-1">🌐</span>Chrome</span>
                <span>{{ deviceStats.chrome }}</span>
              </div>
              <div v-if="deviceStats.firefox > 0" class="flex justify-between text-xs text-muted-foreground pl-4">
                <span class="flex items-center"><span class="mr-1">🦊</span>Firefox</span>
                <span>{{ deviceStats.firefox }}</span>
              </div>
              <div v-if="deviceStats.safari > 0" class="flex justify-between text-xs text-muted-foreground pl-4">
                <span class="flex items-center"><span class="mr-1">🧭</span>Safari</span>
                <span>{{ deviceStats.safari }}</span>
              </div>
              <div v-if="deviceStats.edge > 0" class="flex justify-between text-xs text-muted-foreground pl-4">
                <span class="flex items-center"><span class="mr-1">🌊</span>Edge</span>
                <span>{{ deviceStats.edge }}</span>
              </div>
              <div v-if="deviceStats.opera > 0" class="flex justify-between text-xs text-muted-foreground pl-4">
                <span class="flex items-center"><span class="mr-1">🎭</span>Opera</span>
                <span>{{ deviceStats.opera }}</span>
              </div>
              <div v-if="deviceStats.unknownWeb > 0" class="flex justify-between text-xs text-muted-foreground pl-4">
                <span class="flex items-center"><span class="mr-1">❓</span>Other</span>
                <span>{{ deviceStats.unknownWeb }}</span>
              </div>
            </div>
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
                <SelectItem value="WEB">🌐 All Web</SelectItem>
                <SelectItem value="CHROME">🌐 Chrome</SelectItem>
                <SelectItem value="FIREFOX">🦊 Firefox</SelectItem>
                <SelectItem value="SAFARI">🧭 Safari</SelectItem>
                <SelectItem value="EDGE">🌊 Edge</SelectItem>
                <SelectItem value="OPERA">🎭 Opera</SelectItem>
                <SelectItem value="IOS">🍎 iOS</SelectItem>
                <SelectItem value="ANDROID">🤖 Android</SelectItem>
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
                <TableHead class="w-[180px]">Platform</TableHead>
                <TableHead class="w-[120px]">Browser/OS</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead class="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="device in filteredDevices" :key="device.id" class="hover:bg-muted/50">
                <TableCell>
                  <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                      <span class="text-2xl">{{ getPlatformIcon(device.category || null, device.platform, device.metadata) }}</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="font-medium text-sm">{{ getBasePlatformName(device.platform) }}</div>
                      <div class="text-xs text-muted-foreground">
                        {{ getPlatformDescription(device.platform, device.metadata) }}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div class="text-sm">
                    <div class="font-medium">{{ getBrowserDisplayName(device.category || null, device.platform, device.metadata) }}</div>
                    <div class="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                      <span v-if="getBrowserVersion(device.metadata)">{{ getBrowserVersion(device.metadata) }}</span>
                      <span v-if="getOSInfo(device.metadata)" class="text-blue-600">• {{ getOSInfo(device.metadata) }}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div class="font-mono text-xs">
                    <div class="bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                      {{ device.token.substring(0, 30) }}...
                    </div>
                    <div class="text-[10px] text-muted-foreground mt-1">
                      {{ getTokenType(device.platform) }}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div v-if="device.userId" class="flex items-center space-x-1">
                    <span class="text-sm font-medium">{{ device.userId }}</span>
                    <Badge variant="outline" class="text-[10px] px-1">User</Badge>
                  </div>
                  <div v-else class="flex items-center space-x-1">
                    <span class="text-muted-foreground text-sm">Anonymous</span>
                    <Badge variant="secondary" class="text-[10px] px-1">Guest</Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge :variant="device.status === 'ACTIVE' ? 'default' : 'secondary'" class="flex items-center space-x-1">
                    <CheckCircle v-if="device.status === 'ACTIVE'" class="h-3 w-3" />
                    <XCircle v-else class="h-3 w-3" />
                    <span>{{ device.status === 'ACTIVE' ? 'Active' : 'Inactive' }}</span>
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="text-sm">
                    <div class="font-medium">{{ formatLastSeen(device.lastSeenAt) }}</div>
                    <div class="text-xs text-muted-foreground">
                      {{ device.createdAt ? formatDate(new Date(device.createdAt)) : 'Unknown' }}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div class="flex space-x-1">
                    <Button variant="ghost" size="sm" class="h-7 px-2" @click="deleteDevice(device.id)">
                      Delete
                    </Button>
                  </div>
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
