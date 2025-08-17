<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Sun, Moon } from 'lucide-vue-next'

const colorMode = useColorMode()

function toggleDarkMode() {
  colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'
  colorMode.preference = colorMode.value
}
</script>

<template>
  <Button variant="ghost" size="icon" @click="toggleDarkMode">
    <ClientOnly>
      <Sun v-if="colorMode.value === 'dark'" class="h-4 w-4" />
      <Moon v-else class="h-4 w-4" />
      <template #fallback>
        <Moon class="h-4 w-4" />
      </template>
    </ClientOnly>
    <span class="sr-only">Toggle dark mode</span>
  </Button>
</template> 