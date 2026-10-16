<template>
  <div class="share-page">
    <header class="share-topbar">
      <span class="share-brand">{{ SHARE_BRAND }}</span>
      <div class="lang-switch" role="group" :aria-label="t('share.language')">
        <button type="button" :class="{ on: currentLang === 'zh' }" :aria-pressed="currentLang === 'zh'" @click="setLanguage('zh-CN')">中文</button>
        <button type="button" :class="{ on: currentLang === 'en' }" :aria-pressed="currentLang === 'en'" @click="setLanguage('en-US')">EN</button>
      </div>
    </header>

    <!-- 加载中 -->
    <main v-if="initialLoading" class="share-card gate">
      <div class="cover skeleton" />
      <div class="gate-body">
        <div class="sk-line w60" />
        <div class="sk-line w40" />
        <div class="sk-line h48" />
      </div>
    </main>

    <!-- 分享不存在或已失效 -->
    <main v-else-if="notFound" id="errorPage" class="share-card state">
      <icon-exclamation-circle :size="56" class="state-icon" />
      <h1>{{ t('share.notFound.title') }}</h1>
      <p>{{ t('share.notFound.desc') }}</p>
    </main>

    <!-- 私密分享：未登录或非同公司成员 -->
    <main v-else-if="restricted" id="restrictedPage" class="share-card state">
      <icon-lock :size="56" class="state-icon" />
      <h1>{{ t('share.privateTitle') }}</h1>
      <p>{{ restrictedMessage }}</p>
      <a-button v-if="restricted === 'login'" type="primary" size="large" @click="goLogin">{{ t('share.privateLogin') }}</a-button>
    </main>

    <!-- 提取码页 -->
    <main v-else-if="!verified" id="passwordPage" class="share-card gate">
      <img
        class="cover"
        src="/kv202610.jpg"
        width="1600"
        height="900"
        alt=""
        decoding="async"
        fetchpriority="high"
      >
      <div class="gate-body">
        <div class="sharer">{{ t('share.sharedBy', { name: SHARE_BRAND }) }}</div>
        <div v-if="shareInfo" class="resource-row">
          <span class="resource-icon" :class="resourceKind">
            <icon-folder v-if="shareInfo.resourceType === 'folder'" />
            <icon-file v-else />
          </span>
          <span class="resource-text">
            <span class="resource-name" :title="resourceName">{{ resourceName }}</span>
            <span class="resource-meta">{{ gateMeta }}</span>
          </span>
        </div>

        <form class="code-form" @submit.prevent="handleVerify">
          <label class="code-label" for="share-code">{{ t('share.password.label') }}</label>
          <div class="code-row">
            <a-input-password
              :input-attrs="{ id: 'share-code' }"
              ref="codeInputRef"
              v-model="form.password"
              :placeholder="t('share.password.placeholder')"
              :disabled="loading"
              :error="!!error"
              size="large"
              allow-clear
              autocomplete="off"
              class="code-input"
              @press-enter="handleVerify"
              @input="error = ''"
            />
            <a-button type="primary" size="large" html-type="submit" :loading="loading" class="code-submit">
              {{ t('share.password.accessBtn') }}
            </a-button>
          </div>
          <div v-if="error" class="code-error" role="alert">{{ error }}</div>
          <div v-else class="code-hint">{{ t('share.password.hint') }}</div>
        </form>
      </div>
    </main>

    <!-- 分享内容 -->
    <main v-else id="filesPage" class="share-content">
      <section class="content-head">
        <span class="resource-icon lg" :class="resourceKind">
          <icon-folder v-if="shareInfo?.resourceType === 'folder'" />
          <icon-file v-else />
        </span>
        <div class="head-text">
          <h1 class="head-title" :title="resourceName">{{ resourceName }}</h1>
          <div class="head-meta">
            <span>{{ t('share.sharedBy', { name: SHARE_BRAND }) }}</span>
            <span v-for="m in contentMeta" :key="m">{{ m }}</span>
          </div>
        </div>
        <a-button
          v-if="shareInfo?.resourceType === 'file'"
          type="primary"
          size="large"
          :loading="downloading"
          @click="handleDownload"
        >
          <template #icon><icon-download /></template>
          {{ t('share.actions.download') }}
        </a-button>
      </section>

      <!-- 文件夹 -->
      <template v-if="shareInfo?.resourceType === 'folder'">
        <div v-if="folderPath.length > 1 || (!featured && folderFiles.length > 0)" class="folder-bar">
          <nav v-if="folderPath.length > 1" class="crumbs" aria-label="breadcrumb">
            <template v-for="(item, index) in folderPath" :key="index">
              <span v-if="index > 0" class="crumb-sep">/</span>
              <button
                v-if="index < folderPath.length - 1"
                type="button"
                class="crumb"
                @click="navigateToFolder(item.id)"
              >{{ item.name }}</button>
              <span v-else class="crumb current">{{ item.name }}</span>
            </template>
          </nav>
          <span v-else />
          <div v-if="!featured && folderFiles.length > 0" class="view-switch" role="group">
            <button type="button" :class="{ on: viewMode === 'grid' }" :aria-pressed="viewMode === 'grid'" @click="setViewMode('grid')">{{ t('share.view.grid') }}</button>
            <button type="button" :class="{ on: viewMode === 'list' }" :aria-pressed="viewMode === 'list'" @click="setViewMode('list')">{{ t('share.view.list') }}</button>
          </div>
        </div>

        <div v-if="loadingFiles" class="file-grid">
          <div v-for="n in 4" :key="n" class="file-card"><div class="thumb skeleton" /><div class="sk-line w60" /></div>
        </div>

        <!-- 只有一个可播放视频：直接内嵌播放 -->
        <section v-else-if="featured" class="featured">
          <video
            class="featured-video"
            controls
            playsinline
            preload="metadata"
            :src="mediaUrl(featured)"
          >{{ t('share.browserNotSupportVideo') }}</video>
          <div class="featured-bar">
            <div class="featured-text">
              <div class="featured-name" :title="featured.displayName">{{ featured.displayName }}</div>
              <div class="featured-meta">{{ formatFileSize(featured.size) }}</div>
            </div>
            <a-button type="primary" size="large" @click="handleDownloadFile(featured)">
              <template #icon><icon-download /></template>
              {{ t('share.actions.downloadItem') }}
            </a-button>
          </div>
        </section>

        <div v-else-if="folderFiles.length === 0" class="share-card state slim">
          <icon-folder :size="48" class="state-icon muted" />
          <p>{{ t('share.empty') }}</p>
        </div>

        <!-- 网格 -->
        <div v-else-if="viewMode === 'grid'" class="file-grid">
          <article
            v-for="item in folderFiles"
            :key="item.type + item.id"
            class="file-card"
          >
            <button type="button" class="thumb" :aria-label="item.displayName" @click="openItem(item)">
              <img v-if="isImage(item) && hasAccessUrl(item)" :src="getAccessUrl(item)" :alt="item.displayName" loading="lazy" decoding="async">
              <video v-else-if="isVideo(item) && hasAccessUrl(item)" muted playsinline preload="none" :data-lazy="getAccessUrl(item)" />
              <span v-else class="thumb-icon" :class="iconKind(item)">
                <component :is="iconFor(item)" />
              </span>
              <span v-if="isVideo(item)" class="play-badge"><icon-play-arrow-fill /></span>
            </button>
            <div class="file-name" :title="item.displayName">{{ item.displayName }}</div>
            <div class="file-foot">
              <span class="file-size">{{ item.type === 'folder' ? t('share.resource.folder') : formatFileSize(item.size) }}</span>
              <button v-if="item.type === 'file'" type="button" class="icon-btn" :aria-label="t('share.actions.downloadItem')" @click="handleDownloadFile(item)">
                <icon-download />
              </button>
            </div>
          </article>
        </div>

        <!-- 列表 -->
        <ul v-else class="file-list">
          <li v-for="item in folderFiles" :key="item.type + item.id" class="file-row">
            <button type="button" class="row-main" @click="openItem(item)">
              <span class="thumb-icon sm" :class="iconKind(item)"><component :is="iconFor(item)" /></span>
              <span class="row-name" :title="item.displayName">{{ item.displayName }}</span>
            </button>
            <span class="row-size">{{ item.type === 'folder' ? '' : formatFileSize(item.size) }}</span>
            <span class="row-actions">
              <button v-if="item.type === 'file' && canPreview(item.name)" type="button" class="text-btn" @click="handlePreviewFile(item)">{{ t('share.actions.preview') }}</button>
              <button v-if="item.type === 'file'" type="button" class="text-btn" @click="handleDownloadFile(item)">{{ t('share.actions.downloadItem') }}</button>
            </span>
          </li>
        </ul>
      </template>

    </main>

    <!-- 文件预览 -->
    <a-modal
      v-model:visible="previewVisible"
      :title="previewFile?.displayName || previewFile?.name"
      :width="previewType === 'image' ? 'min(1000px, 94vw)' : 'min(1200px, 96vw)'"
      unmount-on-close
      :footer="false"
      modal-class="share-preview-modal"
      @cancel="closePreview"
    >
      <div class="preview-container">
        <img v-if="previewType === 'image'" class="preview-image" :src="previewUrl" :alt="previewFile?.displayName || ''">
        <video v-else-if="previewType === 'video'" ref="videoRef" class="preview-video" controls autoplay playsinline :src="previewUrl">{{ t('share.browserNotSupportVideo') }}</video>
        <audio v-else-if="previewType === 'audio'" ref="audioRef" controls autoplay :src="previewUrl" style="width: 100%">{{ t('share.browserNotSupportAudio') }}</audio>
        <iframe v-else-if="previewType === 'pdf'" :src="previewUrl" class="preview-pdf" />
        <pre v-else-if="previewType === 'text'" class="preview-text">{{ previewFile?.content || t('share.loading') }}</pre>
      </div>
      <div class="preview-actions">
        <a-button @click="closePreview">{{ t('share.close') }}</a-button>
        <a-button v-if="previewFile" type="primary" @click="handleDownloadFile(previewFile)">
          <template #icon><icon-download /></template>
          {{ t('share.actions.downloadItem') }}
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import {
  IconFile,
  IconFolder,
  IconDownload,
  IconExclamationCircle,
  IconLock,
  IconImage,
  IconVideoCamera,
  IconMusic,
  IconFilePdf,
  IconPlayArrowFill
} from '@arco-design/web-vue/es/icon'
import { getShareInfo, accessShare, downloadShareFile, getShareDownloadUrl, getShareFolderContent } from '@/modules/cloud/api/share'
import type { ShareInfo } from '@/modules/cloud/types'
import { useAuthStore } from '@/stores/auth'
import { formatFileSize, formatDate } from '@/utils/format'
import { getFileType, canPreview, hasAccessUrl, getAccessUrl, getFilePreviewUrl, getFileDownloadUrl } from '@/composables/useShareFileUtils'

