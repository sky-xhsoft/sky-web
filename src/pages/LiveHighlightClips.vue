<template>
  <div class="highlight-clips-page">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <h2>直播高光切片</h2>
      <div class="header-actions">
        <a-button v-if="selectedRows.length > 0" status="danger" size="small" @click="handleBatchDelete">
          <template #icon>
            <icon-delete />
          </template>
          批量删除 ({{ selectedRows.length }})
        </a-button>
        <a-button type="primary" size="small" @click="handleRefresh">
          <template #icon>
            <icon-refresh />
          </template>
          刷新
        </a-button>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <div class="search-bar">
      <a-form :model="searchForm" layout="inline" size="small">
        <a-form-item label="流名称">
          <a-input
            v-model="searchForm.streamName"
            placeholder="请输入流名称"
            style="width: 160px"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="域名">
          <a-input
            v-model="searchForm.domainName"
            placeholder="请输入域名"
            style="width: 160px"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="应用名称">
          <a-input
            v-model="searchForm.appName"
            placeholder="请输入应用名称"
            style="width: 120px"
            allow-clear
          />
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
            <a-button type="primary" size="small" @click="handleSearch">
              <template #icon>
                <icon-search />
              </template>
              查询
            </a-button>
            <a-button size="small" @click="handleReset">
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
      size="small"
      :scroll="{ x: 1520 }"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      :row-selection="rowSelection"
      :columns="columns"
      @selectAll="handleSelectAll"
      @selectionChange="handleSelectionChange"
    >
      <template #title="{ record }">
        <a-tooltip :content="record.title" v-if="record.title">
          <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ record.title }}
          </div>
        </a-tooltip>
        <span v-else style="color: #999;">-</span>
      </template>
      <template #keywords="{ record }">
        <a-space wrap size="mini" v-if="record.keyWords && record.keyWords.length > 0">
          <a-tag v-for="(keyword, index) in record.keyWords.slice(0, 4)" :key="index" size="small">
            {{ keyword }}
          </a-tag>
          <a-tag v-if="record.keyWords.length > 4" size="small" color="gray">+{{ record.keyWords.length - 4 }}</a-tag>
        </a-space>
        <span v-else style="color: #999;">-</span>
      </template>
      <template #startTime="{ record }">
        {{ formatDateTime(record.startTime) }}
      </template>
      <template #endTime="{ record }">
        {{ formatDateTime(record.endTime) }}
      </template>
      <template #duration="{ record }">
        {{ formatDuration(record.startTime, record.endTime) }}
      </template>
      <template #actions="{ record }">
        <a-space size="mini">
          <a-link @click="handlePreview(record)">预览</a-link>
          <a-link @click="handleDownload(record)">下载</a-link>
          <a-link status="danger" @click="handleDelete(record)">删除</a-link>
        </a-space>
      </template>
      <template #empty>
        <a-empty description="暂无高光切片数据" />
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
  IconDelete
} from '@arco-design/web-vue/es/icon'
import { queryCallbackEvents, deleteCallbackEvent, batchDeleteCallbackEvents } from '@/api/live'
import dayjs from 'dayjs'

const navigationStore = useNavigationStore()

// 搜索表单 - 默认查询最近7天数据
const searchForm = reactive({
  streamName: '',
  domainName: '',
  appName: '',
  timeRange: [
    dayjs().subtract(7, 'day').startOf('day').toDate(),
    dayjs().endOf('day').toDate()
  ]
})

// 表格数据类型定义
interface TableDataItem {
  id: number
  title: string
  keyWords: string[]
  domainName: string
  appName: string
  startTime: number
  endTime: number
  clipUrl: string
  streamId: string
  streamName: string
  summary: string
  coverUrl: string
  score: number
  eventTime: number
  createTime: string
}

// 表格数据
const loading = ref(false)
const tableData = ref<TableDataItem[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: true,
  showPageSize: true
})

// 选中的项
const selectedRows = ref<TableDataItem[]>([])

// 行选择配置
const rowSelection = reactive({
  type: 'checkbox',
  showCheckedAll: true
})

