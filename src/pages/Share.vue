<template>
  <div class="share-page">
    <!-- 语言切换按钮 -->
    <div class="language-switcher">
      <a-dropdown @select="handleLanguageChange">
        <a-button type="text" class="lang-btn">
          {{ currentLang === 'zh-CN' ? '中文' : 'EN' }}
          <icon-down />
        </a-button>
        <template #content>
          <a-doption value="zh-CN">中文</a-doption>
          <a-doption value="en-US">English</a-doption>
        </template>
      </a-dropdown>
    </div>

    <!-- 密码验证阶段 -->
    <div v-if="!verified" class="password-wrapper">
      <div class="password-container">
        <a-spin :loading="loading" tip="{{ $t('share.verifying') }}">
          <div class="form-content">
            <!-- 顶部 Logo -->
            <div class="top-logo">
              <img src="https://wcwl.cn/wcwl.png" alt="WCWL" />
            </div>

            <!-- 预览图 -->
            <div class="cover-preview" v-if="shareInfo">
              <img v-if="shareInfo.cover" :src="shareInfo.cover" :alt="projectTitle" />
              <div v-else class="cover-placeholder">
                <img src="https://wcwl.cn/sample-cover.jpg" alt="preview" />
              </div>
            </div>

            <!-- 标题信息 -->
            <div class="title-section" v-if="shareInfo">
              <h1 class="main-title">{{ projectTitle }}</h1>
              <p class="sub-title">{{ $t('share.fromSharer', { name: shareInfo.sharer || 'unknown' }) }}</p>
            </div>

            <!-- 密码输入框 -->
            <a-form :model="form" layout="vertical" @submit="handleVerify" class="password-form">
              <div class="password-input-wrapper">
                <a-input
                    v-model="form.password"
                    :placeholder="$t('share.password.placeholder')"
                    size="large"
                    class="password-input"
                    @press-enter="handleVerify"
                />
                <a-button
                    type="primary"
                    html-type="submit"
                    :loading="loading"
                    class="submit-btn"
                >
                  <icon-arrow-right />
                </a-button>
              </div>
              <div v-if="error" class="error-text">{{ error }}</div>
            </a-form>
          </div>
        </a-spin>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="notFound" class="error-message">
      <div class="error-icon">
        <icon-exclamation-circle :size="80" />
      </div>
      <div class="error-content">
        <h2>{{ $t('share.notFound.title') }}</h2>
        <p>{{ $t('share.notFound.desc') }}</p>
      </div>
    </div>

    <!-- 已验证 - 视频分享页面（PC 三栏布局） -->
    <template v-else-if="isDesktop">
      <div class="pc-layout">
        <!-- 左侧 - 视频列表 -->
        <div class="left-sidebar">
          <div class="sidebar-header">
            <div class="project-title">{{ projectTitle }}</div>
            <a-icon-trigger class="collapse-trigger" @click="leftCollapsed = !leftCollapsed">
              <icon-menu-unfold v-if="leftCollapsed" />
              <icon-menu-fold v-else />
            </a-icon-trigger>
          </div>

          <div v-show="!leftCollapsed" class="video-list-container">
            <!-- 过滤工具栏 -->
            <div class="filter-bar">
              <a-button type="text" size="small">
                {{ $t('filters.tag') }}
                <icon-caret-down />
              </a-button>
              <a-button type="text" size="small">
                {{ $t('filters.date') }}
                <icon-caret-down />
              </a-button>
              <a-button type="text" size="small">
                {{ $t('filters.sort') }}
                <icon-caret-down />
              </a-button>
              <div class="filter-spacer"></div>
              <a-button type="primary" size="small" @click="downloadCurrent">
                <icon-download />
                {{ $t('player.download') }}
              </a-button>
              <a-tag :color="currentVideo?.grade === 'good' ? 'arcoblue' : 'gray'">
                {{ currentVideo?.grade === 'good' ? $t('player.good') : '' }}
              </a-tag>
            </div>

            <!-- 视频列表 -->
            <div class="video-list">
              <div
                  v-for="(video, index) in videoList"
                  :key="video.id"
                  class="video-item"
                  :class="{ active: currentIndex === index }"
                  @click="selectVideo(index, video)"
              >
                <div class="video-thumbnail">
                  <img v-if="video.thumbnail" :src="video.thumbnail" :alt="video.name" />
                  <div v-else class="thumbnail-placeholder">
                    <icon-video-camera :size="32" color="#9ca3af" />
                  </div>
                  <div class="duration-badge" v-if="video.duration">
                    {{ formatDuration(video.duration) }}
                  </div>
                  <div class="grade-badge" v-if="video.grade === 'good'">
                    <a-badge :dot="true" status="success" />
                    <span>{{ $t('player.good') }}</span>
                  </div>
                </div>
                <div class="video-info">
                  <div class="video-name">{{ video.name }}</div>
                  <div class="video-meta" v-if="video.date">{{ video.date }}</div>
                </div>
                <icon-right />
              </div>
            </div>
          </div>
        </div>

        <!-- 中间 - 播放器 -->
        <div class="main-player">
          <!-- 顶部布局工具栏 -->
          <div class="player-toolbar">
            <a-space>
              <a-button
                  v-for="(layout, key) in layoutOptions"
                  :key="key"
                  :type="currentLayout === key ? 'primary' : 'text'"
                  size="small"
                  @click="currentLayout = key"
              >
                {{ $t(`layout.${key}`) }}
              </a-button>
            </a-space>
            <a-space>
              <a-button type="primary" size="small" @click="downloadCurrent">
                <icon-download />
                {{ $t('player.download') }}
              </a-button>
              <a-tag :color="currentVideo?.grade === 'good' ? 'arcoblue' : 'gray'">
                {{ currentVideo?.grade === 'good' ? $t('player.good') : '' }}
              </a-tag>
            </a-space>
          </div>

          <!-- 播放器区域 -->
          <div class="player-container">
            <video
              ref="videoRef"
              controls
              :src="currentVideoSrc"
              :poster="currentVideo?.thumbnail"
            >
              {{ $t('player.duration') }}
            </video>
            <div class="play-overlay" v-if="!playing" @click="togglePlay">
              <div class="play-button">
                <icon-play-circle :size="64" color="white" />
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧 - 信息面板 -->
        <div class="right-sidebar">
          <!-- 自定义信息 -->
          <div class="info-section">
            <div class="section-title">{{ $t('player.customInfo') }}</div>
            <div class="grade-stars">
              <span class="grade-label">Grade</span>
              <div class="stars">
                <icon-star v-for="i in 5" :key="i" :color="i <= (currentVideo?.gradeValue || 0) ? '#e7c300' : '#9ca3af'" />
              </div>
            </div>
          </div>

          <!-- 录制信息 -->
          <div class="info-section">
            <div class="section-title">{{ $t('player.recordInfo') }}</div>
            <div class="info-grid">
              <div class="info-item">{{ $t('player.scene') }}</div>
              <div class="info-item">{{ $t('player.shoot') }}</div>
              <div class="info-item">{{ $t('player.take') }}</div>
            </div>
          </div>

          <!-- 基本信息 -->
          <div class="info-section">
            <div class="section-title">{{ $t('player.overview') }}</div>
            <div class="info-row">
              <span class="info-label">{{ $t('player.fileFormat') }}</span>
              <span class="info-value">{{ currentInfo.fileFormat }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('player.uploadUser') }}</span>
              <span class="info-value">{{ currentInfo.uploadUser }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('player.uploadTime') }}</span>
              <span class="info-value">{{ currentInfo.uploadTime }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('player.fileSize') }}</span>
              <span class="info-value">{{ currentInfo.fileSize }}</span>
            </div>

            <a-select
              v-model="currentInfo.acronym"
              :placeholder="$t('player.acronym')"
              :style="{ width: '100%', marginTop: '12px' }"
            >
              <a-select-option value="CH">{{ $t('player.acronym') }} - CH</a-select-option>
              <a-select-option value="EN">{{ $t('player.acronym') }} - EN</a-select-option>
            </a-select>

            <div class="info-row" style="margin-top: 12px;">
              <span class="info-label">{{ $t('player.audioFileNumber') }}</span>
              <a-button size="small" type="outline" style="margin-left: auto;">
                <icon-plus />
                {{ $t('player.add') }}
              </a-button>
            </div>

            <a-textarea
              v-model="currentInfo.remark"
              :placeholder="$t('player.remark')"
              :rows="3"
              style="margin-top: 12px;"
            />
          </div>

          <!-- 视频信息 -->
          <div class="info-section" v-if="currentVideo">
            <div class="section-title">{{ $t('player.videoInfo') }}</div>
            <div class="info-row">
              <span class="info-label">{{ $t('player.resolution') }}</span>
              <span class="info-value">{{ currentVideo.resolution || '1920 x 1080' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('player.frameRate') }}</span>
              <span class="info-value">{{ currentVideo.frameRate || '50 fps' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('player.duration') }}</span>
              <span class="info-value">{{ formatDuration(currentVideo.duration || 120) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('player.bitrate') }}</span>
              <span class="info-value">{{ currentVideo.bitrate || '4 Mbps' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('player.codec') }}</span>
              <span class="info-value">{{ currentVideo.codec || 'H264' }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 已验证 - 视频分享页面（Mobile 布局） -->
    <template v-else>
      <div class="mobile-layout">
        <!-- 顶部项目标题 -->
        <div class="mobile-header">
          <div class="mobile-logo">
            <div class="logo-icon">
              <img src="https://wcwl.cn/wcwl.png" alt="logo" />
            </div>
            <div class="project-name">{{ projectTitle }}</div>
          </div>
        </div>

        <!-- 播放器 -->
        <div class="mobile-player">
          <video
            ref="videoRefMobile"
            controls
            :src="currentVideoSrc"
            :poster="currentVideo?.thumbnail"
          >
            您的浏览器不支持视频播放
          </video>
        </div>

        <!-- 标签栏 -->
        <div class="tag-scroll">
          <div class="tag-list">
            <a-tag
                v-for="(tag, index) in tags"
                :key="index"
                :color="activeTagIndex === index ? 'arcoblue' : 'default'"
                class="tag-item"
                @click="activeTagIndex = index"
            >
              {{ tag }}
            </a-tag>
            <a-button type="text" class="filter-btn">
              <icon-filter />
            </a-button>
          </div>
        </div>

        <!-- 视频网格列表 -->
        <div class="mobile-video-grid">
          <div
              v-for="(video, index) in videoList"
              :key="video.id"
              class="mobile-video-card"
              :class="{ active: currentIndex === index }"
              @click="selectVideo(index, video)"
          >
            <div class="card-thumbnail">
              <img v-if="video.thumbnail" :src="video.thumbnail" :alt="video.name" />
              <div v-else class="thumbnail-placeholder">
                <icon-video-camera :size="40" color="#9ca3af" />
              </div>
              <div class="duration-badge" v-if="video.duration">
                {{ formatDuration(video.duration) }}
              </div>
              <div class="grade-badge" v-if="video.grade === 'good'">
                <a-badge :dot="true" status="success" />
                <span>{{ $t('player.good') }}</span>
              </div>
            </div>
            <div class="card-info">
              <div class="card-name">{{ video.name }}</div>
              <icon-right />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import {
  IconFile,
  IconFolder,
  IconLock,
  IconDownload,
  IconExclamationCircle,
  IconShareAlt,
  IconUnlock,
  IconDown,
  IconCaretDown,
  IconRight,
  IconArrowRight,
  IconDownload as IconDownload2,
  IconMenuFold,
  IconMenuUnfold,
  IconPlus,
  IconFilter,
  IconStar,
  IconPlayCircle,
  IconVideoCamera
} from '@arco-design/web-vue/es/icon'
import { changeLanguage, getCurrentLanguage } from '@/locales'
import { getShareInfo, accessShare, downloadShareFile, getShareFolderContent } from '@/modules/cloud/api/share'
import type { ShareInfo } from '@/modules/cloud/types'

const { t, locale } = useI18n()
const route = useRoute()
const shareCode = ref(route.params.code as string)

// 响应式布局检测
const isDesktop = ref(window.innerWidth > 700)
const currentLang = ref(getCurrentLanguage())

// 密码验证状态
const loading = ref(false)
const downloading = ref(false)
const verified = ref(false)
const notFound = ref(false)
const error = ref('')

const form = ref({
  password: '',
})

const shareInfo = ref<ShareInfo | null>(null)

// 播放器状态
const playing = ref(false)
const leftCollapsed = ref(false)
const currentLayout = ref('mono')
const layoutOptions = {
  mono: 'mono',
  dual: 'dual',
  quad: 'quad',
  'multi': 'multi',
  overlay: 'overlay'
}

// 视频列表
const currentIndex = ref(0)
const videoList = ref([
  {
    id: 1,
    name: 'recorder_2024-10-20-10-42-35',
    thumbnail: '',
    duration: 120,
    date: '10-20 02:00',
    grade: 'good',
    gradeValue: 5,
    resolution: '1920 x 1080',
    frameRate: '50 fps',
    bitrate: '4 Mbps',
    codec: 'H264',
    url: ''
  },
])

// 标签
const tags = ref(['Chery', '品质', 'KO', '奇迹', 'OJ', '机场'])
const activeTagIndex = ref(0)

// 项目标题
const projectTitle = ref('Chery International UserSummit')

// 当前视频信息面板
const currentInfo = ref({
  fileFormat: 'MP4',
  uploadUser: 'chery international',
  uploadTime: '2024/10/20 10:44',
  fileSize: '',
  acronym: '',
  remark: ''
})

const videoRef = ref<HTMLVideoElement | null>(null)
const videoRefMobile = ref<HTMLVideoElement | null>(null)

// 计算当前视频
const currentVideo = computed(() => videoList.value[currentIndex.value])
const currentVideoSrc = computed(() => {
  if (!currentVideo.value || !currentVideo.value.url) {
    // 如果是分享文件夹，这里应该从后端获取实际视频地址
    // 暂时返回空，实际由后端返回
    return ''
  }
  return currentVideo.value.url
})

// 语言切换
function handleLanguageChange(key: string) {
  changeLanguage(key)
  currentLang.value = key
  locale.value = key
}

function getResourceName(): string {
  if (!shareInfo.value) return ''
  if (shareInfo.value.resourceType === 'file') {
    return shareInfo.value.file?.name || t('share.resource.file')
  }
  return shareInfo.value.folder?.name || t('share.resource.folder')
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

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

async function loadShareInfo() {
  loading.value = true
  error.value = ''
  try {
    const info = await getShareInfo(shareCode.value)
    shareInfo.value = info

    // 更新项目标题（从分享名称提取）
    if (info.share && info.share.name) {
      projectTitle.value = info.share.name
    } else if (info.folder && info.folder.name) {
      projectTitle.value = info.folder.name
    } else if (info.file && info.file.name) {
      projectTitle.value = info.file.name
    }

    if (info.share.shareType === 'public') {
      verified.value = true
      if (info.resourceType === 'folder') {
        await loadFolderContent()
      } else if (info.resourceType === 'file') {
        // 单个视频文件，直接加载
        const file = info.file
        if (file) {
          videoList.value = [{
            id: file.id,
            name: file.name,
            thumbnail: '',
            duration: Math.floor((file.fileSize || 0) / (4 * 1024 * 1024) * 60),
            date: new Date().toLocaleDateString(),
            grade: 'good',
            gradeValue: 5,
            resolution: '1920 x 1080',
            frameRate: '50 fps',
            bitrate: '4 Mbps',
            codec: 'H264',
            url: file.accessUrl || file.accessURL
          }]
          currentInfo.value = {
            fileFormat: 'MP4',
            uploadUser: info.sharer || 'unknown',
            uploadTime: new Date().toLocaleString(),
            fileSize: formatFileSize(file.fileSize || 0),
            acronym: '',
            remark: ''
          }
        }
      }
    }
  } catch (e: any) {
    console.error('获取分享信息失败:', e)
    if (e?.response?.status === 404) {
      notFound.value = true
    } else {
      Message.error(e?.message || t('messages.loadFailed'))
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
    Message.success(t('messages.verifySuccess'))

    if (info.resourceType === 'folder') {
      await loadFolderContent()
    } else if (info.resourceType === 'file') {
      const file = info.file
      if (file) {
        videoList.value = [{
          id: file.id,
          name: file.name,
          thumbnail: '',
          duration: Math.floor((file.fileSize || 0) / (4 * 1024 * 1024) * 60),
          date: new Date().toLocaleDateString(),
          grade: 'good',
          gradeValue: 5,
          resolution: '1920 x 1080',
          frameRate: '50 fps',
          bitrate: '4 Mbps',
          codec: 'H264',
          url: getAccessUrl(file)
        }]
        currentInfo.value = {
          fileFormat: 'MP4',
          uploadUser: info.sharer || 'unknown',
          uploadTime: new Date().toLocaleString(),
          fileSize: formatFileSize(file.fileSize || 0),
          acronym: '',
          remark: ''
        }
      }
    }
  } catch (e: any) {
    console.error('访问分享失败:', e)
    error.value = e?.message || t('share.password.error')
  } finally {
    loading.value = false
  }
}

function getAccessUrl(item: any): string {
  return item.accessUrl || item.accessURL || item.AccessURL
}

async function loadFolderContent(parentId?: number) {
  try {
    const content = await getShareFolderContent(shareCode.value, parentId)
    const items: any[] = []

    if (content.files && content.files.length > 0) {
      content.files.forEach((file: any) => {
        const baseName = file.name || file.Name || file.fileName || file.FileName || ''
        let fileExt = file.fileExt || file.FileExt || ''
        if (fileExt && !fileExt.startsWith('.')) {
          fileExt = '.' + fileExt
        }
        const fullName = baseName + fileExt

        // 判断是否是视频文件
        const ext = fileExt.toLowerCase()
        const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
        if (videoExts.includes(ext)) {
          items.push({
            id: file.id || file.ID || 0,
            name: fullName,
            thumbnail: '',
            duration: Math.floor((file.fileSize || 0) / (4 * 1024 * 1024) * 60) || 120,
            date: file.updateTime || file.createTime || '',
            grade: 'good', // 默认标记为good
            gradeValue: 5,
            resolution: '1920 x 1080',
            frameRate: '50 fps',
            bitrate: '4 Mbps',
            codec: 'H264',
            url: getAccessUrl(file)
          })
        }
      })
    }

    videoList.value = items
    if (items.length > 0) {
      currentInfo.value = {
        fileFormat: 'MP4',
        uploadUser: shareInfo.value?.sharer || 'unknown',
        uploadTime: new Date().toLocaleString(),
        fileSize: formatFileSize(items[0]?.duration * 4 * 1024 * 1024) || '',
        acronym: '',
        remark: ''
      }
    }
  } catch (e: any) {
    console.error('加载文件夹内容失败:', e)
    Message.error(e?.message || t('messages.loadFailed'))
  }
}

function selectVideo(index: number, video: any) {
  currentIndex.value = index
  playing.value = false
  currentInfo.value = {
    fileFormat: 'MP4',
    uploadUser: shareInfo.value?.sharer || 'unknown',
    uploadTime: video.date || new Date().toLocaleString(),
    fileSize: formatFileSize(video.duration * 4 * 1024 * 1024),
    acronym: '',
    remark: ''
  }

  // 自动播放
  nextTick(() => {
    const videoEl = isDesktop.value ? videoRef.value : videoRefMobile.value
    if (videoEl) {
      videoEl.play()
      playing.value = true
    }
  })
}

function downloadCurrent() {
  if (!currentVideo.value) return
  const url = currentVideo.value.url
  if (url && url.length > 0) {
    const link = document.createElement('a')
    link.href = url
    link.download = currentVideo.value.name
    link.rel = 'noopener'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    Message.success(t('share.actions.startDownload'))
    return
  }

  downloading.value = true
  downloadShareFile(
    shareCode.value,
    currentVideo.value.name
  ).finally(() => {
    downloading.value = false
  })
}

function togglePlay() {
  const videoEl = isDesktop.value ? videoRef.value : videoRefMobile.value
  if (videoEl) {
    if (playing.value) {
      videoEl.pause()
    } else {
      videoEl.play()
    }
    playing.value = !playing.value
  }
}

// 监听窗口大小变化
function handleResize() {
  isDesktop.value = window.innerWidth > 700
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  if (!shareCode.value) {
    notFound.value = true
    return
  }
  loadShareInfo()

  // 清理
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})

// 监听播放状态
watch(currentVideoSrc, () => {
  playing.value = false
})
</script>

<style scoped>
.share-page {
  width: 100vw;
  height: 100vh;
  background: #1a1a2e;
  color: #e5e7eb;
  overflow: hidden;
  position: relative;
}

.language-switcher {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1000;
}

.lang-btn {
  color: #e5e7eb !important;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
}

.lang-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
}

/* ========== 密码验证页面 ========== */
.password-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #12121a;
}

