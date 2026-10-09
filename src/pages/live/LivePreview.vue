<template>
  <div class="live-preview-page">
    <div class="preview-wrap">
      <!-- 页头：与直播间详情一致 -->
      <div class="preview-head">
        <div class="head-main">
          <div class="head-crumb">
            <span class="head-link" @click="goBack">直播间管理</span>
            <span>/</span>
            <span>直播预览</span>
          </div>
          <div class="head-title-row">
            <h1 class="head-title">{{ title }}</h1>
            <span class="live-status"><span class="live-dot" />直播中</span>
          </div>
        </div>
        <V2Button type="secondary" @click="goBack">
          <template #icon>
            <icon-left />
          </template>
          返回
        </V2Button>
      </div>

      <!-- 左侧播放器（16:9），右侧流信息面板，两侧等高；窄屏上下排列 -->
      <div class="preview-content">
        <div class="player-box">
          <video
            :key="playerKey"
            id="player-container-id"
            class="player-video"
            preload="auto"
            playsinline
            webkit-playsinline
          ></video>
        </div>

        <div class="stream-info">
          <div class="info-title">流信息</div>
          <div class="detail-rows">
            <span class="dt-label">流名称</span>
            <span class="dt-value">{{ streamInfo.streamName }}</span>
            <span class="dt-label">应用名称</span>
            <span class="dt-value">{{ streamInfo.appName }}</span>
            <span class="dt-label">播放域名</span>
            <span class="dt-value">{{ streamInfo.playDomain }}</span>
          </div>

          <div class="info-divider" />

          <div class="info-title">播放地址</div>
          <div class="url-list">
            <div v-for="item in urlItems" :key="item.label" class="url-item">
              <span class="url-label">{{ item.label }}</span>
              <span :class="item.primary ? 'url-text' : 'url-value'" :title="item.url">{{ item.url || '-' }}</span>
              <icon-copy v-if="item.url" class="copy-icon" @click="copyToClipboard(item.url)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconLeft, IconCopy } from '@arco-design/web-vue/es/icon'
import { useNavigationStore } from '@/stores/navigation'
import { generatePlayURL } from '@/api/live'
import { V2Button } from '@/components/ui'
import dayjs from 'dayjs'

const navigationStore = useNavigationStore()

// Props
const props = defineProps<{
  streamName: string
  appName: string
  playDomain: string
  /** 直播间名称（从直播间页面进入时传入），用作页面标题 */
  roomName?: string
}>()

// 播放器实例
let player: any = null

// 用于强制重新渲染 video 元素的 key
const playerKey = ref(0)

// 流信息
const streamInfo = ref({
  streamName: props.streamName || '',
  appName: props.appName || 'live',
  playDomain: props.playDomain || ''
})

// 播放地址（播放器使用 FLV）
const playUrl = ref('')
const hlsUrl = ref('')
const rtmpUrl = ref('')

const title = computed(() => props.roomName || `流 ${streamInfo.value.streamName}`)

const urlItems = computed(() => [
  { label: 'HTTP-FLV', url: playUrl.value, primary: true },
  { label: 'HLS', url: hlsUrl.value, primary: false },
  { label: 'RTMP', url: rtmpUrl.value, primary: false },
])

// 生成播放地址
const generatePlayUrl = async () => {
  try {
    const expireTime = dayjs().add(7, 'day').unix()
    const response = await generatePlayURL({
      playDomain: streamInfo.value.playDomain || 'play.skyzhou.cn',
      appName: streamInfo.value.appName,
      streamName: streamInfo.value.streamName,
      playKey: '',
      expireTime: expireTime
    })

    if (response.data?.data) {
      // 使用 flv 地址
      playUrl.value = response.data.data.flv || ''
      hlsUrl.value = response.data.data.hls || ''
      rtmpUrl.value = response.data.data.rtmp || ''
    } else {
      Message.error('获取播放地址失败')
      // 使用默认地址
      playUrl.value = `http://${streamInfo.value.playDomain || 'play.skyzhou.cn'}/${streamInfo.value.appName}/${streamInfo.value.streamName}.flv`
    }
  } catch (error: any) {
    console.error('生成播放地址失败:', error)
    Message.error(error.message || '生成播放地址失败')
    // 使用默认地址
    playUrl.value = `http://${streamInfo.value.playDomain || 'play.skyzhou.cn'}/${streamInfo.value.appName}/${streamInfo.value.streamName}.flv`
  }
}

