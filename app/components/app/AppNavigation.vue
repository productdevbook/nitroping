<script setup lang="ts">
import { Activity, Cog, Globe, Smartphone, TrendingUp } from 'lucide-vue-next'

interface Props {
  appId: string
}

const _props = defineProps<Props>()
const route = useRoute()

const navigationItems = [
  {
    name: 'Overview',
    href: `/apps/${_props.appId}`,
    icon: TrendingUp,
    current: route.path === `/apps/${_props.appId}`,
  },
  {
    name: 'Push Providers',
    href: `/apps/${_props.appId}/providers`,
    icon: Globe,
    current: route.path === `/apps/${_props.appId}/providers`,
  },
  {
    name: 'Devices',
    href: `/apps/${_props.appId}/devices`,
    icon: Smartphone,
    current: route.path === `/apps/${_props.appId}/devices`,
  },
  {
    name: 'Notifications',
    href: `/apps/${_props.appId}/notifications`,
    icon: Activity,
    current: route.path === `/apps/${_props.appId}/notifications`,
  },
  {
    name: 'Settings',
    href: `/apps/${_props.appId}/settings`,
    icon: Cog,
    current: route.path === `/apps/${_props.appId}/settings`,
  },
]
</script>

<template>
  <nav class="flex space-x-1 mb-8 border-b">
    <NuxtLink
      v-for="item in navigationItems"
      :key="item.name"
      :to="item.href"
      class="flex items-center px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors"
      :class="[
        item.current
          ? 'text-primary border-primary bg-primary/5'
          : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border',
      ]"
    >
      <component :is="item.icon" class="mr-2 h-4 w-4" />
      {{ item.name }}
    </NuxtLink>
  </nav>
</template>
