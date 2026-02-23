<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, ref } from 'vue'
import { ImageOff } from 'lucide-vue-next'
import type { ImageSize } from '~/composables/useImageUrl'
import { getImageUrl } from '~/composables/useImageUrl'
import { cn } from '~/lib/utils'

const props = withDefaults(defineProps<{
  src?: string | null
  size?: ImageSize
  alt?: string
  class?: HTMLAttributes['class']
  loading?: 'lazy' | 'eager'
}>(), {
  size: 'md',
  loading: 'lazy',
})

const hasError = ref(false)

function onError() {
  hasError.value = true
}

const resolvedSrc = computed(() => getImageUrl(props.src, props.size))
const showFallback = computed(() => !props.src || hasError.value)
</script>

<template>
  <div
    v-if="showFallback"
    data-slot="app-image"
    :class="cn('flex items-center justify-center bg-muted text-muted-foreground', props.class)"
  >
    <slot name="fallback">
      <ImageOff class="size-5 opacity-40" />
    </slot>
  </div>
  <img
    v-else
    data-slot="app-image"
    :src="resolvedSrc"
    :alt="alt ?? ''"
    :loading="loading"
    :class="cn('object-cover', props.class)"
    @error="onError"
  >
</template>
