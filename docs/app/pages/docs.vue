<script setup lang="ts">
import { Comark } from 'comark/vue'
import { ref } from 'vue'
import gettingStarted from '../../../app/src/docs/getting-started.md?raw'
import authentication from '../../../app/src/docs/authentication.md?raw'
import channels from '../../../app/src/docs/channels.md?raw'
import contacts from '../../../app/src/docs/contacts.md?raw'
import workflows from '../../../app/src/docs/workflows.md?raw'
import notifications from '../../../app/src/docs/notifications.md?raw'
import sdk from '../../../app/src/docs/sdk.md?raw'

useHead({
  title: 'Documentation — NitroPing',
  meta: [{ name: 'description', content: 'NitroPing developer documentation' }],
})

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
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <header class="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center gap-4">
            <NuxtLink to="/" class="flex items-center gap-2">
              <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-semibold text-sm">N</span>
              </div>
              <span class="text-xl font-semibold text-gray-900">NitroPing</span>
            </NuxtLink>
            <span class="text-gray-300">/</span>
            <span class="text-gray-600 font-medium">Docs</span>
          </div>
          <a href="https://github.com/productdevbook/nitroping" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-full text-sm font-semibold text-blue-700 transition-colors">
            GitHub
          </a>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div class="flex gap-10">
        <!-- Sidebar -->
        <aside class="w-52 shrink-0">
          <div class="sticky top-20 space-y-1">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 px-2">
              Documentation
            </p>
            <button
              v-for="s in sections"
              :key="s.id"
              class="w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors"
              :class="activeSection === s.id
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'"
              @click="scrollTo(s.id)"
            >
              {{ s.title }}
            </button>
          </div>
        </aside>

        <!-- Content -->
        <main class="flex-1 min-w-0 space-y-16 pb-20">
          <section
            v-for="s in sections"
            :id="s.id"
            :key="s.id"
            class="scroll-mt-24"
          >
            <article class="prose prose-gray max-w-none prose-headings:scroll-mt-24 prose-code:before:content-none prose-code:after:content-none prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200">
              <Comark>{{ s.content }}</Comark>
            </article>
          </section>
        </main>
      </div>
    </div>
  </div>
</template>
