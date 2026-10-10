<template>
  <!-- 文件预览：大窗口，左侧预览，右侧信息栏（文件信息 / 快捷操作 / 同文件夹文件） -->
  <a-modal
    :visible="visible"
    :footer="false"
    :closable="false"
    :hide-title="true"
    :mask-closable="true"
    :esc-to-close="true"
    width="min(1600px, 94vw)"
    modal-class="file-preview-modal"
    :body-style="{ padding: 0 }"
    @update:visible="emit('update:visible', $event)"
    @cancel="handleClose"
  >
    <div class="fp">
      <!-- 顶栏 -->
      <header class="fp-header">
        <CloudFileIcon :name="file?.FileExt || fileName" :mime="file?.FileType" :size="26" />
        <span class="fp-title" :title="fileName">{{ fileName }}</span>

        <div v-if="canNavigate && siblings.length > 1" class="fp-nav" role="group" aria-label="切换文件">
          <button type="button" class="icon-btn" aria-label="上一个文件" :disabled="!hasPrevious" @click="emit('previous')">
            <icon-left />
          </button>
          <span class="fp-nav__pos">{{ currentIndex + 1 }} / {{ siblings.length }}</span>
          <button type="button" class="icon-btn" aria-label="下一个文件" :disabled="!hasNext" @click="emit('next')">
            <icon-right />
          </button>
        </div>

        <button type="button" class="fp-download" :disabled="downloading" @click="handleDownload">
          <icon-loading v-if="downloading" />
          <icon-download v-else />
          下载
        </button>
        <button
          type="button"
          class="icon-btn icon-btn--bordered"
          :class="{ 'is-active': infoOpen }"
          :aria-label="infoOpen ? '收起信息栏' : '展开信息栏'"
          :aria-pressed="infoOpen"
          @click="toggleInfo"
        >
          <icon-layout />
        </button>
        <button type="button" class="icon-btn" aria-label="关闭" @click="handleClose">
          <icon-close />
        </button>
      </header>

      <div class="fp-body">
        <!-- 预览区 -->
        <main class="fp-stage" :class="{ 'is-media': isMedia }">
          <div v-if="loading" class="fp-state">
            <a-spin :size="36" />
            <p>正在加载…</p>
          </div>

          <template v-else>
            <ImagePreview v-if="category === 'image' && previewUrl" :url="previewUrl" :file-name="fileName" />
            <VideoPreview v-else-if="category === 'video' && previewUrl" :url="previewUrl" :file-name="fileName" />
            <AudioPreview v-else-if="category === 'audio' && previewUrl" :url="previewUrl" :file-name="fileName" />

            <!-- 文档 / 文本 / 代码 / 压缩包：open-file-viewer 浏览器内渲染 -->
            <DocumentViewer
              v-else-if="useDocumentViewer && documentBlob"
              :file="documentBlob"
              :file-name="documentIsPdf ? `${fileName}.pdf` : fileName"
              :mime-type="documentIsPdf ? 'application/pdf' : file?.FileType"
            />

            <!-- 不支持的格式 / 文件过大 / 加载失败 -->
            <div v-else class="fp-state">
              <CloudFileIcon :name="file?.FileExt || fileName" :mime="file?.FileType" :size="64" />
              <p>{{ unavailableText }}</p>
              <button type="button" class="fp-download" @click="handleDownload">
                <icon-download />
                下载文件
              </button>
            </div>
          </template>
        </main>

        <!-- 右侧信息栏 -->
        <aside v-if="infoOpen" class="fp-info" aria-label="文件信息">
          <section class="fp-section">
            <h3 class="fp-section__title">文件信息</h3>
            <dl class="fp-meta">
              <dt>大小</dt>
              <dd>{{ fileSize }}</dd>
              <dt>类型</dt>
              <dd>{{ typeLabel }}</dd>
              <template v-if="location">
                <dt>位置</dt>
                <dd :title="location">{{ location }}</dd>
              </template>
              <template v-if="file?.CreateBy">
                <dt>创建人</dt>
                <dd>{{ file.CreateBy }}</dd>
              </template>
              <dt>创建时间</dt>
              <dd>{{ createTime }}</dd>
            </dl>
          </section>

          <section class="fp-actions" aria-label="快捷操作">
            <button v-for="a in actions" :key="a.key" type="button" class="fp-action" :class="{ 'is-danger': a.danger }" @click="emit('action', a.key)">
              <component :is="a.icon" class="fp-action__icon" />
              {{ a.label }}
            </button>
          </section>

          <section v-if="siblings.length > 0" class="fp-siblings">
            <h3 class="fp-section__title fp-siblings__title">同文件夹（{{ siblings.length }}）</h3>
            <div class="fp-siblings__list">
              <button
                v-for="f in siblings"
                :key="f.ID"
                type="button"
                class="fp-sibling"
                :class="{ 'is-current': f.ID === file?.ID }"
                :aria-current="f.ID === file?.ID ? 'true' : undefined"
                @click="f.ID !== file?.ID && emit('select', f)"
              >
                <span class="fp-sibling__thumb">
                  <CloudFileThumb :file-id="f.ID" :name="f.FileName" :ext="f.FileExt" :mime="f.FileType" :icon-size="22" compact />
                </span>
                <span class="fp-sibling__name" :title="f.FileName">{{ f.FileName }}</span>
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent, onBeforeUnmount } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconDownload,
  IconLeft,
  IconRight,
  IconClose,
  IconLayout,
  IconLoading,
  IconShareAlt,
  IconEdit,
  IconExport,
  IconDelete,
} from '@arco-design/web-vue/es/icon'
import { fetchFileBlobPreferDirect, fetchPreviewPdf, getPlayUrl } from '@/modules/cloud/api'
import { useCloudFile } from '@/modules/cloud/composables'
import { formatSize as formatFileSize, formatDate } from '@/modules/cloud/utils/format'
import { fileKindLabel } from '@/modules/cloud/utils/file-kind'
import type { FileItem } from '@/modules/cloud/types'
import type { FileCategory } from '@/modules/cloud/composables/useCloudPreview'
import CloudFileIcon from '../CloudFileIcon.vue'
import CloudFileThumb from '../CloudFileThumb.vue'

