<template>
  <!-- 文档 / 文本 / 代码 / 压缩包预览：open-file-viewer 在浏览器内渲染，文件不发送到第三方 -->
  <div class="document-viewer">
    <OpenFileViewer
      :file="file"
      :file-name="fileName"
      :mime-type="mimeType || undefined"
      :plugins="plugins"
      width="100%"
      height="100%"
      fit="width"
      locale="zh-CN"
      :theme="theme"
      :toolbar="toolbar"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OpenFileViewer } from '@open-file-viewer/vue'
import {
  textPlugin,
  pdfPlugin,
  officePlugin,
  archivePlugin,
  emailPlugin,
  epubPlugin,
  ofdPlugin,
  xpsPlugin,
  xmindPlugin,
  drawingPlugin,
  imagePlugin,
  fallbackPlugin,
} from '@open-file-viewer/core'
import '@open-file-viewer/core/style.css'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url'
import pdfLegacyWorkerSrc from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url'
import { useThemeStore } from '@/stores/theme'

interface Props {
  /** 文件内容（已带鉴权获取） */
  file: Blob
  fileName: string
  mimeType?: string
}

defineProps<Props>()
const emit = defineEmits<{ (e: 'error', error: Error): void }>()

// CAD / 3D / GIS 插件体积大且部分依赖为 GPL 协议，云盘暂不启用
const plugins = [
  textPlugin(),
  pdfPlugin({ workerSrc: pdfWorkerSrc, legacyWorkerSrc: pdfLegacyWorkerSrc }),
  officePlugin(),
  archivePlugin(),
  emailPlugin(),
  epubPlugin(),
  ofdPlugin(),
  xpsPlugin(),
  xmindPlugin(),
  drawingPlugin(),
  imagePlugin(),
  fallbackPlugin(),
]

// 下载在预览窗口顶栏提供；文档不需要旋转
const toolbar = { zoom: true, search: true, print: true, fullscreen: true, download: false, rotate: false }

const themeStore = useThemeStore()
const theme = computed(() => (themeStore.theme === 'dark' ? 'dark' : 'light'))

function handleError(error: Error) {
  console.error('文档预览失败:', error)
  emit('error', error)
}
</script>

<style scoped>
.document-viewer {
  width: 100%;
  height: 70vh;
  min-height: 420px;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--bg-card);
}
</style>
