import { ref, watch } from 'vue'

const STORAGE_KEY = 'moji.note.content'
const TITLE_KEY = 'moji.note.title'

const DEFAULT_TITLE = '未命名笔记'

const DEFAULT_CONTENT = `# 欢迎使用 moon-md

一个清新的 Markdown 笔记应用。**左侧编辑，右侧实时预览**，所写即所得。

## 核心功能

- **实时预览**：边写边看，丝滑流畅
- **本地保存**：内容自动存入浏览器，刷新不丢
- **导出文件**：一键导出 \`.md\` 或 \`.html\`

## 语法速览

> 引用是一段被温柔包裹的文字。

行内代码 \`const hello = 'moon-md'\`，或代码块：

\`\`\`js
function greet(name) {
  return \`你好，\${name} 👋\`
}
\`\`\`

### 列表与任务

1. 有序列表
2. 清晰有序
3. 一目了然

- [x] 实时预览
- [x] 本地保存
- [ ] 你的下一笔

### 表格

| 功能     | 状态 | 快捷键        |
| -------- | ---- | ------------- |
| 加粗     | ✅   | \`Ctrl/Cmd+B\` |
| 斜体     | ✅   | \`Ctrl/Cmd+I\` |
| 保存     | ✅   | \`Ctrl/Cmd+S\` |
| 导出 HTML | ✅   | —             |

---

开始书写吧，纸与竹都在等你。🌿
`

function readKey(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : v
  } catch {
    return fallback
  }
}

const title = ref(readKey(TITLE_KEY, DEFAULT_TITLE))
const content = ref(readKey(STORAGE_KEY, DEFAULT_CONTENT))

let saveTimer = null
function persist() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(TITLE_KEY, title.value)
      localStorage.setItem(STORAGE_KEY, content.value)
    } catch {
      /* 配额或隐私模式忽略 */
    }
  }, 250)
}

watch([title, content], persist, { immediate: false })

export function useNotes() {
  function reset() {
    title.value = DEFAULT_TITLE
    content.value = DEFAULT_CONTENT
  }

  function exportMarkdown() {
    const blob = new Blob([content.value], { type: 'text/markdown;charset=utf-8' })
    download(blob, sanitizeFilename(title.value) + '.md')
  }

  function exportHtml(bodyHtml) {
    const titleText = title.value || DEFAULT_TITLE
    const html = buildHtmlDocument(titleText, bodyHtml)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    download(blob, sanitizeFilename(title.value) + '.html')
  }

  return {
    title,
    content,
    reset,
    exportMarkdown,
    exportHtml,
  }
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function sanitizeFilename(name) {
  return (name || '未命名笔记').replace(/[\\/:*?"<>|]/g, '').trim() || '未命名笔记'
}

function buildHtmlDocument(title, body) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{
    --paper:#fbfaf5;--surface:#fff;--ink:#2c2a26;--ink-soft:#6b675e;
    --line:#e7e2d4;--sage:#5c7a6a;--sage-deep:#45614f;--sage-soft:#e6ece4;
    --clay:#c97b5a;--clay-border:#e6c9b5;--code-bg:#f1eee4;
    --serif:'Fraunces',Georgia,serif;--sans:'Manrope',system-ui,sans-serif;--mono:'JetBrains Mono',Consolas,monospace;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.75 var(--sans);-webkit-font-smoothing:antialiased}
  .wrap{max-width:760px;margin:0 auto;padding:64px 32px}
  .prose h1,.prose h2,.prose h3,.prose h4{font-family:var(--serif);font-weight:500;color:var(--sage-deep);line-height:1.25;margin:1.8em 0 .6em}
  .prose h1{font-size:2.15em;margin-top:0;padding-bottom:.35em;border-bottom:1px solid var(--line)}
  .prose h2{font-size:1.55em}.prose h3{font-size:1.25em}
  .prose p{margin:0 0 1.1em}.prose strong{font-weight:700}
  .prose a{color:var(--clay);text-decoration:none;border-bottom:1px solid var(--clay-border)}
  .prose ul,.prose ol{margin:0 0 1.1em;padding-left:1.6em}.prose li{margin:.35em 0}.prose li::marker{color:var(--sage)}
  .prose blockquote{margin:1.4em 0;padding:.4em 1.2em;border-left:3px solid var(--sage);background:var(--sage-soft);border-radius:0 8px 8px 0;color:var(--ink-soft);font-style:italic}
  .prose code{font-family:var(--mono);font-size:.86em;background:var(--code-bg);color:var(--clay);padding:.15em .45em;border-radius:5px}
  .prose pre{margin:1.3em 0;padding:1.1em 1.3em;background:#2a2e29;border-radius:12px;overflow-x:auto}
  .prose pre code{background:none;color:#e8e6df;padding:0;font-size:.85em;line-height:1.6}
  .prose img{max-width:100%;height:auto;border-radius:12px}
  .prose hr{border:none;height:1px;background:linear-gradient(90deg,transparent,var(--line),transparent);margin:2em 0}
  .prose table{width:100%;border-collapse:collapse;margin:1.3em 0;font-size:.95em}
  .prose th,.prose td{padding:.6em .9em;border:1px solid var(--line);text-align:left}
  .prose th{background:var(--sage-soft);color:var(--sage-deep);font-weight:600}
  .prose input[type=checkbox]{margin-right:.5em;accent-color:var(--sage)}
  .prose li:has(> input[type=checkbox]){list-style:none;margin-left:-1.4em}
  footer{margin-top:64px;padding-top:24px;border-top:1px solid var(--line);color:var(--ink-soft);font-size:13px;text-align:center;font-family:var(--serif);font-style:italic}
</style>
</head>
<body>
<div class="wrap">
  <article class="prose">
${body}
  </article>
  <footer>由 moon-md 书写 · ${new Date().toLocaleDateString('zh-CN')}</footer>
</div>
</body>
</html>`
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}
