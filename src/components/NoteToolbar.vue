<script setup>
defineProps({
  title: { type: String, required: true },
  charCount: { type: Number, default: 0 },
  wordCount: { type: Number, default: 0 },
  saved: { type: Boolean, default: false },
  view: { type: String, default: 'split' },
})
const emit = defineEmits([
  'update:title',
  'command',
  'export-md',
  'export-html',
  'reset',
  'set-view',
])

function onTitleInput(e) {
  emit('update:title', e.target.value)
}
</script>

<template>
  <header class="bar">
    <div class="bar__left">
      <div class="brand">
        <span class="brand__mark">墨</span>
        <span class="brand__name">墨记</span>
      </div>
      <div class="divider"></div>
      <input
        :value="title"
        class="title-input"
        placeholder="未命名笔记"
        spellcheck="false"
        @input="onTitleInput"
      />
    </div>

    <div class="bar__center">
      <div class="view-switch" role="tablist" aria-label="视图模式">
        <button
          v-for="v in [
            { id: 'edit', label: '编辑' },
            { id: 'split', label: '分栏' },
            { id: 'preview', label: '预览' },
          ]"
          :key="v.id"
          role="tab"
          :aria-selected="view === v.id"
          class="view-switch__btn"
          :class="{ active: view === v.id }"
          @click="emit('set-view', v.id)"
        >
          {{ v.label }}
        </button>
      </div>
    </div>

    <div class="bar__right">
      <span class="meta" :class="{ saved }">
        <span class="meta__dot"></span>
        {{ saved ? '已保存' : '保存中…' }}
      </span>
      <span class="count">{{ wordCount }} 字 · {{ charCount }} 字符</span>
      <button class="btn btn--ghost" title="重置为示例内容" @click="emit('reset')">
        <svg class="icon-only" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
      <button class="btn" @click="emit('export-md')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M7 10l5 5 5-5M12 15V3" />
        </svg>
        Markdown
      </button>
      <button class="btn btn--primary" @click="emit('export-html')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M7 10l5 5 5-5M12 15V3" />
        </svg>
        导出 HTML
      </button>
    </div>
  </header>
</template>

<style scoped>
.bar {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 14px 26px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(14px) saturate(1.2);
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: 50;
  flex-wrap: wrap;
}
.bar__left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1 1 auto;
  min-width: 220px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 9px;
}
.brand__mark {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: linear-gradient(140deg, var(--sage), var(--sage-deep));
  color: #fff;
  font-family: var(--serif);
  font-weight: 600;
  font-size: 17px;
  box-shadow: var(--shadow-sm);
}
.brand__name {
  font-family: var(--serif);
  font-weight: 600;
  font-size: 19px;
  color: var(--sage-deep);
  letter-spacing: -0.01em;
}
.divider {
  width: 1px;
  height: 22px;
  background: var(--line);
}
.title-input {
  flex: 1;
  min-width: 80px;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--sans);
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
  padding: 6px 4px;
  border-radius: 6px;
  transition: background 0.18s;
}
.title-input::placeholder {
  color: var(--ink-faint);
  font-weight: 500;
}
.title-input:focus {
  background: var(--surface-soft);
}

.bar__center {
  display: flex;
  justify-content: center;
  flex: 0 0 auto;
}
.view-switch {
  display: inline-flex;
  padding: 3px;
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: 10px;
  gap: 2px;
}
.view-switch__btn {
  border: none;
  background: transparent;
  font-family: var(--sans);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-soft);
  padding: 6px 14px;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.18s;
}
.view-switch__btn:hover {
  color: var(--ink);
}
.view-switch__btn.active {
  background: var(--surface);
  color: var(--sage-deep);
  box-shadow: var(--shadow-sm);
}

.bar__right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 0 0 auto;
}
.meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--ink-faint);
}
.meta__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--clay);
  transition: background 0.3s;
}
.meta.saved .meta__dot {
  background: var(--sage);
}
.count {
  font-size: 12.5px;
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1024px) {
  .bar {
    padding: 12px 18px;
    gap: 12px;
  }
  .bar__center {
    order: 3;
    width: 100%;
    justify-content: flex-start;
  }
  .count {
    display: none;
  }
}
@media (max-width: 680px) {
  .bar__right .btn:nth-child(3) {
    display: none;
  }
  .brand__name {
    display: none;
  }
}
</style>
