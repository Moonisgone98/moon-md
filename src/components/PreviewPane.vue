<script setup>
import { ref } from 'vue'

defineProps({
  html: { type: String, required: true },
  empty: { type: Boolean, default: false },
})

const scrollEl = ref(null)

// 按比例滚动预览区到与编辑区对应的位置
function syncScroll(ratio) {
  const el = scrollEl.value
  if (!el) return
  const max = el.scrollHeight - el.clientHeight
  if (max > 0) el.scrollTop = ratio * max
}

defineExpose({ syncScroll })
</script>

<template>
  <section class="preview">
    <div class="preview__hint">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      预览区
    </div>
    <div ref="scrollEl" class="preview__scroll">
      <article v-if="!empty" class="prose" v-html="html"></article>
      <div v-else class="preview__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
        <p>左侧写下文字，预览将在此浮现</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.preview {
  position: relative;
  height: 100%;
  flex: 1 1 0%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--surface);
}
.preview__hint {
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
.preview__hint svg {
  width: 13px;
  height: 13px;
  color: var(--sage);
}
.preview__scroll {
  flex: 1;
  overflow-y: auto;
  padding: 52px 48px 56px;
  animation: fade 0.4s ease;
}
.preview__empty {
  height: 100%;
  display: grid;
  place-items: center;
  gap: 14px;
  text-align: center;
  color: var(--ink-faint);
}
.preview__empty svg {
  width: 46px;
  height: 46px;
  opacity: 0.5;
}
.preview__empty p {
  margin: 0;
  font-family: var(--serif);
  font-style: italic;
  font-size: 15px;
}

@media (max-width: 860px) {
  .preview__scroll {
    padding: 48px 22px 36px;
  }
}
</style>
