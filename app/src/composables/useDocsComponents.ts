import { defineComponent, h } from 'vue'
import DocsCodeBlock from '~/components/docs/DocsCodeBlock.vue'

export const mdcOptions = {
  highlight: {
    themes: { light: 'github-light', dark: 'github-dark' },
    preStyles: true,
  },
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function getSlotText(slots: any): string {
  const nodes = slots.default?.() ?? []
  function walk(vnodes: any[]): string {
    return vnodes.map((vn) => {
      if (typeof vn === 'string')
        return vn
      if (typeof vn.children === 'string')
        return vn.children
      if (Array.isArray(vn.children))
        return walk(vn.children)
      return ''
    }).join('')
  }
  return walk(nodes)
}

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

export const docsComponents = {
  pre: DocsCodeBlock,

  h1: prose('h1', 'text-2xl font-bold mt-0 mb-4 text-foreground leading-tight', 'DocsH1'),
  h2: heading('h2', 'text-xl font-semibold mt-10 mb-3 text-foreground border-b border-border pb-1.5 scroll-mt-4', 'DocsH2'),
  h3: heading('h3', 'text-sm font-semibold mt-6 mb-2 text-foreground scroll-mt-4', 'DocsH3'),
  h4: prose('h4', 'text-xs font-semibold mt-4 mb-1.5 text-muted-foreground uppercase tracking-wide', 'DocsH4'),

  p: prose('p', 'text-sm text-muted-foreground leading-7 my-3', 'DocsP'),
  strong: prose('strong', 'font-semibold text-foreground', 'DocsStrong'),
  em: prose('em', 'italic', 'DocsEm'),

  ul: prose('ul', 'list-disc list-outside ml-5 my-3 space-y-1.5', 'DocsUl'),
  ol: prose('ol', 'list-decimal list-outside ml-5 my-3 space-y-1.5', 'DocsOl'),
  li: prose('li', 'text-sm text-muted-foreground leading-6 pl-1', 'DocsLi'),

  a: prose('a', 'text-primary underline underline-offset-2 hover:text-primary/80 transition-colors', 'DocsA'),
  code: prose('code', 'bg-muted text-foreground rounded px-1.5 py-0.5 text-[0.8em] font-mono', 'DocsCode'),

  blockquote: prose('blockquote', 'border-l-4 border-primary/40 bg-primary/5 pl-4 pr-3 py-0.5 my-4 rounded-r-md text-sm text-muted-foreground italic', 'DocsBlockquote'),

  table: prose('table', 'w-full border-collapse my-4 text-sm', 'DocsTable'),
  thead: prose('thead', 'bg-muted/60', 'DocsThead'),
  tbody: prose('tbody', 'divide-y divide-border', 'DocsTbody'),
  tr: prose('tr', 'transition-colors hover:bg-muted/30', 'DocsTr'),
  th: prose('th', 'text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border', 'DocsTh'),
  td: prose('td', 'px-3 py-2.5 text-sm text-muted-foreground align-top', 'DocsTd'),

  hr: defineComponent({
    name: 'DocsHr',
    setup() { return () => h('hr', { class: 'my-8 border-t border-border' }) },
  }),
}