// 分享页展示的分享方名称（当前分享都来自同一客户，后端 sharer 为登录用户名，不适合对外展示）
const SHARE_BRAND = 'Chery International'
const VIEW_MODE_KEY = 'share.viewMode'

interface ShareItem {
  id: number
  name: string          // 带扩展名的完整文件名，用于类型判断与下载
  displayName: string   // 展示用名称
  type: 'file' | 'folder'
  size: number
  updateTime: string
  storageType: string
  accessUrl: string
  fileExt: string
  content?: string
}

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const shareCode = ref(route.params.code as string)

// 分享页面向外部访客，默认英文（提取码页和文件列表都是）；页内切换只在本页生效，离开时恢复原语言，不改用户保存的语言设置
const previousLocale = locale.value
locale.value = 'en-US'

const currentLang = computed(() => (locale.value === 'zh-CN' ? 'zh' : 'en'))
function setLanguage(lang: 'zh-CN' | 'en-US') {
  locale.value = lang
}

const initialLoading = ref(true)
const loading = ref(false)
const downloading = ref(false)
// 加密分享验证提取码后签发的访问凭证（有效期 2 小时），下载/预览/浏览文件夹时携带
const accessToken = ref('')
const loadingFiles = ref(false)
const verified = ref(false)
const notFound = ref(false)
// 私密分享受限：login = 需要登录，deny = 已登录但不是分享者所在公司的成员
const restricted = ref<'' | 'login' | 'deny'>('')
const restrictedMessage = ref('')
const error = ref('')

