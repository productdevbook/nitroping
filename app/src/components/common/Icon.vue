<script setup lang="ts">
import { Icon as IconifyIcon } from '@iconify/vue'

interface Props {
  name?: string
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <IconifyIcon
    :icon="props.name || 'lucide:help-circle'"
    :class="props.class"
  />
</template>
