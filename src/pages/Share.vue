<template>
  <!-- 语言切换 -->
  <div class="language-switcher">
    <div class="language-label">{{ currentLang === 'zh' ? '中文' : 'English' }}</div>
    <div class="language-switch" @click="toggleLanguage">
      <div class="language-switch-slider" :class="{ active: currentLang === 'en' }">
        <div class="language-switch-thumb"></div>
      </div>
    </div>
  </div>

  <div class="share-page">
    <div class="share-container" :class="{ 'verified-layout': verified }">
      <!-- 封面区域（仅在未验证时显示） -->
      <div v-if="!verified && !notFound" class="cover-section has-cover">
        <img class="cover-image" src="/afb9e692c32dbeb268027dc114bba931.png" alt="Cover">
        <div class="cover-gradient"></div>
      </div>

      <div v-if="!notFound" class="content-section" :class="{ 'verified-mode': verified }">
        <!-- 密码验证表单 -->
        <div v-if="!verified" id="passwordPage">
          <div class="resource-card" v-if="shareInfo">
            <div class="resource-icon">
              <icon-file v-if="shareInfo.resourceType === 'file'" :size="36" />
              <icon-folder v-else :size="36" />
            </div>
            <div class="resource-info">
              <div class="resource-name">{{ getResourceName() }}</div>
              <div class="resource-meta">
                <span v-if="shareInfo.resourceType === 'file'">
                  {{ formatFileSize(getFileSize()) }}
                </span>
                <span>{{ 'Chery International' }}</span>
              </div>
            </div>
          </div>

          <div class="form-section">
            <label class="form-label">{{ t('share.password.label') }}</label>
            <div class="password-input-wrapper">
              <a-input-password
                  v-model="form.password"
                  :placeholder="t('share.password.placeholder')"
                  allow-clear
                  @press-enter="handleVerify"
                  class="password-input"
                  :disabled="loading"
              >
              </a-input-password>
              <a-button type="primary" :loading="loading" @click="handleVerify" class="submit-btn">
                {{ t('share.password.accessBtn') }}
              </a-button>
            </div>
            <div class="error-text" v-if="error" style="display: block;">{{ t('share.password.error') }}</div>
          </div>
        </div>

        <!-- 分享内容展示 -->
        <div v-else id="filesPage">
          <div class="resource-card">
            <div class="resource-icon">
              <icon-file v-if="shareInfo.resourceType === 'file'" :size="36" />
              <icon-folder v-else :size="36" />
            </div>
            <div class="resource-info">
              <div class="resource-name">{{ getResourceName() }}</div>
              <div class="resource-meta">
                <span>{{ 'Chery International' }}</span>
                <span v-if="shareInfo.share.expireTime">{{ formatDate(shareInfo.share.expireTime) }}</span>
              </div>
            </div>
          </div>

          <!-- 文件下载按钮 -->
          <div class="action-section" v-if="shareInfo.resourceType === 'file'">
            <a-button
                type="primary"
                :loading="downloading"
                @click="handleDownload"
                class="download-button"
            >
              <template #icon>
                <icon-download />
              </template>
              {{ t('share.actions.download') }}
            </a-button>
          </div>

          <!-- 文件夹内容列表 -->
          <div v-if="shareInfo.resourceType === 'folder'" class="folder-content">
              <!-- 面包屑导航 -->
              <div class="breadcrumb">
                <a-breadcrumb>
                  <a-breadcrumb-item
                      v-for="(item, index) in folderPath"
                      :key="index"
                      @click="navigateToFolder(item.id)"
                      style="cursor: pointer;"
                  >
                    {{ item.name }}
                  </a-breadcrumb-item>
                </a-breadcrumb>
              </div>

              <!-- 网格视图 -->
              <div class="file-grid">
                <div
                    v-for="item in folderFiles"
                    :key="item.id"
                    class="file-card"
                    :class="{ 'clickable': item.type === 'folder' || canPreview(item.name) }"
                    @click="item.type === 'folder' ? navigateToFolder(item.id, item.name) : handleFileClick(item)"
                >
                  <!-- 图片预览 -->
                  <div v-if="item.type === 'file' && hasAccessUrl(item) && getFileType(item.name) === 'image'" class="file-thumb">
                    <img
                      :loading="'lazy'"
                      :src="getAccessUrl(item)"
                      :alt="item.name"
                    />
                    <div class="file-card-overlay">
                      <icon-eye :size="32" />
                    </div>
                  </div>
                  <!-- 视频预览（滚动到可见区域才加载封面） -->
                  <div v-else-if="item.type === 'file' && hasAccessUrl(item) && getFileType(item.name) === 'video'" class="file-thumb video-preview">
                    <video
                      muted
                      preload="none"
                      :data-lazy="getAccessUrl(item)"
                      @click.stop="handlePreviewFile(item)"
                    >
                    </video>
                    <div class="file-card-overlay" @click.stop="handlePreviewFile(item)">
                      <icon-play-circle :size="40" color="white" />
                    </div>
                  </div>
                  <!-- 无访问URL的视频显示图标 -->
                  <div v-else-if="item.type === 'file' && getFileType(item.name) === 'video'" class="file-thumb video-preview">
                    <icon-video-camera :size="64" />
                  </div>
                  <!-- 其他类型显示图标 -->
                  <div v-else class="file-thumb">
                    <icon-folder v-if="item.type === 'folder'" :size="80" />
                    <icon-image v-else-if="getFileType(item.name) === 'image'" :size="80" />
                    <icon-video-camera v-else-if="getFileType(item.name) === 'video'" :size="80" />
                    <icon-music v-else-if="getFileType(item.name) === 'audio'" :size="80" />
                    <icon-file-pdf v-else-if="getFileType(item.name) === 'pdf'" :size="80" />
                    <icon-file v-else :size="80" />
                  </div>
                  <div class="file-card-name" :title="item.displayName || item.name">{{ item.displayName || item.name }}</div>
                  <div class="file-card-actions" v-if="item.type === 'file'">
                    <a-button
                        v-if="canPreview(item.name)"
                        type="primary"
                        size="small"
                        @click.stop="handlePreviewFile(item)"
                    >
                      <template #icon>
                        <icon-eye />
                      </template>
                      {{ t('share.actions.preview') }}
                    </a-button>
                    <a-button
                        type="outline"
                        size="small"
                        @click.stop="handleDownloadFile(item)"
                    >
                      <template #icon>
                        <icon-download />
                      </template>
                      {{ t('share.actions.downloadItem') }}
                    </a-button>
                  </div>
                </div>
                <div v-if="folderFiles.length === 0" class="empty-folder">
                  <icon-folder :size="80" style="color: #e5e7eb;" />
                  <p>{{ t('share.empty') }}</p>
                </div>
              </div>
            </div>
        </div>

      </div>
      <!-- 错误提示 - 优先显示 -->
      <div v-if="notFound" id="errorPage" class="content-section">
        <div class="error-state">
          <div class="error-icon">
            <icon-exclamation-circle :size="80" />
          </div>
          <h2>{{ t('share.notFound.title') }}</h2>
          <p>{{ t('share.notFound.desc') }}</p>
        </div>
      </div>
    </div>

    <!-- 文件预览对话框 -->
    <a-modal
        v-model:visible="previewVisible"
        :title="previewFile?.name"
        :width="previewType === 'image' ? '80%' : '90%'"
        unmount-on-close
        @cancel="closePreview"
    >
      <div class="preview-container">
        <!-- 图片预览 -->
        <div v-if="previewType === 'image'" class="preview-image">
          <img :src="previewUrl" :alt="previewFile?.name || ''" />
        </div>

        <!-- 视频预览 -->
        <div v-else-if="previewType === 'video'" class="preview-video">
          <video
              ref="videoRef"
              controls
              :src="previewUrl"
              style="width: 100%; max-height: 70vh;"
          >
            {{ t('share.browserNotSupportVideo') }}
          </video>
        </div>

        <!-- 音频预览 -->
        <div v-else-if="previewType === 'audio'" class="preview-audio">
          <audio
              ref="audioRef"
              controls
              :src="previewUrl"
              style="width: 100%;"
          >
            {{ t('share.browserNotSupportAudio') }}
          </audio>
        </div>

        <!-- PDF预览 -->
        <div v-else-if="previewType === 'pdf'" class="preview-pdf">
          <iframe :src="previewUrl" style="width: 100%; height: 70vh; border: none;"></iframe>
        </div>

        <!-- 文本预览 -->
        <div v-else-if="previewType === 'text'" class="preview-text">
          <pre>{{ previewFile?.content || t('share.loading') }}</pre>
        </div>
      </div>

      <template #footer>
        <a-space>
          <a-button @click="closePreview">{{ t('share.close') }}</a-button>
          <a-button
              v-if="previewFile"
              type="primary"
              @click="handleDownloadFile(previewFile)"
          >
            <template #icon>
              <icon-download />
            </template>
            {{ t('share.actions.downloadItem') }}
          </a-button>
        </a-space>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import {
  IconFile,
  IconFolder,
  IconLock,
  IconDownload,
  IconEye,
  IconExclamationCircle,
  IconImage,
  IconVideoCamera,
  IconMusic,
  IconFilePdf,
  IconPlayCircle,
  IconShareAlt,
  IconUser,
  IconClockCircle,
  IconUnlock
} from '@arco-design/web-vue/es/icon'
import { getShareInfo, accessShare, downloadShareFile, getShareFolderContent } from '@/modules/cloud/api/share'
import type { ShareInfo } from '@/modules/cloud/types'

