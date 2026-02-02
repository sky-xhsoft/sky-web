<template>
  <div class="highlight-clip-preview-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <a-button @click="handleBack">
        <template #icon>
          <icon-left />
        </template>
        返回列表
      </a-button>
      <h2>高光切片预览</h2>
      <div class="header-actions">
        <a-button @click="handleDownload">
          <template #icon>
            <icon-download />
          </template>
          下载
        </a-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <a-spin :loading="loading" style="width: 100%; min-height: 400px;" v-if="loading" />

    <!-- 视频播放器 -->
    <div class="video-container" v-else-if="clip">
      <video
        v-if="clip.clipUrl"
        :src="clip.clipUrl"
        controls
        autoplay
        preload="metadata"
        style="width: 100%; max-height: 70vh; background: #000;"
        @error="handleVideoError"
      >
        您的浏览器不支持视频播放
      </video>
      <a-alert v-else type="warning">
        视频URL为空，无法播放
      </a-alert>

      <!-- 切片信息 -->
      <div class="clip-info">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="标题" :span="2" v-if="clip.title">
            {{ clip.title }}
          </a-descriptions-item>
          <a-descriptions-item label="摘要" :span="2" v-if="clip.summary">
            {{ clip.summary }}
          </a-descriptions-item>
          <a-descriptions-item label="关键词" :span="2" v-if="clip.keyWords && clip.keyWords.length > 0">
            <a-space wrap>
              <a-tag v-for="(keyword, index) in clip.keyWords" :key="index">
                {{ keyword }}
              </a-tag>
            </a-space>
          </a-descriptions-item>
          <a-descriptions-item label="流名称">
            {{ clip.streamName || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="切片时长">
            {{ formatDuration(clip.startTime, clip.endTime) }}
          </a-descriptions-item>
          <a-descriptions-item label="开始时间">
            {{ formatDateTime(clip.startTime) }}
          </a-descriptions-item>
          <a-descriptions-item label="结束时间">
            {{ formatDateTime(clip.endTime) }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </div>

    <!-- 错误状态 -->
    <a-result v-else status="404" title="未找到切片数据">
      <template #extra>
        <a-button type="primary" @click="handleBack">返回列表</a-button>
      </template>
    </a-result>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useNavigationStore } from '@/stores/navigation'
import { Message } from '@arco-design/web-vue'
import {
  IconLeft,
  IconDownload
} from '@arco-design/web-vue/es/icon'
import { queryCallbackEvents } from '@/api/live'
import dayjs from 'dayjs'

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

<style scoped lang="less">
.highlight-clip-preview-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;

  .page-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;

    h2 {
      flex: 1;
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .video-container {
    background: #fff;
    border-radius: 4px;
    padding: 20px;

    video {
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .clip-info {
      margin-top: 20px;
    }
  }
}
</style>