const form = ref({ password: '' })
const codeInputRef = ref<any>(null)

const shareInfo = ref<ShareInfo | null>(null)
const folderFiles = ref<ShareItem[]>([])
const currentFolderId = ref<number | undefined>(undefined)
const folderPath = ref<Array<{ id: number | undefined; name: string }>>([])

const viewMode = ref<'grid' | 'list'>(readViewMode())

const previewVisible = ref(false)
const previewFile = ref<ShareItem | null>(null)
const previewType = ref<'image' | 'video' | 'audio' | 'pdf' | 'text' | 'unknown'>('unknown')
const previewUrl = ref<string>('')

const videoRef = ref<HTMLVideoElement | null>(null)
const audioRef = ref<HTMLAudioElement | null>(null)
let videoObserver: IntersectionObserver | null = null

const resourceName = computed(() => {
  const info = shareInfo.value
  if (!info) return ''
  if (info.resourceType === 'file') return info.file?.name || t('share.resource.file')
  return info.folder?.name || t('share.resource.folder')
})

const resourceKind = computed(() => {
  const info = shareInfo.value
  if (!info || info.resourceType === 'folder') return 'k-folder'
  return 'k-' + kindOfName(info.file?.name || '')
})

const expireText = computed(() => {
  const exp = shareInfo.value?.share.expireTime
  return exp ? t('share.meta.expires', { time: formatDate(exp) }) : t('share.meta.forever')
})

