<script setup>
const emit = defineEmits(['command'])
const buttons = [
  { cmd: 'h1', label: 'H1', title: '一级标题', type: 'text' },
  { cmd: 'h2', label: 'H2', title: '二级标题', type: 'text' },
  { cmd: 'bold', label: 'B', title: '加粗 (Ctrl+B)', type: 'bold' },
  { cmd: 'italic', label: 'I', title: '斜体 (Ctrl+I)', type: 'italic' },
  { cmd: 'strike', label: 'S', title: '删除线', type: 'strike' },
  { cmd: 'quote', label: '❝', title: '引用', type: 'text' },
  { cmd: 'ul', label: '•', title: '无序列表', type: 'text' },
  { cmd: 'ol', label: '1.', title: '有序列表', type: 'text' },
  { cmd: 'link', label: '🔗', title: '链接', type: 'text' },
  { cmd: 'code', label: '</>', title: '行内代码', type: 'mono' },
  { cmd: 'codeblock', label: '```', title: '代码块', type: 'mono' },
]
</script>

<template>
  <div class="fmt">
    <button
      v-for="b in buttons"
      :key="b.cmd"
      class="fmt__btn"
      :class="'fmt__btn--' + b.type"
      :title="b.title"
      @click="emit('command', b.cmd)"
    >
      {{ b.label }}
    </button>
  </div>
</template>

<style scoped>
.fmt {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
  flex-wrap: wrap;
}
.fmt__btn {
  min-width: 32px;
  height: 30px;
  padding: 0 8px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--ink-soft);
  transition: all 0.15s;
  font-size: 14px;
  line-height: 1;
}
.fmt__btn:hover {
  background: var(--sage-soft);
  color: var(--sage-deep);
}
.fmt__btn:active {
  transform: scale(0.94);
}
.fmt__btn--bold {
  font-weight: 700;
  font-family: var(--sans);
}
.fmt__btn--italic {
  font-style: italic;
  font-family: var(--serif);
  font-size: 16px;
}
.fmt__btn--strike {
  text-decoration: line-through;
  font-weight: 600;
}
.fmt__btn--mono {
  font-family: var(--mono);
  font-size: 12.5px;
}
</style>