const { t, locale } = useI18n()
const route = useRoute()
const shareCode = ref(route.params.code as string)

// 语言切换
const currentLang = computed(() => locale.value === 'zh-CN' ? 'zh' : 'en')

function toggleLanguage() {
  locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
}

const loading = ref(false)
const downloading = ref(false)
const loadingFiles = ref(false)
const verified = ref(false)
const notFound = ref(false)
const error = ref('')
const showFolderContent = ref(false)

const form = ref({
  password: '',
})

const shareInfo = ref<ShareInfo | null>(null)
const folderFiles = ref<any[]>([])
const currentFolderId = ref<number | undefined>(undefined)
const folderPath = ref<Array<{ id: number | undefined; name: string }>>([])

const previewVisible = ref(false)
const previewFile = ref<any>(null)
const previewType = ref<'image' | 'video' | 'audio' | 'pdf' | 'text' | 'unknown'>('unknown')
const previewUrl = ref<string>('')

const videoRef = ref<HTMLVideoElement | null>(null)
let videoObserver: IntersectionObserver | null = null
const audioRef = ref<HTMLAudioElement | null>(null)


function getResourceName(): string {
  if (!shareInfo.value) return ''
  if (shareInfo.value.resourceType === 'file') {
    return shareInfo.value.file?.name || '文件'
  }
  return shareInfo.value.folder?.name || '文件夹'
}

