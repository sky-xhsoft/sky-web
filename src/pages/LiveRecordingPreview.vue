<template>
  <div class="live-recording-preview-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <a-button @click="handleBack">
        <template #icon>
          <icon-left />
        </template>
        返回列表
      </a-button>
      <h2>录制文件预览</h2>
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

    <!-- 视频/音频播放器 -->
    <div class="media-container" v-else-if="record">
      <video
        v-if="record.fileFormat !== 'aac'"
        :src="record.videoUrl"
        controls
        autoplay
        preload="metadata"
        style="width: 100%; max-height: 70vh; background: #000;"
      >
        您的浏览器不支持视频播放
      </video>
      <audio
        v-else
        :src="record.videoUrl"
        controls
        autoplay
        style="width: 100%"
      >
        您的浏览器不支持音频播放
      </audio>

      <!-- 录制信息 -->
      <div class="record-info">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="流名称">
            {{ record.streamName || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="文件格式">
            <a-tag :color="getFormatColor(record.fileFormat)">
              {{ record.fileFormat?.toUpperCase() }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="文件大小">
            {{ formatFileSize(record.fileSize) }}
          </a-descriptions-item>
          <a-descriptions-item label="录制时长">
            {{ formatDuration(record.duration) }}
          </a-descriptions-item>
          <a-descriptions-item label="录制开始时间">
            {{ formatDateTime(record.startTime) }}
          </a-descriptions-item>
          <a-descriptions-item label="录制结束时间">
            {{ formatDateTime(record.endTime) }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </div>

    <!-- 错误状态 -->
    <a-result v-else status="404" title="未找到录制数据">
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
const record = ref<any>(null)

// 从导航参数中获取录制数据
const navParams = computed(() => navigationStore.current.params || {})

// 加载录制数据
const loadRecordData = async () => {
  // 优先使用传递的数据
  if (navParams.value.recordData) {
    record.value = navParams.value.recordData
    return
  }

  // 否则通过ID查询
  const recordId = navParams.value.recordId
  if (!recordId) {
    Message.error('缺少录制ID')
    return
  }

  loading.value = true
  try {
    const res = await queryCallbackEvents({
      eventType: 'recording_file',
      id: recordId,
      pageNum: 1,
      pageSize: 1
    })

    if (res.data?.code === 200 || res.data?.code === 0) {
      const list = res.data.data.list
      if (list && list.length > 0) {
        const item = list[0]
        const eventData = JSON.parse(item.eventData)

        record.value = {
          id: item.id,
          streamId: item.streamId,
          streamName: item.streamName,
          domainName: item.domainName,
          appName: item.appName,
          videoUrl: eventData.video_url || '',
          fileFormat: eventData.video_format || eventData.media_type || '',
          fileSize: eventData.file_size || 0,
          duration: eventData.duration || 0,
          startTime: eventData.start_time != null ? eventData.start_time * 1000 : null,
          endTime: eventData.end_time != null ? eventData.end_time * 1000 : null,
          eventTime: item.eventTime != null ? item.eventTime * 1000 : null,
          createTime: item.createTime
        }
      } else {
        Message.error('未找到录制数据')
      }
    }
  } catch (error) {
    console.error('加载录制数据失败:', error)
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
  if (record.value?.videoUrl) {
    window.open(record.value.videoUrl, '_blank')
  }
}

// 格式化时间
const formatDateTime = (timestamp: number) => {
  if (timestamp == null || isNaN(Number(timestamp))) return '-'
  const date = dayjs(timestamp)
  if (!date.isValid()) return '-'
  return date.format('YYYY-MM-DD HH:mm:ss')
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes == null || isNaN(Number(bytes))) return '-'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// 格式化时长
const formatDuration = (seconds: number) => {
  if (seconds == null || isNaN(Number(seconds))) return '-'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (hours > 0) {
    return `${hours}小时${minutes}分${secs}秒`
  }
  return `${minutes}分${secs}秒`
}

// 获取格式颜色
const getFormatColor = (format: string) => {
  const colorMap: Record<string, string> = {
    flv: 'blue',
    mp4: 'green',
    hls: 'orange',
    aac: 'purple'
  }
  return colorMap[format?.toLowerCase()] || 'gray'
}

onMounted(() => {
  loadRecordData()
})
</script>

<style scoped lang="less">
.live-recording-preview-page {
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

  .media-container {
    background: #fff;
    border-radius: 4px;
    padding: 20px;

    video, audio {
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .record-info {
      margin-top: 20px;
    }
  }
}
</style>
