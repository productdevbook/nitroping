<script setup lang="ts">
import type { SidebarProps } from '~/components/ui/sidebar'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppNavMain from '~/components/app/AppNavMain.vue'
import AppNavUser from '~/components/app/AppNavUser.vue'
import Icon from '~/components/common/Icon.vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar'
import { useApp } from '~/graphql'

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})

const route = useRoute()

const appId = computed(() => {
  const match = route.path.match(/^\/apps\/([^/]+)/)
  return match?.[1] ?? null
})

const isAppContext = computed(() => !!appId.value)
const isDocsContext = computed(() => route.path.startsWith('/docs'))

const { data: appData } = useApp(appId as any)
const currentApp = computed(() => appData.value)

// App-specific navigation
const appNavItems = computed(() => {
  if (!appId.value)
    return []
  const id = appId.value
  return [
    { title: 'Overview', url: `/apps/${id}`, icon: 'lucide:trending-up', isActive: route.path === `/apps/${id}` },
    { title: 'Push Providers', url: `/apps/${id}/providers`, icon: 'lucide:globe', isActive: route.path.startsWith(`/apps/${id}/providers`) },
    { title: 'Devices', url: `/apps/${id}/devices`, icon: 'lucide:smartphone', isActive: route.path === `/apps/${id}/devices` },
    { title: 'Notifications', url: `/apps/${id}/notifications`, icon: 'lucide:activity', isActive: route.path === `/apps/${id}/notifications` },
    { title: 'Contacts', url: `/apps/${id}/contacts`, icon: 'lucide:users', isActive: route.path === `/apps/${id}/contacts` },
    { title: 'Channels', url: `/apps/${id}/channels`, icon: 'lucide:radio', isActive: route.path === `/apps/${id}/channels` },
    { title: 'Templates', url: `/apps/${id}/templates`, icon: 'lucide:file-text', isActive: route.path.startsWith(`/apps/${id}/templates`) },
    { title: 'Workflows', url: `/apps/${id}/workflows`, icon: 'lucide:git-branch', isActive: route.path.startsWith(`/apps/${id}/workflows`) },
    { title: 'Webhooks', url: `/apps/${id}/hooks`, icon: 'lucide:webhook', isActive: route.path === `/apps/${id}/hooks` },
    { title: 'Settings', url: `/apps/${id}/settings`, icon: 'lucide:cog', isActive: route.path === `/apps/${id}/settings` },
  ]
})

// Global navigation
const navMain = computed(() => [
  { title: 'Dashboard', url: '/', icon: 'lucide:home', isActive: route.path === '/' },
  { title: 'Applications', url: '/apps', icon: 'lucide:package', isActive: route.path.startsWith('/apps') },
  { title: 'Analytics', url: '/analytics', icon: 'lucide:bar-chart-3', isActive: route.path.startsWith('/analytics') },
])

const navTools = computed(() => [
  { title: 'Send Notification', url: '/send', icon: 'lucide:send', isActive: route.path.startsWith('/send') },
  { title: 'Device Testing', url: '/devices', icon: 'lucide:smartphone', isActive: route.path.startsWith('/devices') },
  { title: 'Web Push Test', url: '/test-webpush', icon: 'lucide:bell', isActive: route.path.startsWith('/test-webpush') },
])

const navHelp = computed(() => [
  { title: 'Documentation', url: '/docs/getting-started', icon: 'lucide:book-open', isActive: route.path.startsWith('/docs') },
  { title: 'GitHub', url: 'https://github.com/productdevbook/nitroping', icon: 'lucide:github', isActive: false },
])

