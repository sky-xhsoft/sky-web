<template>
  <div class="share-page">
    <div class="share-container">
      <!-- Logo和标题 -->
      <div class="share-header">
        <h1 class="share-title">文件分享</h1>
        <p class="share-subtitle">安全、便捷的文件分享服务</p>
      </div>

      <!-- 密码验证表单 -->
      <div v-if="!verified" class="password-form">
        <a-spin :loading="loading" tip="验证中...">
          <div class="form-content">
            <div class="share-info" v-if="shareInfo">
              <div class="file-icon">
                <icon-file v-if="shareInfo.resourceType === 'file'" :size="64" />
                <icon-folder v-else :size="64" />
              </div>
              <div class="file-name">{{ getResourceName() }}</div>
              <div class="file-meta">
                <span v-if="shareInfo.resourceType === 'file'">
                  {{ formatFileSize(getFileSize()) }}
                </span>
                <span class="sharer">分享者: {{ shareInfo.sharer }}</span>
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
            <div class="file-info">
              <div class="file-icon-large">
                <icon-file v-if="shareInfo.resourceType === 'file'" :size="80" />
                <icon-folder v-else :size="80" />
              </div>
              <div class="file-details">
                <h2 class="file-name-large">{{ getResourceName() }}</h2>
                <div class="file-meta-large">
                  <span v-if="shareInfo.resourceType === 'file'">
                    大小: {{ formatFileSize(getFileSize()) }}
                  </span>
                  <span>分享者: {{ shareInfo.sharer }}</span>
                  <span v-if="shareInfo.share.expireTime">
                    过期时间: {{ formatDate(shareInfo.share.expireTime) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="actions">
              <a-button
                  v-if="shareInfo.resourceType === 'file'"
                  type="primary"
                  size="large"
                  :loading="downloading"
                  @click="handleDownload"
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
                  <div class="file-card-icon">
                    <icon-folder v-if="item.type === 'folder'" :size="48" />
                    <icon-image v-else-if="getFileType(item.name) === 'image'" :size="48" />
                    <icon-video-camera v-else-if="getFileType(item.name) === 'video'" :size="48" />
                    <icon-music v-else-if="getFileType(item.name) === 'audio'" :size="48" />
                    <icon-file-pdf v-else-if="getFileType(item.name) === 'pdf'" :size="48" />
                    <icon-file v-else :size="48" />
                  </div>
                  <div class="file-card-name" :title="item.name">{{ item.name }}</div>
                  <div class="file-card-info">
                    <span v-if="item.type === 'file'">{{ formatFileSize(item.size) }}</span>
                    <span v-else>文件夹</span>
                  </div>
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
                <icon-folder :size="64" style="color: #d1d5db;" />
                <p>此文件夹为空</p>
              </div>
            </a-spin>
          </div>
        </a-spin>
      </div>

      <!-- 错误提示 -->
      <div v-if="notFound" class="error-message">
        <icon-exclamation-circle :size="64" />
        <h2>分享不存在或已失效</h2>
        <p>请检查分享链接是否正确，或联系分享者重新分享</p>
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
const currentFolderId = ref<number | undefined>(undefined) // 当前文件夹ID
const folderPath = ref<Array<{ id: number | undefined; name: string }>>([]) // 面包屑路径

// 预览相关
const previewVisible = ref(false)
const previewFile = ref<any>(null)
const previewType = ref<'image' | 'video' | 'audio' | 'pdf' | 'text' | 'unknown'>('unknown')
const previewUrl = ref<string>('') // 缓存的预览 URL

// 媒体元素的引用
const videoRef = ref<HTMLVideoElement | null>(null)
const audioRef = ref<HTMLAudioElement | null>(null)

// 获取资源名称
function getResourceName(): string {
  if (!shareInfo.value) return ''
  if (shareInfo.value.resourceType === 'file') {
    return shareInfo.value.file?.name || '文件'
  }
  return shareInfo.value.folder?.name || '文件夹'
}

// 获取文件大小
function getFileSize(): number {
  if (!shareInfo.value || shareInfo.value.resourceType !== 'file') return 0
  return shareInfo.value.file?.fileSize || 0
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 格式化日期
function formatDate(date: string): string {
  return new Date(date).toLocaleString('zh-CN')
}

// 加载分享信息
async function loadShareInfo() {
  loading.value = true
  error.value = ''
  try {
    const info = await getShareInfo(shareCode.value)
    console.log('初始加载分享信息:', info)
    shareInfo.value = info

    // 如果是公开分享，直接验证通过
    if (info.share.shareType === 'public') {
      console.log('公开分享，直接验证通过')
      verified.value = true

      // 如果是文件夹分享，自动加载文件夹内容
      if (info.resourceType === 'folder') {
        console.log('公开文件夹分享，开始加载内容')
        showFolderContent.value = true

        // 初始化面包屑路径
        folderPath.value = [{ id: undefined, name: info.folder?.name || '根目录' }]
        currentFolderId.value = undefined

        await loadFolderContent()
      }
    } else {
      console.log('密码分享，需要验证密码')
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

// 验证密码
async function handleVerify() {
  if (!form.value.password.trim()) {
    error.value = '请输入访问密码'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const info = await accessShare(shareCode.value, form.value.password)
    console.log('验证成功，获取到的分享信息:', info)
    shareInfo.value = info
    verified.value = true
    Message.success('验证成功')

    // 如果是文件夹分享，自动加载文件夹内容
    if (info.resourceType === 'folder') {
      console.log('检测到文件夹分享，开始加载内容')
      showFolderContent.value = true

      // 初始化面包屑路径
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

// 下载文件
async function handleDownload() {
  if (!shareInfo.value || shareInfo.value.resourceType !== 'file') return

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

// 查看文件夹
async function handleViewFolder() {
  showFolderContent.value = true
  await loadFolderContent()
}

// 加载文件夹内容
async function loadFolderContent(parentId?: number) {
  loadingFiles.value = true
  try {
    // 如果 parentId 为 undefined，不传递参数（后端会使用分享的根文件夹ID）
    const content = await getShareFolderContent(shareCode.value, parentId)
    console.log('获取到的文件夹内容:', content)

    // 转换为表格数据格式
    const items: any[] = []

    // 添加文件夹
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

    // 添加文件
    if (content.files && content.files.length > 0) {
      content.files.forEach((file: any) => {
        items.push({
          id: file.id,
          name: file.name || file.fileName,
          type: 'file',
          size: file.fileSize || 0,
          updateTime: file.updateTime || '',
        })
      })
    }

    console.log('转换后的表格数据:', items)
    console.log('当前文件夹ID:', currentFolderId.value)
    console.log('面包屑路径:', folderPath.value)
    folderFiles.value = items
  } catch (e: any) {
    console.error('加载文件夹内容失败:', e)
    Message.error(e?.message || '加载文件夹内容失败')
  } finally {
    loadingFiles.value = false
  }
}

// 导航到指定文件夹
async function navigateToFolder(folderId?: number, folderName?: string) {
  console.log('导航到文件夹:', folderId, folderName)

  // 如果点击的是面包屑，需要更新路径
  if (folderName === undefined) {
    // 点击面包屑导航
    const pathIndex = folderPath.value.findIndex(item => item.id === folderId)
    if (pathIndex !== -1) {
      // 截断路径到点击的位置
      folderPath.value = folderPath.value.slice(0, pathIndex + 1)
      currentFolderId.value = folderId
    }
  } else {
    // 进入子文件夹
    folderPath.value.push({ id: folderId, name: folderName })
    currentFolderId.value = folderId
  }

  console.log('更新后的路径:', folderPath.value)
  console.log('当前文件夹ID:', currentFolderId.value)

  // 加载文件夹内容
  await loadFolderContent(currentFolderId.value)
}

// 判断文件类型
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

// 判断文件是否可预览
function canPreview(fileName: string): boolean {
  const type = getFileType(fileName)
  return ['image', 'video', 'audio', 'pdf', 'text'].includes(type)
}

// 获取文件预览URL
function getFilePreviewUrl(fileId: number): string {
  // 使用相对路径，开发环境会通过 Vite 代理
  return `/api/v1/cloud/shares/${shareCode.value}/files/${fileId}/preview`
}

// 获取文件下载URL
function getFileDownloadUrl(fileId: number): string {
  // 使用相对路径，开发环境会通过 Vite 代理
  return `/api/v1/cloud/shares/${shareCode.value}/files/${fileId}/download`
}

// 预览文件
function handlePreviewFile(file: any) {
  if (!canPreview(file.name)) {
    Message.warning('该文件类型不支持预览')
    return
  }

  previewFile.value = file
  previewType.value = getFileType(file.name)
  previewUrl.value = getFilePreviewUrl(file.id) // 缓存预览 URL
  previewVisible.value = true
}

// 关闭预览
function closePreview() {
  try {
    // 停止视频播放并释放资源
    if (videoRef.value) {
      videoRef.value.pause()
      videoRef.value.currentTime = 0
      videoRef.value.src = ''
      videoRef.value.load()
    }

    // 停止音频播放并释放资源
    if (audioRef.value) {
      audioRef.value.pause()
      audioRef.value.currentTime = 0
      audioRef.value.src = ''
      audioRef.value.load()
    }
  } catch (error) {
    console.warn('关闭预览时清理媒体资源失败:', error)
  }

  // 立即关闭 Modal
  previewVisible.value = false

  // 使用 nextTick 确保 Modal 开始关闭后再清理数据
  nextTick(() => {
    previewFile.value = null
    previewType.value = 'unknown'
    previewUrl.value = ''
  })
}

// 处理文件点击
function handleFileClick(file: any) {
  if (canPreview(file.name)) {
    handlePreviewFile(file)
  } else {
    handleDownloadFile(file)
  }
}

// 下载文件
function handleDownloadFile(file: any) {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.share-container {
  width: 100%;
  max-width: 1200px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.share-header {
  text-align: center;
  padding: 40px 20px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.share-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px;
}

.share-subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.password-form {
  padding: 40px;
  text-align: center;
}

.form-content {
  max-width: 400px;
  margin: 0 auto;
}

.share-info {
  text-align: center;
  margin-bottom: 30px;
}

.file-icon {
  color: #667eea;
  margin-bottom: 16px;
}

.file-name {
  font-size: 18px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 8px;
  word-break: break-all;
}

.file-meta {
  font-size: 14px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sharer {
  color: #667eea;
}

.share-content {
  padding: 40px;
}

.content-header {
  margin-bottom: 30px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.file-icon-large {
  color: #667eea;
  flex-shrink: 0;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name-large {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px;
  word-break: break-all;
}

.file-meta-large {
  font-size: 14px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.actions {
  display: flex;
  gap: 12px;
}

.folder-content {
  margin-top: 30px;
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
}

.breadcrumb {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  padding: 8px 0;
}

@media (max-width: 768px) {
  .file-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }
}

@media (min-width: 1024px) {
  .file-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 20px;
  }
}

.file-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
  background: white;
}

.file-card:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.file-card.clickable {
  cursor: pointer;
}

.file-card.clickable:hover {
  background: #f9fafb;
}

.file-card-icon {
  color: #667eea;
  margin-bottom: 12px;
}

.file-card-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  text-align: center;
  word-break: break-word;
  margin-bottom: 8px;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.file-card-info {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.file-card-actions {
  margin-top: 8px;
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
  padding: 16px;
  border-radius: 8px;
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
  padding: 60px 20px;
  color: #9ca3af;
}

.empty-folder p {
  margin-top: 16px;
  font-size: 14px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-item.clickable {
  cursor: pointer;
  transition: color 0.2s;
}

.file-item.clickable:hover {
  color: #667eea;
}

.file-item.clickable:hover span {
  text-decoration: underline;
}

.error-message {
  text-align: center;
  padding: 60px 40px;
  color: #6b7280;
}

.error-message h2 {
  font-size: 20px;
  color: #1f2937;
  margin: 20px 0 12px;
}

.error-message p {
  font-size: 14px;
  margin: 0;
}
</style>
