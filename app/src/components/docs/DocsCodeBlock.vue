<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// Forward shiki's style="background-color:..." to the <pre> element
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  // eslint-disable-next-line vue/prop-name-casing
  __node?: any
  language?: string
  filename?: string
}>(), {})

const codeText = ref('')
const copied = ref(false)

// Replicate minimark textContent without importing the package directly
function extractText(node: any): string {
  if (typeof node === 'string')
    return node
  if (!Array.isArray(node))
    return ''
  return node.slice(2).map(extractText).join('')
}

watch(() => props.__node, (node) => {
  codeText.value = node ? extractText(node) : ''
}, { immediate: true })

async function copyCode() {
  if (!codeText.value)
    return
  try {
    await navigator.clipboard.writeText(codeText.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
  catch {}
}

const langLabel = computed(() => props.filename || props.language || '')
</script>

<template>
  <div class="group my-5 rounded-lg border border-border overflow-hidden text-sm">
    <!-- Header bar -->
    <div class="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2.5">
      <!-- macOS window dots -->
      <div class="flex items-center gap-1.5 shrink-0">
        <span class="size-2.5 rounded-full bg-red-400/70" />
        <span class="size-2.5 rounded-full bg-yellow-400/70" />
        <span class="size-2.5 rounded-full bg-green-400/70" />
      </div>

      <!-- Language / filename -->
      <span v-if="langLabel" class="flex-1 text-center text-xs font-mono font-medium text-muted-foreground">
        {{ langLabel }}
      </span>
      <div v-else class="flex-1" />

      <!-- Copy button -->
      <button
        type="button"
        class="flex items-center gap-1.5 rounded px-2 py-0.5 text-xs text-muted-foreground transition-all hover:bg-background hover:text-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
        @click="copyCode"
      >
        <template v-if="copied">
          <svg class="size-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span class="text-green-500">Copied!</span>
        </template>
        <template v-else>
          <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </template>
      </button>
    </div>

    <!-- Code area — $attrs carries shiki's background-color from preStyles:true -->
    <pre v-bind="$attrs" class="overflow-x-auto p-4 text-[13px] leading-relaxed font-mono"><slot /></pre>
  </div>
</template>
