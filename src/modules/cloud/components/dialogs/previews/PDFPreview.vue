<template>
  <div class="pdf-preview">
    <iframe
      :src="url"
      frameborder="0"
      @load="handleLoad"
      @error="handleError"
    />

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <a-spin :size="50" />
      <p>正在加载PDF...</p>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error-overlay">
      <icon-file-pdf />
      <p>PDF加载失败</p>
      <p class="error-hint">请尝试下载后使用PDF阅读器打开</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IconFilePdf } from '@arco-design/web-vue/es/icon'

interface Props {
  url: string
  fileName: string
}

const props = defineProps<Props>()

// ==================== 状态 ====================
const loading = ref(true)
const error = ref(false)

// ==================== 方法 ====================
function handleLoad() {
  loading.value = false
  error.value = false
}

function handleError() {
  loading.value = false
  error.value = true
}
</script>

<style scoped>
.pdf-preview {
  position: relative;
  width: 100%;
  min-height: 600px;
  background: #525659;
}

.pdf-preview iframe {
  width: 100%;
  height: 75vh;
  min-height: 600px;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #525659;
}

.loading-overlay p {
  margin: 0;
  color: #e5e7eb;
  font-size: 14px;
}

.error-overlay :deep(.arco-icon) {
  font-size: 64px;
  color: #9ca3af;
}

.error-overlay p {
  margin: 0;
  color: #e5e7eb;
  font-size: 14px;
}

.error-hint {
  font-size: 12px !important;
  color: #9ca3af !important;
}
</style>