const downloadsLeftText = computed(() => {
  const s = shareInfo.value?.share
  if (!s || !s.maxDownloads) return ''
  return t('share.meta.downloadsLeft', { n: Math.max(0, s.maxDownloads - (s.downloadCount || 0)) })
})

// 提取码页资源说明：文件显示大小，文件夹只显示类型（目录统计在验证后才可见）
const gateMeta = computed(() => {
  const info = shareInfo.value
  if (!info) return ''
  const parts = [info.resourceType === 'file' ? formatFileSize(info.file?.fileSize || 0) : t('share.resource.folder'), expireText.value]
  return parts.filter(Boolean).join(' · ')
})

const contentMeta = computed(() => {
  const info = shareInfo.value
  if (!info) return []
  const parts: string[] = []
  if (info.resourceType === 'file') parts.push(formatFileSize(info.file?.fileSize || 0))
  else if (!loadingFiles.value) parts.push(t('share.meta.items', { n: folderFiles.value.length }, folderFiles.value.length))
  parts.push(expireText.value)
  if (downloadsLeftText.value) parts.push(downloadsLeftText.value)
  return parts
})

// 当前目录只有一个视频（且有可访问地址或可走预览接口）时直接内嵌播放
const featured = computed<ShareItem | null>(() => {
  if (folderFiles.value.length !== 1) return null
  const only = folderFiles.value[0]
  return only.type === 'file' && isVideo(only) ? only : null
})

function kindOfName(name: string): string {
  const k = getFileType(name)
  return k === 'unknown' || k === 'text' ? 'doc' : k
}

function isImage(item: ShareItem) {
  return item.type === 'file' && getFileType(item.name) === 'image'
}

function isVideo(item: ShareItem) {
  return item.type === 'file' && getFileType(item.name) === 'video'
}

function iconKind(item: ShareItem) {
  return item.type === 'folder' ? 'k-folder' : 'k-' + kindOfName(item.name)
}

function iconFor(item: ShareItem) {
  if (item.type === 'folder') return IconFolder
  switch (getFileType(item.name)) {
    case 'image': return IconImage
    case 'video': return IconVideoCamera
    case 'audio': return IconMusic
    case 'pdf': return IconFilePdf
    default: return IconFile
  }
}

function mediaUrl(item: ShareItem) {
  const url = getAccessUrl(item)
  return hasAccessUrl(item) ? url : getFilePreviewUrl(shareCode.value, item.id, accessToken.value)
}