// 销毁播放器
const destroyPlayer = () => {
  if (player) {
    try {
      player.pause && player.pause()
    } catch {
      // 忽略
    }
    try {
      player.dispose && player.dispose()
    } catch (e) {
      console.error('播放器dispose失败:', e)
    }
    player = null
  }

  // 清空 video 元素
  const videoElement = document.getElementById('player-container-id') as HTMLVideoElement
  if (videoElement) {
    videoElement.pause()
    videoElement.removeAttribute('src')
    videoElement.load()
    // 移除所有子元素
    while (videoElement.firstChild) {
      videoElement.removeChild(videoElement.firstChild)
    }
  }

  // 查找并移除 TCPlayer 创建的额外元素
  const playerWrapper = document.querySelector('.player-box')
  if (playerWrapper) {
    const children = playerWrapper.querySelectorAll('div, video')
    children.forEach(child => {
      if (child.id !== 'player-container-id') {
        child.remove()
      }
    })
  }
}

// 初始化播放器
const initPlayer = () => {
  try {
    // 先确保销毁旧的播放器
    destroyPlayer()

    // 更新 key，强制重新渲染 video 元素
    playerKey.value++

    // 检查 TCPlayer 是否已加载
    if (typeof (window as any).TCPlayer === 'undefined') {
      Message.error('播放器加载失败，请刷新页面重试')
      return
    }

    // 检查播放地址是否为空
    if (!playUrl.value) {
      Message.error('播放地址为空')
      return
    }

    // 等待一下 DOM 更新
    setTimeout(() => {
      // 创建播放器实例
      player = (window as any).TCPlayer('player-container-id', {
        sources: [{
          src: playUrl.value
        }],
        licenseUrl: 'https://1401565388.trtcube-license.cn/license/v2/1401565388_1/v_cube.license',
        autoplay: true,
        controls: true,
        width: '100%',
        height: '100%',
        // 不按宽度自适应高度，由 .player-box 控制高度
        fluid: false,
        language: 'zh-CN',
        plugins: {
          ContinuePlay: {
            auto: true
          }
        }
      })
    }, 100)

  } catch (error) {
    console.error('播放器初始化失败:', error)
    Message.error('播放器初始化失败')
  }
}

// 返回
const goBack = () => {
  // 先销毁播放器
  destroyPlayer()
  // 直接导航到直播间列表页面
  navigationStore.navigateTo('LiveRoomList', '直播间管理', {}, false)
}

// 复制到剪贴板
const copyToClipboard = (text: string) => {
  if (!text) return

  // 先检查 navigator.clipboard 是否可用
  if (navigator.clipboard && window.isSecureContext) {
    // 在安全上下文（HTTPS）中使用新 API
    navigator.clipboard.writeText(text)
      .then(() => {
        Message.success('已复制到剪贴板')
      })
      .catch(() => {
        fallbackCopy(text)
      })
  } else {
    // 在非安全上下文（HTTP）或不支持的浏览器中使用降级方案
    fallbackCopy(text)
  }
}

// 降级方案：使用传统方法复制
const fallbackCopy = (text: string) => {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
    Message.success('已复制到剪贴板')
  } catch {
    Message.error('复制失败')
  } finally {
    document.body.removeChild(textarea)
  }
}

// 组件挂载
onMounted(() => {
  // 延迟初始化，确保 DOM 已渲染
  setTimeout(async () => {
    await generatePlayUrl()
    initPlayer()
  }, 100)
})

// 组件卸载前清理
onBeforeUnmount(() => {
  destroyPlayer()
})
</script>

<style scoped>
.live-preview-page {
  padding: 8px;
  height: 100%;
  overflow-y: auto;
}

.preview-wrap {
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
}

.head-main {
  flex: 1;
  min-width: 0;
}

.head-crumb {
  display: flex;
  gap: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.head-link {
  color: var(--brand-blue);
  cursor: pointer;
}

.head-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.head-title {
  margin: 0;
  overflow: hidden;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.live-status {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: var(--error-bg);
  color: var(--error);
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: currentColor;
  animation: v2-pulse 1.6s infinite;
}

@keyframes v2-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.preview-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 12px;
  align-items: stretch;
}

.player-box {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.player-box video,
.player-box :deep(.video-js) {
  width: 100% !important;
  height: 100% !important;
}

.player-box video {
  object-fit: contain;
}

.stream-info {
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  font-size: 13px;
}

.info-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.detail-rows {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 8px 12px;
}

.dt-label {
  color: var(--text-tertiary);
}

.dt-value {
  min-width: 0;
  word-break: break-all;
  color: var(--text-primary);
}

.info-divider {
  height: 1px;
  margin: 14px 0;
  background: var(--border-light);
}

.url-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.url-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-page);
  border-radius: var(--radius-md);
}

.url-label {
  flex-shrink: 0;
  width: 60px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.url-text,
.url-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.copy-icon {
  flex-shrink: 0;
  cursor: pointer;
  color: var(--text-tertiary);
  font-size: 14px;
}

.copy-icon:hover {
  color: var(--brand-blue);
}

@media (max-width: 1000px) {
  .preview-content {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>