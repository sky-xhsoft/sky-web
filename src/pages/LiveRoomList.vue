<template>
  <div class="live-room-list">
    <!-- 操作栏 -->
    <div class="action-bar">
      <a-space size="medium">
        <a-button type="primary" @click="handleCreate">
          <template #icon>
            <icon-plus />
          </template>
          {{ texts.createLive }}
        </a-button>
      </a-space>
      <a-space size="medium">
        <a-button @click="handleRefresh">
          <template #icon>
            <icon-refresh />
          </template>
          {{ texts.refresh }}
        </a-button>
        <a-button v-if="selectedRows.length > 0" type="primary" status="danger" @click="handleBatchDelete">
          <template #icon>
            <icon-delete />
          </template>
          {{ texts.batchDelete }} ({{ selectedRows.length }})
        </a-button>
      </a-space>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <a-space size="medium">
        <a-dropdown trigger="click">
          <a-button>
            {{ texts.allFilters }}
            <icon-down />
          </a-button>
          <template #content>
            <a-doption>{{ texts.roomType }}</a-doption>
            <a-doption>{{ texts.broadcastFormat }}</a-doption>
            <a-doption>{{ texts.status }}</a-doption>
            <a-doption>{{ texts.viewingMethod }}</a-doption>
          </template>
        </a-dropdown>

        <a-select
          v-model="searchForm.filterType"
          :placeholder="texts.searchByRoomName"
          style="width: 150px"
          @change="handleSearch"
        >
          <a-option value="roomName">{{ texts.searchByRoomName }}</a-option>
          <a-option value="id">{{ texts.searchById }}</a-option>
          <a-option value="streamName">{{ texts.searchByStreamName }}</a-option>
        </a-select>

        <a-input
          v-model="searchForm.keyword"
          :placeholder="texts.searchPlaceholder"
          style="width: 300px"
          allow-clear
        >
          <template #prefix>
            <icon-search />
          </template>
        </a-input>

        <a-button type="primary" @click="handleSearch">{{ texts.search }}</a-button>
      </a-space>
    </div>

    <!-- 表格 -->
    <a-table
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      row-key="id"
      :row-selection="rowSelection"
      @selectionChange="handleSelectionChange"
      @selectAll="handleSelectAll"
    >
      <template #roomInfo="{ record }">
        <div class="room-info">
          <a-image
            :src="record.coverImage || '/default-cover.png'"
            width="80"
            height="45"
            fit="cover"
          />
          <div class="room-details">
            <div class="room-name">{{ record.roomName }}</div>
            <div class="room-meta">
              <a-tag>{{ record.viewingMethodText }}</a-tag>
            </div>
          </div>
        </div>
      </template>

      <template #roomType="{ record }">
        {{ getRoomTypeText(record.roomType) }}
      </template>

      <template #broadcastFormat="{ record }">
        {{ getBroadcastFormatText(record.broadcastFormat) }}
      </template>

      <template #status="{ record }">
        <a-tag :color="getStatusColor(record.status)">
          {{ getStatusText(record.status) }}
        </a-tag>
      </template>

      <template #startTime="{ record }">
        {{ formatDateTime(record.startTime) }}
      </template>

      <template #actions="{ record }">
        <a-space>
          <a-link @click="handleManage(record)">{{ texts.manage }}</a-link>
          <a-link v-if="record.status === 'live'" @click="handlePreview(record)">{{ texts.preview }}</a-link>
          <a-link @click="handlePullStreamTask(record)">{{ texts.socialDistribution }}</a-link>
          <a-link @click="handleHighlightClips(record)">{{ texts.highlightClips }}</a-link>
          <a-link @click="handleRecordings(record)">{{ texts.recordings }}</a-link>
          <a-dropdown trigger="click">
            <a-link>
              <icon-more />
            </a-link>
            <template #content>
              <a-doption @click="handleEdit(record)">
                <icon-edit />
                {{ texts.edit }}
              </a-doption>
              <a-doption v-if="record.status !== 'live'" @click="handleRecycle(record)">
                <icon-delete />
                {{ texts.delete }}
              </a-doption>
            </template>
          </a-dropdown>
        </a-space>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { useNavigationStore } from '../stores/navigation'
import { useI18n } from 'vue-i18n'
import api from '../api/http'
import { listDomains } from '../api/live'
import dayjs from 'dayjs'
import { IconRefresh, IconDelete } from '@arco-design/web-vue/es/icon'

