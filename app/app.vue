<script setup lang="ts">
import { darkTheme, lightTheme, Notification, NotificationProgress, Notivue } from 'notivue'

const colorMode = useColorMode()
const theme = computed(() => colorMode.value === 'dark' ? darkTheme : lightTheme)
</script>

<template>
  <NuxtLoadingIndicator color="#4B5563" />

  <Notivue v-slot="item">
    <Notification :item="item" :theme="theme">
      <NotificationProgress :item="item" />
    </Notification>
  </Notivue>

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
