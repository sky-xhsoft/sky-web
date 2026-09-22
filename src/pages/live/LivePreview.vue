<template>
  <div class="live-preview-page">
    <V2PageHeader title="直播预览" :description="streamInfo.streamName">
      <template #actions>
        <V2Tag type="success"><span class="live-dot" /> LIVE</V2Tag>
        <V2Button type="secondary" @click="goBack">
          <template #icon>
            <icon-left />
          </template>
          返回
        </V2Button>
      </template>
    </V2PageHeader>

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

      <V2Card class="stream-info">
        <div class="stream-title">流信息</div>
        <div class="detail-rows">
          <span class="dt-label">流名称</span>
          <span>{{ streamInfo.streamName }}</span>
          <span class="dt-label">应用名称</span>
          <span>{{ streamInfo.appName }}</span>
          <span class="dt-label">播放域名</span>
          <span>{{ streamInfo.playDomain }}</span>
          <span class="dt-label">播放地址</span>
          <span class="play-url">
            <span class="url-text">{{ playUrl }}</span>
            <icon-copy class="copy-icon" @click="copyToClipboard(playUrl)" />
          </span>
        </div>
      </V2Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconLeft, IconCopy } from '@arco-design/web-vue/es/icon'
import { useNavigationStore } from '@/stores/navigation'
import { generatePlayURL } from '@/api/live'
import { V2PageHeader, V2Button, V2Card, V2Tag } from '@/components/ui'
import dayjs from 'dayjs'

const navigationStore = useNavigationStore()

// Props
const props = defineProps<{
  streamName: string
  appName: string
  playDomain: string
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

// 播放地址
const playUrl = ref('')

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
        fluid: true,
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
  display: flex;
  flex-direction: column;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.player-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: rgba(0, 0, 0, 0.92);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.player-box video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.live-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--error);
  animation: v2-pulse 1.6s infinite;
}

@keyframes v2-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.stream-info {
  padding: 20px;
}

.stream-title {
  font-weight: 600;
  margin-bottom: 14px;
  color: var(--text-primary);
}

.detail-rows {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 10px 14px;
  font-size: 13px;
}

.dt-label {
  color: var(--text-tertiary);
}

.play-url {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.url-text {
  word-break: break-all;
}

.copy-icon {
  cursor: pointer;
  color: var(--text-tertiary);
  font-size: 14px;
  flex-shrink: 0;
}

.copy-icon:hover {
  color: var(--brand-blue);
}
</style>