// 预览子组件
import ImagePreview from './previews/ImagePreview.vue'
import VideoPreview from './previews/VideoPreview.vue'
import AudioPreview from './previews/AudioPreview.vue'

// 文档预览组件体积较大，打开预览时才加载
const DocumentViewer = defineAsyncComponent(() => import('./previews/DocumentViewer.vue'))

/** 文档类预览需要把文件整体读入浏览器，超过该大小提示下载 */
const MAX_DOCUMENT_PREVIEW_SIZE = 100 * 1024 * 1024
/** 本地存储的视频 / 音频没有直链，需整个读入浏览器内存，超过该大小提示下载 */
const MAX_MEDIA_BLOB_SIZE = 200 * 1024 * 1024
/** 浏览器内无法保留排版、由服务器转换为 PDF 预览的旧版 Word 格式（与后端 previewPDFExts 一致） */
const LEGACY_WORD_EXTS = ['doc', 'dot', 'wps']
/** 旧版 Word 转换上限（与后端 previewMaxSourceSize 一致），超过则不转换 */
const MAX_LEGACY_WORD_SIZE = 50 * 1024 * 1024

/** 信息栏展开状态（每个浏览器记住） */
const INFO_OPEN_KEY = 'sky-web:cloud-preview-info-open'

export type PreviewAction = 'share' | 'rename' | 'move' | 'delete'

interface Props {
  visible: boolean
  file: FileItem | null
  category: FileCategory
  canNavigate?: boolean
  hasPrevious?: boolean
  hasNext?: boolean
  /** 同文件夹中的文件（按页面显示顺序） */
  siblings?: FileItem[]
  /** 当前文件所在位置，如「我的云盘 / FR品牌之夜」 */
  location?: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'previous'): void
  (e: 'next'): void
  (e: 'download'): void
  (e: 'select', file: FileItem): void
  (e: 'action', action: PreviewAction): void
}

const props = withDefaults(defineProps<Props>(), {
  canNavigate: false,
  hasPrevious: false,
  hasNext: false,
  siblings: () => [],
  location: '',
})

const emit = defineEmits<Emits>()

// ==================== 状态 ====================
const loading = ref(false)
const downloading = ref(false)
const previewUrl = ref<string>('')
const documentBlob = ref<Blob | null>(null)
/** documentBlob 是服务器转换出的 PDF（旧版 Word） */
const documentIsPdf = ref(false)
const tooLarge = ref(false)
const loadFailed = ref(false)
const infoOpen = ref(readInfoOpen())

