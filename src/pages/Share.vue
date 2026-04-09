<template>
  <div class="share-page">
    <div class="share-container">
      <!-- 头部区域 -->
      <div class="share-header">
        <div class="logo-section">
          <div class="logo-icon">
            <icon-share-alt :size="32" />
          </div>
          <div class="logo-text">
            <h1 class="share-title">云盘分享</h1>
            <p class="share-subtitle">安全便捷的文件分享服务</p>
          </div>
        </div>
      </div>

      <!-- 密码验证表单 -->
      <div v-if="!verified" class="password-form">
        <a-spin :loading="loading" tip="验证中...">
          <div class="form-content">
            <div class="resource-preview" v-if="shareInfo">
              <div class="resource-icon">
                <icon-file v-if="shareInfo.resourceType === 'file'" :size="72" />
                <icon-folder v-else :size="72" />
              </div>
              <div class="resource-info">
                <div class="resource-name">{{ getResourceName() }}</div>
                <div class="resource-meta">
                  <span v-if="shareInfo.resourceType === 'file'">
                    {{ formatFileSize(getFileSize()) }}
                  </span>
                  <span class="sharer-info">分享者: {{ shareInfo.sharer }}</span>
                </div>
              </div>
            </div>

            <a-form :model="form" layout="vertical" @submit="handleVerify">
              <a-form-item
                  field="password"
                  label="访问密码"
                  :rules="[{ required: true, message: '请输入访问密码' }]"
                  :validate-status="error ? 'error' : undefined"
                  :help="error"
              >
                <a-input-password
                    v-model="form.password"
                    placeholder="请输入访问密码"
                    size="large"
                    allow-clear
                    @press-enter="handleVerify"
                >
                  <template #prefix>
                    <icon-lock />
                  </template>
                </a-input-password>
              </a-form-item>

              <a-button type="primary" html-type="submit" long size="large" :loading="loading">
                <template #icon>
                  <icon-unlock />
                </template>
                访问分享
              </a-button>
            </a-form>
          </div>
        </a-spin>
      </div>

      <!-- 分享内容展示 -->
      <div v-else class="share-content">
        <a-spin :loading="loading">
          <div class="content-header">
            <div class="file-detail">
              <div class="file-preview">
                <div class="file-preview-icon">
                  <icon-file v-if="shareInfo.resourceType === 'file'" :size="88" />
                  <icon-folder v-else :size="88" />
                </div>
              </div>
              <div class="file-info">
                <h2 class="file-name">{{ getResourceName() }}</h2>
                <div class="file-meta">
                  <span v-if="shareInfo.resourceType === 'file'">
                    <icon-file :size="14" /> {{ formatFileSize(getFileSize()) }}
                  </span>
                  <span>
                    <icon-user :size="14" /> {{ shareInfo.sharer }}
                  </span>
                  <span v-if="shareInfo.share.expireTime">
                    <icon-clock-circle :size="14" /> {{ formatDate(shareInfo.share.expireTime) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="action-section" v-if="shareInfo.resourceType === 'file'">
              <a-button
                  type="primary"
                  size="large"
                  :loading="downloading"
                  @click="handleDownload"
                  class="download-button"
              >
                <template #icon>
                  <icon-download />
                </template>
                下载文件
              </a-button>
            </div>
          </div>

          <!-- 文件夹内容列表 -->
          <div v-if="shareInfo.resourceType === 'folder'" class="folder-content">
            <!-- 面包屑导航 -->
            <div class="breadcrumb" v-if="folderPath.length > 0">
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
            <a-spin :loading="loadingFiles">
              <div class="file-grid">
                <div
                    v-for="item in folderFiles"
                    :key="item.id"
                    class="file-card"
                    :class="{ 'clickable': item.type === 'folder' || canPreview(item.name) }"
                    @click="item.type === 'folder' ? navigateToFolder(item.id, item.name) : handleFileClick(item)"
                >
                  <!-- 图片预览 -->
                  <div v-if="item.type === 'file' && hasAccessUrl(item) && getFileType(item.name) === 'image'" class="file-card-preview">
                    <img :src="getAccessUrl(item)" :alt="item.name" />
                    <div class="file-card-overlay">
                      <icon-eye :size="32" />
                    </div>
                  </div>
                  <!-- 视频预览 -->
                  <div v-else-if="item.type === 'file' && hasAccessUrl(item) && getFileType(item.name) === 'video'" class="file-card-preview video-preview">
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
                  <div v-else class="file-card-icon">
                    <icon-folder v-if="item.type === 'folder'" :size="56" />
                    <icon-image v-else-if="getFileType(item.name) === 'image'" :size="56" />
                    <icon-video-camera v-else-if="getFileType(item.name) === 'video'" :size="56" />
                    <icon-music v-else-if="getFileType(item.name) === 'audio'" :size="56" />
                    <icon-file-pdf v-else-if="getFileType(item.name) === 'pdf'" :size="56" />
                    <icon-file v-else :size="56" />
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
                      预览
                    </a-button>
                    <a-button
                        type="outline"
                        size="small"
                        @click.stop="handleDownloadFile(item)"
                    >
                      <template #icon>
                        <icon-download />
                      </template>
                      下载
                    </a-button>
                  </div>
                </div>
              </div>
              <div v-if="folderFiles.length === 0" class="empty-folder">
                <icon-folder :size="80" style="color: #e5e7eb;" />
                <p>此文件夹为空</p>
              </div>
            </a-spin>
          </div>
        </a-spin>
      </div>

      <!-- 错误提示 -->
      <div v-if="notFound" class="error-message">
        <div class="error-icon">
          <icon-exclamation-circle :size="80" />
        </div>
        <div class="error-content">
          <h2>分享不存在或已失效</h2>
          <p>请检查分享链接是否正确，或联系分享者重新分享</p>
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
            您的浏览器不支持视频播放
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
            您的浏览器不支持音频播放
          </audio>
        </div>

        <!-- PDF预览 -->
        <div v-else-if="previewType === 'pdf'" class="preview-pdf">
          <iframe :src="previewUrl" style="width: 100%; height: 70vh; border: none;"></iframe>
        </div>

        <!-- 文本预览 -->
        <div v-else-if="previewType === 'text'" class="preview-text">
          <pre>{{ previewFile?.content || '加载中...' }}</pre>
        </div>
      </div>

      <template #footer>
        <a-space>
          <a-button @click="closePreview">关闭</a-button>
          <a-button
              v-if="previewFile"
              type="primary"
              @click="handleDownloadFile(previewFile)"
          >
            <template #icon>
              <icon-download />
            </template>
            下载
          </a-button>
        </a-space>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
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

const route = useRoute()
const shareCode = ref(route.params.code as string)

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
  return new Date(date).toLocaleString('zh-CN')
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
        folderPath.value = [{ id: undefined, name: info.folder?.name || '根目录' }]
        currentFolderId.value = undefined
        await loadFolderContent()
      }
    }
  } catch (e: any) {
    console.error('获取分享信息失败:', e)
    if (e?.response?.status === 404) {
      notFound.value = true
    } else {
      Message.error(e?.message || '获取分享信息失败')
    }
  } finally {
    loading.value = false
  }
}