function getFileSize(): number {
  if (!shareInfo.value || shareInfo.value.resourceType !== 'file') return 0
  return shareInfo.value.file?.fileSize || 0
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString(locale.value)
}

// 视频懒加载 - 滚动到可见区域才加载封面
function initVideoLazyLoad() {
  // 先清理之前的 observer
  if (videoObserver) {
    videoObserver.disconnect()
  }

  // 创建 IntersectionObserver
  videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const video = entry.target as HTMLVideoElement
          const lazySrc = video.getAttribute('data-lazy')
          if (lazySrc) {
            video.src = lazySrc
            video.preload = 'metadata' // 只加载元数据（封面）
            video.removeAttribute('data-lazy')
            videoObserver?.unobserve(video)
          }
        }
      })
    },
    {
      rootMargin: '100px 0px', // 提前100px开始加载
      threshold: 0.1
    }
  )

  // 观察所有视频元素
  const videos = document.querySelectorAll('video[data-lazy]')
  videos.forEach((video) => {
    videoObserver.observe(video)
  })
}

async function loadShareInfo() {
  loading.value = true
  error.value = ''
  try {
    const info = await getShareInfo(shareCode.value)
    shareInfo.value = info

    if (info.share.shareType === 'public') {
      verified.value = true
      if (info.resourceType === 'folder') {
        showFolderContent.value = true
        folderPath.value = [{ id: undefined, name: info.folder?.name || (currentLang.value === 'zh' ? '根目录' : 'Root') }]
        currentFolderId.value = undefined
        await loadFolderContent()
      }
    }
  } catch (e: any) {
    console.error('获取分享信息失败:', e)
    // 判断是否是分享不存在或已失效的错误（无论状态码）
    const errorMessage = e?.message || ''
    if (e?.response?.status === 404 || errorMessage.includes('分享不存在') || errorMessage.includes('已失效') || errorMessage.includes('30001')) {
      notFound.value = true
    } else {
      Message.error(t('share.getShareInfoFailed'))
    }
  } finally {
    loading.value = false
  }
}

