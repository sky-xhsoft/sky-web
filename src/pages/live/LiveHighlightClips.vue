<template>
  <div class="highlight-clips-page">
    <V2PageHeader v-if="!embedded" title="直播高光切片" description="管理直播精彩片段与高光切片">
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
            placeholder="切片名称/流名称"
            style="width: 200px"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model="searchForm.status" placeholder="全部状态" style="width: 140px" allow-clear>
            <a-option value="processing">处理中</a-option>
            <a-option value="ready">可用</a-option>
            <a-option value="failed">失败</a-option>
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
          <a-table-column title="切片名称" :width="180">
            <template #cell="{ record }">
              <a-tooltip :content="record.clipName" v-if="record.clipName">
                <div class="clip-name">{{ record.clipName }}</div>
              </a-tooltip>
              <span v-else class="text-muted">-</span>
            </template>
          </a-table-column>
          <a-table-column title="缩略图" :width="120">
            <template #cell="{ record }">
              <img
                v-if="record.thumbnail || record.clipUrl"
                :src="record.thumbnail || record.clipUrl"
                class="clip-thumb"
                @click="handlePreview(record)"
              />
              <span v-else class="text-muted">-</span>
            </template>
          </a-table-column>
          <a-table-column title="流名称" data-index="streamId" :width="160" />
          <a-table-column title="状态" :width="100">
            <template #cell="{ record }">
              <V2Tag :type="getStatusType(record.status)">{{ getStatusText(record.status) }}</V2Tag>
            </template>
          </a-table-column>
          <a-table-column title="开始时间" :width="170">
            <template #cell="{ record }">{{ formatDateTime(record.startTime) }}</template>
          </a-table-column>
          <a-table-column title="结束时间" :width="170">
            <template #cell="{ record }">{{ formatDateTime(record.endTime) }}</template>
          </a-table-column>
          <a-table-column title="时长" :width="100">
            <template #cell="{ record }">{{ formatDuration(record.duration) }}</template>
          </a-table-column>
          <a-table-column title="文件大小" :width="120">
            <template #cell="{ record }">{{ formatFileSize(record.fileSize) }}</template>
          </a-table-column>
          <a-table-column title="操作" fixed="right" :width="140">
            <template #cell="{ record }">
              <a-space size="small">
                <a-link @click="handlePreview(record)">预览</a-link>
                <a-link v-if="record.clipUrl" @click="handleDownload(record)">下载</a-link>
              </a-space>
            </template>
          </a-table-column>
        </template>
        <template #empty>
          <a-empty description="暂无高光切片数据" />
        </template>
      </a-table>
    </V2Card>

    <a-modal v-model:visible="previewVisible" unmount-on-close @before-close="stopPreview" title="切片预览" :footer="false" width="720px">
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
import { listClips, type LiveClip } from '@/api/live'
import { formatDateTime } from '@/utils/date'
import { V2PageHeader, V2Card, V2Button, V2Tag } from '@/components/ui'

const props = defineProps<{
  roomId?: string
  /** 嵌入直播间详情页的标签页：不显示页头和汇总卡片，直接展示列表 */
  embedded?: boolean
}>()

const loading = ref(false)
const tableData = ref<LiveClip[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: true,
  showPageSize: true
})

const searchForm = reactive({
  keyword: '',
  status: '',
  timeRange: [] as Date[]
})

const totalDuration = computed(() => tableData.value.reduce((sum, item) => sum + (item.duration || 0), 0))
const statCards = computed(() => [
  { label: '切片总数', value: pagination.total },
  { label: '总时长', value: formatDuration(totalDuration.value) }
])

const previewVisible = ref(false)
const previewUrl = ref('')
const previewVideoRef = ref<HTMLVideoElement | null>(null)

// 弹窗关闭时只是隐藏，<video> 仍在页面里会继续播放，要先暂停
const stopPreview = () => {
  previewVideoRef.value?.pause()
}

const getStatusType = (status?: string) => {
  const map: Record<string, any> = { processing: 'info', ready: 'success', failed: 'error' }
  return map[status || ''] || 'neutral'
}
const getStatusText = (status?: string) => {
  const map: Record<string, string> = { processing: '处理中', ready: '可用', failed: '失败' }
  return map[status || ''] || status || '-'
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      status: searchForm.status
    }
    if (props.roomId) {
      params.roomId = props.roomId
    }
    if (searchForm.timeRange?.length === 2) {
      params.startTime = dayjs(searchForm.timeRange[0]).unix()
      params.endTime = dayjs(searchForm.timeRange[1]).unix()
    }
    const res = await listClips(params)
    tableData.value = res.list || []
    pagination.total = res.pagination?.total || 0
  } catch (error: any) {
    console.error('加载高光切片失败:', error)
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
  searchForm.status = ''
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

const handlePreview = (record: LiveClip) => {
  previewUrl.value = record.clipUrl || ''
  previewVisible.value = true
}
const handleDownload = (record: LiveClip) => {
  if (record.clipUrl) window.open(record.clipUrl, '_blank')
}

const formatDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`
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
.highlight-clips-page {
  padding: 12px;
  background: var(--bg-page);
  height: 100%;
  overflow-y: auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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

.clip-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}

.clip-thumb {
  width: 100px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  cursor: pointer;
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