function readViewMode(): 'grid' | 'list' {
  try {
    return localStorage.getItem(VIEW_MODE_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

function setViewMode(mode: 'grid' | 'list') {
  viewMode.value = mode
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode)
  } catch {
    // 无痕模式等禁用存储时忽略
  }
  if (mode === 'grid') nextTick(initVideoLazyLoad)
}

function initVideoLazyLoad() {
  videoObserver?.disconnect()
  videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const video = entry.target as HTMLVideoElement
        const lazySrc = video.getAttribute('data-lazy')
        if (lazySrc) {
          // 只加载元数据，用首帧作为封面
          video.preload = 'metadata'
          video.src = lazySrc + '#t=0.5'
          video.removeAttribute('data-lazy')
        }
        videoObserver?.unobserve(video)
      })
    },
    { rootMargin: '200px 0px', threshold: 0.01 }
  )
  document.querySelectorAll('.share-page video[data-lazy]').forEach((v) => videoObserver?.observe(v))
}

function enterContent(info: ShareInfo) {
  verified.value = true
  if (info.resourceType === 'folder') {
    folderPath.value = [{ id: undefined, name: info.folder?.name || t('share.root') }]
    currentFolderId.value = undefined
    loadFolderContent()
  }
}

async function loadShareInfo() {
  loading.value = true
  error.value = ''
  try {
    const info = await getShareInfo(shareCode.value)
    shareInfo.value = info
    // 公开分享直接可看；私密分享能取到信息即说明已通过同公司校验，并已签发访问凭证
    if (info.share.shareType === 'public' || info.share.shareType === 'private') {
      accessToken.value = info.accessToken || ''
      enterContent(info)
    } else {
      nextTick(() => codeInputRef.value?.focus?.())
    }
  } catch (e: any) {
    console.error('获取分享信息失败:', e)
    const errorMessage = e?.message || ''
    if (e?.response?.status === 403) {
      restricted.value = authStore.isAuthenticated ? 'deny' : 'login'
      restrictedMessage.value = errorMessage
      return
    }
    if (e?.response?.status === 404 || errorMessage.includes('分享不存在') || errorMessage.includes('已失效') || errorMessage.includes('30001')) {
      notFound.value = true
    } else {
      Message.error(t('share.getShareInfoFailed'))
    }
  } finally {
    loading.value = false
    initialLoading.value = false
  }
}

function goLogin() {
  router.push({ path: '/login', query: { redirect: route.fullPath } })
}

/**
 * 访问凭证缺失或过期（后端返回 403）：回到提取码页重新验证
 */
function handleAccessExpired(e: any): boolean {
  if (e?.status !== 403 && e?.response?.status !== 403) return false
  accessToken.value = ''
  if (shareInfo.value?.share.shareType === 'private') {
    loadShareInfo()
    return true
  }
  verified.value = false
  error.value = t('share.expired')
  nextTick(() => codeInputRef.value?.focus?.())
  return true
}

async function handleVerify() {
  if (loading.value) return
  if (!form.value.password.trim()) {
    error.value = t('share.error.passwordRequired')
    return
  }
  loading.value = true
  error.value = ''
  try {
    const info = await accessShare(shareCode.value, form.value.password.trim())
    shareInfo.value = info
    accessToken.value = info.accessToken || ''
    enterContent(info)
  } catch (e: any) {
    console.error('访问分享失败:', e)
    error.value = t('share.password.error')
  } finally {
    loading.value = false
  }
}

