<template>
  <div class="markdown-preview">
    <div class="markdown-header">
      <span class="file-name">{{ fileName }}</span>
      <div class="header-actions">
        <V2Button size="sm" @click="toggleMode">
          <template #icon>
            <icon-eye v-if="mode === 'source'" />
            <icon-code v-else />
          </template>
          {{ mode === 'source' ? '预览' : '源码' }}
        </V2Button>
        <V2Button size="sm" @click="copyContent">
          <template #icon>
            <icon-copy />
          </template>
          复制
        </V2Button>
      </div>
    </div>
    <div class="markdown-content">
      <!-- 渲染模式 -->
      <div v-if="mode === 'rendered'" class="markdown-body" v-html="renderedHtml"></div>
      <!-- 源码模式 -->
      <pre v-else class="markdown-source">{{ content }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { V2Button } from '@/components/ui'
import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconCopy, IconEye, IconCode } from '@arco-design/web-vue/es/icon'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

interface Props {
  content: string
  fileName: string
}

const props = defineProps<Props>()

// 显示模式：rendered（渲染后的HTML）或 source（源码）
const mode = ref<'rendered' | 'source'>('rendered')

// 配置 marked
marked.setOptions({
  breaks: true, // 支持 GitHub 风格的换行
  gfm: true, // 启用 GitHub Flavored Markdown
})

// ==================== 计算属性 ====================
const renderedHtml = computed(() => {
  try {
    const rawHtml = marked.parse(props.content) as string
    // Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'ul', 'ol', 'li',
        'blockquote',
        'strong', 'em', 'b', 'i',
        'code', 'pre',
        'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
      ALLOW_DATA_ATTR: false,
      ALLOW_URI_AUTO_LINKS: true,
      FORCE_BODY: true,
    })
  } catch (error) {
    console.error('Markdown 渲染失败:', error)
    return '<p>Markdown 渲染失败</p>'
  }
})

// ==================== 方法 ====================
function toggleMode() {
  mode.value = mode.value === 'rendered' ? 'source' : 'rendered'
}

async function copyContent() {
  try {
    await navigator.clipboard.writeText(props.content)
    Message.success('已复制到剪贴板')
  } catch {
    Message.error('复制失败')
  }
}
</script>

<style scoped>
.markdown-preview {
  background: var(--bg-card);
}

.markdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-hover);
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.markdown-content {
  padding: 24px;
  max-height: 70vh;
  overflow: auto;
}

/* Markdown 渲染样式 */
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  word-wrap: break-word;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body :deep(h1) {
  font-size: 2em;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.3em;
}

.markdown-body :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.3em;
}

.markdown-body :deep(h3) {
  font-size: 1.25em;
}

.markdown-body :deep(h4) {
  font-size: 1em;
}

.markdown-body :deep(h5) {
  font-size: 0.875em;
}

.markdown-body :deep(h6) {
  font-size: 0.85em;
  color: var(--text-secondary);
}

.markdown-body :deep(p) {
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body :deep(a) {
  color: var(--brand-blue);
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body :deep(li) {
  margin-bottom: 4px;
}

.markdown-body :deep(blockquote) {
  margin: 0 0 16px 0;
  padding: 0 1em;
  color: var(--text-secondary);
  border-left: 4px solid var(--border);
}

.markdown-body :deep(code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: var(--bg-hover);
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
}

.markdown-body :deep(pre) {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: var(--bg-hover);
  border-radius: 6px;
  margin-bottom: 16px;
}

.markdown-body :deep(pre code) {
  display: inline;
  padding: 0;
  margin: 0;
  overflow: visible;
  line-height: inherit;
  word-wrap: normal;
  background-color: transparent;
  border: 0;
}

.markdown-body :deep(table) {
  border-spacing: 0;
  border-collapse: collapse;
  margin-bottom: 16px;
  width: 100%;
}

.markdown-body :deep(table th),
.markdown-body :deep(table td) {
  padding: 6px 13px;
  border: 1px solid var(--border);
}

.markdown-body :deep(table th) {
  font-weight: 600;
  background-color: var(--bg-hover);
}

.markdown-body :deep(table tr) {
  background-color: var(--bg-card);
  border-top: 1px solid var(--border);
}

.markdown-body :deep(table tr:nth-child(2n)) {
  background-color: var(--bg-hover);
}

.markdown-body :deep(img) {
  max-width: 100%;
  box-sizing: content-box;
}

.markdown-body :deep(hr) {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: var(--border);
  border: 0;
}

/* 源码模式样式 */
.markdown-source {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
