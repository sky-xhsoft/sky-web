<template>
  <div class="text-preview">
    <div class="text-header">
      <span class="file-name">{{ fileName }}</span>
      <V2Button size="sm" @click="copyContent">
        <template #icon>
          <icon-copy />
        </template>
        复制
      </V2Button>
    </div>
    <div class="text-content">
      <pre>{{ content }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { V2Button } from '@/components/ui'
import { Message } from '@arco-design/web-vue'
import { IconCopy } from '@arco-design/web-vue/es/icon'

interface Props {
  content: string
  fileName: string
}

const props = defineProps<Props>()

// ==================== 方法 ====================
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
.text-preview {
  background: var(--bg-card);
}

.text-header {
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

.text-content {
  padding: 24px;
  max-height: 70vh;
  overflow: auto;
}

.text-content pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
