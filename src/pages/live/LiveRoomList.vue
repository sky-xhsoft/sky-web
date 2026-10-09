<template>
  <div class="live-room-list">
    <!-- 操作栏 -->
    <div class="action-bar">
      <a-space size="medium">
        <a-button type="primary" @click="handleCreate">
          <template #icon>
            <icon-plus />
          </template>
          {{ t('liveRoomList.createLiveRoom') }}
        </a-button>
      </a-space>
      <a-space size="medium">
        <a-button @click="handleRefresh">
          <template #icon>
            <icon-refresh />
          </template>
          {{ t('liveRoomList.refresh') }}
        </a-button>
        <a-button v-if="selectedRows.length > 0" type="primary" status="danger" @click="handleBatchDelete">
          <template #icon>
            <icon-delete />
          </template>
          {{ t('liveRoomList.batchDelete') }} ({{ selectedRows.length }})
        </a-button>
      </a-space>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <a-space size="medium">
        <a-dropdown trigger="click">
          <a-button>
            {{ t('liveRoomList.allFilters') }}
            <icon-down />
          </a-button>
          <template #content>
            <a-doption>{{ t('liveRoomList.filters.roomType') }}</a-doption>
            <a-doption>{{ t('liveRoomList.filters.broadcastFormat') }}</a-doption>
            <a-doption>{{ t('liveRoomList.filters.liveStatus') }}</a-doption>
            <a-doption>{{ t('liveRoomList.filters.viewingMethod') }}</a-doption>
          </template>
        </a-dropdown>

        <a-select
          v-model="searchForm.filterType"
          :placeholder="t('liveRoomList.filterBy')"
          style="width: 150px"
          @change="handleSearch"
        >
          <a-option value="roomName">{{ t('liveRoomList.liveName') }}</a-option>
          <a-option value="id">{{ t('liveRoomList.liveId') }}</a-option>
          <a-option value="streamName">{{ t('liveRoomList.streamName') }}</a-option>
        </a-select>

        <a-input
          v-model="searchForm.keyword"
          :placeholder="t('liveRoomList.searchPlaceholder')"
          style="width: 300px"
          allow-clear
        >
          <template #prefix>
            <icon-search />
          </template>
        </a-input>

        <a-button type="primary" @click="handleSearch">{{ t('liveRoomList.search') }}</a-button>
      </a-space>
    </div>

    <!-- 直播间卡片列表 -->
    <a-spin :loading="loading" class="room-card-spin">
    <div class="room-card-grid">
      <a-empty v-if="tableData.length === 0 && !loading" :description="t('liveRoomList.empty')" />
      <a-grid :cols="{ xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 6 }" :col-gap="16" :row-gap="16">
        <a-grid-item v-for="record in tableData" :key="record.id">
          <a-card :bordered="false" hoverable class="room-card">
            <template #cover>
              <div class="room-card-cover" @click="handleManage(record)">
                <a-image :src="record.coverImage || '/default-cover.png'" fit="cover" class="room-card-img" />
                <a-tag class="status-badge" :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
              </div>
            </template>
            <a-card-meta>
              <template #title>
                <div class="room-card-title" @click="handleManage(record)">{{ record.roomName }}</div>
              </template>
              <template #description>
                <div class="room-card-meta">
                  <div class="meta-line"><span class="meta-label">{{ t('liveRoomList.broadcastFormat') }}</span><span>{{ getBroadcastFormatText(record.broadcastFormat) }}</span></div>
                  <div class="meta-line"><span class="meta-label">{{ t('liveRoomList.viewingMethod') }}</span><span>{{ getViewingMethodText(record.viewingMethod) }}</span></div>
                  <div class="meta-line"><span class="meta-label">{{ t('liveRoomList.startTime') }}</span><span>{{ formatDateTime(record.startTime) }}</span></div>
                </div>
              </template>
            </a-card-meta>
            <template #extra>
              <a-space><a-link @click="handleManage(record)">{{ t('liveRoomList.manage') }}</a-link></a-space>
            </template>
            <template #actions>
              <a-space class="room-card-actions">
                <a-button size="mini" type="text" @click="handleEdit(record)"><template #icon><icon-edit /></template>{{ t('liveRoomList.edit') }}</a-button>
                <a-button size="mini" type="text" @click="handleSpeechTask(record)"><template #icon><icon-language /></template>{{ t('liveRoomList.speechSubtitle') }}</a-button>
                <a-button size="mini" type="text" v-if="record.status === 'live'" @click="handlePreview(record)">{{ t('liveRoomList.preview') }}</a-button>
                <a-button size="mini" type="text" @click="handlePullStreamTask(record)">{{ t('liveRoomList.socialDistribution') }}</a-button>
                <a-button size="mini" type="text" @click="handleHighlightClips(record)">{{ t('liveRoomList.highlightClips') }}</a-button>
                <a-button size="mini" type="text" @click="handleRecordings(record)">{{ t('liveRoomList.liveRecordings') }}</a-button>
                <a-button size="mini" type="text" status="danger" v-if="record.status !== 'live'" @click="handleRecycle(record)"><template #icon><icon-delete /></template>{{ t('liveRoomList.delete') }}</a-button>
              </a-space>
            </template>
          </a-card>
        </a-grid-item>
      </a-grid>
      <!-- 分页 -->
      <div class="room-card-pagination">
        <a-pagination
          :current="pagination.current"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          show-total
          show-page-size
          @change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        />
      </div>
    </div>
    </a-spin>

    <!-- 新增字幕同传任务弹窗 -->
    <SpeechTaskModal
      v-model:visible="speechModalVisible"
      :record="currentSpeechRecord"
      :title="t('liveRoomList.addSpeechTask')"
      :ok-text="t('liveRoomList.createSpeechTask')"
      @success="onSpeechTaskSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { useNavigationStore } from '../../stores/navigation'