async function handleVerify() {
  if (!form.value.password.trim()) {
    error.value = t('share.error.passwordRequired')
    return
  }

  loading.value = true
  error.value = ''
  try {
    const info = await accessShare(shareCode.value, form.value.password)
    shareInfo.value = info
    verified.value = true
    Message.success(t('share.verifyingSuccess'))

    if (info.resourceType === 'folder') {
      showFolderContent.value = true
      folderPath.value = [{ id: undefined, name: info.folder?.name || t('share.resource.folder') }]
      currentFolderId.value = undefined
      await loadFolderContent()
    }
  } catch (e: any) {
    console.error('访问分享失败:', e)
    error.value = e?.message || t('share.password.error')
  } finally {
    loading.value = false
  }
}

async function handleDownload() {
  if (!shareInfo.value || shareInfo.value.resourceType !== 'file') return

  const file = shareInfo.value.file
  if (file) {
    const accessUrl = getAccessUrl(file)
    // 只要有完整的访问URL（http/https开头），就直接使用，不依赖 storageType 判断
    if (accessUrl && (accessUrl.startsWith('http://') || accessUrl.startsWith('https://'))) {
      const link = document.createElement('a')
      link.href = accessUrl
      link.download = file.name || `file-${Date.now()}`
      link.rel = 'noopener'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      Message.success(t('share.actions.startDownload'))
      return
    }
  }

  downloading.value = true
  try {
    await downloadShareFile(
        shareCode.value,
        shareInfo.value.file?.name || `file-${Date.now()}`
    )
    Message.success('开始下载')
  } catch (e: any) {
    console.error('下载失败:', e)
    Message.error(e?.message || '下载失败')
  } finally {
    downloading.value = false
  }
}

async function loadFolderContent(parentId?: number) {
  loadingFiles.value = true
  try {
    const content = await getShareFolderContent(shareCode.value, parentId)
    const items: any[] = []

    if (content.folders && content.folders.length > 0) {
      content.folders.forEach((folder: any) => {
        items.push({
          id: folder.id,
          name: folder.name,
          type: 'folder',
          size: 0,
          updateTime: folder.updateTime || '',
        })
      })
    }

    if (content.files && content.files.length > 0) {
      content.files.forEach((file: any) => {
        const baseName = file.name || file.Name || file.fileName || file.FileName || ''
        let fileExt = file.fileExt || file.FileExt || ''
        if (fileExt && !fileExt.startsWith('.')) {
          fileExt = '.' + fileExt
        }
        const fullName = baseName + fileExt

        const item = {
          id: file.id || file.ID || 0,
          name: fullName,
          displayName: baseName,
          type: file.type || file.Type || 'file',
          size: (file.fileSize || file.FileSize || file.size || file.Size || 0),
          updateTime: file.updateTime || file.UpdateTime || file.createTime || file.CreateTime || '',
          storageType: file.storageType || file.StorageType || '',
          accessUrl: file.accessUrl || file.accessURL || file.AccessURL || file.AccessUrl || '',
          fileExt: fileExt,
        }
        items.push(item)
      })
    }

    folderFiles.value = items
    // 初始化视频懒加载
    nextTick(() => {
      initVideoLazyLoad()
    })
  } catch (e: any) {
    console.error('加载文件夹内容失败:', e)
    Message.error(e?.message || t('share.getShareInfoFailed'))
  } finally {
    loadingFiles.value = false
  }
}

async function navigateToFolder(folderId?: number, folderName?: string) {
  if (folderName === undefined) {
    const pathIndex = folderPath.value.findIndex(item => item.id === folderId)
    if (pathIndex !== -1) {
      folderPath.value = folderPath.value.slice(0, pathIndex + 1)
      currentFolderId.value = folderId
    }
  } else {
    folderPath.value.push({ id: folderId, name: folderName })
    currentFolderId.value = folderId
  }
  await loadFolderContent(currentFolderId.value)
}

