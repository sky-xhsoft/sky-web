<template>
  <div class="live-recordings-page">
    <V2PageHeader v-if="!embedded" title="直播录制列表" description="查看和管理直播录制文件">
      <template #actions>
        <V2Button type="secondary" @click="handleRefresh">
          <template #icon><icon-refresh /></template>
          刷新
        </V2Button>
      </template>
    </V2PageHeader>
    <!-- 嵌入直播间详情页时只保留操作按钮，不显示页头与汇总 -->
    <div v-else class="embedded-toolbar">
      <V2Button type="secondary" @click="handleRefresh">
        <template #icon><icon-refresh /></template>
        刷新
      </V2Button>
    </div>

    <div v-if="!embedded" class="stats-grid">
      <V2Card v-for="(stat, idx) in statCards" :key="idx" hover>
        <div class="stat-card">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value">{{ stat.value }}</div>
        </div>
      </V2Card>
    </div>

    <V2Card class="search-card" :padding="true">
      <a-form :model="searchForm" layout="inline" size="small">
        <a-form-item label="关键词">
          <a-input
            v-model="searchForm.keyword"
            placeholder="直播间名称/描述"
            style="width: 200px"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="格式">
          <a-select v-model="searchForm.recordType" placeholder="全部格式" style="width: 120px" allow-clear>
            <a-option value="flv">FLV</a-option>
            <a-option value="mp4">MP4</a-option>
            <a-option value="hls">HLS</a-option>
            <a-option value="aac">AAC</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="时间范围">
          <a-range-picker
            v-model="searchForm.timeRange"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            style="width: 340px"
          />
        </a-form-item>
        <a-form-item>
          <a-space>
            <V2Button @click="handleSearch">
              <template #icon><icon-search /></template>
              查询
            </V2Button>
            <V2Button type="secondary" @click="handleReset">
              <template #icon><icon-refresh /></template>
              重置
            </V2Button>
          </a-space>
        </a-form-item>
      </a-form>
    </V2Card>

    <V2Card :padding="false" style="overflow: hidden;">
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
          <a-table-column title="直播间" :width="180">
            <!-- 未关联直播间的旧记录显示流名称 -->
            <template #cell="{ record }">{{ record.roomName || record.streamId || '-' }}</template>
          </a-table-column>
          <a-table-column title="录制类型" :width="100">
            <template #cell="{ record }">
              <V2Tag v-if="record.recordType" :type="getFormatType(record.recordType)">{{ record.recordType.toUpperCase() }}</V2Tag>
              <span v-else class="text-muted">-</span>
            </template>
          </a-table-column>
          <a-table-column title="文件大小" :width="120">
            <template #cell="{ record }">{{ formatFileSize(record.fileSize) }}</template>
          </a-table-column>
          <a-table-column title="录制时长" :width="120">
            <template #cell="{ record }">{{ formatDuration(record.duration) }}</template>
          </a-table-column>
          <a-table-column title="开始时间" :width="170">
            <template #cell="{ record }">{{ formatDateTime(record.startTime) }}</template>
          </a-table-column>
          <a-table-column title="结束时间" :width="170">
            <template #cell="{ record }">{{ formatDateTime(record.endTime) }}</template>
          </a-table-column>
          <a-table-column title="状态" :width="100">
            <template #cell="{ record }">
              <V2Tag :type="getStatusType(record.status)">{{ getStatusText(record.status) }}</V2Tag>
            </template>
          </a-table-column>
          <a-table-column title="生成时间" :width="170">
            <template #cell="{ record }">{{ formatDateTime(record.createTime) }}</template>
          </a-table-column>
          <a-table-column title="操作" fixed="right" :width="140">
            <template #cell="{ record }">
              <a-space size="small">
                <a-link @click="handlePreview(record)">预览</a-link>
                <a-link v-if="record.recordUrl" @click="handleDownload(record)">下载</a-link>
              </a-space>
            </template>
          </a-table-column>
        </template>
        <template #empty>
          <a-empty description="暂无录制数据" />
        </template>
      </a-table>
    </V2Card>

    <a-modal v-model:visible="previewVisible" unmount-on-close @before-close="stopPreview" title="录制预览" :footer="false" width="720px">
      <div class="preview-wrapper">
        <video v-if="previewUrl" ref="previewVideoRef" :src="previewUrl" controls style="width: 100%; max-height: 420px;" />
        <div v-else class="preview-empty">
          <a-empty description="无可播放视频" />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconRefresh, IconSearch } from '@arco-design/web-vue/es/icon'
