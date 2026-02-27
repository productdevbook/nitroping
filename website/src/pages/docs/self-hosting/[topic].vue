<script setup lang="ts">
import { MDC } from 'mdc-syntax/vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { docsComponents, mdcOptions } from '~/composables/useDocsComponents'

const route = useRoute()
const router = useRouter()

const topic = computed(() => route.params.topic as string)

const selfHostingPages = [
  { topic: 'docker', title: 'Docker Compose' },
  { topic: 'kubernetes', title: 'Kubernetes (Helm)' },
  { topic: 'configuration', title: 'Configuration' },
  { topic: 'reverse-proxy', title: 'Reverse Proxy' },
]

const currentIndex = computed(() => selfHostingPages.findIndex(p => p.topic === topic.value))
const prevPage = computed(() => currentIndex.value > 0 ? selfHostingPages[currentIndex.value - 1] : null)
const nextPage = computed(() => currentIndex.value < selfHostingPages.length - 1 ? selfHostingPages[currentIndex.value + 1] : null)

// MD files live in app/src/docs/self-hosting/ — 5 levels up from website/src/pages/docs/self-hosting/
const modules = import.meta.glob('../../../../../app/src/docs/self-hosting/*.md', { query: '?raw', import: 'default' })

const content = ref('')
const notFound = ref(false)

async function loadContent() {
  const key = `../../../../../app/src/docs/self-hosting/${topic.value}.md`
  if (modules[key]) {
    content.value = await modules[key]() as string
    notFound.value = false
  }
  else {
    notFound.value = true
  }
}

watch(topic, loadContent, { immediate: true })

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const headings = computed(() => {
  if (!content.value)
    return []
  const result: Array<{ level: 2 | 3, text: string, id: string }> = []
  for (const line of content.value.split('\n')) {
    const h2 = line.match(/^## (.+)/)
    const h3 = line.match(/^### (.+)/)
    if (h2?.[1])
      result.push({ level: 2, text: h2[1].trim(), id: slugify(h2[1].trim()) })
    else if (h3?.[1])
      result.push({ level: 3, text: h3[1].trim(), id: slugify(h3[1].trim()) })
  }
  return result
})
</script>

<template>
  <div class="flex gap-10 py-2 min-h-full">
    <div class="flex-1 min-w-0 max-w-[720px]">
      <div v-if="notFound" class="flex flex-col items-center justify-center py-24 text-center gap-3">
        <p class="text-4xl">
          📄
        </p>
        <p class="text-lg font-medium text-foreground">
          Page not found
        </p>
        <p class="text-sm text-muted-foreground">
          No docs found for "{{ topic }}"
        </p>
        <button class="mt-2 text-sm text-primary underline underline-offset-2" @click="router.push('/docs/self-hosting/docker')">
          Go to Docker Compose
        </button>
      </div>

      <template v-else-if="content">
        <Suspense>
          <MDC :markdown="content" :options="mdcOptions" :components="docsComponents" />
        </Suspense>

        <div class="mt-12 pt-6 border-t border-border flex items-center justify-between gap-4">
          <RouterLink
            v-if="prevPage"
            :to="`/docs/self-hosting/${prevPage.topic}`"
            class="group flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-muted/50 min-w-0"
          >
            <svg class="size-4 text-muted-foreground shrink-0 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <div class="min-w-0">
              <div class="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                Previous
              </div>
              <div class="font-medium text-foreground truncate">
                {{ prevPage.title }}
              </div>
            </div>
          </RouterLink>
          <div v-else />

          <RouterLink
            v-if="nextPage"
            :to="`/docs/self-hosting/${nextPage.topic}`"
            class="group flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-muted/50 text-right min-w-0 ml-auto"
          >
            <div class="min-w-0">
              <div class="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                Next
              </div>
              <div class="font-medium text-foreground truncate">
                {{ nextPage.title }}
              </div>
            </div>
            <svg class="size-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </RouterLink>
          <div v-else />
        </div>

        <div class="h-12" />
      </template>
    </div>

    <aside v-if="headings.length" class="hidden xl:block w-52 shrink-0">
      <div class="sticky top-6">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          On this page
        </p>
        <nav class="space-y-0.5">
          <a
            v-for="h in headings"
            :key="h.id"
            :href="`#${h.id}`"
            class="block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5 leading-snug"
            :class="h.level === 3 ? 'pl-3 text-[0.8rem]' : ''"
          >
            {{ h.text }}
          </a>
        </nav>
      </div>
    </aside>
  </div>
</template>