import api from '../../api/http'
import { listDomains } from '../../api/live'
import dayjs from 'dayjs'
import { IconRefresh, IconDelete, IconLanguage } from '@arco-design/web-vue/es/icon'
import { useI18n } from 'vue-i18n'
import { convertLiveRoomToFrontend, getStatusColor } from '../../composables/useLiveRoomData'
import SpeechTaskModal from './components/SpeechTaskModal.vue'

const { t } = useI18n()

const navigationStore = useNavigationStore()
const loading = ref(false)
const tableData = ref([])
const domains = ref<{ name: string; type: number }[]>([])
let unregisterBackCallback: (() => void) | null = null

// 选中的行
const selectedRows = ref<any[]>([])

// 字幕同传弹窗状态
const speechModalVisible = ref(false)
const currentSpeechRecord = ref<any>(null)

const handleSpeechTask = (record: any) => {
  currentSpeechRecord.value = record
  speechModalVisible.value = true
}

const onSpeechTaskSuccess = () => {
  // 创建成功后可按需刷新
}

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

const getBroadcastFormatText = (format: string) => {
  const map: Record<string, string> = {
    live: t('liveRoomList.broadcastFormats.live'),
    vod: t('liveRoomList.broadcastFormats.vod'),
    pseudo: t('liveRoomList.broadcastFormats.pseudo')
  }
  return map[format] || format
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    draft: t('liveRoomList.statuses.draft'),
    scheduled: t('liveRoomList.statuses.scheduled'),
    live: t('liveRoomList.statuses.live'),
    ended: t('liveRoomList.statuses.ended'),
    archived: t('liveRoomList.statuses.archived')
  }
  return map[status] || status
}

const getViewingMethodText = (method: string) => {
  const map: Record<string, string> = {
    public: t('liveRoomList.viewingMethods.public'),
    password: t('liveRoomList.viewingMethods.password'),
    pay: t('liveRoomList.viewingMethods.pay')
  }
  return map[method] || method
}

