<script setup lang="ts">
import type { SidebarProps } from 'abckit/shadcn/sidebar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from 'abckit/shadcn/sidebar'
import {
  BarChart3,
  FileText,
  Github,
  Home,
  Package,
  Send,
  Smartphone,
  Zap,
} from 'lucide-vue-next'
import AppNavMain from '~/components/app/AppNavMain.vue'
import AppNavUser from '~/components/app/AppNavUser.vue'

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})

const route = useRoute()

// Navigation items
const navMain = computed(() => [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
    isActive: route.path === '/',
  },
  {
    title: 'Applications',
    url: '/apps',
    icon: Package,
    isActive: route.path.startsWith('/apps'),
  },
  {
    title: 'Analytics',
    url: '/analytics',
    icon: BarChart3,
    isActive: route.path.startsWith('/analytics'),
  },
])

const navTools = computed(() => [
  {
    title: 'Send Notification',
    url: '/send',
    icon: Send,
    isActive: route.path.startsWith('/send'),
  },
  {
    title: 'Device Testing',
    url: '/devices',
    icon: Smartphone,
    isActive: route.path.startsWith('/devices'),
  },
])

const navHelp = computed(() => [
  {
    title: 'Documentation',
    url: '/docs',
    icon: FileText,
    isActive: route.path.startsWith('/docs'),
  },
  {
    title: 'GitHub',
    url: 'https://github.com/productdevbook/nitroping',
    icon: Github,
    isActive: false,
  },
])

// User data
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
            <NuxtLink to="/">
              <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Zap class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">NitroPing</span>
                <span class="truncate text-xs">Push Notifications</span>
              </div>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <AppNavMain :items="navMain" label="Main" />
      <AppNavMain :items="navTools" label="Tools" />
      <AppNavMain :items="navHelp" label="Help" />
    </SidebarContent>

    <SidebarFooter>
      <AppNavUser :user="userData" />
    </SidebarFooter>
  </Sidebar>
</template>
