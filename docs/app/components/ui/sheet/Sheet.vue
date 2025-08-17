<script setup lang="ts">
import type { HTMLAttributes, ComputedRef } from 'vue'
import { DialogRoot, type DialogRootEmits, type DialogRootProps, useForwardPropsEmits } from 'reka-ui'

interface SheetProps extends DialogRootProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<SheetProps>()
const emits = defineEmits<DialogRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DialogRoot
    data-slot="sheet"
    v-bind="forwarded"
  >
    <slot />
  </DialogRoot>
</template>
