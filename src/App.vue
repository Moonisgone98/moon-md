<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import NoteToolbar from './components/NoteToolbar.vue'
import FormatToolbar from './components/FormatToolbar.vue'
import EditorPane from './components/EditorPane.vue'
import PreviewPane from './components/PreviewPane.vue'
import { useNotes } from './composables/useNotes'

marked.setOptions({
  breaks: true,
  gfm: true,
})

const { title, content, reset, exportMarkdown, exportHtml } = useNotes()

const editorRef = ref(null)
const view = ref('split') // edit | split | preview
const splitRatio = ref(0.5) // 编辑区占比
const saved = ref(true)
let savedTimer = null

const rawHtml = computed(() => {
  try {
    return marked.parse(content.value || '')
  } catch {
    return ''
  }
})
const cleanHtml = computed(() =>
  DOMPurify.sanitize(rawHtml.value, { ADD_ATTR: ['target'] }),
)

const wordCount = computed(() => {
  const t = content.value.replace(/\s+/g, '')
  return t.length
})
const charCount = computed(() => content.value.length)
const isEmpty = computed(() => content.value.trim() === '')

// 内容变化时，标记"保存中"，composable 的 debounce 写入后回置"已保存"
watch(
  () => content.value,
  () => {
    saved.value = false
    clearTimeout(savedTimer)
    savedTimer = setTimeout(() => (saved.value = true), 600)
  },
)

function runCommand(cmd) {
  editorRef.value?.[cmd]?.()
}

function handleExportHtml() {
  exportHtml(cleanHtml.value)
}

function onKeydown(e) {
  const mod = e.ctrlKey || e.metaKey
  if (!mod) return
  const k = e.key.toLowerCase()
  if (k === 'b') {
    e.preventDefault()
    runCommand('bold')
  } else if (k === 'i') {
    e.preventDefault()
    runCommand('italic')
  } else if (k === 's') {
    e.preventDefault()
    saved.value = false
    clearTimeout(savedTimer)
    savedTimer = setTimeout(() => (saved.value = true), 400)
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// 拖拽分隔条
const dragging = ref(false)
function onDividerDown(e) {
  e.preventDefault()
  dragging.value = true
  window.addEventListener('mousemove', onDividerMove)
  window.addEventListener('mouseup', onDividerUp)
}
function onDividerMove(e) {
  const wrap = document.getElementById('workspace')
  if (!wrap) return
  const rect = wrap.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  splitRatio.value = Math.min(0.82, Math.max(0.18, ratio))
}
function onDividerUp() {
  dragging.value = false
  window.removeEventListener('mousemove', onDividerMove)
  window.removeEventListener('mouseup', onDividerUp)
}

const editStyle = computed(() =>
  view.value === 'split' ? { flex: `0 0 ${splitRatio.value * 100}%` } : {},
)
const previewStyle = computed(() =>
  view.value === 'split' ? { flex: '1 1 0%' } : {},
)
</script>

<template>
  <div class="app">
    <NoteToolbar
      :title="title"
      :char-count="charCount"
      :word-count="wordCount"
      :saved="saved"
      :view="view"
      @update:title="title = $event"
      @command="runCommand"
      @export-md="exportMarkdown"
      @export-html="handleExportHtml"
      @reset="reset"
      @set-view="view = $event"
    />

    <div class="subbar" v-if="view !== 'preview'">
      <FormatToolbar @command="runCommand" />
    </div>

    <main id="workspace" class="workspace" :class="'workspace--' + view">
      <div v-show="view !== 'preview'" class="pane pane--edit" :style="editStyle">
        <EditorPane ref="editorRef" v-model:content="content" />
      </div>

      <div
        v-if="view === 'split'"
        class="divider"
        :class="{ active: dragging }"
        @mousedown="onDividerDown"
        @dblclick="splitRatio = 0.5"
      >
        <span class="divider__handle"></span>
      </div>

      <div v-show="view !== 'edit'" class="pane pane--preview" :style="previewStyle">
        <PreviewPane :html="cleanHtml" :empty="isEmpty" />
      </div>
    </main>

    <footer class="statusbar">
      <span>墨记 · Markdown 笔记</span>
      <span class="statusbar__hint">
        <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>B</kbd> 加粗 · <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>I</kbd> 斜体 · 拖动中间分隔条调整栏宽
      </span>
    </footer>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100svh;
  overflow: hidden;
}

.subbar {
  border-top: 1px solid var(--line);
}

.workspace {
  flex: 1;
  display: flex;
  min-height: 0;
  position: relative;
  animation: rise 0.45s ease;
}
.workspace--edit .pane--preview,
.workspace--preview .pane--edit {
  display: none;
}
.workspace--edit .pane--edit,
.workspace--preview .pane--preview {
  flex: 1 1 0%;
}
.pane {
  min-width: 0;
  overflow: hidden;
  display: flex;
}
.pane--edit {
  border-right: 1px solid var(--line);
}

.divider {
  flex: 0 0 9px;
  position: relative;
  cursor: col-resize;
  background: var(--paper-deep);
  border-left: 1px solid var(--line);
  border-right: 1px solid var(--line);
  z-index: 5;
  transition: background 0.18s;
}
.divider:hover,
.divider.active {
  background: var(--sage-soft);
}
.divider__handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 42px;
  border-radius: 4px;
  background: var(--line);
  transition: background 0.18s;
}
.divider:hover .divider__handle,
.divider.active .divider__handle {
  background: var(--sage);
}

.statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 26px;
  background: var(--surface);
  border-top: 1px solid var(--line);
  font-size: 12px;
  color: var(--ink-faint);
  flex-wrap: wrap;
}
.statusbar__hint {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
kbd {
  display: inline-block;
  padding: 1px 6px;
  border: 1px solid var(--line);
  border-bottom-width: 2px;
  border-radius: 4px;
  background: var(--surface-soft);
  font-family: var(--mono);
  font-size: 11px;
  color: var(--ink-soft);
  line-height: 1.5;
}

@media (max-width: 860px) {
  .workspace--split {
    flex-direction: column;
  }
  .pane--edit {
    border-right: none;
    border-bottom: 1px solid var(--line);
    flex: 1 1 45% !important;
  }
  .pane--preview {
    flex: 1 1 55% !important;
  }
  .divider {
    display: none;
  }
  .statusbar__hint {
    display: none;
  }
}
</style>
