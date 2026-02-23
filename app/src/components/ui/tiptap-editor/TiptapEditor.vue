<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import { computed, ref, watch } from 'vue'
import Icon from '~/components/common/Icon.vue'

const props = withDefaults(defineProps<{
  modelValue: string
  immersive?: boolean
  hideToolbar?: boolean
  placeholder?: string
}>(), {
  placeholder: 'Yazmaya başla... veya / ile komut',
})

const rawMode = ref(false)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'word-count': [value: number]
  focus: []
  blur: []
}>()

// Programmatic setContent sırasında onUpdate'i engelle
let skipUpdate = false

function extractMarkdown(editor: any): string {
  return editor.getMarkdown() as string
}

function setMarkdownContent(editor: any, md: string) {
  skipUpdate = true
  editor.commands.setContent(md || '', { contentType: 'markdown' } as any)
  skipUpdate = false
}

function getWordCount(editorInstance: any = editor.value): number {
  if (!editorInstance)
    return 0
  const words = (editorInstance.storage as any)?.characterCount?.words?.()
  return typeof words === 'number' ? words : 0
}

function emitWordCount(editorInstance: any = editor.value) {
  emit('word-count', getWordCount(editorInstance))
}

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      link: { openOnClick: false },
    }),
    Markdown,
    CharacterCount.configure(),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose max-w-none focus:outline-none min-h-[100px] px-3 py-2',
    },
  },
  onCreate({ editor }) {
    if (props.modelValue) {
      setMarkdownContent(editor, props.modelValue)
    }
    emitWordCount(editor)
  },
  onUpdate({ editor }) {
    if (skipUpdate) return
    emitWordCount(editor)
    emit('update:modelValue', extractMarkdown(editor))
  },
  onFocus() {
    emit('focus')
  },
  onBlur() {
    emit('blur')
  },
})

watch(() => props.modelValue, (val) => {
  if (!editor.value) return
  const current = extractMarkdown(editor.value)
  if (val !== current) {
    setMarkdownContent(editor.value, val)
    emitWordCount()
  }
})

function toggleRawMode() {
  if (rawMode.value) {
    // Switching from raw → WYSIWYG: sync markdown into editor
    if (editor.value) {
      setMarkdownContent(editor.value, props.modelValue)
    }
  }
  rawMode.value = !rawMode.value
}

function onRawInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}