function clickDownloadLink(href: string, filename: string, newTab: boolean) {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  if (newTab) {
    link.rel = 'noopener'
    link.target = '_blank'
  } else {
    link.style.display = 'none'
  }
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function handleDownload() {
  if (!shareInfo.value || shareInfo.value.resourceType !== 'file') return
  downloading.value = true
  try {
    // 先由后端校验并计入下载次数（达到上限会报错），再用返回的直链下载
    const { url } = await getShareDownloadUrl(shareCode.value, accessToken.value)
    const filename = shareInfo.value.file?.name || `file-${Date.now()}`
    if (url) {
      clickDownloadLink(url, filename, true)
    } else {
      // 没有直链：走后端流式下载（该接口自己计数）
      await downloadShareFile(shareCode.value, filename, accessToken.value)
    }
    Message.success(t('share.downloadStarted'))
  } catch (e: any) {
    console.error('下载失败:', e)
    if (handleAccessExpired(e)) return
    Message.error(e?.message || t('share.downloadFailed'))
  } finally {
    downloading.value = false
  }
}

async function handleDownloadFile(file: ShareItem) {
  try {
    const { url } = await getShareDownloadUrl(shareCode.value, accessToken.value, file.id)
    if (url) {
      clickDownloadLink(url, file.name, true)
    } else {
      clickDownloadLink(getFileDownloadUrl(shareCode.value, file.id, accessToken.value), file.name, false)
    }
    Message.success(t('share.downloadStarted'))
  } catch (e: any) {
    console.error('下载失败:', e)
    if (handleAccessExpired(e)) return
    Message.error(e?.message || t('share.downloadFailed'))
  }
}

/** 后端文件名可能已带扩展名，只有不带时才补，避免出现 a.mp4.mp4 */
function fullFileName(baseName: string, fileExt: string): string {
  if (!fileExt) return baseName
  return baseName.toLowerCase().endsWith(fileExt.toLowerCase()) ? baseName : baseName + fileExt
}

async function loadFolderContent(parentId?: number) {
  loadingFiles.value = true
  try {
    const content = await getShareFolderContent(shareCode.value, parentId, accessToken.value)
    const items: ShareItem[] = []
    ;(content.folders || []).forEach((folder: any) => {
      items.push({
        id: folder.id,
        name: folder.name,
        displayName: folder.name,
        type: 'folder',
        size: 0,
        updateTime: folder.updateTime || '',
        storageType: '',
        accessUrl: '',
        fileExt: '',
      })
    })
    ;(content.files || []).forEach((file: any) => {
      const baseName = file.name || file.Name || file.fileName || file.FileName || ''
      let fileExt = file.fileExt || file.FileExt || ''
      if (fileExt && !fileExt.startsWith('.')) fileExt = '.' + fileExt
      const name = fullFileName(baseName, fileExt)
      items.push({
        id: file.id || file.ID || 0,
        name,
        displayName: name,
        type: (file.type || file.Type || 'file') === 'folder' ? 'folder' : 'file',
        size: file.fileSize || file.FileSize || file.size || file.Size || 0,
        updateTime: file.updateTime || file.UpdateTime || file.createTime || file.CreateTime || '',
        storageType: file.storageType || file.StorageType || '',
        accessUrl: file.accessUrl || file.accessURL || file.AccessURL || file.AccessUrl || '',
        fileExt,
      })
    })
    folderFiles.value = items
  } catch (e: any) {
    console.error('加载文件夹内容失败:', e)
    if (handleAccessExpired(e)) return
    Message.error(e?.message || t('share.getShareInfoFailed'))
  } finally {
    loadingFiles.value = false
    nextTick(initVideoLazyLoad)
  }
}

async function navigateToFolder(folderId?: number, folderName?: string) {
  if (folderName === undefined) {
    const pathIndex = folderPath.value.findIndex((item) => item.id === folderId)
    if (pathIndex !== -1) folderPath.value = folderPath.value.slice(0, pathIndex + 1)
  } else {
    folderPath.value.push({ id: folderId, name: folderName })
  }
  currentFolderId.value = folderId
  await loadFolderContent(folderId)
}

function openItem(item: ShareItem) {
  if (item.type === 'folder') {
    navigateToFolder(item.id, item.name)
  } else if (canPreview(item.name)) {
    handlePreviewFile(item)
  } else {
    handleDownloadFile(item)
  }
}

function handlePreviewFile(file: ShareItem) {
  if (!canPreview(file.name)) {
    Message.warning(t('share.previewNotSupport'))
    return
  }
  previewFile.value = file
  previewType.value = getFileType(file.name)
  previewUrl.value = mediaUrl(file)
  previewVisible.value = true
}

function closePreview() {
  for (const media of [videoRef.value, audioRef.value]) {
    try {
      if (media) {
        media.pause()
        media.removeAttribute('src')
        media.load()
      }
    } catch (err) {
      console.warn('关闭预览时清理媒体资源失败:', err)
    }
  }
  previewVisible.value = false
  nextTick(() => {
    previewFile.value = null
    previewType.value = 'unknown'
    previewUrl.value = ''
  })
}

// 浏览器标签显示分享名称
watch(resourceName, (name) => {
  if (name) document.title = `${name} · ${SHARE_BRAND}`
})

onMounted(() => {
  if (!shareCode.value) {
    notFound.value = true
    initialLoading.value = false
    return
  }
  loadShareInfo()
})

onUnmounted(() => {
  videoObserver?.disconnect()
  videoObserver = null
  locale.value = previousLocale
})
</script>

<style scoped>
.share-page {
  --sp-bg: #f3f5f8;
  --sp-card: #ffffff;
  --sp-border: #e3e7ed;
  --sp-text: #16191f;
  --sp-sub: #5a6270;
  --sp-accent: var(--brand-blue, #165dff);
  min-height: 100vh;
  background: var(--sp-bg);
  color: var(--sp-text);
  font-family: var(--font-family, system-ui, sans-serif);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px 48px;
  box-sizing: border-box;
}

/* 顶栏 */
.share-topbar {
  width: 100%;
  max-width: 1120px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 0;
}

.share-brand {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.lang-switch,
.view-switch {
  display: inline-flex;
  padding: 3px;
  border-radius: 8px;
  background: #e8ebf0;
}

.lang-switch button,
.view-switch button {
  min-width: 48px;
  height: 30px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--sp-sub);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.lang-switch button.on,
.view-switch button.on {
  background: #ffffff;
  color: var(--sp-text);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(15, 22, 35, 0.08);
}

/* 卡片 */
.share-card {
  width: 100%;
  max-width: 720px;
  background: var(--sp-card);
  border: 1px solid var(--sp-border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(15, 22, 35, 0.06);
}

.cover {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: #0f3b8c;
}

.gate-body {
  padding: 24px 28px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sharer {
  font-size: 13px;
  color: var(--sp-sub);
}

.resource-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: -8px;
}

.resource-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 22px;
}

.resource-icon.lg {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  font-size: 28px;
}

.k-folder { background: #fff4e0; color: #b25e00; }
.k-video { background: #fff1e8; color: #b4430a; }
.k-image { background: #e8f0ff; color: #0e44c2; }
.k-audio { background: #f2ecff; color: #5b3cc4; }
.k-pdf { background: #fdecec; color: #b42318; }
.k-doc { background: #eef0f3; color: #5a6270; }

.resource-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.resource-name {
  font-size: 17px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-meta {
  font-size: 13px;
  color: var(--sp-sub);
}

.code-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.code-label {
  font-size: 13px;
  font-weight: 600;
}

.code-row {
  display: flex;
  gap: 10px;
}

.code-input {
  flex: 1;
  min-width: 0;
}

.code-input {
  height: 48px;
  border-radius: 10px;
}

.code-input :deep(.arco-input) {
  font-size: 16px;
  letter-spacing: 0.08em;
}

.code-submit {
  height: 48px;
  min-width: 120px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
}

.code-error {
  font-size: 13px;
  color: #b42318;
}

.code-hint {
  font-size: 12px;
  color: var(--sp-sub);
}

/* 状态页 */
.state {
  margin-top: 8vh;
  padding: 48px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.state.slim {
  margin-top: 0;
  max-width: none;
  box-shadow: none;
}

.state h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.state p {
  margin: 0;
  font-size: 14px;
  color: var(--sp-sub);
  max-width: 420px;
}

.state-icon {
  color: #e8590c;
}

.state-icon.muted {
  color: #b8bec8;
}

/* 内容页 */
.share-content {
  width: 100%;
  max-width: 1120px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.content-head {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 20px 24px;
  background: var(--sp-card);
  border: 1px solid var(--sp-border);
  border-radius: 16px;
}

.head-text {
  flex: 1 1 260px;
  min-width: 0;
}

.head-title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.head-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 13px;
  color: var(--sp-sub);
}

.folder-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  min-height: 36px;
}

.crumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 14px;
  min-width: 0;
}

.crumb {
  border: 0;
  background: transparent;
  padding: 4px 6px;
  border-radius: 6px;
  font: inherit;
  color: var(--sp-accent);
  cursor: pointer;
}

.crumb:hover {
  background: #e8f0ff;
}

.crumb.current {
  color: var(--sp-text);
  font-weight: 600;
  cursor: default;
}

.crumb-sep {
  color: #b8bec8;
}

/* 单视频内嵌 */
.featured {
  background: var(--sp-card);
  border: 1px solid var(--sp-border);
  border-radius: 16px;
  overflow: hidden;
}

.featured-video {
  display: block;
  width: 100%;
  max-height: 72vh;
  aspect-ratio: 16 / 9;
  background: #0f1623;
}

.featured-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px 20px;
}

.featured-text {
  flex: 1 1 200px;
  min-width: 0;
}

.featured-name {
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.featured-meta {
  font-size: 13px;
  color: var(--sp-sub);
  margin-top: 2px;
}

/* 网格 */
.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}

.file-card {
  background: var(--sp-card);
  border: 1px solid var(--sp-border);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}

.file-card:hover {
  border-color: #c8d3e6;
  box-shadow: 0 6px 16px rgba(15, 22, 35, 0.08);
}

.thumb {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 4 / 3;
  border: 0;
  padding: 0;
  background: #f5f6f8;
  cursor: pointer;
  overflow: hidden;
}

.thumb img,
.thumb video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.thumb-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.thumb-icon.sm {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  font-size: 18px;
  flex-shrink: 0;
}

.play-badge {
  position: absolute;
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background: rgba(15, 22, 35, 0.6);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.file-name {
  padding: 10px 12px 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
  min-height: 39px;
}

.file-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px 8px 12px;
  font-size: 12px;
  color: var(--sp-sub);
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--sp-accent);
  font-size: 18px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: #e8f0ff;
}

/* 列表 */
.file-list {
  list-style: none;
  margin: 0;
  padding: 0;
  background: var(--sp-card);
  border: 1px solid var(--sp-border);
  border-radius: 12px;
  overflow: hidden;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-top: 1px solid #eef0f3;
}

.file-row:first-child {
  border-top: 0;
}

.row-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 0;
  background: transparent;
  padding: 4px 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.row-name {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-size {
  width: 90px;
  font-size: 13px;
  color: var(--sp-sub);
  text-align: right;
  flex-shrink: 0;
}

.row-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.text-btn {
  height: 32px;
  padding: 0 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--sp-accent);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.text-btn:hover {
  background: #e8f0ff;
}

/* 骨架屏 */
.skeleton,
.sk-line {
  background: linear-gradient(90deg, #eef0f3 25%, #f6f7f9 50%, #eef0f3 75%);
  background-size: 200% 100%;
  animation: sk 1.2s ease-in-out infinite;
}

.cover.skeleton {
  aspect-ratio: 16 / 9;
}

.sk-line {
  height: 14px;
  border-radius: 6px;
}

.file-card .sk-line {
  margin: 12px;
}

.sk-line.w60 { width: 60%; }
.sk-line.w40 { width: 40%; }
.sk-line.h48 { height: 48px; border-radius: 10px; }

@keyframes sk {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

/* 预览弹窗 */
.preview-container {
  display: flex;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 72vh;
  object-fit: contain;
}

.preview-video {
  width: 100%;
  max-height: 72vh;
  background: #0f1623;
}

.preview-pdf {
  width: 100%;
  height: 72vh;
  border: 0;
}

.preview-text {
  width: 100%;
  max-height: 72vh;
  overflow: auto;
  margin: 0;
  padding: 12px;
  background: #f5f6f8;
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-all;
}

.preview-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

/* 手机 */
@media (max-width: 640px) {
  .share-page {
    padding: 0 12px 32px;
  }

  .share-topbar {
    padding: 12px 0;
  }

  .share-card {
    border-radius: 12px;
  }

  .gate-body {
    padding: 20px 18px 24px;
  }

  .code-row {
    flex-direction: column;
  }

  .code-submit {
    width: 100%;
  }

  .content-head {
    padding: 16px;
    gap: 12px;
  }

  .content-head :deep(.arco-btn) {
    width: 100%;
  }

  .head-title,
  .resource-name {
    font-size: 18px;
    white-space: normal;
    word-break: break-word;
  }

  .file-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .row-size {
    display: none;
  }

  .featured-bar :deep(.arco-btn) {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton,
  .sk-line {
    animation: none;
  }
}
</style>