import dayjs from 'dayjs'
import { listRecordings, type LiveRecording } from '@/api/live'
import { formatDateTime } from '@/utils/date'
import { V2PageHeader, V2Card, V2Button, V2Tag } from '@/components/ui'

const props = defineProps<{
  roomId?: string
  /** 嵌入直播间详情页的标签页：不显示页头和汇总卡片，直接展示列表 */
  embedded?: boolean
}>()

const loading = ref(false)
const tableData = ref<LiveRecording[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showTotal: true,
  showPageSize: true
})

const searchForm = reactive({
  keyword: '',
  recordType: '',
  timeRange: [] as Date[]
})

const totalSize = computed(() => tableData.value.reduce((sum, item) => sum + (item.fileSize || 0), 0))
const totalDuration = computed(() => tableData.value.reduce((sum, item) => sum + (item.duration || 0), 0))
const statCards = computed(() => [
  { label: '录制总数', value: pagination.total },
  { label: '总大小', value: formatFileSize(totalSize.value) },
  { label: '总时长', value: formatDuration(totalDuration.value) }
])

const previewVisible = ref(false)
const previewUrl = ref('')
const previewVideoRef = ref<HTMLVideoElement | null>(null)

// 弹窗关闭时只是隐藏，<video> 仍在页面里会继续播放，要先暂停
const stopPreview = () => {
  previewVideoRef.value?.pause()
}

const getFormatType = (type: string) => {
  const map: Record<string, any> = { flv: 'info', mp4: 'success', hls: 'warning', aac: 'neutral' }
  return map[type?.toLowerCase()] || 'neutral'
}
const getStatusType = (status?: string) => {
  const map: Record<string, any> = { ready: 'success', processing: 'info', failed: 'error', pending: 'warning' }
  return map[status || ''] || 'neutral'
}
const getStatusText = (status?: string) => {
  const map: Record<string, string> = { ready: '可用', processing: '处理中', failed: '失败', pending: '待处理' }
  return map[status || ''] || status || '-'
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      status: '',
      recordType: searchForm.recordType
    }
    if (props.roomId) {
      params.roomId = props.roomId
    }
    if (searchForm.timeRange?.length === 2) {
      params.startTime = dayjs(searchForm.timeRange[0]).unix()
      params.endTime = dayjs(searchForm.timeRange[1]).unix()
    }
    const res = await listRecordings(params)
    tableData.value = res.list || []
    pagination.total = res.pagination?.total || 0
  } catch (error: any) {
    console.error('加载录制数据失败:', error)
    Message.error(error.response?.data?.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  loadData()
}
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.recordType = ''
  searchForm.timeRange = []
  pagination.current = 1
  loadData()
}
const handleRefresh = () => loadData()
const handlePageChange = (page: number) => {
  pagination.current = page
  loadData()
}
const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.current = 1
  loadData()
}

const handlePreview = (record: LiveRecording) => {
  previewUrl.value = record.recordUrl || ''
  previewVisible.value = true
}
const handleDownload = (record: LiveRecording) => {
  if (record.recordUrl) window.open(record.recordUrl, '_blank')
}

const formatDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return '-'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) return `${hours}小时${minutes}分${secs}秒`
  if (minutes > 0) return `${minutes}分${secs}秒`
  return `${secs}秒`
}
const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '-'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

onMounted(() => loadData())
</script>

<style scoped>
.live-recordings-page {
  padding: 12px;
  background: var(--bg-page);
  height: 100%;
  overflow-y: auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.search-card {
  margin-bottom: 16px;
}

.text-muted {
  color: var(--text-tertiary);
}

.preview-wrapper {
  padding: 8px 0;
}

.preview-empty {
  padding: 40px 0;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.embedded-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}
</style>
