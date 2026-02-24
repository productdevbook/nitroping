<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '~/components/common/Icon.vue'

interface Props {
  appId: string
}

const _props = defineProps<Props>()
const route = useRoute()

const navigationItems = computed(() => [
  {
    name: 'Overview',
    href: `/apps/${_props.appId}`,
    icon: 'lucide:trending-up',
    current: route.path === `/apps/${_props.appId}`,
  },
  {
    name: 'Push Providers',
    href: `/apps/${_props.appId}/providers`,
    icon: 'lucide:globe',
    current: route.path.startsWith(`/apps/${_props.appId}/providers`),
  },
  {
    name: 'Devices',
    href: `/apps/${_props.appId}/devices`,
    icon: 'lucide:smartphone',
    current: route.path === `/apps/${_props.appId}/devices`,
  },
  {
    name: 'Notifications',
    href: `/apps/${_props.appId}/notifications`,
    icon: 'lucide:activity',
    current: route.path === `/apps/${_props.appId}/notifications`,
  },
  {
    name: 'Subscribers',
    href: `/apps/${_props.appId}/subscribers`,
    icon: 'lucide:users',
    current: route.path === `/apps/${_props.appId}/subscribers`,
  },
  {
    name: 'Channels',
    href: `/apps/${_props.appId}/channels`,
    icon: 'lucide:radio',
    current: route.path === `/apps/${_props.appId}/channels`,
  },
  {
    name: 'Templates',
    href: `/apps/${_props.appId}/templates`,
    icon: 'lucide:file-text',
    current: route.path.startsWith(`/apps/${_props.appId}/templates`),
  },
  {
    name: 'Workflows',
    href: `/apps/${_props.appId}/workflows`,
    icon: 'lucide:git-branch',
    current: route.path.startsWith(`/apps/${_props.appId}/workflows`),
  },
  {
    name: 'Webhooks',
    href: `/apps/${_props.appId}/hooks`,
    icon: 'lucide:webhook',
    current: route.path === `/apps/${_props.appId}/hooks`,
  },
  {
    name: 'Settings',
    href: `/apps/${_props.appId}/settings`,
    icon: 'lucide:cog',
    current: route.path === `/apps/${_props.appId}/settings`,
  },
])
</script>

<template>
  <nav class="flex space-x-1 mb-8 border-b">
    <RouterLink
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
      <Icon :name="item.icon" class="mr-2 size-4" />
      {{ item.name }}
    </RouterLink>
  </nav>
</template>
