<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  content: { type: String, required: true },
})
const emit = defineEmits(['update:content'])

const textarea = ref(null)
const dragging = ref(false)

function onInput(e) {
  emit('update:content', e.target.value)
}

function wrapSelection(before, after = before, placeholder = '') {
  const el = textarea.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const value = props.content
  const selected = value.slice(start, end) || placeholder
  const next = value.slice(0, start) + before + selected + after + value.slice(end)
  emit('update:content', next)
  nextTick(() => {
    el.focus()
    el.selectionStart = start + before.length
    el.selectionEnd = start + before.length + selected.length
  })
}

defineExpose({
  bold: () => wrapSelection('**', '**', '加粗文字'),
  italic: () => wrapSelection('*', '*', '斜体文字'),
  strike: () => wrapSelection('~~', '~~', '删除文字'),
  code: () => wrapSelection('`', '`', 'code'),
  h1: () => insertLinePrefix('# '),
  h2: () => insertLinePrefix('## '),
  quote: () => insertLinePrefix('> '),
  ul: () => insertLinePrefix('- '),
  ol: () => insertLinePrefix('1. '),
  link: () => wrapSelection('[', '](https://)', '链接文字'),
  codeblock: () => wrapSelection('\n```js\n', '\n```\n', '// 代码'),
})

function insertLinePrefix(prefix) {
  const el = textarea.value
  if (!el) return
  const start = el.selectionStart
  const value = props.content
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const next = value.slice(0, lineStart) + prefix + value.slice(lineStart)
  emit('update:content', next)
  nextTick(() => {
    el.focus()
    el.selectionStart = el.selectionEnd = start + prefix.length
  })
}

function onDrop(e) {
  if (!e.dataTransfer?.files?.length) return
  const file = e.dataTransfer.files[0]
  if (!file.type.startsWith('image/')) return
  e.preventDefault()
  const reader = new FileReader()
  reader.onload = () => {
    const mark = `\n![${file.name}](${reader.result})\n`
    const el = textarea.value
    const pos = el ? el.selectionStart : props.content.length
    const next = props.content.slice(0, pos) + mark + props.content.slice(pos)
    emit('update:content', next)
  }
  reader.readAsDataURL(file)
}

function onDragOver(e) {
  if (e.dataTransfer?.types?.includes('Files')) {
    e.preventDefault()
    dragging.value = true
  }
}
function onDragLeave() {
  dragging.value = false
}
</script>

<template>
  <section class="editor" :class="{ dragging }" @drop="onDrop" @dragover="onDragOver" @dragleave="onDragLeave">
    <div class="editor__hint">
      <span class="dot"></span>
      编辑区
    </div>
    <textarea
      ref="textarea"
      :value="content"
      class="editor__textarea"
      spellcheck="false"
      placeholder="在这里写下点什么…"
      @input="onInput"
    ></textarea>
    <transition name="drop-flag">
      <div v-if="dragging" class="editor__drop">释放以插入图片</div>
    </transition>
  </section>
</template>

<style scoped>
.editor {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--surface-soft);
}
.editor__hint {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-faint);
  pointer-events: none;
  z-index: 2;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sage);
  box-shadow: 0 0 0 3px var(--sage-soft);
}
.editor__textarea {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 48px 44px 32px;
  background: transparent;
  font-family: var(--mono);
  font-size: 14.5px;
  line-height: 1.75;
  color: var(--ink);
  caret-color: var(--sage);
  tab-size: 2;
}
.editor__textarea::placeholder {
  color: var(--ink-faint);
  font-style: italic;
}
.editor.dragging {
  background: var(--sage-soft);
}
.editor__drop {
  position: absolute;
  inset: 12px;
  border: 2px dashed var(--sage);
  border-radius: var(--r-md);
  display: grid;
  place-items: center;
  font-family: var(--serif);
  font-size: 18px;
  color: var(--sage-deep);
  background: rgba(230, 236, 228, 0.6);
  backdrop-filter: blur(2px);
  pointer-events: none;
}
.drop-flag-enter-active,
.drop-flag-leave-active {
  transition: opacity 0.18s;
}
.drop-flag-enter-from,
.drop-flag-leave-to {
  opacity: 0;
}

@media (max-width: 860px) {
  .editor__textarea {
    padding: 44px 22px 24px;
    font-size: 14px;
  }
}
</style>
