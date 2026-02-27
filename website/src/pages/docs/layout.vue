<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const navGuide = [
  { slug: 'getting-started', title: 'Getting Started' },
  { slug: 'authentication', title: 'Authentication' },
]

const navFeatures = [
  {
    slug: 'channels',
    title: 'Channels',
    icon: '📡',
    children: [
      { type: 'email', title: 'Email (SMTP)' },
      { type: 'telegram', title: 'Telegram' },
      { type: 'discord', title: 'Discord' },
      { type: 'sms', title: 'SMS (Twilio)' },
      { type: 'push', title: 'Push Notifications' },
      { type: 'in-app', title: 'In-App' },
    ],
  },
  { slug: 'contacts', title: 'Contacts', icon: '👥' },
  { slug: 'workflows', title: 'Workflows', icon: '⚡' },
  { slug: 'notifications', title: 'Notifications', icon: '🔔' },
]

const navReference = [
  { slug: 'sdk', title: 'SDK & Examples', icon: '📦' },
]

const currentSlug = computed(() => route.params.slug as string | undefined)
const currentType = computed(() => route.params.type as string | undefined)

const isChannelsActive = computed(() => route.path.startsWith('/docs/channels'))

function isActive(slug: string) {
  return currentSlug.value === slug
}
function isChannelActive(type: string) {
  return currentType.value === type
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div class="mx-auto flex h-14 max-w-[1280px] items-center gap-4 px-6">
        <RouterLink to="/" class="flex items-center gap-2 font-semibold">
          <div class="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            N
          </div>
          <span class="text-foreground">NitroPing</span>
        </RouterLink>
        <span class="text-border">/</span>
        <span class="text-sm text-muted-foreground font-medium">Docs</span>
        <div class="flex-1" />
        <RouterLink to="/" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to home
        </RouterLink>
        <a
          href="https://github.com/productdevbook/nitroping"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          GitHub
        </a>
      </div>
    </header>

    <div class="mx-auto flex max-w-[1280px]">
      <!-- Sidebar -->
      <aside class="hidden lg:block w-56 shrink-0 border-r border-border">
        <div class="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-6 px-4">
          <!-- Guide -->
          <p class="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Guide
          </p>
          <nav class="mb-6 space-y-0.5">
            <RouterLink
              v-for="item in navGuide"
              :key="item.slug"
              :to="`/docs/${item.slug}`"
              class="block rounded-md px-2 py-1.5 text-sm transition-colors"
              :class="isActive(item.slug)
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'"
            >
              {{ item.title }}
            </RouterLink>
          </nav>

          <!-- Features -->
          <p class="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Features
          </p>
          <nav class="mb-6 space-y-0.5">
            <template v-for="item in navFeatures" :key="item.slug">
              <RouterLink
                v-if="!item.children"
                :to="`/docs/${item.slug}`"
                class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
                :class="isActive(item.slug)
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'"
              >
                <span>{{ item.title }}</span>
              </RouterLink>
              <!-- Channels with children -->
              <template v-else>
                <button
                  class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
                  :class="isChannelsActive
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground'"
                  @click="router.push('/docs/channels/email')"
                >
                  <span class="flex-1 text-left">{{ item.title }}</span>
                  <svg class="size-3.5 transition-transform" :class="isChannelsActive ? 'rotate-90' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div v-if="isChannelsActive" class="ml-2 border-l border-border pl-3 space-y-0.5">
                  <RouterLink
                    v-for="child in item.children"
                    :key="child.type"
                    :to="`/docs/channels/${child.type}`"
                    class="block rounded-md px-2 py-1 text-[0.8rem] transition-colors"
                    :class="isChannelActive(child.type)
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'"
                  >
                    {{ child.title }}
                  </RouterLink>
                </div>
              </template>
            </template>
          </nav>

          <!-- Reference -->
          <p class="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Reference
          </p>
          <nav class="space-y-0.5">
            <RouterLink
              v-for="item in navReference"
              :key="item.slug"
              :to="`/docs/${item.slug}`"
              class="block rounded-md px-2 py-1.5 text-sm transition-colors"
              :class="isActive(item.slug)
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'"
            >
              {{ item.title }}
            </RouterLink>
          </nav>
        </div>
      </aside>

      <!-- Content -->
      <main class="flex-1 min-w-0 px-8 py-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>
