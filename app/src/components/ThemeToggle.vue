<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '~/components/ui/button'

const isDark = computed(() => document.documentElement.classList.contains('dark'))

function toggle() {
  const root = document.documentElement
  if (root.classList.contains('dark')) {
    root.classList.remove('dark')
    localStorage.setItem('color-mode', 'light')
  }
  else {
    root.classList.add('dark')
    localStorage.setItem('color-mode', 'dark')
  }
}

// Apply stored preference on mount
if (typeof localStorage !== 'undefined') {
  const stored = localStorage.getItem('color-mode')
  if (stored === 'dark') {
    document.documentElement.classList.add('dark')
  }
}
</script>

<template>
  <Button variant="ghost" size="icon" @click="toggle">
    <svg v-if="isDark" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
    <svg v-else class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </Button>
</template>