.password-container {
  width: 100%;
  height: 100%;
  max-width: 100%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.form-content {
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.top-logo {
  align-self: flex-start;
  margin-bottom: 8px;
}

.top-logo img {
  height: 48px;
  width: auto;
}

.cover-preview {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
}

.cover-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.cover-placeholder {
  width: 100%;
  aspect-ratio: 16/9;
  background: #1e1e2e;
  border-radius: 16px;
  overflow: hidden;
}

.cover-placeholder img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.title-section {
  width: 100%;
  text-align: center;
}

.main-title {
  font-size: 42px;
  font-weight: 500;
  color: #ffffff;
  margin: 0 0 12px;
  line-height: 1.3;
}

.sub-title {
  font-size: 28px;
  font-weight: 400;
  color: #888899;
  margin: 0;
  line-height: 1.4;
}

.password-form {
  width: 100%;
  margin-top: 16px;
}

.password-input-wrapper {
  display: flex;
  align-items: center;
  background: #1e1e2e;
  border-radius: 9999px;
  padding: 4px;
  overflow: hidden;
}

.password-input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 12px 24px;
  color: #fff;
  font-size: 24px;
}

.password-input :deep(.arco-input-inner) {
  background: transparent;
  color: #fff;
  font-size: 24px;
}

.password-input :deep(.arco-input-input) {
  background: transparent;
  color: #fff;
  font-size: 24px;
}

.submit-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  border: none;
  flex-shrink: 0;
}