function getFileType(fileName: string): 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'unknown' {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv']
  const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'm4a']
  const pdfExts = ['pdf']
  const textExts = ['txt', 'md', 'json', 'xml', 'csv', 'log']

  if (imageExts.includes(ext)) return 'image'
  if (videoExts.includes(ext)) return 'video'
  if (audioExts.includes(ext)) return 'audio'
  if (pdfExts.includes(ext)) return 'pdf'
  if (textExts.includes(ext)) return 'text'

  return 'unknown'
}

function hasAccessUrl(item: any): boolean {
  const url = item.accessUrl || item.accessURL || item.AccessURL || item.AccessUrl || ''
  // 只有完整的 HTTP/HTTPS URL 才算有效访问链接
  return url.startsWith('http://') || url.startsWith('https://')
}

function getAccessUrl(item: any): string {
  return item.accessUrl || item.accessURL || item.AccessURL || item.AccessUrl || ''
}

function canPreview(fileName: string): boolean {
  const type = getFileType(fileName)
  return ['image', 'video', 'audio', 'pdf', 'text'].includes(type)
}

function getFilePreviewUrl(fileId: number): string {
  return `/api/v1/cloud/shares/${shareCode.value}/files/${fileId}/preview`
}

function getFileDownloadUrl(fileId: number): string {
  return `/api/v1/cloud/shares/${shareCode.value}/files/${fileId}/download`
}

function handlePreviewFile(file: any) {
  if (!canPreview(file.name)) {
    Message.warning(t('share.previewNotSupport'))
    return
  }

  previewFile.value = file
  previewType.value = getFileType(file.name)

  const accessUrl = getAccessUrl(file)
  // 只要有完整的访问URL（http/https开头），就直接使用，不依赖 storageType 判断
  if (accessUrl && (accessUrl.startsWith('http://') || accessUrl.startsWith('https://'))) {
    previewUrl.value = accessUrl
  } else {
    previewUrl.value = getFilePreviewUrl(file.id)
  }

  previewVisible.value = true
}

function closePreview() {
  try {
    if (videoRef.value) {
      videoRef.value.pause()
      videoRef.value.currentTime = 0
      videoRef.value.src = ''
      videoRef.value.load()
    }

    if (audioRef.value) {
      audioRef.value.pause()
      audioRef.value.currentTime = 0
      audioRef.value.src = ''
      audioRef.value.load()
    }
  } catch (error) {
    console.warn('关闭预览时清理媒体资源失败:', error)
  }

  previewVisible.value = false

  nextTick(() => {
    previewFile.value = null
    previewType.value = 'unknown'
    previewUrl.value = ''
  })
}

function handleFileClick(file: any) {
  if (canPreview(file.name)) {
    handlePreviewFile(file)
  } else {
    handleDownloadFile(file)
  }
}

function handleDownloadFile(file: any) {
  const accessUrl = getAccessUrl(file)
  // 只要有完整的访问URL（http/https开头），就直接使用，不依赖 storageType 判断
  if (accessUrl && (accessUrl.startsWith('http://') || accessUrl.startsWith('https://'))) {
    const link = document.createElement('a')
    link.href = accessUrl
    link.download = file.name
    link.rel = 'noopener'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    Message.success('开始下载')
    return
  }
  const downloadUrl = getFileDownloadUrl(file.id)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = file.name
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  Message.success('开始下载')
}

onMounted(() => {
  if (!shareCode.value) {
    notFound.value = true
    return
  }
  loadShareInfo()
})

onUnmounted(() => {
  if (videoObserver) {
    videoObserver.disconnect()
    videoObserver = null
  }
})
</script>

<style scoped>
/* ========== 极简设计风格 - 参考图风格 ========== */

:root {
  --primary-color: #007bff;
  --primary-hover: #0056b3;
  --bg-page: #f8f9fa;
  --bg-white: #ffffff;
  --bg-card: #e9f5ff;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --border-color: #ced4da;
  --border-focus: #007bff;
}

