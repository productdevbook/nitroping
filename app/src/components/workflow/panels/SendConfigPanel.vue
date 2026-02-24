<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useChannels } from '~/graphql/channels'
import { useTemplates } from '~/graphql/templates'

const props = defineProps<{ nodeData: any }>()
const emit = defineEmits<{ (e: 'update', data: any): void }>()

const route = useRoute()
const appId = computed(() => route.params.id as string)

const { data: channelsData } = useChannels(appId)
const channels = computed(() => channelsData.value || [])

const { data: templatesData } = useTemplates(appId)
const templates = computed(() => (templatesData.value || []).filter(
  (t: any) => !props.nodeData?.channelType || t.channelType === props.nodeData?.channelType,
))

const form = ref({
  channelId: props.nodeData?.channelId || '',
  templateId: props.nodeData?.templateId || '',
})

watch(form, (val) => {
  const channel = channels.value.find((c: any) => c.id === val.channelId)
  const template = templates.value.find((t: any) => t.id === val.templateId)
  emit('update', {
    ...props.nodeData,
    channelId: val.channelId,
    templateId: val.templateId,
    channelType: channel?.type,
    label: template?.name || 'Send',
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
          <SelectValue placeholder="Select channel..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="ch in channels" :key="ch.id" :value="ch.id">
            {{ ch.name }} ({{ ch.type }})
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label class="text-xs">Template</Label>
      <Select v-model="form.templateId">
        <SelectTrigger>
          <SelectValue placeholder="Select template..." />
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
