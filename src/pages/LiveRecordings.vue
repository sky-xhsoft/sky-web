<template>
  <div class="live-recordings-page">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <h2>直播录制列表</h2>
      <div class="header-actions">
        <a-button type="primary" @click="handleRefresh">
          <template #icon>
            <icon-refresh />
          </template>
          刷新
        </a-button>
        <a-button @click="handleExport">
          <template #icon>
            <icon-download />
          </template>
          导出
        </a-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <a-card class="stat-card">
        <a-statistic title="总录制数（筛选后）" :value="stats.total">
          <template #prefix>
            <icon-file />
          </template>
        </a-statistic>
      </a-card>
      <a-card class="stat-card">
        <a-statistic title="今日录制" :value="stats.today">
          <template #prefix>
            <icon-calendar />
          </template>
        </a-statistic>
      </a-card>
    </div>

    <!-- 搜索筛选 -->
    <div class="search-bar">
      <a-form :model="searchForm" layout="inline">
        <a-form-item label="直播间">
          <a-input
            v-model="searchForm.roomName"
            placeholder="请输入直播间名称"
            style="width: 200px"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="域名">
          <a-input
            v-model="searchForm.domainName"
            placeholder="请输入域名"
            style="width: 200px"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="应用名称">
          <a-input
            v-model="searchForm.appName"
            placeholder="请输入应用名称"
            style="width: 200px"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="文件格式">
          <a-select
            v-model="searchForm.fileFormat"
            placeholder="请选择格式"
            style="width: 120px"
            allow-clear
          >
            <a-option value="flv">FLV</a-option>
            <a-option value="mp4">MP4</a-option>
            <a-option value="hls">HLS</a-option>
            <a-option value="aac">AAC</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="录制时间">
          <a-range-picker
            v-model="searchForm.timeRange"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            style="width: 380px"
          />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">
              <template #icon>
                <icon-search />
              </template>
              查询
            </a-button>
            <a-button @click="handleReset">
              <template #icon>
                <icon-refresh />
              </template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </div>

    <!-- 数据表格 -->
    <a-table
      :loading="loading"
      :data="tableData"
      :pagination="pagination"
      :bordered="{ wrapper: true, cell: true }"
      row-key="id"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <template #columns>
        <a-table-column title="ID" data-index="id" :width="80" />
        <a-table-column title="直播间" :width="150">
          <template #cell="{ record }">
            {{ record.roomName || record.streamName || '-' }}
          </template>
        </a-table-column>
        <a-table-column title="域名" :width="180">
          <template #cell="{ record }">
            {{ record.domainName || '-' }}
          </template>
        </a-table-column>
        <a-table-column title="应用名称" :width="120">
          <template #cell="{ record }">
            {{ record.appName || '-' }}
          </template>
        </a-table-column>
        <a-table-column title="文件格式" :width="100">
          <template #cell="{ record }">
            <a-tag v-if="record.fileFormat" :color="getFormatColor(record.fileFormat)">
              {{ record.fileFormat?.toUpperCase() }}
            </a-tag>
            <span v-else>-</span>
          </template>
        </a-table-column>
        <a-table-column title="文件大小" :width="120">
          <template #cell="{ record }">
            {{ formatFileSize(record.fileSize) }}
          </template>
        </a-table-column>
        <a-table-column title="录制时长" :width="120">
          <template #cell="{ record }">
            {{ formatDuration(record.duration) }}
          </template>
        </a-table-column>
        <a-table-column title="录制时间" :width="180">
          <template #cell="{ record }">
            {{ formatDateTime(record.startTime) }}
          </template>
        </a-table-column>
        <a-table-column title="生成时间" :width="180">
          <template #cell="{ record }">
            {{ formatDateTime(record.eventTime) }}
          </template>
        </a-table-column>
        <a-table-column title="操作" :width="180" fixed="right">
          <template #cell="{ record }">
            <a-space>
              <a-link @click="handlePreview(record)">预览</a-link>
              <a-link @click="handleDownload(record)">下载</a-link>
              <a-link status="danger" @click="handleDelete(record)">删除</a-link>
            </a-space>
          </template>
        </a-table-column>
      </template>
      <template #empty>
        <a-empty description="暂无录制数据" />
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useNavigationStore } from '@/stores/navigation'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconRefresh,
  IconSearch,
  IconDownload,
  IconFile,
  IconCalendar,
} from '@arco-design/web-vue/es/icon'
import { queryCallbackEvents, deleteCallbackEvent } from '@/api/live'
import dayjs from 'dayjs'

// 接收传递的参数
const props = defineProps<{
  roomId?: string
}>()

const navigationStore = useNavigationStore()

// 搜索表单 - 默认查询最近7天数据
const searchForm = reactive({
  roomName: '',
  domainName: '',
  appName: '',
  fileFormat: '',
  timeRange: [
    dayjs().subtract(7, 'day').startOf('day').toDate(),
    dayjs().endOf('day').toDate()
  ]
})

// 统计数据
const stats = reactive({
  total: 0,
  today: 0
})

// 表格数据
const loading = ref(false)
const tableData = ref([])
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showTotal: true,
  showPageSize: true
})