// 处理选择变化
const handleSelectionChange = (rowKeys: any[]) => {
  // 根据选中的行 keys 找到对应的记录
  selectedRows.value = tableData.value.filter(record => rowKeys.includes(record.id))
}

// 处理全选
const handleSelectAll = (checked: boolean) => {
  if (checked) {
    // 全选时，选中所有数据
    selectedRows.value = [...tableData.value]
  } else {
    // 取消全选时，清空选中数据
    selectedRows.value = []
  }
}

// 列配置
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 100
  },
  {
    title: '标题',
    slotName: 'title',
    width: 280
  },
  {
    title: '关键词',
    slotName: 'keywords',
    width: 280
  },
  {
    title: '域名',
    dataIndex: 'domainName',
    width: 160
  },
  {
    title: '应用',
    dataIndex: 'appName',
    width: 80
  },
  {
    title: '开始时间',
    slotName: 'startTime',
    width: 160
  },
  {
    title: '结束时间',
    slotName: 'endTime',
    width: 160
  },
  {
    title: '时长',
    slotName: 'duration',
    width: 90
  },
  {
    title: '操作',
    slotName: 'actions',
    width: 150,
    fixed: 'right'
  }
]

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      eventType: 'highlight',
      pageNum: pagination.current,
      pageSize: pagination.pageSize
    }

    if (searchForm.streamName) {
      params.streamName = searchForm.streamName
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
      tableData.value = res.data.data.list.map((item: any) => {
        const eventData = JSON.parse(item.eventData)

        return {
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
          score: eventData.score, // 保留旧字段以兼容
          eventTime: item.eventTime != null ? item.eventTime * 1000 : null,
          createTime: item.createTime
        }
      })
      pagination.total = res.data.data.total
    } else {
      console.error('API returned error code:', res.data?.code)
    }
  } catch (error) {
    console.error('加载高光切片数据失败:', error)
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
  searchForm.streamName = ''
  searchForm.domainName = ''
  searchForm.appName = ''
  searchForm.timeRange = []
  pagination.current = 1
  loadData()
}

// 刷新
const handleRefresh = () => {
  loadData()
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
  navigationStore.navigateTo('LiveHighlightClipPreview', '高光切片预览', { clipId: record.id, clipData: record })
}

// 单个删除
const handleDelete = (record: TableDataItem) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条高光切片记录吗？此操作不可恢复。',
    onOk: async () => {
      try {
        await deleteCallbackEvent(record.id)
        Message.success('删除成功')
        loadData()
      } catch (error) {
        console.error('删除高光切片失败:', error)
        Message.error('删除失败')
      }
    }
  })
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    Message.warning('请选择要删除的记录')
    return
  }

  Modal.confirm({
    title: '确认批量删除',
    content: `确定要删除选中的 ${selectedRows.value.length} 条高光切片记录吗？此操作不可恢复。`,
    onOk: async () => {
      try {
        const ids = selectedRows.value.map(item => item.id)
        await batchDeleteCallbackEvents(ids)
        Message.success('批量删除成功')
        loadData()
        selectedRows.value = []
      } catch (error) {
        console.error('批量删除高光切片失败:', error)
        Message.error('批量删除失败')
      }
    }
  })
}

// 下载
const handleDownload = (record: any) => {
  window.open(record.clipUrl, '_blank')
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
  loadData()
})
</script>

<style scoped lang="less">
.highlight-clips-page {
  padding: 12px;
  overflow-y: auto;
  height: calc(100vh - 80px);

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }

  .search-bar {
    background: #fff;
    padding: 12px 16px;
    border-radius: 4px;
    margin-bottom: 12px;
  }

  // 表格紧凑样式
  :deep(.arco-table) {
    font-size: 13px;

    .arco-table-th,
    .arco-table-td {
      padding: 8px 12px;
    }

    .arco-table-th {
      background-color: #f7f8fa;
      font-weight: 600;
    }
  }

  // 标签紧凑样式
  :deep(.arco-tag) {
    margin: 2px;
    padding: 0 6px;
    font-size: 12px;
    line-height: 20px;
  }

  // 链接紧凑样式
  :deep(.arco-link) {
    font-size: 13px;
  }
}
</style>
