<script setup lang="ts">
import { ref, watch } from 'vue'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

const props = defineProps<{ nodeData: any }>()
const emit = defineEmits<{ (e: 'update', data: any): void }>()

const form = ref({
  field: props.nodeData?.field || '',
  operator: props.nodeData?.operator || 'eq',
  value: props.nodeData?.value || '',
})

watch(form, (val) => {
  emit('update', {
    ...props.nodeData,
    field: val.field,
    operator: val.operator,
    value: val.value,
    label: `${val.field} ${val.operator} ${val.value}`,
  })
}, { deep: true })
</script>

<template>
  <div class="space-y-3">
    <div>
      <Label class="text-xs">Field</Label>
      <Input v-model="form.field" placeholder="plan" />
    </div>
    <div>
      <Label class="text-xs">Operator</Label>
      <Select v-model="form.operator">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="eq">equals</SelectItem>
          <SelectItem value="neq">not equals</SelectItem>
          <SelectItem value="contains">contains</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label class="text-xs">Value</Label>
      <Input v-model="form.value" placeholder="pro" />
    </div>
  </div>
</template>
