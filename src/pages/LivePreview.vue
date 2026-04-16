<template>
  <div class="live-preview-page">
    <div class="preview-header">
      <a-button @click="goBack">
        <template #icon>
          <icon-left />
        </template>
        返回
      </a-button>
      <h2>直播预览</h2>
    </div>

    <div class="preview-content">
      <div class="player-wrapper">
        <video
          :key="playerKey"
          id="player-container-id"
          width="100%"
          height="100%"
          preload="auto"
          playsinline
          webkit-playsinline
        ></video>
      </div>

      <div class="stream-info">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="流名称">
            {{ streamInfo.streamName }}
          </a-descriptions-item>
          <a-descriptions-item label="应用名称">
            {{ streamInfo.appName }}
          </a-descriptions-item>
          <a-descriptions-item label="播放域名">
            {{ streamInfo.playDomain }}
          </a-descriptions-item>
          <a-descriptions-item label="播放地址">
            <div class="play-url">
              <span>{{ playUrl }}</span>
              <icon-copy class="copy-icon" @click="copyToClipboard(playUrl)" />
            </div>
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconLeft, IconCopy } from '@arco-design/web-vue/es/icon'
import { useNavigationStore } from '@/stores/navigation'
import { generatePlayURL } from '@/api/live'
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
    } catch (e) {
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
  const playerWrapper = document.querySelector('.player-wrapper')
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
        // licenseUrl: 'your-license-url', // 如果需要 license，请在这里配置
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
  } catch (err) {
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
  padding: 20px;
  background: #fff;
  min-height: 100vh;
  overflow-y: auto;
  height: auto;
  min-height: 600px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.preview-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.player-wrapper {
  width: 70%;
  max-width: 800px;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: 4px;
  overflow: hidden;
  margin: 0 auto;
  position: relative;
}

.stream-info {
}

.play-url {
  display: flex;
  align-items: center;
  gap: 8px;
}

.play-url span {
  word-break: break-all;
}

.copy-icon {
  cursor: pointer;
  color: #86909c;
  font-size: 14px;
  flex-shrink: 0;
}

.copy-icon:hover {
  color: #165dff;
}
</style>
