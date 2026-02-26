<script setup lang="ts">
import { Comark } from 'comark/vue'
import { ref } from 'vue'
import gettingStarted from '~/docs/getting-started.md?raw'
import authentication from '~/docs/authentication.md?raw'
import channels from '~/docs/channels.md?raw'
import contacts from '~/docs/contacts.md?raw'
import workflows from '~/docs/workflows.md?raw'
import notifications from '~/docs/notifications.md?raw'
import sdk from '~/docs/sdk.md?raw'

const sections = [
  { id: 'getting-started', title: 'Getting Started', content: gettingStarted },
  { id: 'authentication', title: 'Authentication', content: authentication },
  { id: 'channels', title: 'Channels', content: channels },
  { id: 'contacts', title: 'Contacts', content: contacts },
  { id: 'workflows', title: 'Workflows', content: workflows },
  { id: 'notifications', title: 'Notifications', content: notifications },
  { id: 'sdk', title: 'SDK & Examples', content: sdk },
]

const activeSection = ref('getting-started')

function scrollTo(id: string) {
  activeSection.value = id
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="flex gap-8 min-h-full">
    <!-- Sidebar -->
    <aside class="w-52 shrink-0">
      <div class="sticky top-4 space-y-1">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2">
          Documentation
        </p>
        <button
          v-for="s in sections"
          :key="s.id"
          class="w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors"
          :class="activeSection === s.id
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'"
          @click="scrollTo(s.id)"
        >
          {{ s.title }}
        </button>
      </div>
    </aside>

    <!-- Content -->
    <div class="flex-1 min-w-0 space-y-12 pb-16">
      <section
        v-for="s in sections"
        :id="s.id"
        :key="s.id"
        class="scroll-mt-4"
      >
        <article class="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-4 prose-code:before:content-none prose-code:after:content-none prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border">
          <Comark>{{ s.content }}</Comark>
        </article>
      </section>
    </div>
  </div>
</template>
