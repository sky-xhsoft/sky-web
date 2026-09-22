<template>
  <div class="live-recording-preview-page">
    <V2PageHeader
      title="录制文件预览"
      description="查看录制文件详情并支持播放在线预览"
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

    <!-- 媒体播放器 + 信息 -->
    <div v-else-if="record">
      <V2Card :padding="true" class="player-card">
        <div class="player-box">
          <video
            v-if="record.fileFormat !== 'aac'"
            :src="record.videoUrl"
            controls
            autoplay
            preload="metadata"
            class="player-media"
          >
            您的浏览器不支持视频播放
          </video>
          <audio
            v-else
            :src="record.videoUrl"
            controls
            autoplay
            class="player-media player-audio"
          >
            您的浏览器不支持音频播放
          </audio>
        </div>
      </V2Card>

      <V2Card :padding="true" class="info-card">
        <div class="card-title">录制信息</div>
        <div class="detail-rows">
          <span class="dt-label">流名称</span>
          <span>{{ record.streamName || '-' }}</span>
          <span class="dt-label">文件格式</span>
          <span>
            <V2Tag :type="getFormatType(record.fileFormat)">{{ record.fileFormat?.toUpperCase() }}</V2Tag>
          </span>
          <span class="dt-label">文件大小</span>
          <span>{{ formatFileSize(record.fileSize) }}</span>
          <span class="dt-label">录制时长</span>
          <span>{{ formatDuration(record.duration) }}</span>
          <span class="dt-label">录制开始时间</span>
          <span>{{ formatDateTime(record.startTime) }}</span>
          <span class="dt-label">录制结束时间</span>
          <span>{{ formatDateTime(record.endTime) }}</span>
        </div>
      </V2Card>
    </div>

    <!-- 错误状态 -->
    <V2Card v-else :padding="false" style="overflow: hidden;">
      <a-result status="404" title="未找到录制数据">
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
  IconDownload
} from '@arco-design/web-vue/es/icon'
import { queryCallbackEvents } from '@/api/live'
import dayjs from 'dayjs'
import { V2PageHeader, V2Card, V2Button, V2Tag } from '@/components/ui'

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

// 获取格式类型
const getFormatType = (format: string) => {
  const colorMap: Record<string, any> = {
    flv: 'info',
    mp4: 'success',
    hls: 'warning',
    aac: 'neutral'
  }
  return colorMap[format?.toLowerCase()] || 'neutral'
}

onMounted(() => {
  loadRecordData()
})
</script>

<style scoped>
.live-recording-preview-page {
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

.player-audio {
  height: auto;
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
</style>