<script setup lang="ts">
import Icon from '~/components/common/Icon.vue'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '~/components/ui/sidebar'

interface MenuItem {
  title: string
  url: string
  icon?: string
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
    <SidebarGroupLabel v-if="label">
      {{ label }}
    </SidebarGroupLabel>
    <SidebarMenu>
      <template v-for="item in items" :key="item.title">
        <SidebarMenuItem>
          <!-- Menu with subitems -->
          <template v-if="item.items && item.items.length > 0">
            <Collapsible :default-open="item.isActive" class="group/collapsible">
              <SidebarMenuButton as-child :tooltip="item.title">
                <CollapsibleTrigger class="w-full">
                  <Icon v-if="item.icon" :name="item.icon" class="size-4" />
                  <span>{{ item.title }}</span>
                  <Icon name="lucide:chevron-right" class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarMenuButton>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem v-for="subItem in item.items" :key="subItem.title">
                    <SidebarMenuSubButton as-child :is-active="subItem.isActive">
                      <RouterLink :to="subItem.url">
                        <span>{{ subItem.title }}</span>
                      </RouterLink>
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
                <Icon v-if="item.icon" :name="item.icon" class="size-4" />
                <span>{{ item.title }}</span>
                <Icon name="lucide:external-link" class="size-3 ml-auto" />
              </a>
              <!-- Internal link -->
              <RouterLink v-else :to="item.url">
                <Icon v-if="item.icon" :name="item.icon" class="size-4" />
                <span>{{ item.title }}</span>
              </RouterLink>
            </SidebarMenuButton>
          </template>
        </SidebarMenuItem>
      </template>
    </SidebarMenu>
  </SidebarGroup>
</template>
