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
const previewRef = ref(null)
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

// 编辑区滚动时，同步滚动预览区到对应位置
function onEditorScroll(ratio) {
  if (view.value !== 'split') return
  previewRef.value?.syncScroll(ratio)
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

// —— 本地文件拖拽：拖入 .md/.txt 加载到预览，拖入图片插入笔记 ——
const dragOver = ref(false)
let dragDepth = 0

function isFileDrag(e) {
  return e.dataTransfer?.types?.includes('Files')
}
function onDragEnter(e) {
  if (!isFileDrag(e)) return
  e.preventDefault()
  dragDepth++
  dragOver.value = true
}
function onDragOver(e) {
  if (!isFileDrag(e)) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'
}
function onDragLeave(e) {
  if (!isFileDrag(e)) return
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) dragOver.value = false
}
async function onFileDrop(e) {
  if (!e.dataTransfer?.files?.length) return
  e.preventDefault()
  dragDepth = 0
  dragOver.value = false
  await loadFiles([...e.dataTransfer.files])
}

function isTextLike(file) {
  return /\.(md|markdown|mdx|txt)$/i.test(file.name) || file.type === 'text/markdown' || file.type === 'text/plain'
}

async function loadFiles(files) {
  let loadedText = false
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      await insertImageFile(file)
    } else if (!loadedText && isTextLike(file)) {
      await loadTextFile(file)
      loadedText = true
    }
  }
}

async function loadTextFile(file) {
  const text = await file.text()
  content.value = text
  title.value = file.name.replace(/\.[^.]+$/, '') || '未命名笔记'
}

function insertImageFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      content.value += `\n![${file.name}](${reader.result})\n`
      resolve()
    }
    reader.onerror = resolve
    reader.readAsDataURL(file)
  })
}

// —— 文件选择按钮：弹出系统选择器，复用上面的加载逻辑 ——
const fileInput = ref(null)
function triggerOpenFile() {
  fileInput.value?.click()
}
async function onFilePick(e) {
  const files = e.target?.files
  if (files?.length) await loadFiles([...files])
  e.target.value = '' // 允许重复选择同一文件
}

const editStyle = computed(() =>
  view.value === 'split' ? { flex: `0 0 ${splitRatio.value * 100}%` } : {},
)
const previewStyle = computed(() =>
  view.value === 'split' ? { flex: '1 1 0%' } : {},
)
</script>

<template>
  <div
    class="app"
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onFileDrop"
  >
    <transition name="drop-fade">
      <div v-if="dragOver" class="drop-overlay">
        <div class="drop-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M7 9l5-5 5 5M12 4v12" />
          </svg>
          <p class="drop-card__title">释放以打开文件</p>
          <span class="drop-card__hint">支持 .md / .markdown / .txt · 图片将插入笔记</span>
        </div>
      </div>
    </transition>
    <NoteToolbar
      :title="title"
      :char-count="charCount"
      :word-count="wordCount"
      :saved="saved"
      :view="view"
      @update:title="title = $event"
      @command="runCommand"
      @open-file="triggerOpenFile"
      @export-md="exportMarkdown"
      @export-html="handleExportHtml"
      @reset="reset"
      @set-view="view = $event"
    />
    <input
      ref="fileInput"
      type="file"
      accept=".md,.markdown,.mdx,.txt,text/markdown,text/plain,image/*"
      multiple
      class="file-input-hidden"
      @change="onFilePick"
    />

    <div class="subbar" v-if="view !== 'preview'">
      <FormatToolbar @command="runCommand" />
    </div>

    <main id="workspace" class="workspace" :class="'workspace--' + view">
      <div v-show="view !== 'preview'" class="pane pane--edit" :style="editStyle">
        <EditorPane ref="editorRef" v-model:content="content" @scroll="onEditorScroll" />
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
        <PreviewPane ref="previewRef" :html="cleanHtml" :empty="isEmpty" />
      </div>
    </main>

    <footer class="statusbar">
      <span>moon-md · Markdown 笔记</span>
      <span class="statusbar__hint">
        <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>B</kbd> 加粗 · <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>I</kbd> 斜体 · 拖入 .md/图片 · 拖动分隔条调栏宽
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
.file-input-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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

/* —— 文件拖拽遮罩 —— */
.drop-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  background: rgba(251, 250, 245, 0.78);
  backdrop-filter: blur(6px) saturate(1.1);
  pointer-events: none;
}
.drop-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 44px 56px;
  border: 2px dashed var(--sage);
  border-radius: var(--r-xl);
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  color: var(--sage-deep);
  animation: pop 0.22s ease;
}
.drop-card svg {
  width: 46px;
  height: 46px;
}
.drop-card__title {
  margin: 0;
  font-family: var(--serif);
  font-size: 22px;
  font-weight: 500;
  color: var(--sage-deep);
}
.drop-card__hint {
  font-size: 13px;
  color: var(--ink-faint);
}
@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.94);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.drop-fade-enter-active,
.drop-fade-leave-active {
  transition: opacity 0.18s ease;
}
.drop-fade-enter-from,
.drop-fade-leave-to {
  opacity: 0;
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
