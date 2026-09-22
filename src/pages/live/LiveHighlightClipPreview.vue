<template>
  <div class="highlight-clip-preview-page">
    <V2PageHeader
      title="高光切片预览"
      description="直播精彩片段预览与详情"
    >
      <template #actions>
        <V2Button type="secondary" @click="handleBack">
          <template #icon><icon-left /></template>
          返回列表
        </V2Button>
        <V2Button @click="handleDownload">
          <template #icon><icon-download /></template>
          下载
        </V2Button>
      </template>
    </V2PageHeader>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-wrap">
      <a-spin :loading="loading" style="width: 100%" />
    </div>

    <!-- 视频播放器 -->
    <div v-else-if="clip">
      <V2Card :padding="true" class="player-card">
        <div class="player-box">
          <video
            v-if="clip.clipUrl"
            :src="clip.clipUrl"
            controls
            autoplay
            preload="metadata"
            class="player-media"
            @error="handleVideoError"
          >
            您的浏览器不支持视频播放
          </video>
          <div v-else class="player-fallback">
            <icon-play-circle class="fallback-icon" />
            <span>视频URL为空，无法播放</span>
          </div>
          <div v-if="clip.clipUrl" class="player-overlay">
            <span>高光片段 · {{ formatDuration(clip.startTime, clip.endTime) }}</span>
            <span><span class="live-dot"></span> 高光切片</span>
          </div>
        </div>
      </V2Card>

      <!-- 切片信息 -->
      <V2Card :padding="true" class="info-card">
        <div class="card-title">切片信息</div>
        <div class="detail-rows">
          <span v-if="clip.title" class="dt-label">标题</span>
          <span v-if="clip.title">{{ clip.title }}</span>
          <span v-if="clip.summary" class="dt-label">摘要</span>
          <span v-if="clip.summary">{{ clip.summary }}</span>
          <span v-if="clip.keyWords && clip.keyWords.length > 0" class="dt-label">关键词</span>
          <span v-if="clip.keyWords && clip.keyWords.length > 0">
            <span class="keyword-list">
              <V2Tag v-for="(keyword, index) in clip.keyWords" :key="index" type="info">{{ keyword }}</V2Tag>
            </span>
          </span>
          <span class="dt-label">流名称</span>
          <span>{{ clip.streamName || '-' }}</span>
          <span class="dt-label">切片时长</span>
          <span>{{ formatDuration(clip.startTime, clip.endTime) }}</span>
          <span class="dt-label">开始时间</span>
          <span>{{ formatDateTime(clip.startTime) }}</span>
          <span class="dt-label">结束时间</span>
          <span>{{ formatDateTime(clip.endTime) }}</span>
        </div>
      </V2Card>
    </div>

    <!-- 错误状态 -->
    <V2Card v-else :padding="false" style="overflow: hidden;">
      <a-result status="404" title="未找到切片数据">
        <template #extra>
          <V2Button @click="handleBack">返回列表</V2Button>
        </template>
      </a-result>
    </V2Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useNavigationStore } from '@/stores/navigation'
import { Message } from '@arco-design/web-vue'
import {
  IconLeft,
  IconDownload,
  IconPlayCircle
} from '@arco-design/web-vue/es/icon'
import { queryCallbackEvents } from '@/api/live'
import dayjs from 'dayjs'
import { V2PageHeader, V2Card, V2Button, V2Tag } from '@/components/ui'

const navigationStore = useNavigationStore()

const loading = ref(false)
const clip = ref<any>(null)

// 从导航参数中获取切片数据
const navParams = computed(() => navigationStore.current.params || {})

// 加载切片数据
const loadClipData = async () => {
  // 优先使用传递的数据
  if (navParams.value.clipData) {
    clip.value = navParams.value.clipData
    return
  }

  // 否则通过ID查询
  const clipId = navParams.value.clipId
  if (!clipId) {
    Message.error('缺少切片ID')
    return
  }

  loading.value = true
  try {
    // 通过ID查询单个切片数据
    const res = await queryCallbackEvents({
      eventType: 'highlight',
      id: clipId,
      pageNum: 1,
      pageSize: 1
    })

    if (res.data?.code === 200 || res.data?.code === 0) {
      const list = res.data.data.list
      if (list && list.length > 0) {
        const item = list[0]
        const eventData = JSON.parse(item.eventData)

        clip.value = {
          id: item.id,
          streamId: item.streamId,
          streamName: item.streamName,
          domainName: item.domainName,
          appName: item.appName,
          clipUrl: eventData.video_store_url || eventData.clip_url || eventData.video_url || '',
          startTime: (eventData.begin_time || eventData.start_time) != null
            ? (eventData.begin_time || eventData.start_time) * 1000
            : null,
          endTime: eventData.end_time != null ? eventData.end_time * 1000 : null,
          title: eventData.title || '',
          summary: eventData.summary || '',
          keyWords: eventData.key_words || [],
          coverUrl: eventData.cov_img_store_url || '',
          eventTime: item.eventTime != null ? item.eventTime * 1000 : null,
          createTime: item.createTime
        }
      } else {
        Message.error('未找到切片数据')
      }
    }
  } catch (error) {
    console.error('加载切片数据失败:', error)
    Message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 返回列表
const handleBack = () => {
  navigationStore.goBack()
}

// 下载
const handleDownload = () => {
  if (clip.value?.clipUrl) {
    window.open(clip.value.clipUrl, '_blank')
  }
}

// 视频加载错误
const handleVideoError = (event: Event) => {
  console.error('Video error:', event)
  const video = event.target as HTMLVideoElement
  let errorMsg = '视频加载失败'
  if (video.error) {
    switch (video.error.code) {
      case 1:
        errorMsg = '视频加载被中止'
        break
      case 2:
        errorMsg = '网络错误，无法加载视频'
        break
      case 3:
        errorMsg = '视频解码失败'
        break
      case 4:
        errorMsg = '视频格式不支持或视频URL无效'
        break
    }
  }
  Message.error(errorMsg)
}

// 格式化时间
const formatDateTime = (timestamp: number) => {
  if (timestamp == null || isNaN(Number(timestamp))) return '-'
  const date = dayjs(timestamp)
  if (!date.isValid()) return '-'
  return date.format('YYYY-MM-DD HH:mm:ss')
}

// 格式化时长
const formatDuration = (startTime: number, endTime: number) => {
  if (startTime == null || endTime == null) return '-'
  const duration = Math.floor((endTime - startTime) / 1000)
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}分${seconds}秒`
}

onMounted(() => {
  loadClipData()
})
</script>

<style scoped>
.highlight-clip-preview-page {
  padding: 12px;
  background: var(--bg-page);
  min-height: 100%;
  height: auto;
  overflow-y: auto;
}

.loading-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.player-card {
  margin-bottom: 16px;
}

.player-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: rgba(0, 0, 0, 0.92);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.player-media {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.player-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  color: rgba(156, 163, 175, 1);
  font-size: 13px;
}

.fallback-icon {
  font-size: 44px;
}

.player-overlay {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  padding: 10px 14px;
  background: linear-gradient(rgba(0, 0, 0, 0.55), transparent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
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

.info-card .card-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--text-primary);
  margin-bottom: 14px;
}

.detail-rows {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 10px 16px;
  font-size: 13px;
}

.detail-rows .dt-label {
  color: var(--text-tertiary);
}

.keyword-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>