const { download } = useCloudFile()

const actions: { key: PreviewAction; label: string; icon: unknown; danger?: boolean }[] = [
  { key: 'share', label: '分享', icon: IconShareAlt },
  { key: 'rename', label: '重命名', icon: IconEdit },
  { key: 'move', label: '移动', icon: IconExport },
  { key: 'delete', label: '删除', icon: IconDelete, danger: true },
]

// ==================== 计算属性 ====================
const fileName = computed(() => props.file?.FileName || '未知文件')
const fileSize = computed(() => formatFileSize(props.file?.FileSize || 0))
const createTime = computed(() => formatDate(props.file?.CreateTime || '', 'full'))
const typeLabel = computed(() => {
  const ext = (props.file?.FileExt || '').replace(/^\./, '').toLowerCase()
  const label = fileKindLabel(props.file?.FileExt || props.file?.FileName, props.file?.FileType)
  return ext ? `${label}（.${ext}）` : label
})
const currentIndex = computed(() => props.siblings.findIndex((f) => f.ID === props.file?.ID))

// 文档、文本、代码、压缩包使用 open-file-viewer 预览
const useDocumentViewer = computed(() => ['document', 'text', 'code', 'archive'].includes(props.category))
const isMedia = computed(() => ['image', 'video', 'audio'].includes(props.category))
const fileExt = computed(() => (props.file?.FileExt || props.file?.FileName?.split('.').pop() || '').replace(/^\./, '').toLowerCase())

const unavailableText = computed(() => {
  if (tooLarge.value) return '文件过大，无法直接查看，建议下载后查看'
  if (loadFailed.value) return '文件加载失败，可下载后查看'
  return '暂不支持预览此类型文件，请下载后查看'
})

// ==================== 监听 ====================
watch(
  () => props.visible,
  async (visible) => {
    if (visible && props.file) {
      await loadPreview()
      window.addEventListener('keydown', handleKeydown)
    } else {
      cleanupResources()
      window.removeEventListener('keydown', handleKeydown)
    }
  },
  { immediate: true },
)

watch(
  () => props.file?.ID,
  async () => {
    if (props.file && props.visible) await loadPreview()
  },
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  cleanupResources()
})

// ==================== 方法 ====================
/** 加载预览内容：文档类读取为 Blob，图片 / 视频 / 音频生成对象地址 */
async function loadPreview() {
  if (!props.file) return
  const fileId = props.file.ID

  loading.value = true
  cleanupResources()
  try {
    const size = props.file.FileSize || 0
    const docLimit = LEGACY_WORD_EXTS.includes(fileExt.value) ? MAX_LEGACY_WORD_SIZE : MAX_DOCUMENT_PREVIEW_SIZE
    if (useDocumentViewer.value && size > docLimit) {
      tooLarge.value = true
      return
    }
    if (!useDocumentViewer.value && !isMedia.value) return

    const legacyWord = useDocumentViewer.value && LEGACY_WORD_EXTS.includes(fileExt.value)
    // 云存储文件取签名直链：浏览器直接从 COS 读取，不经过应用服务器（本地存储没有直链）
    const directUrl = legacyWord ? '' : await getPlayUrl(fileId).catch(() => '')
    if (props.file?.ID !== fileId) return

    if (isMedia.value) {
      // 图片 / 视频 / 音频：直接用直链显示或边下边播
      if (directUrl) {
        previewUrl.value = directUrl
        return
      }
      if (props.category !== 'image' && (props.file.FileSize || 0) > MAX_MEDIA_BLOB_SIZE) {
        tooLarge.value = true
        return
      }
    }

    if (legacyWord) {
      // 旧版 Word：浏览器内只能解析出文字，改用服务器转换的 PDF 保留排版；转换不可用时退回浏览器解析
      try {
        const pdf = await fetchPreviewPdf(fileId)
        if (props.file?.ID !== fileId) return
        documentBlob.value = pdf
        documentIsPdf.value = true
        return
      } catch (error) {
        console.warn('文档转换预览不可用，改为浏览器内解析:', error)
      }
    }

    const blob = await fetchFileBlobPreferDirect(fileId, directUrl)
    if (props.file?.ID !== fileId) return // 加载期间已切换到其他文件
    if (useDocumentViewer.value) {
      documentBlob.value = blob
    } else {
      previewUrl.value = URL.createObjectURL(blob)
    }
  } catch (error: any) {
    console.error('加载预览失败:', error)
    loadFailed.value = true
    Message.error(error?.message || '加载预览失败')
  } finally {
    loading.value = false
  }
}

