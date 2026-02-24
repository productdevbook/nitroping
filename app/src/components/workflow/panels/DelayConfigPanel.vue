<script setup lang="ts">
import { ref, watch } from 'vue'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

const props = defineProps<{ nodeData: any }>()
const emit = defineEmits<{ (e: 'update', data: any): void }>()

const UNIT_MS: Record<string, number> = {
  seconds: 1000,
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
}

function msToUnit(ms: number): { value: number, unit: string } {
  if (!ms)
    return { value: 1, unit: 'hours' }
  for (const [unit, factor] of Object.entries(UNIT_MS).reverse()) {
    if (ms % factor === 0)
      return { value: ms / factor, unit }
  }
  return { value: ms / 1000, unit: 'seconds' }
}

const initial = msToUnit(props.nodeData?.delayMs || 3_600_000)
const form = ref({ value: initial.value, unit: initial.unit })

watch(form, (val) => {
  const delayMs = val.value * (UNIT_MS[val.unit] || 1000)
  emit('update', {
    ...props.nodeData,
    delayMs,
    label: `${val.value} ${val.unit}`,
  })
}, { deep: true })
</script>

<template>
  <div class="space-y-3">
    <div class="flex gap-2">
      <div class="flex-1">
        <Label class="text-xs">Duration</Label>
        <Input v-model.number="form.value" type="number" min="1" />
      </div>
      <div class="flex-1">
        <Label class="text-xs">Unit</Label>
        <Select v-model="form.unit">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="seconds">Seconds</SelectItem>
            <SelectItem value="minutes">Minutes</SelectItem>
            <SelectItem value="hours">Hours</SelectItem>
            <SelectItem value="days">Days</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
</template>
