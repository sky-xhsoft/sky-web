<template>
  <div class="code-preview">
    <div class="code-header">
      <div class="file-info">
        <span class="language-badge">{{ language }}</span>
        <span class="file-name">{{ fileName }}</span>
      </div>
      <a-button size="small" @click="copyContent">
        <template #icon>
          <icon-copy />
        </template>
        复制
      </a-button>
    </div>
    <div class="code-content">
      <pre><code :class="`language-${language}`" v-html="highlightedCode"></code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconCopy } from '@arco-design/web-vue/es/icon'

interface Props {
  content: string
  fileName: string
  fileExt: string
}

const props = defineProps<Props>()

// ==================== 计算属性 ====================
const language = computed(() => {
  const extMap: Record<string, string> = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.jsx': 'javascript',
    '.tsx': 'typescript',
    '.vue': 'vue',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
    '.json': 'json',
    '.xml': 'xml',
    '.py': 'python',
    '.java': 'java',
    '.go': 'go',
    '.rs': 'rust',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.php': 'php',
    '.rb': 'ruby',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.sql': 'sql',
    '.sh': 'bash',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
  }

  return extMap[props.fileExt] || 'plaintext'
})

const highlightedCode = computed(() => {
  // 简单的语法高亮（基础版）
  // 在实际项目中，建议使用 highlight.js 或 Prism.js
  return escapeHtml(props.content)
})

// ==================== 方法 ====================
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

async function copyContent() {
  try {
    await navigator.clipboard.writeText(props.content)
    Message.success('已复制到剪贴板')
  } catch (error) {
    Message.error('复制失败')
  }
}
</script>

<style scoped>
.code-preview {
  background: #1e1e1e;
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 1px solid #333;
  background: #252526;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.language-badge {
  padding: 2px 8px;
  background: #007acc;
  color: white;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  text-transform: uppercase;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #cccccc;
}

.code-content {
  padding: 24px;
  max-height: 70vh;
  overflow: auto;
  background: #1e1e1e;
}

.code-content pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.code-content code {
  color: #d4d4d4;
  white-space: pre;
  word-break: normal;
  overflow-wrap: normal;
}

/* 自定义滚动条 */
.code-content::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.code-content::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.code-content::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 5px;
}

.code-content::-webkit-scrollbar-thumb:hover {
  background: #4e4e4e;
}
</style>