.submit-btn:hover {
  background: #2563eb;
}

.error-text {
  color: #f87272;
  font-size: 14px;
  margin-top: 12px;
  text-align: center;
}

/* ========== PC 三栏布局 ========== */
.pc-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 左侧边栏 */
.left-sidebar {
  width: 260px;
  min-width: 260px;
  background: #161d31;
  border-right: 1px solid #2a2a3e;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.left-sidebar.collapsed {
  width: 48px;
  min-width: 48px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 12px 10px;
  border-bottom: 1px solid #2a2a3e;
  gap: 8px;
}

.project-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #e5e7eb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collapse-trigger {
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-trigger:hover {
  color: #e5e7eb;
}

.video-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.filter-bar {
  display: flex;
  align-items: center;
  padding: 8px 6px;
  gap: 4px;
  border-bottom: 1px solid #2a2a3e;
  flex-shrink: 0;
}

.filter-bar .arco-btn-text {
  color: #9ca3af;
  font-size: 12px;
  padding: 4px 8px;
}

.filter-bar .arco-btn-text:hover {
  color: #e5e7eb;
  background: rgba(255, 255, 255, 0.05);
}

.filter-spacer {
  flex: 1;
}

.video-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}

.video-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  margin-bottom: 6px;
  border-radius: 6px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.video-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.3);
}