const { t } = useI18n()
const navigationStore = useNavigationStore()
const loading = ref(false)
const tableData = ref([])
const domains = ref<{ name: string; type: number }[]>([])
let unregisterBackCallback: (() => void) | null = null

const texts = computed(() => ({
  createLive: t('liveRoom.createLive'),
  refresh: t('liveRoom.refresh'),
  batchDelete: t('liveRoom.batchDelete'),
  allFilters: t('liveRoom.allFilters'),
  roomType: t('liveRoom.roomType'),
  broadcastFormat: t('liveRoom.broadcastFormat'),
  status: t('liveRoom.status'),
  viewingMethod: t('liveRoom.viewingMethod'),
  searchPlaceholder: t('liveRoom.searchPlaceholder'),
  search: t('liveRoom.search'),
  searchByRoomName: t('liveRoom.searchByRoomName'),
  searchById: t('liveRoom.searchById'),
  searchByStreamName: t('liveRoom.searchByStreamName'),
  colId: t('liveRoom.colId'),
  colRoom: t('liveRoom.colRoom'),
  colBroadcastFormat: t('liveRoom.colBroadcastFormat'),
  colStatus: t('liveRoom.colStatus'),
  colStartTime: t('liveRoom.colStartTime'),
  colActions: t('liveRoom.colActions'),
  manage: t('liveRoom.manage'),
  preview: t('liveRoom.preview'),
  socialDistribution: t('liveRoom.socialDistribution'),
  highlightClips: t('liveRoom.highlightClips'),
  recordings: t('liveRoom.recordings'),
  edit: t('liveRoom.edit'),
  delete: t('liveRoom.delete'),
  roomTypeVideo: t('liveRoom.roomTypeVideo'),
  roomTypeImage: t('liveRoom.roomTypeImage'),
  roomTypeVr: t('liveRoom.roomTypeVr'),
  roomTypeAudio: t('liveRoom.roomTypeAudio'),
  roomTypeGraphic: t('liveRoom.roomTypeGraphic'),
  formatLive: t('liveRoom.formatLive'),
  formatVod: t('liveRoom.formatVod'),
  formatPseudo: t('liveRoom.formatPseudo'),
  statusDraft: t('liveRoom.statusDraft'),
  statusScheduled: t('liveRoom.statusScheduled'),
  statusLive: t('liveRoom.statusLive'),
  statusEnded: t('liveRoom.statusEnded'),
  statusArchived: t('liveRoom.statusArchived'),
  statusPublic: t('liveRoom.statusPublic'),
  createTitle: t('liveRoom.createTitle'),
  editTitle: t('liveRoom.editTitle'),
  detailTitle: t('liveRoom.detailTitle'),
  loadDataFailed: t('liveRoom.loadDataFailed'),
  batchDeleteConfirmTitle: t('liveRoom.batchDeleteConfirmTitle'),
  batchDeleteConfirmContent: t('liveRoom.batchDeleteConfirmContent'),
  batchDeleteSuccess: t('liveRoom.batchDeleteSuccess'),
  batchDeleteFailed: t('liveRoom.batchDeleteFailed'),
  recycleConfirmTitle: t('liveRoom.recycleConfirmTitle'),
  recycleConfirmContent: t('liveRoom.recycleConfirmContent'),
  recycleSuccess: t('liveRoom.recycleSuccess'),
  recycleFailed: t('liveRoom.recycleFailed'),
  fetchDataFailed: t('liveRoom.fetchDataFailed'),
  inDevelopment: t('liveRoom.inDevelopment'),
  refreshPasswordTitle: t('liveRoom.refreshPasswordTitle'),
  refreshPasswordContent: t('liveRoom.refreshPasswordContent'),
  refreshPasswordSuccess: t('liveRoom.refreshPasswordSuccess'),
  refreshPasswordFailed: t('liveRoom.refreshPasswordFailed'),
  copySuccess: t('liveRoom.copySuccess'),
  copyFailed: t('liveRoom.copyFailed'),
  startLiveSuccess: t('liveRoom.startLiveSuccess'),
  operationFailed: t('liveRoom.operationFailed'),
  noPlayDomainWarning: t('liveRoom.noPlayDomainWarning'),
  previewFailed: t('liveRoom.previewFailed'),
  confirm: t('liveRoom.confirm'),
  cancel: t('liveRoom.cancel'),
}))