/* 语言切换开关 */
.language-switcher {
  position: fixed !important;
  top: 8px !important;
  right: 8px !important;
  background: white !important;
  border: 1px solid #e9ecef !important;
  border-radius: 2px !important;
  padding: 4px 8px !important;
  z-index: 9999 !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.language-label {
  font-size: 12px !important;
  font-weight: 500 !important;
  color: #333 !important;
}

.language-switch {
  position: relative !important;
  width: 36px !important;
  height: 20px !important;
  cursor: pointer !important;
}

.language-switch-slider {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  background: #e9ecef !important;
  border-radius: 10px !important;
  transition: background 0.2s ease !important;
}

.language-switch-slider.active {
  background: #007bff !important;
}

.language-switch-thumb {
  position: absolute !important;
  top: 2px !important;
  left: 2px !important;
  width: 16px !important;
  height: 16px !important;
  background: white !important;
  border-radius: 50% !important;
  transition: transform 0.2s ease !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
}

.language-switch-slider.active .language-switch-thumb {
  transform: translateX(16px) !important;
}

.share-page {
  min-height: 100vh;
  background: var(--bg-page) !important;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0;
  overflow-y: auto;
}

/* PC端密码页面 - 封面和内容同宽，加边框 */
.share-page:not(:has(.verified-layout)) .share-container {
  max-width: 800px;
  width: 100%;
  padding: 0 0 40px 0;
  margin-top: 40px;
  margin-bottom: 40px;
  background: #ffffff;
  border: 1px solid #dee2e6;
}

.share-page:not(:has(.verified-layout)) .cover-section {
  max-width: 800px;
  width: 100%;
}

.share-page:not(:has(.verified-layout)) .content-section {
  max-width: 800px;
  width: 100%;
  padding: 0 16px;
}

/* 已验证时保持一致背景 */
.share-page:has(.verified-layout) {
  background: var(--bg-page) !important;
}

.share-container {
  max-width: 800px;
  width: 100%;
  background: transparent;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 已验证时容器加宽 */
.share-container.verified-layout {
  max-width: 1200px;
  width: 100%;
  padding: 40px;
  align-items: stretch;
}

/* 封面区域（仅密码页面显示） */
.cover-section {
  width: 100%;
  max-width: 100%;
  height: auto;
  background: transparent;
  position: relative;
  overflow: hidden;
  margin: 0 0 16px 0;
  border-radius: 0;
}

.cover-section.has-cover {
  background: transparent;
}

.cover-image {
  width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
}

.cover-gradient {
  display: none;
}

/* 内容区域 */
.content-section {
  padding: 0 16px;
  width: 100%;
  max-width: 800px;
}

/* 密码页面的内容左对齐 */
.content-section:not(.verified-mode) {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  min-height: auto;
}

/* 已验证状态下（文件列表） */
.content-section.verified-mode {
  padding: 0;
  max-width: 100%;
}

.resource-card {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 20px !important;
  background: #f0f7ff !important;
  border-radius: 4px !important;
  border: 2px solid #b8d4f0 !important;
  margin-bottom: 28px !important;
  width: 100%;
  max-width: 800px;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.08) !important;
}

/* 文件列表中的 resource-card */
.content-section.verified-mode .resource-card {
  max-width: 100%;
  margin-bottom: 20px;
  background: var(--bg-card) !important;
  border-color: #d6eaff !important;
}

.resource-icon {
  width: 36px !important;
  height: 36px !important;
  border-radius: 2px !important;
  background: rgba(0, 123, 255, 0.1) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
}

.resource-icon :deep(.arco-icon) {
  width: 20px;
  height: 20px;
  color: var(--primary-color);
}

.resource-info {
  flex: 1;
  min-width: 0;
}

.resource-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 12px;
}

