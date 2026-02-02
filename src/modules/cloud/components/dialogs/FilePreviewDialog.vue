<template>
  <a-modal
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :title="modalTitle"
    :width="modalWidth"
    :footer="false"
    :mask-closable="true"
    :esc-to-close="true"
    class="file-preview-modal"
    @cancel="handleClose"
  >
    <template #title>
      <div class="preview-header">
        <div class="preview-title">
          <span class="file-emoji">{{ fileEmoji }}</span>
          <span class="file-name">{{ fileName }}</span>
        </div>
        <div class="preview-actions">
          <a-button
            size="small"
            type="text"
            @click="handleDownload"
            :loading="downloading"
          >
            <template #icon>
              <icon-download />
            </template>
            下载
          </a-button>
          <a-button
            v-if="canNavigate"
            size="small"
            type="text"
            @click="handlePrevious"
            :disabled="!hasPrevious"
          >
            <template #icon>
              <icon-left />
            </template>
            上一个
          </a-button>
          <a-button
            v-if="canNavigate"
            size="small"
            type="text"
            @click="handleNext"
            :disabled="!hasNext"
          >
            <template #icon>
              <icon-right />
            </template>
            下一个
          </a-button>
        </div>
      </div>
    </template>

    <!-- 加载状态 -->
    <div v-if="loading" class="preview-loading">
      <a-spin :size="50" />
      <p>正在加载...</p>
    </div>

    <!-- 预览内容 -->
    <div v-else class="preview-content">
      <!-- 图片预览 -->
      <ImagePreview
        v-if="category === 'image'"
        :url="previewUrl"
        :file-name="fileName"
      />

      <!-- 视频预览 -->
      <VideoPreview
        v-else-if="category === 'video'"
        :url="previewUrl"
        :file-name="fileName"
      />

      <!-- 音频预览 -->
      <AudioPreview
        v-else-if="category === 'audio'"
        :url="previewUrl"
        :file-name="fileName"
      />

      <!-- PDF预览 -->
      <PDFPreview
        v-else-if="category === 'document'"
        :url="previewUrl"
        :file-name="fileName"
      />

      <!-- Markdown预览 -->
      <MarkdownPreview
        v-else-if="category === 'text' && isMarkdown"
        :content="textContent"
        :file-name="fileName"
      />

      <!-- 文本预览 -->
      <TextPreview
        v-else-if="category === 'text'"
        :content="textContent"
        :file-name="fileName"
      />

      <!-- 代码预览 -->
      <CodePreview
        v-else-if="category === 'code'"
        :content="textContent"
        :file-name="fileName"
        :file-ext="fileExt"
      />

      <!-- 不支持的格式 -->
      <div v-else class="preview-unsupported">
        <icon-file />
        <p>暂不支持预览此类型文件</p>
        <a-button type="primary" @click="handleDownload">
          <template #icon>
            <icon-download />
          </template>
          下载文件
        </a-button>
      </div>
    </div>

    <!-- 文件信息 -->
    <div class="preview-info">
      <div class="info-item">
        <span class="info-label">文件大小:</span>
        <span class="info-value">{{ fileSize }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">文件类型:</span>
        <span class="info-value">{{ fileType }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">创建时间:</span>
        <span class="info-value">{{ createTime }}</span>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconDownload,
  IconLeft,
  IconRight,
  IconFile,
} from '@arco-design/web-vue/es/icon'
import { fetchFileBlob } from '@/modules/cloud/api'
import { useCloudFile } from '@/modules/cloud/composables'
import { formatSize as formatFileSize, formatDate } from '@/modules/cloud/utils/format'
import type { FileItem } from '@/modules/cloud/types'
import type { FileCategory } from '@/modules/cloud/composables/useCloudPreview'

// 导入预览子组件
import ImagePreview from './previews/ImagePreview.vue'
import VideoPreview from './previews/VideoPreview.vue'
import AudioPreview from './previews/AudioPreview.vue'
import PDFPreview from './previews/PDFPreview.vue'
import TextPreview from './previews/TextPreview.vue'
import CodePreview from './previews/CodePreview.vue'
import MarkdownPreview from './previews/MarkdownPreview.vue'

interface Props {
  visible: boolean
  file: FileItem | null
  category: FileCategory
  canNavigate?: boolean
  hasPrevious?: boolean
  hasNext?: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'previous'): void
  (e: 'next'): void
  (e: 'download'): void
}

const props = withDefaults(defineProps<Props>(), {
  canNavigate: false,
  hasPrevious: false,
  hasNext: false,
})

const emit = defineEmits<Emits>()

// ==================== 状态 ====================
const loading = ref(false)
const downloading = ref(false)
const previewUrl = ref<string>('')
const textContent = ref<string>('')

const { download } = useCloudFile()