// 选中的行
const selectedRows = ref<any[]>([])

// 加载域名列表
const loadDomains = async () => {
  try {
    const response = await listDomains(undefined)
    const result = response.data
    if (result && result.data) {
      const rawDomains = result.data.domains || []
      domains.value = rawDomains.map((d: any) => ({
        name: d.Name,
        type: d.Type
      }))
    }
  } catch (error: any) {
    console.error('加载域名列表失败:', error)
  }
}

const searchForm = reactive({
  filterType: 'roomName',
  keyword: ''
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: true,
  showPageSize: true
})

// 行选择配置
const rowSelection = reactive({
  type: 'checkbox',
  showCheckedAll: true,
  selectable: (record: any) => record.status !== 'live'
})

// 处理选择变化
const handleSelectionChange = (rowKeys: any[]) => {
  // 根据选中的行 keys 找到对应的记录
  selectedRows.value = tableData.value.filter(record => rowKeys.includes(record.id))
}

// 处理全选
const handleSelectAll = (checked: boolean) => {
  if (checked) {
    // 全选时，只选中非直播状态的记录
    selectedRows.value = tableData.value.filter(record => record.status !== 'live')
  } else {
    // 取消全选时，清空选中数据
    selectedRows.value = []
  }
}

const columns = computed(() => [
  {
    title: texts.value.colId,
    dataIndex: 'id',
    width: 50
  },
  {
    title: texts.value.colRoom,
    slotName: 'roomInfo',
    width: 180
  },
  {
    title: texts.value.colBroadcastFormat,
    slotName: 'broadcastFormat',
    width: 100
  },
  {
    title: texts.value.colStatus,
    slotName: 'status',
    width: 100
  },
  {
    title: texts.value.colStartTime,
    slotName: 'startTime',
    width: 180
  },
  {
    title: texts.value.colActions,
    slotName: 'actions',
    width: 280,
    fixed: 'right'
  }
])

const getRoomTypeText = (type: string) => {
  const map: Record<string, string> = {
    video: texts.value.roomTypeVideo,
    image: texts.value.roomTypeImage,
    vr: texts.value.roomTypeVr,
    audio: texts.value.roomTypeAudio,
    graphic: texts.value.roomTypeGraphic
  }
  return map[type] || type
}

const getBroadcastFormatText = (format: string) => {
  const map: Record<string, string> = {
    live: texts.value.formatLive,
    vod: texts.value.formatVod,
    pseudo: texts.value.formatPseudo
  }
  return map[format] || format
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    draft: texts.value.statusDraft,
    scheduled: texts.value.statusScheduled,
    live: texts.value.statusLive,
    ended: texts.value.statusEnded,
    archived: texts.value.statusArchived
  }
  return map[status] || status
}

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    draft: 'gray',
    scheduled: 'blue',
    live: 'red',
    ended: 'green',
    archived: 'gray'
  }
  return map[status] || 'gray'
}

const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '--'
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm')
}