// 加载统计数据
const loadStats = async () => {
  try {
    // 只加载今日数据统计（仅在页面初始加载时调用）
    const today = dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss')
    const todayRes = await queryCallbackEvents({
      eventType: 'recording_file',
      startTime: today,
      pageNum: 1,
      pageSize: 1
    })
    if (todayRes.data?.code === 200 || todayRes.data?.code === 0) {
      stats.today = todayRes.data.data.total
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      eventType: 'recording_file',
      pageNum: pagination.current,
      pageSize: pagination.pageSize
    }

    // 根据房间 ID 过滤数据
    if (props.roomId) {
      params.streamId = props.roomId
    } else if (searchForm.roomName) {
      params.roomName = searchForm.roomName
    }
    if (searchForm.domainName) {
      params.domainName = searchForm.domainName
    }
    if (searchForm.appName) {
      params.appName = searchForm.appName
    }
    if (searchForm.timeRange && searchForm.timeRange.length === 2) {
      params.startTime = dayjs(searchForm.timeRange[0]).format('YYYY-MM-DD HH:mm:ss')
      params.endTime = dayjs(searchForm.timeRange[1]).format('YYYY-MM-DD HH:mm:ss')
    }

    const res = await queryCallbackEvents(params)

    if (res.data?.code === 200 || res.data?.code === 0) {
      // 解析事件数据
      tableData.value = res.data.data.list
        .map((item: any) => {
          const eventData = JSON.parse(item.eventData)

          // 从 eventData 中提取字段，支持多种可能的字段名
          const videoUrl = eventData.video_url || eventData.videoUrl || ''
          const fileSize = eventData.file_size ?? eventData.fileSize ?? 0
          const duration = eventData.duration ?? 0
          const fileFormat = eventData.file_format || eventData.fileFormat || ''
          const startTime = eventData.start_time ?? eventData.startTime ?? null
          const endTime = eventData.end_time ?? eventData.endTime ?? null
          const recordFileId = eventData.record_file_id || eventData.recordFileId || ''
          const videoId = eventData.video_id || eventData.videoId || ''


          // 如果 eventData 中没有这些字段，尝试从 item 的其他字段获取
          const streamName = item.streamName || eventData.stream_name || eventData.streamName || ''
          const domainName = item.domainName || eventData.push_domain || eventData.pushDomain || ''
          const appName = item.appName || eventData.app_name || eventData.appName || ''

          const processedEventTime = item.eventTime != null ? item.eventTime * 1000 : null

          return {
            id: item.id,
            streamId: item.streamId || eventData.stream_id || '',
            streamName,
            roomName: item.roomName || '',
            domainName,
            appName,
            videoUrl,
            fileSize,
            duration,
            fileFormat,
            startTime: startTime != null ? startTime * 1000 : null,
            endTime: endTime != null ? endTime * 1000 : null,
            recordFileId,
            videoId,
            eventTime: processedEventTime,
            createTime: item.createTime
          }
        })
        .filter((item: any) => {
          // 如果有格式筛选，进行过滤
          if (searchForm.fileFormat) {
            return item.fileFormat === searchForm.fileFormat
          }
          return true
        })

      pagination.total = res.data.data.total
      // 更新统计数据中的总数（基于当前筛选条件）
      stats.total = res.data.data.total
    }
  } catch (error) {
    console.error('加载录制数据失败:', error)
    Message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.roomName = ''
  searchForm.domainName = ''
  searchForm.appName = ''
  searchForm.fileFormat = ''
  searchForm.timeRange = []
  pagination.current = 1
  loadData()
}

// 刷新
const handleRefresh = () => {
  loadData()
}

// 导出
const handleExport = () => {
  Message.info('导出功能开发中...')
}

// 分页
const handlePageChange = (page: number) => {
  pagination.current = page
  loadData()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.current = 1
  loadData()
}

// 预览
const handlePreview = (record: any) => {
  navigationStore.navigateTo('LiveRecordingPreview', '录制文件预览', { recordId: record.id, recordData: record })
}

// 下载
const handleDownload = (record: any) => {
  window.open(record.videoUrl, '_blank')
}

// 删除
const handleDelete = (record: any) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条录制记录吗？此操作不可恢复。',
    onOk: async () => {
      try {
        await deleteCallbackEvent(record.id)
        Message.success('删除成功')
        loadData()
      } catch (error) {
        console.error('删除录制记录失败:', error)
        Message.error('删除失败')
      }
    }
  })
}

// 格式化时间
const formatDateTime = (timestamp: number | string) => {
  if (timestamp == null || isNaN(Number(timestamp))) return '-'
  const date = dayjs(timestamp)
  if (!date.isValid()) return '-'
  return date.format('YYYY-MM-DD HH:mm:ss')
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes == null || bytes === 0) return '-'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

// 格式化时长
const formatDuration = (seconds: number) => {
  if (seconds == null || seconds === 0) return '-'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}小时${minutes}分${secs}秒`
  } else if (minutes > 0) {
    return `${minutes}分${secs}秒`
  } else {
    return `${secs}秒`
  }
}

// 格式化总时长
const formatTotalDuration = (seconds: number) => {
  if (seconds == null || seconds === 0) return '-'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}小时${minutes}分`
  } else if (minutes > 0) {
    return `${minutes}分`
  } else {
    return `${seconds}秒`
  }
}

// 获取格式颜色
const getFormatColor = (format: string) => {
  const colors: Record<string, string> = {
    flv: 'blue',
    mp4: 'green',
    hls: 'orange',
    aac: 'purple'
  }
  return colors[format?.toLowerCase()] || 'gray'
}

onMounted(() => {
  // 页面加载时，先加载今日统计（只加载一次）
  loadStats()
  // 然后加载列表数据
  loadData()
})
</script>

<style scoped lang="less">
.live-recordings-page {
  padding: 20px;
  overflow-y: auto;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .stats-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 20px;

    .stat-card {
      text-align: center;
    }
  }

  .search-bar {
    background: #fff;
    padding: 20px;
    border-radius: 4px;
    margin-bottom: 16px;
  }

  .preview-container {
    .record-info {
      margin-top: 20px;
    }
  }
}
</style>