.video-item.active {
  background: rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.video-thumbnail {
  width: 64px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  background: #2a2a3e;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a2a3e;
}

.duration-badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
}

.grade-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.7);
  color: #36d399;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.video-info {
  flex: 1;
  min-width: 0;
}

.video-name {
  font-size: 12px;
  color: #e5e7eb;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-meta {
  font-size: 11px;
  color: #9ca3af;
}

.video-item > .arco-icon {
  color: #6b7280;
  flex-shrink: 0;
  font-size: 14px;
}

/* 中间播放器 */
.main-player {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #0a0a0a;
  overflow: hidden;
}

.player-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #1a1a2e;
  border-bottom: 1px solid #2a2a3e;
  flex-shrink: 0;
}

.player-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.player-container video {
  max-width: 100%;
  max-height: 100%;
}

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.play-button {
  opacity: 0.8;
  transition: opacity 0.2s;
}

.play-overlay:hover .play-button {
  opacity: 1;
  transform: scale(1.1);
}

/* 右侧信息面板 */
.right-sidebar {
  width: 280px;
  min-width: 280px;
  background: #161d31;
  border-left: 1px solid #2a2a3e;
  padding: 12px;
  overflow-y: auto;
}

.info-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #e5e7eb;
  margin-bottom: 12px;
}

