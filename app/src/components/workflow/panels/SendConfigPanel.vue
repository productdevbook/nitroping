<script setup lang="ts">
import type { SendNodeData } from '~/components/workflow/types'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useChannels } from '~/graphql/channels'
import { useTemplates } from '~/graphql/templates'

const props = defineProps<{ nodeData: SendNodeData }>()
const emit = defineEmits<{ (e: 'update', data: Partial<SendNodeData>): void }>()

const route = useRoute()
const appId = computed(() => route.params.id as string)

const { data: channelsData } = useChannels(appId)
const { data: templatesData } = useTemplates(appId)

// Only show channels and templates that match the node's pre-set channelType
const channels = computed(() =>
  (channelsData.value ?? []).filter((c: any) => c.type === props.nodeData.channelType),
)

const templates = computed(() =>
  (templatesData.value ?? []).filter((t: any) => t.channelType === props.nodeData.channelType),
)

const form = ref({
  channelId: props.nodeData.channelId ?? '',
  templateId: props.nodeData.templateId ?? '',
})

watch(form, (val) => {
  const template = templates.value.find((t: any) => t.id === val.templateId)
  emit('update', {
    channelId: val.channelId,
    templateId: val.templateId,
    label: template?.name ?? props.nodeData.label,
    templateName: template?.name,
  })
}, { deep: true })
</script>

<template>
  <div class="space-y-3">
    <div>
      <Label class="text-xs">Channel</Label>
      <Select v-model="form.channelId">
        <SelectTrigger>
          <SelectValue placeholder="Select channel…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="ch in channels" :key="ch.id" :value="ch.id">
            {{ ch.name }}
          </SelectItem>
        </SelectContent>
      </Select>
      <p v-if="channels.length === 0 && channelsData" class="mt-1 text-xs text-muted-foreground">
        No {{ nodeData.channelType }} channels configured.
      </p>
    </div>
    <div>
      <Label class="text-xs">Template</Label>
      <Select v-model="form.templateId">
        <SelectTrigger>
          <SelectValue placeholder="Select template…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="tpl in templates" :key="tpl.id" :value="tpl.id">
            {{ tpl.name }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