const navDocsGuide = computed(() => [
  { title: 'Getting Started', url: '/docs/getting-started', icon: 'lucide:play-circle', isActive: route.path === '/docs/getting-started' },
  {
    title: 'Self-Hosting',
    url: '/docs/self-hosting/docker',
    icon: 'lucide:server',
    isActive: route.path.startsWith('/docs/self-hosting'),
    items: [
      { title: 'Docker Compose', url: '/docs/self-hosting/docker', isActive: route.path === '/docs/self-hosting/docker' },
      { title: 'Kubernetes (Helm)', url: '/docs/self-hosting/kubernetes', isActive: route.path === '/docs/self-hosting/kubernetes' },
      { title: 'Configuration', url: '/docs/self-hosting/configuration', isActive: route.path === '/docs/self-hosting/configuration' },
      { title: 'Reverse Proxy', url: '/docs/self-hosting/reverse-proxy', isActive: route.path === '/docs/self-hosting/reverse-proxy' },
    ],
  },
  { title: 'Authentication', url: '/docs/authentication', icon: 'lucide:key', isActive: route.path === '/docs/authentication' },
])

const navDocsFeatures = computed(() => [
  {
    title: 'Channels',
    url: '/docs/channels',
    icon: 'lucide:radio',
    isActive: route.path.startsWith('/docs/channels'),
    items: [
      { title: 'Email (SMTP)', url: '/docs/channels/email', isActive: route.path === '/docs/channels/email' },
      { title: 'Telegram', url: '/docs/channels/telegram', isActive: route.path === '/docs/channels/telegram' },
      { title: 'Discord', url: '/docs/channels/discord', isActive: route.path === '/docs/channels/discord' },
      { title: 'SMS (Twilio)', url: '/docs/channels/sms', isActive: route.path === '/docs/channels/sms' },
      { title: 'Push', url: '/docs/channels/push', isActive: route.path === '/docs/channels/push' },
      { title: 'In-App', url: '/docs/channels/in-app', isActive: route.path === '/docs/channels/in-app' },
    ],
  },
  { title: 'Contacts', url: '/docs/contacts', icon: 'lucide:users', isActive: route.path === '/docs/contacts' },
  { title: 'Workflows', url: '/docs/workflows', icon: 'lucide:git-branch', isActive: route.path === '/docs/workflows' },
  { title: 'Notifications', url: '/docs/notifications', icon: 'lucide:bell', isActive: route.path === '/docs/notifications' },
])

const navDocsReference = computed(() => [
  { title: 'SDK & Examples', url: '/docs/sdk', icon: 'lucide:code-2', isActive: route.path === '/docs/sdk' },
])

const userData = computed(() => ({
  name: 'Admin User',
  email: 'admin@nitroping.dev',
  avatar: '/placeholder-avatar.jpg',
}))
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <RouterLink v-if="isAppContext" to="/apps">
              <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Icon name="lucide:arrow-left" class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">{{ currentApp?.name ?? '...' }}</span>
                <span class="truncate text-xs text-muted-foreground">Back to list</span>
              </div>
            </RouterLink>
            <RouterLink v-else-if="isDocsContext" to="/">
              <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Icon name="lucide:arrow-left" class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">Documentation</span>
                <span class="truncate text-xs text-muted-foreground">Back to app</span>
              </div>
            </RouterLink>
            <RouterLink v-else to="/">
              <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Icon name="lucide:zap" class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">NitroPing</span>
                <span class="truncate text-xs">Push Notifications</span>
              </div>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <template v-if="isAppContext">
        <AppNavMain :items="appNavItems" label="Application" />
      </template>
      <template v-else-if="isDocsContext">
        <AppNavMain :items="navDocsGuide" label="Guide" />
        <AppNavMain :items="navDocsFeatures" label="Features" />
        <AppNavMain :items="navDocsReference" label="Reference" />
      </template>
      <template v-else>
        <AppNavMain :items="navMain" label="Main" />
        <AppNavMain :items="navTools" label="Tools" />
        <AppNavMain :items="navHelp" label="Help" />
      </template>
    </SidebarContent>

    <SidebarFooter>
      <AppNavUser :user="userData" />
    </SidebarFooter>
  </Sidebar>
</template>