// ==================== 计算属性 ====================
const fileName = computed(() => props.file?.FileName || '未知文件')
const fileSize = computed(() => formatFileSize(props.file?.FileSize || 0))
const fileType = computed(() => props.file?.FileType || '未知')
const fileExt = computed(() => props.file?.FileExt?.toLowerCase() || '')
const createTime = computed(() => formatDate(props.file?.CreateTime || '', 'full'))

// 判断是否是 Markdown 文件
const isMarkdown = computed(() => {
  const result = fileExt.value === '.md'
  console.log('[DEBUG] isMarkdown check:', { fileExt: fileExt.value, isMarkdown: result, category: props.category })
  return result
})

const fileEmoji = computed(() => {
  const ext = fileExt.value
  const emojiMap: Record<string, string> = {
    // 图片
    '.jpg': '🖼️',
    '.jpeg': '🖼️',
    '.png': '🖼️',
    '.gif': '🎞️',
    '.svg': '🎨',
    '.webp': '🖼️',
    '.bmp': '🖼️',

    // 视频
    '.mp4': '🎬',
    '.webm': '🎬',
    '.ogg': '🎬',
    '.mov': '🎬',

    // 音频
    '.mp3': '🎵',
    '.wav': '🎵',
    '.m4a': '🎵',
    '.aac': '🎵',

    // 文档
    '.pdf': '📕',

    // 文本
    '.txt': '📄',
    '.md': '📝',
    '.json': '📋',
    '.xml': '📋',
    '.csv': '📊',

    // 代码
    '.js': '📜',
    '.ts': '📜',
    '.vue': '💚',
    '.html': '🌐',
    '.css': '🎨',
    '.go': '🔵',
    '.py': '🐍',
    '.java': '☕',
  }

  return emojiMap[ext] || '📄'
})

const modalTitle = computed(() => '文件预览')

const modalWidth = computed(() => {
  if (props.category === 'image' || props.category === 'video') {
    return '90%'
  }
  if (props.category === 'code' || props.category === 'text') {
    return '80%'
  }
  return '70%'
})

// ==================== 监听器 ====================
watch(
  () => props.visible,
  async (newVisible) => {
    if (newVisible && props.file) {
      await loadPreview()
    } else {
      // 关闭时清理资源
      cleanupResources()
    }
  }
)

watch(
  () => props.file,
  async (newFile) => {
    if (newFile && props.visible) {
      await loadPreview()
    }
  }
)

// ==================== 方法 ====================
/**
 * 加载预览内容
 */
async function loadPreview() {
  if (!props.file) return

  loading.value = true
  try {
    // 清理之前的资源
    cleanupResources()

    const needText = ['text', 'code'].includes(props.category)

    if (needText) {
      // 文本和代码需要获取文本内容
      const blob = await fetchFileBlob(props.file.ID)
      textContent.value = await blob.text()
    } else {
      // 图片、视频、音频、PDF 都需要通过 blob 方式加载（因为需要鉴权）
      const blob = await fetchFileBlob(props.file.ID)
      previewUrl.value = URL.createObjectURL(blob)
    }
  } catch (error: any) {
    console.error('加载预览失败:', error)
    Message.error(error?.message || '加载预览失败')
  } finally {
    loading.value = false
  }
}

/**
 * 清理资源
 */
function cleanupResources() {
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = ''
  textContent.value = ''
}

/**
 * 处理下载
 */
async function handleDownload() {
  if (!props.file) return

  downloading.value = true
  try {
    await download(props.file)
    emit('download')
  } catch (error) {
    // 错误已在 download 方法中处理
  } finally {
    downloading.value = false
  }
}

/**
 * 处理关闭
 */
function handleClose() {
  emit('update:visible', false)
}

/**
 * 处理上一个
 */
function handlePrevious() {
  emit('previous')
}

/**
 * 处理下一个
 */
function handleNext() {
  emit('next')
}
</script>

<style scoped>
.file-preview-modal :deep(.arco-modal) {
  max-width: 95vw;
}

.file-preview-modal :deep(.arco-modal-body) {
  padding: 0;
  max-height: 75vh;
  overflow: auto;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 40px;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.file-emoji {
  font-size: 20px;
  flex-shrink: 0;
}

.file-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  gap: 16px;
}

.preview-loading p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.preview-content {
  min-height: 400px;
}

.preview-unsupported {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  gap: 16px;
}

.preview-unsupported :deep(.arco-icon) {
  font-size: 64px;
  color: #9ca3af;
}

.preview-unsupported p {
  margin: 0;
  color: #6b7280;
  font-size: 16px;
}

.preview-info {
  display: flex;
  gap: 24px;
  padding: 16px 24px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.info-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.info-label {
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  color: #1f2937;
}

/* 响应式 */
@media (max-width: 768px) {
  .preview-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .preview-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .preview-info {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
