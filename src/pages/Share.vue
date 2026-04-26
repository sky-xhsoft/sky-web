<template>
  <!-- 语言切换 -->
  <div class="language-switcher">
    <div class="language-label">{{ t('share.languageLabel') }}</div>
    <div class="language-switch" @click="toggleLanguage">
      <div class="language-switch-slider" :class="{ active: locale === 'en-US' }">
        <div class="language-switch-thumb"></div>
      </div>
    </div>
  </div>

  <div class="share-page">
    <div class="share-container">
      <!-- 封面区域 -->
      <div class="cover-section" :class="{ 'cover-minimized': verified }" id="coverSection">
        <img class="cover-image" id="coverImage" alt="Cover">
        <div class="cover-gradient"></div>
      </div>

      <div v-if="!notFound" class="content-section">
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
            <div class="error-text" v-if="error" style="display: block;">{{ error }}</div>
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
                    <img :src="getAccessUrl(item)" :alt="item.name" />
                    <div class="file-card-overlay">
                      <icon-eye :size="32" />
                    </div>
                  </div>
                  <!-- 视频预览 -->
                  <div v-else-if="item.type === 'file' && hasAccessUrl(item) && getFileType(item.name) === 'video'" class="file-thumb video-preview">
                    <video
                      :src="getAccessUrl(item)"
                      muted
                      preload="metadata"
                      @click.stop="handlePreviewFile(item)"
                    >
                    </video>
                    <div class="file-card-overlay" @click.stop="handlePreviewFile(item)">
                      <icon-play-circle :size="36" color="white" />
                    </div>
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
                      {{ t('share.actions.download') }}
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
            {{ t('share.videoNotSupported') }}
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
            {{ t('share.audioNotSupported') }}
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
            {{ t('share.download') }}
          </a-button>
        </a-space>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import {
  IconFile,
  IconFolder,
  IconDownload,
  IconEye,
  IconExclamationCircle,
  IconImage,
  IconVideoCamera,
  IconMusic,
  IconFilePdf,
  IconPlayCircle
} from '@arco-design/web-vue/es/icon'
import { getShareInfo, accessShare, downloadShareFile, getShareFolderContent } from '@/modules/cloud/api/share'
import type { ShareInfo } from '@/modules/cloud/types'
import { changeLanguage } from '../locales'

const route = useRoute()
const shareCode = ref(route.params.code as string)

// 语言切换 - 使用全局 vue-i18n
const { t, locale } = useI18n()

