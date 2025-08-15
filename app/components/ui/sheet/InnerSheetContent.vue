<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { X } from 'lucide-vue-next'
import {
  DialogClose,
  DialogContent,
  type DialogContentEmits,
  type DialogContentProps,
  DialogPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

interface InnerSheetContentProps extends DialogContentProps {
  class?: HTMLAttributes['class']
  side?: 'top' | 'right' | 'bottom' | 'left'
}

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<InnerSheetContentProps>(), {
  side: 'right',
})
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'side')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogPortal>
    <!-- No overlay for inner sheets -->
    <DialogContent
      data-slot="inner-sheet-content"
      :class="cn(
        'bg-background fixed z-[60] flex flex-col gap-4 shadow-lg border transition-all duration-300',
        
        // Simple positioning
        side === 'right' && 'inset-y-0 right-0 h-full w-3/4 sm:max-w-md',
        side === 'left' && 'inset-y-0 left-0 h-full w-3/4 sm:max-w-md',
        side === 'top' && 'inset-x-0 top-0 h-auto max-h-[90vh] overflow-y-auto',
        side === 'bottom' && 'inset-x-0 bottom-0 h-auto max-h-[90vh] overflow-y-auto',
        
        props.class)"
      v-bind="{ ...forwarded, ...$attrs }"
    >
      <slot />

      <DialogClose
        class="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
      >
        <X class="size-4" />
        <span class="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template> 