// 将后端返回的大写下划线格式转换为前端驼峰格式
const convertToFrontendFormat = (data: any) => {
  return {
    id: data.ID,
    roomName: data.ROOM_NAME || '',
    roomType: data.ROOM_TYPE || 'video',
    broadcastFormat: data.BROADCAST_FORMAT || 'live',
    roomStage: data.ROOM_STAGE || 'formal',
    displayMode: data.DISPLAY_MODE || 'landscape',
    startTime: data.START_TIME || '',
    endTime: data.END_TIME || '',
    coverImage: data.COVER_IMAGE || '',
    viewingMethod: data.VIEWING_METHOD || 'public',
    viewingPassword: data.VIEWING_PASSWORD || '',
    viewingPrice: data.VIEWING_PRICE || 0,
    playbackMethod: data.PLAYBACK_METHOD || 'post_end',
    playbackValidity: data.PLAYBACK_VALIDITY || 'unlimited',
    playbackStartTime: data.PLAYBACK_START_TIME || '',
    playbackEndTime: data.PLAYBACK_END_TIME || '',
    status: data.STATUS || 'draft',
    viewerCount: data.VIEWER_COUNT || 0,
    peakViewerCount: data.PEAK_VIEWER_COUNT || 0,
    duration: data.DURATION || 0,
    description: data.DESCRIPTION || '',
    streamName: data.STREAM_NAME || '',
    pushUrl: data.PUSH_URL || '',
    playUrl: data.PLAY_URL || '',
    channel: data.CHANNEL || '--',
    viewingMethodText: data.VIEWING_METHOD === 'public' ? texts.value.statusPublic : (data.VIEWING_METHOD || texts.value.statusPublic),
    statusText: data.STATUS || ''
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    // 使用标准的通用数据查询接口
    const response = await api.post('/data/LIVE_ROOM/query', {
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      filters: {
        IS_ACTIVE: 'Y'
      }
    })

    if (response.data) {
      // 后端返回格式: { code, message, data: { total, page, pageSize, data: [...] } }
      const result = response.data.data
      const rawData = result.data || []

      // 确保 rawData 是数组
      if (Array.isArray(rawData)) {
        tableData.value = rawData.map((item: any) => convertToFrontendFormat(item))
      } else {
        console.warn('返回的数据不是数组:', rawData)
        tableData.value = []
      }

      pagination.total = result.total || 0
    }
  } catch (error: any) {
    console.error('获取数据失败:', error)
    Message.error(error.message || texts.value.loadDataFailed)
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  navigationStore.navigateTo('LiveRoomForm', texts.value.createTitle, {}, true)
}

const handleRefresh = () => {
  fetchData()
}

const handleSearch = () => {
  pagination.current = 1
  fetchData()
}

const handlePageChange = (page: number) => {
  pagination.current = page
  fetchData()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.current = 1
  fetchData()
}

const handleEdit = (record: any) => {
  navigationStore.navigateTo('LiveRoomForm', texts.value.editTitle, { roomId: record.id }, true)
}

const handleManage = (record: any) => {
  navigationStore.navigateTo('LiveRoomDetail', texts.value.detailTitle, { id: record.id }, false)
}

const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    return
  }

  Modal.confirm({
    title: texts.value.batchDeleteConfirmTitle,
    content: texts.value.batchDeleteConfirmContent.replace('{count}', String(selectedRows.value.length)),
    okText: texts.value.confirm,
    cancelText: texts.value.cancel,
    onOk: async () => {
      try {
        for (const record of selectedRows.value) {
          const getResponse = await api.get(`/data/LIVE_ROOM/${record.id}`)
          if (!getResponse.data?.data) {
            continue
          }
          await api.put(`/data/LIVE_ROOM/${record.id}`, {
            ...getResponse.data.data,
            IS_ACTIVE: 'N'
          })
        }
        Message.success(texts.value.batchDeleteSuccess.replace('{count}', String(selectedRows.value.length)))
        // 清空选中的行
        selectedRows.value = []
        fetchData()
      } catch (error: any) {
        Message.error(error.message || texts.value.batchDeleteFailed)
      }
    }
  })
}

const handleRecycle = (record: any) => {
  Modal.confirm({
    title: texts.value.recycleConfirmTitle,
    content: texts.value.recycleConfirmContent.replace('{name}', record.roomName),
    okText: texts.value.confirm,
    cancelText: texts.value.cancel,
    onOk: async () => {
      try {
        const getResponse = await api.get(`/data/LIVE_ROOM/${record.id}`)
        if (!getResponse.data?.data) {
          Message.error(texts.value.fetchDataFailed)
          return
        }
        await api.put(`/data/LIVE_ROOM/${record.id}`, {
          ...getResponse.data.data,
          IS_ACTIVE: 'N'
        })
        Message.success(texts.value.recycleSuccess)
        fetchData()
      } catch (error: any) {
        Message.error(error.message || texts.value.recycleFailed)
      }
    }
  })
}

// 其他处理函数
const handleShare = (record: any) => {
  Message.info(texts.value.inDevelopment)
}

const handleRecommend = (record: any) => {
  Message.info(texts.value.inDevelopment)
}

const handleTag = (record: any) => {
  Message.info(texts.value.inDevelopment)
}

const handleDataAnalysis = (record: any) => {
  Message.info(texts.value.inDevelopment)
}

const handleOperationRecommend = (record: any) => {
  Message.info(texts.value.inDevelopment)
}

const handleScreenInteraction = (record: any) => {
  Message.info(texts.value.inDevelopment)
}

const handleDownloadPlayback = (record: any) => {
  Message.info(texts.value.inDevelopment)
}