function toggleLanguage() {
  const newLang = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
  changeLanguage(newLang)
  locale.value = newLang
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
const audioRef = ref<HTMLAudioElement | null>(null)

function getResourceName(): string {
  if (!shareInfo.value) return ''
  if (shareInfo.value.resourceType === 'file') {
    const fileName = shareInfo.value.file?.name || '文件'
    // 去掉文件后缀
    const lastDotIndex = fileName.lastIndexOf('.')
    return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName
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
        folderPath.value = [{ id: undefined, name: info.folder?.name || t('share.breadcrumbRoot') }]
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
    error.value = t('share.password.required')
    return
  }

  loading.value = true
  error.value = ''
  try {
    const info = await accessShare(shareCode.value, form.value.password)
    shareInfo.value = info
    verified.value = true
    Message.success(t('share.verifySuccess'))

    if (info.resourceType === 'folder') {
      showFolderContent.value = true
      folderPath.value = [{ id: undefined, name: info.folder?.name || t('share.breadcrumbRoot') }]
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
    const storageType = file.storageType || file.StorageType
    const accessUrl = getAccessUrl(file)
    if (storageType === 'oss' && accessUrl && accessUrl.length > 0) {
      const link = document.createElement('a')
      link.href = accessUrl
      link.download = file.name || `file-${Date.now()}`
      link.rel = 'noopener'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      Message.success(t('share.downloadSuccess'))
      return
    }
  }

  downloading.value = true
  try {
    await downloadShareFile(
        shareCode.value,
        shareInfo.value.file?.name || `file-${Date.now()}`
    )
    Message.success(t('share.downloadSuccess'))
  } catch (e: any) {
    console.error('下载失败:', e)
    Message.error(e?.message || t('share.downloadFailed'))
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
  } catch (e: any) {
    console.error('加载文件夹内容失败:', e)
    Message.error(e?.message || t('share.loadFolderContentFailed'))
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
  return !!(item.accessUrl || item.accessURL || item.AccessURL)
}

function getAccessUrl(item: any): string {
  return item.accessUrl || item.accessURL || item.AccessURL
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

  const storageType = file.storageType || file.StorageType
  const accessUrl = getAccessUrl(file)
  if (storageType === 'oss' && accessUrl && accessUrl.length > 0) {
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
  const storageType = file.storageType || file.StorageType
  const accessUrl = getAccessUrl(file)
  if (storageType === 'oss' && accessUrl && accessUrl.length > 0) {
    const link = document.createElement('a')
    link.href = accessUrl
    link.download = file.name
    link.rel = 'noopener'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    Message.success(t('share.downloadSuccess'))
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
  Message.success(t('share.downloadSuccess'))
}

onMounted(() => {
  // 加载封面图片
  const coverImage = document.getElementById('coverImage') as HTMLImageElement
  const coverSection = document.getElementById('coverSection')
  if (coverImage && coverSection) {
    coverImage.src = '/afb9e692c32dbeb268027dc114bba931.png'
    coverSection.classList.add('has-cover')
  }

  if (!shareCode.value) {
    notFound.value = true
    return
  }
  loadShareInfo()
})
</script>

<style scoped>
/* 语言切换开关 */
.language-switcher {
  position: fixed !important;
  top: 12px !important;
  right: 12px !important;
  background: rgba(255, 255, 255, 0.9) !important;
  border: 1px solid #d1e8ff !important;
  border-radius: 0 !important;
  padding: 8px 12px !important;
  z-index: 9998 !important;
  backdrop-filter: blur(10px) !important;
  box-shadow: 0 2px 8px rgba(0, 168, 255, 0.1) !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
}

.language-label {
  font-size: 13px !important;
  font-weight: 500 !important;
  color: var(--text-secondary) !important;
  white-space: nowrap !important;
}

.language-switch {
  position: relative !important;
  width: 44px !important;
  height: 24px !important;
  cursor: pointer !important;
}

.language-switch-slider {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  background: #d1e8ff !important;
  border-radius: 12px !important;
  transition: background 0.3s ease !important;
}

.language-switch-slider.active {
  background: linear-gradient(135deg, #00a8ff 0%, #0066cc 100%) !important;
}

.language-switch-thumb {
  position: absolute !important;
  top: 2px !important;
  left: 2px !important;
  width: 20px !important;
  height: 20px !important;
  background: white !important;
  border-radius: 50% !important;
  transition: transform 0.3s ease !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

.language-switch-slider.active .language-switch-thumb {
  transform: translateX(20px) !important;
}

:root {
  --primary-color: #00a8ff;
  --primary-dark: #0066cc;
  --primary-gradient: linear-gradient(135deg, #00a8ff 0%, #0066cc 100%);
  --accent-gradient: linear-gradient(135deg, #e8f4ff 0%, #b3d8ff 100%);
  --bg-page: #f5f7fa;
  --bg-white: #ffffff;
  --bg-card: #f0f8ff;
  --bg-hover: #e6f2ff;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --text-white: #ffffff;
  --border-color: #d1e8ff;
  --border-light: #e6f2ff;
  --shadow-sm: 0 2px 8px rgba(0, 168, 255, 0.1);
  --shadow-md: 0 4px 16px rgba(0, 168, 255, 0.15);
  --shadow-lg: 0 8px 32px rgba(0, 168, 255, 0.2);
}

.share-page {
  min-height: 100vh;
  background: var(--accent-gradient);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0;
  overflow: auto;
}

/* 进入文件列表后，从顶部开始显示 */
.share-page:has(.cover-minimized) {
  align-items: flex-start;
  padding-top: 0;
}

.share-container {
  max-width: 800px;
  width: 100%;
  background: var(--bg-white);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: fadeIn 0.5s ease-out;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 封面隐藏后，容器撑满视口 */
.share-container:has(.cover-minimized) {
  min-height: 100vh;
}

@media (min-width: 1024px) {
  .share-container:has(.cover-minimized) {
    max-width: 1000px;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 封面区域 */
.cover-section {
  width: 100%;
  aspect-ratio: 16/9;
  max-height: 500px;
  background: var(--primary-gradient);
  position: relative;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

/* 验证成功后，所有设备都完全隐藏封面 */
.cover-section.cover-minimized {
  display: none !important;
  height: 0 !important;
  max-height: 0 !important;
}

.cover-section.has-cover {
  background: transparent;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.6) 100%);
}

.cover-section.has-cover .cover-gradient {
  background: linear-gradient(to bottom, transparent 40%, rgba(0, 0, 0, 0.7) 100%);
}

/* 内容区域 */
.content-section {
  padding: 40px;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}


.resource-card {
  display: flex !important;
  align-items: center !important;
  gap: 16px !important;
  padding: 20px !important;
  background: #f0f8ff !important;
  border-radius: 0 !important;
  border: 1px solid #d1e8ff !important;
  margin-bottom: 24px !important;
}

.resource-icon {
  width: 64px !important;
  height: 64px !important;
  border-radius: 16px !important;
  background: linear-gradient(135deg, rgba(0, 168, 255, 0.1) 0%, rgba(0, 102, 204, 0.1) 100%) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
}

.resource-icon :deep(.arco-icon) {
  width: 36px;
  height: 36px;
  color: var(--primary-color);
}

.resource-info {
  flex: 1;
  min-width: 0;
}

.resource-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 13px;
}

.form-section {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.password-input-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 覆盖 Arco Design 密码输入框样式 */
.password-input-wrapper :deep(.arco-input-wrapper) {
  flex: 1 !important;
  padding: 0 !important;
  border: 2px solid #d1e8ff !important;
  border-radius: 0 !important;
  transition: all 0.2s ease !important;
}

.password-input-wrapper :deep(.arco-input-wrapper.arco-input-focus) {
  border-color: #00a8ff !important;
  box-shadow: 0 0 0 4px rgba(0, 168, 255, 0.1) !important;
}

.password-input-wrapper :deep(.arco-input) {
  padding: 16px 20px !important;
  border: none !important;
  border-radius: 14px !important;
  font-size: 18px !important;
  height: auto !important;
  line-height: 1.5 !important;
  box-shadow: none !important;
}

.password-input-wrapper :deep(.arco-input:focus) {
  box-shadow: none !important;
  outline: none !important;
}

.submit-btn {
  padding: 16px 40px !important;
  background: linear-gradient(135deg, #00a8ff 0%, #0066cc 100%) !important;
  color: white !important;
  border: 1px solid #00a8ff !important;
  border-radius: 0 !important;
  font-size: 16px !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  white-space: nowrap !important;
  height: auto !important;
  line-height: 1.5 !important;
}

.submit-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 24px rgba(0, 102, 204, 0.4) !important;
}

.error-text {
  color: #ef4444;
  font-size: 13px;
  margin-top: 8px;
}

/* 分享内容展示 */
#filesPage {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.action-section {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  flex-shrink: 0;
}

.resource-card {
  flex-shrink: 0;
}

.download-button {
  padding: 16px 40px !important;
  background: linear-gradient(135deg, #00a8ff 0%, #0066cc 100%) !important;
  color: white !important;
  border: 1px solid #00a8ff !important;
  border-radius: 0 !important;
  font-size: 16px !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  white-space: nowrap !important;
  height: auto !important;
  line-height: 1.5 !important;
}

.download-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 24px rgba(0, 102, 204, 0.4) !important;
}

/* 文件夹内容 */
.folder-content {
  margin-top: 0;
  border-top: none;
  padding-top: 0;
  height: calc(100vh - 260px); /* 增加高度，确保最后一行完整显示 */
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}


/* 面包屑导航 */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0f8ff;
  border-radius: 0;
  border: 1px solid #d1e8ff;
  margin-bottom: 16px;
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
  border-radius: 6px;
  transition: all 0.2s ease;
}

.breadcrumb :deep(.arco-breadcrumb-item:hover) {
  background: var(--bg-hover);
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
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 16px !important;
  margin-top: 20px !important;
  width: 100% !important;
}

/* PC 端响应式样式 */
@media (min-width: 1024px) {
  .file-grid {
    grid-template-columns: repeat(4, 1fr) !important;
    margin-bottom: 40px !important; /* 解决显示不完整的问题 */
  }

  /* 调整文件夹内容高度，确保 PC 端显示完整 */
  .folder-content {
    height: calc(100vh - 240px) !important;
  }

  /* 封面隐藏后，文件列表占满整个视口高度 */
  .cover-minimized + .content-section .folder-content {
    height: calc(100vh - 100px) !important;
    max-height: calc(100vh - 100px) !important;
  }

  /* 封面隐藏后，调整内容区域的 padding */
  .cover-minimized + .content-section {
    padding-top: 30px !important;
    padding-bottom: 30px !important;
  }
}

/* 平板端响应式样式 */
@media (min-width: 768px) and (max-width: 1023px) {
  .file-grid {
    grid-template-columns: repeat(3, 1fr) !important;
    margin-bottom: 40px !important;
  }

  /* 封面隐藏后，平板端文件夹内容高度增加 */
  .folder-content {
    height: calc(100vh - 140px) !important;
  }

  /* 调整内容区域 padding */
  .content-section {
    padding: 30px !important;
  }
}

/* 手机端响应式样式 */
@media (max-width: 767px) {
  .file-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    margin-bottom: 40px !important;
  }

  /* 封面隐藏后，手机端文件夹内容高度增加 */
  .folder-content {
    height: calc(100vh - 140px) !important;
  }

  /* 调整内容区域 padding */
  .content-section {
    padding: 20px !important;
  }
}

/* 确保 a-spin 内部的文件网格也能正确显示 */
:deep(.arco-spin) {
  display: block !important;
  width: 100% !important;
}

:deep(.arco-spin-container) {
  display: block !important;
  width: 100% !important;
}

.folder-content :deep(.arco-spin) .file-grid,
:deep(.arco-spin) .file-grid,
:deep(.arco-spin-container) .file-grid {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 16px !important;
  margin-top: 20px !important;
  width: 100% !important;
}

.file-card {
  background: #ffffff !important;
  border: 1px solid #d1e8ff !important;
  border-radius: 0 !important;
  overflow: hidden !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.file-card:hover {
  border-color: #00a8ff !important;
  box-shadow: 0 4px 16px rgba(0, 168, 255, 0.15) !important;
  transform: translateY(-4px) !important;
}

.file-card.clickable {
  cursor: pointer !important;
}

.file-thumb {
  width: 100% !important;
  aspect-ratio: 16/9 !important;
  background: #f0f8ff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  position: relative !important;
  overflow: hidden !important;
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
  transform: scale(1.05);
}

.file-card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  transition: opacity 0.3s ease;
  color: white;
}

.file-card:hover .file-card-overlay {
  opacity: 1;
}

.file-thumb :deep(.arco-icon) {
  width: 48px;
  height: 48px;
  color: var(--primary-color);
}

.file-card-name {
  padding: 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
}

.file-card-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 0 16px 16px;
}

.file-card-actions :deep(.arco-btn) {
  font-size: 12px !important;
  height: 32px;
  padding: 0 12px !important;
  border-radius: 8px;
}

/* 错误状态 */
.error-state {
  text-align: center;
  padding: 80px 40px;
}

.error-state .error-icon {
  width: 80px;
  height: 80px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.error-state .error-icon :deep(.arco-icon) {
  width: 40px;
  height: 40px;
  color: #ef4444;
}

.error-state h2 {
  font-size: 24px;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.error-state p {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.8;
}

/* 空文件夹 */
.empty-folder {
  text-align: center;
  padding: 80px 40px;
}

.empty-folder :deep(.arco-icon) {
  font-size: 80px;
  color: #e5e7eb;
}

.empty-folder p {
  margin-top: 20px;
  font-size: 16px;
  color: #6b7280;
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
  background: #f9fafb;
  padding: 20px;
  border-radius: 12px;
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
@media (max-width: 768px) {
  .share-page {
    padding: 0;
    background: var(--bg-white);
  }

  .share-container {
    border-radius: 0;
    box-shadow: none;
  }

  .content-section {
    padding: 20px 16px;
  }

  .resource-card {
    padding: 14px !important;
    gap: 12px !important;
  }

  .resource-icon {
    width: 48px !important;
    height: 48px !important;
    border-radius: 12px !important;
  }

  .resource-icon :deep(.arco-icon) {
    width: 28px;
    height: 28px;
  }

  .resource-name {
    font-size: 16px;
  }

  .file-detail {
    padding: 14px;
    gap: 12px;
  }

  .file-preview-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
  }

  .file-preview-icon :deep(.arco-icon) {
    width: 28px;
    height: 28px;
  }

  .file-name {
    font-size: 16px;
  }

  .password-input-wrapper {
    flex-direction: column;
  }

  .password-input-wrapper :deep(.arco-input-wrapper) {
    width: 100%;
  }

  .submit-btn {
    width: 100%;
  }

  .download-button {
    width: 100%;
  }

  .file-card {
    border-radius: 12px;
  }

  .file-card-name {
    font-size: 12px;
    padding: 8px 10px;
  }

  .file-card-actions {
    padding: 0 8px 8px;
  }

  .file-card-actions :deep(.arco-btn) {
    font-size: 11px !important;
    height: 28px;
    padding: 0 8px !important;
  }
}

@media (max-width: 480px) {
  .share-page {
    padding: 0;
    background: var(--bg-white);
  }

  .share-container {
    max-width: 100%;
    border-radius: 0;
    box-shadow: none;
  }

  .content-section {
    padding: 16px;
  }

  .file-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 12px !important;
  }

  .file-card-icon :deep(.arco-icon) {
    width: 40px;
    height: 40px;
  }

  .file-card-name {
    font-size: 13px;
    padding: 12px;
  }
}

@media (max-width: 360px) {
  .file-grid {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }
}
</style>