function setLink() {
  if (!editor.value) return
  const previousUrl = editor.value.getAttributes('link').href as string | undefined
  const url = window.prompt('URL', previousUrl)
  if (url === null) return
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

function insertMarkdown(markdown: string) {
  if (!editor.value)
    return
  editor.value.chain().focus().insertContent(markdown).run()
}

function toggleBold() {
  editor.value?.chain().focus().toggleBold().run()
}

function toggleItalic() {
  editor.value?.chain().focus().toggleItalic().run()
}

function toggleHeading2() {
  editor.value?.chain().focus().toggleHeading({ level: 2 }).run()
}

function toggleHeading3() {
  editor.value?.chain().focus().toggleHeading({ level: 3 }).run()
}

function toggleBulletList() {
  editor.value?.chain().focus().toggleBulletList().run()
}

function toggleOrderedList() {
  editor.value?.chain().focus().toggleOrderedList().run()
}

function insertDivider() {
  editor.value?.chain().focus().setHorizontalRule().run()
}

function focus(position: 'start' | 'end' = 'start') {
  editor.value?.chain().focus(position).run()
}

function blur() {
  editor.value?.commands.blur()
}

defineExpose({
  insertMarkdown,
  toggleBold,
  toggleItalic,
  toggleHeading2,
  toggleHeading3,
  toggleBulletList,
  toggleOrderedList,
  insertDivider,
  setLink,
  focus,
  blur,
  getWordCount,
})

interface ToolbarButton {
  icon: string
  label: string
  action: () => void
  isActive?: () => boolean
}

const toolbarButtons = computed<ToolbarButton[]>(() => {
  if (!editor.value) return []
  const e = editor.value
  return [
    { icon: 'lucide:bold', label: 'Bold', action: () => e.chain().focus().toggleBold().run(), isActive: () => e.isActive('bold') },
    { icon: 'lucide:italic', label: 'Italic', action: () => e.chain().focus().toggleItalic().run(), isActive: () => e.isActive('italic') },
    { icon: 'lucide:heading-2', label: 'H2', action: () => e.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => e.isActive('heading', { level: 2 }) },
    { icon: 'lucide:heading-3', label: 'H3', action: () => e.chain().focus().toggleHeading({ level: 3 }).run(), isActive: () => e.isActive('heading', { level: 3 }) },
    { icon: 'lucide:list', label: 'Bullet List', action: () => e.chain().focus().toggleBulletList().run(), isActive: () => e.isActive('bulletList') },
    { icon: 'lucide:list-ordered', label: 'Ordered List', action: () => e.chain().focus().toggleOrderedList().run(), isActive: () => e.isActive('orderedList') },
    { icon: 'lucide:link', label: 'Link', action: setLink, isActive: () => e.isActive('link') },
    { icon: 'lucide:minus', label: 'Separator', action: () => e.chain().focus().setHorizontalRule().run() },
  ]
})
</script>

<template>
  <div
    class="bg-background"
    :class="props.immersive ? 'editor-immersive rounded-none border-0' : 'rounded-md border border-input'"
  >
    <!-- Toolbar -->
    <div
      v-if="editor"
      v-show="!props.hideToolbar"
      class="editor-toolbar flex items-center gap-1 overflow-x-auto px-1.5 py-1.5"
      :class="props.immersive ? 'border-0' : 'border-b'"
    >
      <template v-if="!rawMode">
        <button
          v-for="btn in toolbarButtons"
          :key="btn.label"
          type="button"
          :title="btn.label"
          class="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:size-7"
          :class="{ 'bg-muted text-foreground': btn.isActive?.() }"
          @click="btn.action"
        >
          <Icon :name="btn.icon" class="size-3.5" />
        </button>
      </template>

      <span v-else class="px-1.5 text-xs text-muted-foreground">Markdown</span>

      <!-- Spacer -->
      <div class="flex-1" />

      <slot name="toolbar-right" />

      <!-- View Toggle -->
      <button
        type="button"
        :title="rawMode ? 'Görsel editör' : 'Markdown kodu'"
        class="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:size-7"
        :class="{ 'bg-muted text-foreground': rawMode }"
        @click="toggleRawMode"
      >
        <Icon :name="rawMode ? 'lucide:eye' : 'lucide:code'" class="size-3.5" />
      </button>
    </div>

    <!-- WYSIWYG Editor -->
    <EditorContent
      v-show="!rawMode"
      :editor="editor"
      :class="props.immersive ? 'min-h-[70vh] md:min-h-[75vh]' : ''"
    />

    <!-- Raw Markdown -->
    <textarea
      v-if="rawMode"
      :value="modelValue"
      class="w-full resize-y bg-transparent px-3 py-2 font-mono text-sm focus:outline-none"
      :class="props.immersive ? 'min-h-[70vh] md:min-h-[75vh]' : 'min-h-[100px]'"
      @input="onRawInput"
    />
  </div>
</template>

<style>
.tiptap {
  min-height: 100px;
}
.tiptap p.is-editor-empty:first-child::before {
  color: color-mix(in oklab, var(--muted-foreground) 55%, transparent);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
.editor-immersive .tiptap {
  font-size: 1rem;
  line-height: 1.85;
  padding-left: 0;
  padding-right: 0;
  min-height: max(65vh, 22rem);
}
@media (min-width: 768px) {
  .editor-immersive .tiptap {
    min-height: max(70vh, 24rem);
  }
}
.editor-immersive .editor-toolbar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: color-mix(in oklab, var(--background) 92%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
}
.tiptap p {
  margin: 0.45em 0;
}
.tiptap h2 {
  font-size: 1.45em;
  font-weight: 600;
  margin: 0.75em 0 0.35em;
}
.tiptap h3 {
  font-size: 1.2em;
  font-weight: 600;
  margin: 0.65em 0 0.3em;
}
.tiptap ul, .tiptap ol {
  padding-left: 1.5em;
  margin: 0.45em 0;
}
.tiptap ul {
  list-style: disc;
}
.tiptap ol {
  list-style: decimal;
}
.tiptap hr {
  border-color: var(--border);
  margin: 0.75em 0;
}
.tiptap a {
  color: var(--primary);
  text-decoration: underline;
}
.tiptap code {
  background: var(--muted);
  border-radius: 0.25em;
  padding: 0.1em 0.3em;
  font-size: 0.9em;
}
</style>
