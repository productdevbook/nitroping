<template>
  <div class="mb-8">
    <div class="flex items-center space-x-4 mb-4">
      <Button v-if="showBackButton" variant="ghost" size="icon" @click="$emit('back')">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <div class="flex-1">
        <div class="flex items-center space-x-3 mb-1">
          <h1 class="text-3xl font-bold">{{ title }}</h1>
          <Badge v-if="badge" :variant="badgeVariant">{{ badge }}</Badge>
        </div>
        <p v-if="subtitle" class="text-muted-foreground">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="flex items-center space-x-2">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { ArrowLeft } from 'lucide-vue-next'

interface Props {
  title: string
  subtitle?: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  showBackButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  badgeVariant: 'secondary',
  showBackButton: true
})

const emit = defineEmits<{
  back: []
}>()
</script>