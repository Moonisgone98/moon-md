<script setup>
import { ref, nextTick, onUnmounted } from 'vue'

const props = defineProps({
  content: { type: String, required: true },
})
const emit = defineEmits(['update:content', 'scroll'])

const textarea = ref(null)

function onInput(e) {
  emit('update:content', e.target.value)
}

// 滚动同步：编辑区滚动时，按比例计算并发送滚动位置给预览区
let scrollRaf = null
function onScroll() {
  if (scrollRaf) return
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = null
    const el = textarea.value
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    emit('scroll', max > 0 ? el.scrollTop / max : 0)
  })
}

onUnmounted(() => {
  if (scrollRaf) cancelAnimationFrame(scrollRaf)
})

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
  focus: () => textarea.value?.focus(),
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
</script>

<template>
  <section class="editor">
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
      @scroll.passive="onScroll"
    ></textarea>
  </section>
</template>

<style scoped>
.editor {
  position: relative;
  height: 100%;
  flex: 1 1 0%;
  min-width: 0;
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

@media (max-width: 860px) {
  .editor__textarea {
    padding: 44px 22px 24px;
    font-size: 14px;
  }
}
</style>