function cleanupResources() {
  if (previewUrl.value.startsWith('blob:')) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  documentBlob.value = null
  documentIsPdf.value = false
  tooLarge.value = false
  loadFailed.value = false
}

async function handleDownload() {
  if (!props.file) return
  downloading.value = true
  try {
    await download(props.file)
    emit('download')
  } catch {
    // 错误已在 download 方法中处理
  } finally {
    downloading.value = false
  }
}

function handleClose() {
  emit('update:visible', false)
}

function readInfoOpen(): boolean {
  try {
    return localStorage.getItem(INFO_OPEN_KEY) !== '0'
  } catch {
    return true
  }
}

function toggleInfo() {
  infoOpen.value = !infoOpen.value
  try {
    localStorage.setItem(INFO_OPEN_KEY, infoOpen.value ? '1' : '0')
  } catch {
    // 存储不可用时只在本次生效
  }
}

/** ← / → 切换文件（输入框内不处理） */
function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
  if (event.key === 'ArrowLeft' && props.hasPrevious) emit('previous')
  else if (event.key === 'ArrowRight' && props.hasNext) emit('next')
}
</script>

<style scoped>
.fp {
  display: flex;
  flex-direction: column;
  height: min(1000px, 90vh);
  color: var(--text-primary);
}

/* 顶栏 */
.fp-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
  height: 58px;
  padding: 0 14px 0 20px;
  border-bottom: 1px solid var(--border);
}

.fp-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 15px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fp-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.fp-nav__pos {
  padding: 0 6px;
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.icon-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 30px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
}

.icon-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.icon-btn--bordered {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
}

.icon-btn--bordered.is-active {
  background: var(--info-bg);
  border-color: transparent;
  color: var(--brand-blue);
}

.fp-download {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--brand-blue);
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.fp-download:hover:not(:disabled) {
  filter: brightness(1.08);
}

.fp-download:disabled {
  opacity: 0.7;
  cursor: default;
}

/* 主体 */
.fp-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.fp-stage {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: auto;
  background: var(--bg-hover);
}

.fp-stage.is-media {
  display: grid;
  place-items: center;
  padding: 16px;
  background: #111318;
}

.fp-stage :deep(.document-viewer) {
  height: 100%;
  min-height: 0;
  border-radius: 0;
}

.fp-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  height: 100%;
  min-height: 320px;
  color: var(--text-secondary);
}

.fp-stage.is-media .fp-state {
  color: #c9ced8;
}

/* 信息栏 */
.fp-info {
  display: flex;
  flex-direction: column;
  flex: 0 0 300px;
  min-height: 0;
  border-left: 1px solid var(--border);
  background: var(--bg-card);
}

.fp-section {
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
}

.fp-section__title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
}

.fp-meta {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 8px;
  margin: 0;
  font-size: 12px;
}

.fp-meta dt {
  color: var(--text-tertiary);
}

.fp-meta dd {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fp-actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  padding: 10px;
  border-bottom: 1px solid var(--border);
}

.fp-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 0;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.fp-action:hover {
  background: var(--bg-hover);
}

.fp-action.is-danger {
  color: var(--error);
}

.fp-action__icon {
  font-size: 18px;
}

.fp-siblings {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.fp-siblings__title {
  padding: 14px 18px 0;
}

.fp-siblings__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 8px 12px;
}

.fp-sibling {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 10px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.fp-sibling:hover {
  background: var(--bg-hover);
}

.fp-sibling.is-current {
  background: var(--info-bg);
  font-weight: 600;
  cursor: default;
}

.fp-sibling__thumb {
  flex: 0 0 auto;
  width: 36px;
  height: 28px;
  overflow: hidden;
  border-radius: 4px;
  background: var(--bg-hover);
}

.fp-sibling__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .fp-info {
    display: none;
  }
}
</style>
