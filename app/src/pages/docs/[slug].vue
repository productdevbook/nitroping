<script setup lang="ts">
import { MDC } from 'mdc-syntax/vue'
import { computed, defineComponent, h, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DocsCodeBlock from '~/components/docs/DocsCodeBlock.vue'

const route = useRoute()
const router = useRouter()

const slug = computed(() => route.params.slug as string)

// ── Doc order (prev/next nav) ─────────────────────────────────────────────

const docPages = [
  { slug: 'getting-started', title: 'Getting Started' },
  { slug: 'authentication', title: 'Authentication' },
  { slug: 'channels', title: 'Channels' },
  { slug: 'contacts', title: 'Contacts' },
  { slug: 'workflows', title: 'Workflows' },
  { slug: 'notifications', title: 'Notifications' },
  { slug: 'sdk', title: 'SDK & Examples' },
]

const currentIndex = computed(() => docPages.findIndex(p => p.slug === slug.value))
const prevPage = computed(() => currentIndex.value > 0 ? docPages[currentIndex.value - 1] : null)
const nextPage = computed(() => currentIndex.value < docPages.length - 1 ? docPages[currentIndex.value + 1] : null)

// ── Dynamic MD import ─────────────────────────────────────────────────────

const modules = import.meta.glob('../../docs/*.md', { query: '?raw', import: 'default' })

const content = ref('')
const notFound = ref(false)

async function loadContent() {
  const key = `../../docs/${slug.value}.md`
  if (modules[key]) {
    content.value = await modules[key]() as string
    notFound.value = false
  }
  else {
    notFound.value = true
  }
}

watch(slug, loadContent, { immediate: true })

// ── TOC — extract h2/h3 from markdown source ──────────────────────────────

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const headings = computed(() => {
  if (!content.value) return []
  const result: Array<{ level: 2 | 3, text: string, id: string }> = []
  for (const line of content.value.split('\n')) {
    const h2 = line.match(/^## (.+)/)
    const h3 = line.match(/^### (.+)/)
    if (h2?.[1]) result.push({ level: 2, text: h2[1].trim(), id: slugify(h2[1].trim()) })
    else if (h3?.[1]) result.push({ level: 3, text: h3[1].trim(), id: slugify(h3[1].trim()) })
  }
  return result
})

// ── MDC options ───────────────────────────────────────────────────────────

const mdcOptions = {
  highlight: {
    themes: { light: 'github-light', dark: 'github-dark' },
    preStyles: true,
  },
}

// ── Heading helper — generate stable ID from slot text ────────────────────

function getSlotText(slots: any): string {
  const nodes = slots.default?.() ?? []
  function walk(vnodes: any[]): string {
    return vnodes.map((vn) => {
      if (typeof vn === 'string') return vn
      if (typeof vn.children === 'string') return vn.children
      if (Array.isArray(vn.children)) return walk(vn.children)
      return ''
    }).join('')
  }
  return walk(nodes)
}

// ── Docs typography components ────────────────────────────────────────────

function prose(tag: string, classes: string, name: string) {
  return defineComponent({
    name,
    setup(_p, { slots }) {
      return () => h(tag, { class: classes }, slots.default?.())
    },
  })
}

function heading(level: 'h2' | 'h3', classes: string, name: string) {
  return defineComponent({
    name,
    setup(_p, { slots }) {
      return () => {
        const children = slots.default?.() ?? []
        const id = slugify(getSlotText({ default: () => children }))
        return h(level, { id, class: classes }, children)
      }
    },
  })
}

const docsComponents = {
  // Code blocks — DocsCodeBlock handles the <pre> wrapper
  pre: DocsCodeBlock,

  // Headings with anchored IDs
  h1: prose('h1', 'text-2xl font-bold mt-0 mb-4 text-foreground leading-tight', 'DocsH1'),
  h2: heading('h2', 'text-xl font-semibold mt-10 mb-3 text-foreground border-b border-border pb-1.5 scroll-mt-4', 'DocsH2'),
  h3: heading('h3', 'text-sm font-semibold mt-6 mb-2 text-foreground scroll-mt-4', 'DocsH3'),
  h4: prose('h4', 'text-xs font-semibold mt-4 mb-1.5 text-muted-foreground uppercase tracking-wide', 'DocsH4'),

  // Text
  p: prose('p', 'text-sm text-muted-foreground leading-7 my-3', 'DocsP'),
  strong: prose('strong', 'font-semibold text-foreground', 'DocsStrong'),
  em: prose('em', 'italic', 'DocsEm'),

  // Lists
  ul: prose('ul', 'list-disc list-outside ml-5 my-3 space-y-1.5', 'DocsUl'),
  ol: prose('ol', 'list-decimal list-outside ml-5 my-3 space-y-1.5', 'DocsOl'),
  li: prose('li', 'text-sm text-muted-foreground leading-6 pl-1', 'DocsLi'),

  // Inline elements
  a: prose('a', 'text-primary underline underline-offset-2 hover:text-primary/80 transition-colors', 'DocsA'),
  // inline code only — code inside <pre> bypasses this (MDCRenderer parent guard)
  code: prose('code', 'bg-muted text-foreground rounded px-1.5 py-0.5 text-[0.8em] font-mono', 'DocsCode'),

  // Blockquote
  blockquote: prose('blockquote', 'border-l-4 border-primary/40 bg-primary/5 pl-4 pr-3 py-0.5 my-4 rounded-r-md text-sm text-muted-foreground italic', 'DocsBlockquote'),

  // Table
  table: prose('table', 'w-full border-collapse my-4 text-sm', 'DocsTable'),
  thead: prose('thead', 'bg-muted/60', 'DocsThead'),
  tbody: prose('tbody', 'divide-y divide-border', 'DocsTbody'),
  tr: prose('tr', 'transition-colors hover:bg-muted/30', 'DocsTr'),
  th: prose('th', 'text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border', 'DocsTh'),
  td: prose('td', 'px-3 py-2.5 text-sm text-muted-foreground align-top', 'DocsTd'),

  // Divider
  hr: defineComponent({
    name: 'DocsHr',
    setup() { return () => h('hr', { class: 'my-8 border-t border-border' }) },
  }),
}
</script>

<template>
  <div class="flex gap-10 py-2 min-h-full">
    <!-- Main content -->
    <div class="flex-1 min-w-0 max-w-[720px]">
      <!-- Not found -->
      <div v-if="notFound" class="flex flex-col items-center justify-center py-24 text-center gap-3">
        <p class="text-4xl">📄</p>
        <p class="text-lg font-medium text-foreground">Page not found</p>
        <p class="text-sm text-muted-foreground">No docs found for "{{ slug }}"</p>
        <button class="mt-2 text-sm text-primary underline underline-offset-2" @click="router.push('/docs/getting-started')">
          Go to Getting Started
        </button>
      </div>

      <!-- Content -->
      <template v-else-if="content">
        <Suspense>
          <MDC :markdown="content" :options="mdcOptions" :components="docsComponents" />
        </Suspense>

        <!-- Prev / Next navigation -->
        <div class="mt-12 pt-6 border-t border-border flex items-center justify-between gap-4">
          <RouterLink
            v-if="prevPage"
            :to="`/docs/${prevPage.slug}`"
            class="group flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-muted/50 hover:border-border/80 min-w-0"
          >
            <svg class="size-4 text-muted-foreground shrink-0 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <div class="min-w-0">
              <div class="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Previous</div>
              <div class="font-medium text-foreground truncate">{{ prevPage.title }}</div>
            </div>
          </RouterLink>
          <div v-else />

          <RouterLink
            v-if="nextPage"
            :to="`/docs/${nextPage.slug}`"
            class="group flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-muted/50 hover:border-border/80 text-right min-w-0 ml-auto"
          >
            <div class="min-w-0">
              <div class="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Next</div>
              <div class="font-medium text-foreground truncate">{{ nextPage.title }}</div>
            </div>
            <svg class="size-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </RouterLink>
          <div v-else />
        </div>

        <!-- Bottom spacing -->
        <div class="h-12" />
      </template>
    </div>

    <!-- On this page (TOC) — only on xl screens -->
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