const handleRefreshPassword = (record: any) => {
  Modal.confirm({
    title: texts.value.refreshPasswordTitle,
    content: texts.value.refreshPasswordContent,
    okText: texts.value.confirm,
    cancelText: texts.value.cancel,
    onOk: async () => {
      try {
        const newPassword = Math.random().toString(36).slice(-8)
        const getResponse = await api.get(`/data/LIVE_ROOM/${record.id}`)
        if (!getResponse.data?.data) {
          Message.error(texts.value.fetchDataFailed)
          return
        }
        await api.put(`/data/LIVE_ROOM/${record.id}`, {
          ...getResponse.data.data,
          VIEWING_PASSWORD: newPassword
        })
        Message.success(texts.value.refreshPasswordSuccess.replace('{password}', newPassword))
        fetchData()
      } catch (error: any) {
        Message.error(error.message || texts.value.refreshPasswordFailed)
      }
    }
  })
}

const handleSetChannel = (record: any) => {
  Message.info(texts.value.inDevelopment)
}

const handleAdminMonitor = (record: any) => {
  Message.info(texts.value.inDevelopment)
}

const handlePullStreamTask = (record: any) => {
  navigationStore.navigateTo('PullStreamTask', texts.value.socialDistribution, { roomId: record.id }, false)
}

const handleHighlightClips = (record: any) => {
  navigationStore.navigateTo('LiveHighlightClips', texts.value.highlightClips, { roomId: record.id }, false)
}

const handleRecordings = (record: any) => {
  navigationStore.navigateTo('LiveRecordings', texts.value.recordings, { roomId: record.id }, false)
}

const handlePreview = async (record: any) => {
  try {
    const playDomain = domains.value.find(d => d.type === 1)
    if (!playDomain) {
      Message.warning(texts.value.noPlayDomainWarning)
      return
    }
    const streamName = record.streamName || String(record.id)
    const appName = 'live'
    navigationStore.navigateTo('LivePreview', texts.value.preview, {
      streamName,
      appName,
      playDomain: playDomain.name
    })
  } catch (error: any) {
    console.error('预览失败:', error)
    Message.error(texts.value.previewFailed)
  }
}

const handleCopy = async (record: any) => {
  try {
    const getResponse = await api.get(`/data/LIVE_ROOM/${record.id}`)
    if (!getResponse.data?.data) {
      Message.error(texts.value.fetchDataFailed)
      return
    }
    const originalData = getResponse.data.data
    const copyData = {
      ...originalData,
      ID: undefined,
      ROOM_NAME: `${originalData.ROOM_NAME} - 副本`
    }
    await api.post('/data/LIVE_ROOM', copyData)
    Message.success(texts.value.copySuccess)
    fetchData()
  } catch (error: any) {
    console.error('复制失败:', error)
    Message.error(error.message || texts.value.copyFailed)
  }
}

const handleStartLive = async (record: any) => {
  try {
    const getResponse = await api.get(`/data/LIVE_ROOM/${record.id}`)
    if (!getResponse.data?.data) {
      Message.error(texts.value.fetchDataFailed)
      return
    }
    const originalData = getResponse.data.data
    await api.put(`/data/LIVE_ROOM/${record.id}`, {
      ...originalData,
      STATUS: 'live',
      START_TIME: dayjs().format('YYYY-MM-DD HH:mm:ss')
    })
    Message.success(texts.value.startLiveSuccess)
    fetchData()
  } catch (error: any) {
    console.error('操作失败:', error)
    Message.error(error.message || texts.value.operationFailed)
  }
}

const handleBackToSite = () => {
  Message.info(texts.value.inDevelopment)
}

onMounted(() => {
  loadDomains()
  fetchData()
  unregisterBackCallback = navigationStore.onBack((fromComponent, toComponent) => {
    if (toComponent === 'LiveRoomList' && (fromComponent === 'LiveRoomForm')) {
      fetchData()
    }
  })
})

onUnmounted(() => {
  if (unregisterBackCallback) {
    unregisterBackCallback()
  }
})
</script>

<style scoped lang="scss">
.live-room-list {
  padding: 12px;
  background: #fff;
  height: 100%;
  overflow-y: auto;

  .action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e5e6eb;
  }

  .search-bar {
    margin-bottom: 12px;
  }

  .room-info {
    display: flex;
    gap: 8px;

    .room-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .room-name {
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 4px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .room-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: #86909c;
      }
    }
  }
}
</style>
