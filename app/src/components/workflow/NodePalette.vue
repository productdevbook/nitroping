<script setup lang="ts">
import type { ChannelType, WorkflowNodeData } from './types'
import { Separator } from '~/components/ui/separator'

interface DraggableItem {
  icon: string
  label: string
  type: string
  data: WorkflowNodeData
  badgeClass: string
  iconClass: string
}

interface InfoItem {
  icon: string
  label: string
  sub: string
  badgeClass: string
  iconClass: string
}

type PaletteItem = DraggableItem | InfoItem

function isDraggable(item: PaletteItem): item is DraggableItem {
  return 'type' in item
}

const sections: { title: string, items: PaletteItem[] }[] = [
  {
    title: 'Triggers',
    items: [
      {
        icon: '⚡',
        label: 'Event Trigger',
        sub: 'Fired via API',
        badgeClass: 'text-indigo-700 bg-indigo-100',
        iconClass: 'bg-indigo-100',
      },
    ] satisfies InfoItem[],
  },
  {
    title: 'Actions',
    items: [
      { icon: '✉️', label: 'Email',    type: 'send', badgeClass: 'text-blue-700 bg-blue-100',     iconClass: 'bg-blue-100',   data: { channelType: 'EMAIL' as ChannelType,    label: 'Send Email' } },
      { icon: '💬', label: 'SMS',      type: 'send', badgeClass: 'text-green-700 bg-green-100',   iconClass: 'bg-green-100',  data: { channelType: 'SMS' as ChannelType,      label: 'Send SMS' } },
      { icon: '🔔', label: 'Push',     type: 'send', badgeClass: 'text-purple-700 bg-purple-100', iconClass: 'bg-purple-100', data: { channelType: 'PUSH' as ChannelType,     label: 'Send Push' } },
      { icon: '📱', label: 'In-App',   type: 'send', badgeClass: 'text-orange-700 bg-orange-100', iconClass: 'bg-orange-100', data: { channelType: 'IN_APP' as ChannelType,   label: 'Send In-App' } },
      { icon: '🎮', label: 'Discord',  type: 'send', badgeClass: 'text-indigo-700 bg-indigo-100', iconClass: 'bg-indigo-100', data: { channelType: 'DISCORD' as ChannelType,  label: 'Send Discord' } },
      { icon: '✈️', label: 'Telegram', type: 'send', badgeClass: 'text-cyan-700 bg-cyan-100',     iconClass: 'bg-cyan-100',   data: { channelType: 'TELEGRAM' as ChannelType, label: 'Send Telegram' } },
    ] satisfies DraggableItem[],
  },
  {
    title: 'Logic',
    items: [
      { icon: '⏱', label: 'Delay',  type: 'delay',  badgeClass: 'text-amber-700 bg-amber-100', iconClass: 'bg-amber-100', data: { label: 'Delay', delayMs: 3_600_000 } },
      { icon: '🔀', label: 'Filter', type: 'filter', badgeClass: 'text-teal-700 bg-teal-100',   iconClass: 'bg-teal-100',  data: { label: 'Filter' } },
    ] satisfies DraggableItem[],
  },
]

function onDragStart(event: DragEvent, item: DraggableItem) {
  event.dataTransfer!.effectAllowed = 'move'
  event.dataTransfer!.setData(
    'application/vueflow',
    JSON.stringify({ type: item.type, data: item.data }),
  )
}
</script>

<template>
  <aside class="w-56 flex-none flex flex-col border-r bg-card overflow-hidden">
    <!-- Header -->
    <div class="px-3 py-2.5 border-b">
      <p class="text-sm font-semibold">
        Nodes
      </p>
      <p class="text-xs text-muted-foreground">
        Drag to canvas
      </p>
    </div>

    <!-- Items -->
    <div class="flex-1 overflow-y-auto py-2">
      <template v-for="(section, si) in sections" :key="section.title">
        <Separator v-if="si > 0" class="my-2" />

        <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-1">
          {{ section.title }}
        </p>

        <div class="space-y-0.5 px-1.5">
          <template v-for="item in section.items" :key="item.label">
            <!-- Non-draggable (info only) -->
            <div
              v-if="!isDraggable(item)"
              class="flex items-center gap-2.5 px-2 py-2 rounded-lg opacity-60"
            >
              <div class="size-7 rounded-md flex items-center justify-center text-base shrink-0" :class="item.iconClass">
                {{ item.icon }}
              </div>
              <div class="min-w-0">
                <p class="text-xs font-medium leading-none">
                  {{ item.label }}
                </p>
                <p class="text-[10px] text-muted-foreground mt-0.5">
                  {{ (item as InfoItem).sub }}
                </p>
              </div>
            </div>

            <!-- Draggable -->
            <div
              v-else
              draggable="true"
              class="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-grab select-none hover:bg-accent active:cursor-grabbing transition-colors"
              @dragstart="onDragStart($event, item as DraggableItem)"
            >
              <div
                class="size-7 rounded-md flex items-center justify-center text-base leading-none shrink-0"
                :class="(item as DraggableItem).iconClass"
              >
                {{ item.icon }}
              </div>
              <p class="text-xs font-medium truncate">
                {{ item.label }}
              </p>
            </div>
          </template>
        </div>
      </template>
    </div>
  </aside>
</template>