const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '--'
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm')
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
        tableData.value = rawData.map((item: any) => convertLiveRoomToFrontend(item))
      } else {
        console.warn('返回的数据不是数组:', rawData)
        tableData.value = []
      }

      pagination.total = result.total || 0
    }
  } catch (error: any) {
    console.error('获取数据失败:', error)
    Message.error(error.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  navigationStore.navigateTo('LiveRoomForm', t('liveRoomList.createLiveRoom'), {}, true)
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
  navigationStore.navigateTo('LiveRoomForm', t('liveRoomList.edit'), { roomId: record.id }, true)
}

const handleManage = (record: any) => {
  navigationStore.navigateTo('LiveRoomDetail', t('liveRoomList.liveRoom') + ' ' + t('layout.roomDetail'), { id: record.id }, false)
}

const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    return
  }

  Modal.confirm({
    title: t('liveRoomList.batchDeleteConfirm.title'),
    content: t('liveRoomList.batchDeleteConfirm.content', { count: selectedRows.value.length }),
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
        Message.success(t('liveRoomList.batchDeleteConfirm.success', { count: selectedRows.value.length }))
        // 清空选中的行
        selectedRows.value = []
        fetchData()
      } catch (error: any) {
        Message.error(error.message || '批量删除失败')
      }
    }
  })
}

const handleRecycle = (record: any) => {
  Modal.confirm({
    title: t('liveRoomList.recycleConfirm.title'),
    content: t('liveRoomList.recycleConfirm.content', { name: record.roomName }),
    onOk: async () => {
      try {
        const getResponse = await api.get(`/data/LIVE_ROOM/${record.id}`)
        if (!getResponse.data?.data) {
          Message.error(t('liveRoomList.messages.fetchData'))
          return
        }
        await api.put(`/data/LIVE_ROOM/${record.id}`, {
          ...getResponse.data.data,
          IS_ACTIVE: 'N'
        })
        Message.success(t('liveRoomList.recycleConfirm.success'))
        fetchData()
      } catch (error: any) {
        Message.error(error.message || t('liveRoomList.recycleConfirm.failed'))
      }
    }
  })
}

const handlePullStreamTask = (record: any) => {
  navigationStore.navigateTo('PullStreamTask', t('liveRoomList.socialDistribution'), { roomId: record.id }, false)
}

const handleHighlightClips = (record: any) => {
  navigationStore.navigateTo('LiveHighlightClips', t('liveRoomList.highlightClips'), { roomId: record.id }, false)
}

const handleRecordings = (record: any) => {
  navigationStore.navigateTo('LiveRecordings', t('liveRoomList.liveRecordings'), { roomId: record.id }, false)
}

const handlePreview = async (record: any) => {
  try {
    const playDomain = domains.value.find(d => d.type === 1)
    if (!playDomain) {
      Message.warning(t('liveRoomList.messages.preview.noPlayDomain'))
      return
    }
    const streamName = record.streamName || String(record.id)
    const appName = 'live'
    navigationStore.navigateTo('LivePreview', t('liveRoomList.preview'), {
      streamName,
      appName,
      playDomain: playDomain.name,
      roomName: record.roomName
    })
  } catch (error: any) {
    console.error('预览失败:', error)
    Message.error(t('liveRoomList.messages.preview.failed'))
  }
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


  .room-card-spin {
    display: block;
    width: 100%;
  }

  .room-card-grid {
    .room-card {
      border: 1px solid rgb(var(--gray-3));
      border-radius: 8px;
      transition: border-color 0.2s;
      overflow: hidden;
      &:hover { border-color: rgb(var(--primary-6)); }
      .room-card-cover {
        position: relative;
        height: 140px;
        overflow: hidden;
        cursor: pointer;
        .room-card-img { width: 100%; height: 140px; object-fit: cover; }
        .status-badge { position: absolute; top: 8px; right: 8px; }
      }
      .room-card-title {
        font-size: 14px; font-weight: 600; cursor: pointer;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        &:hover { color: rgb(var(--primary-6)); }
      }
      .room-card-meta {
        .meta-line {
          display: flex; justify-content: space-between;
          font-size: 12px; color: #4e5969; margin-bottom: 4px;
          .meta-label { color: #86909c; }
        }
      }
      .room-card-actions { flex-wrap: wrap; row-gap: 4px; }
    }
  }
  .room-card-pagination {
    display: flex; justify-content: flex-end; margin-top: 16px;
    padding-top: 12px; border-top: 1px solid #f2f3f5;
  }
}
</style>