.form-section {
  width: 100%;
  max-width: 800px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.password-input-wrapper {
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
  width: 100% !important;
  align-items: stretch !important;
  position: relative !important;
  z-index: 1 !important;
}

/* 输入框容器 - 让它自适应剩余空间 */
.password-input-wrapper :deep(.arco-input-group-wrapper),
.password-input-wrapper :deep(.arco-input-wrapper),
.password-input-wrapper :deep(.arco-input-group) {
  flex: 1 !important;
  min-width: 0 !important;
  width: auto !important;
}

/* 覆盖 Arco Design 密码输入框样式 */
.password-input-wrapper :deep(.arco-input-wrapper) {
  width: 100% !important;
  padding: 0 !important;
  border: 2px solid var(--border-color) !important;
  border-radius: 0 !important;
  transition: all 0.2s ease !important;
}

.password-input-wrapper :deep(.arco-input-wrapper.arco-input-focus) {
  border-color: var(--border-focus) !important;
}

.password-input-wrapper :deep(.arco-input) {
  height: 50px !important;
  line-height: 50px !important;
  font-size: 16px !important;
}

.password-input-wrapper :deep(.arco-input) {
  padding: 10px 12px !important;
  border: none !important;
  border-radius: 2px !important;
  font-size: 14px !important;
  height: 40px !important;
  line-height: 1.4 !important;
  box-shadow: none !important;
}

.password-input-wrapper :deep(.arco-input:focus) {
  box-shadow: none !important;
  outline: none !important;
}

/* 强制按钮样式 - 全屏宽度 */
.password-input-wrapper > .submit-btn,
.submit-btn.arco-btn.arco-btn-primary {
  width: 100% !important;
  min-width: 100% !important;
  padding: 0 28px !important;
  background-color: #007bff !important;
  background: #007bff !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 0 !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  white-space: nowrap !important;
  height: 50px !important;
  line-height: 50px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  position: relative !important;
  z-index: 999 !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.password-input-wrapper > .submit-btn:hover,
.submit-btn.arco-btn.arco-btn-primary:hover {
  background-color: #0056b3 !important;
  background: #0056b3 !important;
}

.submit-btn:hover {
  background: var(--primary-hover) !important;
}

.error-text {
  color: #dc3545;
  font-size: 12px;
  margin-top: 8px;
  text-align: left;
}

/* 分享内容展示 */
#filesPage {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.action-section {
  display: flex;
  justify-content: flex-start;
  margin-top: 0;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.download-button {
  padding: 0 32px !important;
  background: var(--primary-color) !important;
  color: white !important;
  border: none !important;
  border-radius: 2px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  white-space: nowrap !important;
  height: 40px !important;
  line-height: 40px !important;
}

.download-button:hover {
  background: var(--primary-hover) !important;
}

/* 文件夹内容 */
.folder-content {
  margin-top: 0;
  border-top: none;
  padding-top: 0;
  width: 100%;
}

/* 面包屑导航 */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--bg-card);
  border-radius: 2px;
  border: 1px solid #d6eaff;
  margin-bottom: 20px;
  overflow-x: auto;
  flex-wrap: nowrap;
  flex-shrink: 0;
}

.breadcrumb :deep(.arco-breadcrumb) {
  flex: 1;
}

