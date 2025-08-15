<script setup lang="ts">
import Button from './Button.vue'

const colorMode = useColorMode()

function toggleDarkMode() {
  colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'
  colorMode.preference = colorMode.value
}
</script>

<template>
  <Button variant="ghost" size="icon" @click="toggleDarkMode">
    <ClientOnly>
      <Icon 
        :name="colorMode.value === 'dark' ? 'lucide:sun' : 'lucide:moon'" 
        class="h-5 w-5" 
      />
      <template #fallback>
        <Icon name="lucide:moon" class="h-5 w-5" />
      </template>
    </ClientOnly>
    <span class="sr-only">Toggle dark mode</span>
  </Button>
</template> 