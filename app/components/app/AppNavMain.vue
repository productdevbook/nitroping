<script setup lang="ts">
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from 'abckit/shadcn/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from 'abckit/shadcn/sidebar'
import { ChevronRight, ExternalLink } from 'lucide-vue-next'

interface MenuItem {
  title: string
  url: string
  icon?: any
  isActive: boolean
  items?: Array<{
    title: string
    url: string
    isActive: boolean
  }>
}

defineProps<{
  items: MenuItem[]
  label?: string
}>()
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel v-if="label">{{ label }}</SidebarGroupLabel>
    <SidebarMenu>
      <template v-for="item in items" :key="item.title">
        <SidebarMenuItem>
          <!-- Menu with subitems -->
          <template v-if="item.items && item.items.length > 0">
            <Collapsible :default-open="item.isActive" class="group/collapsible">
              <SidebarMenuButton as-child :tooltip="item.title">
                <CollapsibleTrigger class="w-full">
                  <component :is="item.icon" v-if="item.icon" class="size-4" />
                  <span>{{ item.title }}</span>
                  <ChevronRight class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarMenuButton>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem v-for="subItem in item.items" :key="subItem.title">
                    <SidebarMenuSubButton as-child :is-active="subItem.isActive">
                      <NuxtLink :to="subItem.url">
                        <span>{{ subItem.title }}</span>
                      </NuxtLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </template>

          <!-- Simple menu item -->
          <template v-else>
            <SidebarMenuButton as-child :is-active="item.isActive" :tooltip="item.title">
              <!-- External link -->
              <a v-if="item.url.startsWith('http')" :href="item.url" target="_blank" rel="noopener noreferrer">
                <component :is="item.icon" v-if="item.icon" class="size-4" />
                <span>{{ item.title }}</span>
                <ExternalLink class="size-3 ml-auto" />
              </a>
              <!-- Internal link -->
              <NuxtLink v-else :to="item.url">
                <component :is="item.icon" v-if="item.icon" class="size-4" />
                <span>{{ item.title }}</span>
              </NuxtLink>
            </SidebarMenuButton>
          </template>
        </SidebarMenuItem>
      </template>
    </SidebarMenu>
  </SidebarGroup>
</template>