async function handleVerify() {
  if (!form.value.password.trim()) {
    error.value = '请输入访问密码'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const info = await accessShare(shareCode.value, form.value.password)
    shareInfo.value = info
    verified.value = true
    Message.success('验证成功')

    if (info.resourceType === 'folder') {
      showFolderContent.value = true
      folderPath.value = [{ id: undefined, name: info.folder?.name || '根目录' }]
      currentFolderId.value = undefined
      await loadFolderContent()
    }
  } catch (e: any) {
    console.error('访问分享失败:', e)
    error.value = e?.message || '密码错误，请重试'
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
      Message.success('开始下载')
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
  } catch (e: any) {
    console.error('加载文件夹内容失败:', e)
    Message.error(e?.message || '加载文件夹内容失败')
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
    Message.warning('该文件类型不支持预览')
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
</script>

<style scoped>
.share-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.share-container {
  width: 100%;
  max-width: 900px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideIn 0.4s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.share-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32px 40px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.logo-text {
  flex: 1;
}

.share-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
}

.share-subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
  font-weight: 400;
}

.password-form {
  padding: 48px 40px;
  text-align: center;
}

.form-content {
  max-width: 450px;
  margin: 0 auto;
}

.resource-preview {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 40px;
  padding: 24px;
  background: linear-gradient(135deg, #f8f9ff 0%, #eef2ff 100%);
  border-radius: 16px;
  border: 1px solid #e5e7eb;
}

.resource-icon {
  color: #667eea;
  flex-shrink: 0;
}

.resource-info {
  flex: 1;
  text-align: left;
}

.resource-name {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  word-break: break-all;
}

.resource-meta {
  font-size: 14px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sharer-info {
  color: #667eea;
  font-weight: 500;
}

.share-content {
  padding: 40px;
}

.content-header {
  margin-bottom: 40px;
}

.file-detail {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #f8f9ff 0%, #eef2ff 100%);
  border-radius: 16px;
  border: 1px solid #e5e7eb;
}

.file-preview {
  flex-shrink: 0;
}

.file-preview-icon {
  color: #667eea;
}

.file-info {
  flex: 1;
}

.file-name {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px;
  word-break: break-all;
  line-height: 1.3;
}

.file-meta {
  font-size: 14px;
  color: #6b7280;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.file-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-section {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.download-button {
  width: 200px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
}

.folder-content {
  margin-top: 40px;
  border-top: 2px solid #f3f4f6;
  padding-top: 32px;
}

.breadcrumb {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
}

.file-grid {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 20px;
  padding: 8px 0;
}

@media (min-width: 641px) {
  .file-grid {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}

@media (min-width: 1025px) {
  .file-grid {
    grid-template-columns: repeat(4, 1fr) !important;
  }
}

@media (min-width: 1441px) {
  .file-grid {
    grid-template-columns: repeat(6, 1fr) !important;
  }
}

.file-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  transition: all 0.3s ease;
  background: white;
  overflow: hidden;
  position: relative;
}

.file-card:hover {
  border-color: #667eea;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  transform: translateY(-4px);
}

.file-card.clickable {
  cursor: pointer;
}

.file-card.clickable:hover {
  background: #f9fafb;
}

.file-card-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f3f4f6;
}

.file-card-preview.video-preview {
  aspect-ratio: 16/9;
}

.file-card-preview img,
.file-card-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.file-card:hover .file-card-preview img {
  transform: scale(1.05);
}

.file-card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: white;
}

.file-card:hover .file-card-overlay {
  opacity: 1;
}

.file-card-icon {
  color: #667eea;
  margin: 20px 0 16px;
}

.file-card-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  text-align: center;
  word-break: break-word;
  margin: 16px 16px 12px;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.file-card-actions {
  margin: 12px 0 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

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

.empty-folder {
  text-align: center;
  padding: 80px 20px;
  color: #9ca3af;
}

.empty-folder p {
  margin-top: 20px;
  font-size: 16px;
  color: #6b7280;
}

.error-message {
  text-align: center;
  padding: 80px 40px;
  color: #9ca3af;
}

.error-icon {
  color: #f53f3f;
  margin-bottom: 24px;
}

.error-content h2 {
  font-size: 24px;
  color: #1f2937;
  margin: 0 0 12px;
  font-weight: 700;
}

.error-content p {
  font-size: 15px;
  color: #6b7280;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .share-page {
    padding: 16px;
  }

  .share-header {
    padding: 24px 24px;
  }

  .share-title {
    font-size: 24px !important;
  }

  .password-form,
  .share-content {
    padding: 32px 24px;
  }

  .resource-preview,
  .file-detail {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }

  .resource-info,
  .file-info {
    text-align: center;
  }

  .file-name {
    font-size: 20px !important;
  }

  .file-meta {
    justify-content: center;
  }

  .file-grid {
    grid-template-columns: 1fr !important;
  }

  .breadcrumb {
    font-size: 13px;
    padding: 12px;
  }
}
</style>