.breadcrumb :deep(.arco-breadcrumb-item) {
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  padding: 4px 8px;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.breadcrumb :deep(.arco-breadcrumb-item:hover) {
  background: rgba(0, 123, 255, 0.1);
  color: var(--primary-color);
}

.breadcrumb :deep(.arco-breadcrumb-item.arco-breadcrumb-item-last) {
  color: var(--text-primary);
  font-weight: 600;
}

.breadcrumb :deep(.arco-breadcrumb-item.arco-breadcrumb-item-last:hover) {
  color: var(--primary-color);
  cursor: pointer;
}

/* 文件网格 */
.file-grid {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 20px !important;
  margin-top: 0 !important;
  width: 100% !important;
}

.file-card {
  background: #ffffff !important;
  border: 2px solid #dee2e6 !important;
  border-radius: 4px !important;
  overflow: hidden !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
}

.file-card:hover {
  border-color: #007bff !important;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2) !important;
  transform: translateY(-2px) !important;
}

.file-card.clickable {
  cursor: pointer !important;
}

.file-thumb {
  width: 100% !important;
  aspect-ratio: 16/9 !important;
  background: linear-gradient(135deg, #f0f7ff 0%, #e3eef9 100%) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  position: relative !important;
  overflow: hidden !important;
  border-bottom: 1px solid #d0d7e0;
}

.file-thumb.video-preview {
  aspect-ratio: 16/9;
}

.file-thumb img,
.file-thumb video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.file-card:hover .file-thumb img {
  transform: scale(1.02);
}

.file-card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  color: white;
}

.file-card:hover .file-card-overlay {
  opacity: 1;
}

.file-thumb :deep(.arco-icon) {
  width: 48px;
  height: 48px;
  color: #0056b3;
  filter: drop-shadow(0 1px 2px rgba(0, 86, 179, 0.2));
}

.file-card-name {
  padding: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #ffffff;
}

.file-card-actions {
  display: flex;
  gap: 6px;
  justify-content: center;
  padding: 0 12px 12px;
}

.file-card-actions :deep(.arco-btn) {
  font-size: 11px !important;
  height: 28px;
  padding: 0 10px !important;
  border-radius: 2px;
}

/* 错误状态 */
.error-state {
  text-align: center;
  padding: 80px 40px;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.error-state .error-icon {
  width: 64px;
  height: 64px;
  background: rgba(220, 53, 69, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.error-state .error-icon :deep(.arco-icon) {
  width: 32px;
  height: 32px;
  color: #dc3545;
}

.error-state h2 {
  font-size: 20px;
  color: var(--text-primary);
  margin-bottom: 12px;
  font-weight: 600;
}

.error-state p {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

/* 空文件夹 */
.empty-folder {
  text-align: center;
  padding: 80px 40px;
  grid-column: 1 / -1;
}

.empty-folder :deep(.arco-icon) {
  font-size: 64px;
  color: #dee2e6;
}

.empty-folder p {
  margin-top: 16px;
  font-size: 14px;
  color: #6c757d;
}

/* 预览对话框 */
.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.preview-image img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.preview-video,
.preview-audio,
.preview-pdf {
  width: 100%;
}

.preview-text {
  max-height: 70vh;
  overflow: auto;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 2px;
}

.preview-text pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
}

/* ========== 响应式优化 ========== */

/* PC 端大屏幕 */
@media (min-width: 1200px) {
  .file-grid {
    grid-template-columns: repeat(5, 1fr) !important;
    gap: 24px !important;
  }
}

/* 平板端 */
@media (min-width: 768px) and (max-width: 1023px) {
  .file-grid {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 16px !important;
  }

  .share-container.verified-layout {
    padding: 0 24px 24px;
  }
}

/* 手机端 - 移动端全屏风格 */
@media (max-width: 767px) {
  .share-page {
    padding: 0;
    background: #f8f9fa !important;
  }

  .share-container {
    max-width: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  .share-container.verified-layout {
    padding: 16px;
  }

  .cover-section {
    max-width: 100%;
    width: 100%;
    margin: 0 0 16px 0;
    border-radius: 0;
  }

  .cover-section .cover-image {
    width: 100%;
    border-radius: 0;
  }

  .content-section {
    max-width: 100%;
    padding: 0 16px;
  }

  .resource-card {
    max-width: 100%;
    padding: 16px !important;
    margin-bottom: 20px;
  }

  .password-input-wrapper {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 12px !important;
  }

  .password-input-wrapper :deep(.arco-input-wrapper) {
    border-radius: 0 !important;
    height: 50px !important;
  }

  .password-input-wrapper :deep(.arco-input) {
    height: 50px !important;
    line-height: 50px !important;
    font-size: 16px !important;
  }

  .submit-btn {
    width: 100% !important;
    min-width: 100% !important;
    height: 50px !important;
    line-height: 50px !important;
    border-radius: 0 !important;
    font-size: 16px !important;
  }

  .file-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 12px !important;
  }

  .file-card-name {
    font-size: 12px;
    padding: 10px;
  }

  .file-card-actions {
    padding: 0 8px 8px;
  }

  .file-card-actions :deep(.arco-btn) {
    font-size: 10px !important;
    height: 26px;
    padding: 0 8px !important;
  }

  .breadcrumb {
    padding: 8px 10px;
  }

  .download-button {
    width: 100%;
  }

  .form-label {
    font-size: 14px !important;
    margin-bottom: 12px !important;
  }
}

@media (max-width: 480px) {
  .file-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px !important;
  }

  .language-switcher {
    top: 4px !important;
    right: 4px !important;
  }
}

@media (max-width: 360px) {
  .file-grid {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }
}
</style>
