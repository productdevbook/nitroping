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
  { title: 'Documentation', url: '/docs', icon: 'lucide:file-text', isActive: route.path.startsWith('/docs') },
  { title: 'GitHub', url: 'https://github.com/productdevbook/nitroping', icon: 'lucide:github', isActive: false },
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
