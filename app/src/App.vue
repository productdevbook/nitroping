<script setup lang="ts">
import { Notivue, Notification } from 'notivue'
</script>

<template>
  <Notivue v-slot="item">
    <Notification :item="item" />
  </Notivue>

  <div class="box-border min-h-screen bg-surface font-sans text-foreground transition-colors">
    <RouterView />
  </div>
</template>