.grade-stars {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grade-label {
  font-size: 13px;
  color: #9ca3af;
}

.stars {
  display: flex;
  gap: 4px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.info-grid .info-item {
  text-align: center;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  font-size: 12px;
  color: #e5e7eb;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.info-label {
  font-size: 13px;
  color: #9ca3af;
  flex-shrink: 0;
}

.info-value {
  font-size: 13px;
  color: #e5e7eb;
  flex: 1;
  text-align: right;
}

/* ========== Mobile 布局 ========== */
.mobile-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
  overflow: hidden;
}

.mobile-header {
  padding: 8px 12px;
  background: #161d31;
  border-bottom: 1px solid #2a2a3e;
  flex-shrink: 0;
}

.mobile-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mobile-logo .logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  overflow: hidden;
  background: white;
}

.mobile-logo .logo-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.project-name {
  font-size: 22px;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-player {
  width: 100%;
  background: #000;
  flex-shrink: 0;
}

.mobile-player video {
  width: 100%;
  display: block;
}

.tag-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 8px 8px;
  background: #161d31;
  border-bottom: 1px solid #2a2a3e;
  flex-shrink: 0;
}

.tag-list {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag-item {
  flex-shrink: 0;
}

.filter-btn {
  color: #9ca3af;
  padding: 0 6px;
}

.mobile-video-grid {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.mobile-video-card {
  background: #161d31;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.mobile-video-card:hover {
  background: rgba(102, 126, 234, 0.1);
}

.mobile-video-card.active {
  border-color: #36d399;
}

.card-thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: #2a2a3e;
  overflow: hidden;
}

.card-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-info {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  gap: 6px;
}

.card-name {
  flex: 1;
  font-size: 14px;
  color: #e5e7eb;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-info > .arco-icon {
  color: #6b7280;
  font-size: 16px;
  flex-shrink: 0;
}

/* ========== 错误页面 ========== */
.error-message {
  text-align: center;
  padding: 80px 20px;
  color: #9ca3af;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.error-icon {
  color: #f87272;
  margin-bottom: 24px;
}

.error-content h2 {
  font-size: 24px;
  color: #e5e7eb;
  margin: 0 0 12px;
  font-weight: 700;
}

.error-content p {
  font-size: 15px;
  color: #9ca3af;
  line-height: 1.6;
}

/* ========== 滚动条样式 ========== */
.video-list::-webkit-scrollbar,
.right-sidebar::-webkit-scrollbar,
.mobile-video-grid::-webkit-scrollbar {
  width: 6px;
}

.video-list::-webkit-scrollbar-track,
.right-sidebar::-webkit-scrollbar-track,
.mobile-video-grid::-webkit-scrollbar-track {
  background: transparent;
}

.video-list::-webkit-scrollbar-thumb,
.right-sidebar::-webkit-scrollbar-thumb,
.mobile-video-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.video-list::-webkit-scrollbar-thumb:hover,
.right-sidebar::-webkit-scrollbar-thumb:hover,
.mobile-video-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.tag-scroll::-webkit-scrollbar {
  height: 4px;
}

.tag-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.tag-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
</style>
