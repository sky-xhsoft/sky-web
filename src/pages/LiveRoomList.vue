<template>
  <div class="live-room-list">
    <!-- 操作栏 -->
    <div class="action-bar">
      <a-space size="medium">
        <a-button type="primary" @click="handleCreate">
          <template #icon>
            <icon-plus />
          </template>
          创建直播
        </a-button>
        <a-button>
          <template #icon>
            <icon-import />
          </template>
          批量创建直播
        </a-button>
        <a-button>
          <template #icon>
            <icon-settings />
          </template>
          直播全局设置
        </a-button>
        <a-button>
          <template #icon>
            <icon-calendar />
          </template>
          直播教程
        </a-button>
      </a-space>

      <a-space size="medium">
        <a-badge :count="0" :dot-style="{ width: '8px', height: '8px' }">
          <a-button>
            <template #icon>
              <icon-clock-circle />
            </template>
            待整改直播内容 (0)
          </a-button>
        </a-badge>
        <a-button>
          <template #icon>
            <icon-share-alt />
          </template>
          分类管理
        </a-button>
        <a-button @click="handleBackToSite">
          <template #icon>
            <icon-export />
          </template>
          回收站
        </a-button>
      </a-space>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <a-space size="medium">
        <a-dropdown trigger="click">
          <a-button>
            所有筛选
            <icon-down />
          </a-button>
          <template #content>
            <a-doption>直播类型</a-doption>
            <a-doption>直播形式</a-doption>
            <a-doption>直播状态</a-doption>
            <a-doption>观看方式</a-doption>
          </template>
        </a-dropdown>

        <a-select
          v-model="searchForm.filterType"
          placeholder="直播名称"
          style="width: 150px"
        >
          <a-option value="roomName">直播名称</a-option>
          <a-option value="id">直播ID</a-option>
          <a-option value="streamName">流名称</a-option>
        </a-select>

        <a-input
          v-model="searchForm.keyword"
          placeholder="请输入直播名称"
          style="width: 300px"
          allow-clear
        >
          <template #prefix>
            <icon-search />
          </template>
        </a-input>

        <a-button type="primary" @click="handleSearch">搜索</a-button>
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
    >
      <template #roomInfo="{ record }">
        <div class="room-info">
          <a-image
            :src="record.coverImage || '/default-cover.png'"
            width="120"
            height="68"
            fit="cover"
          />
          <div class="room-details">
            <div class="room-name">{{ record.roomName }}</div>
            <div class="room-meta">
              <a-tag>{{ record.viewingMethodText }}</a-tag>
              <span>{{ record.statusText }}</span>
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
          <a-link @click="handleManage(record)">管理</a-link>
          <a-dropdown trigger="click">
            <a-link>
              <icon-more />
            </a-link>
            <template #content>
              <a-doption @click="handleShare(record)">
                <icon-share-alt />
                分享
              </a-doption>
              <a-doption @click="handleRecommend(record)">
                <icon-thumb-up />
                推荐
              </a-doption>
              <a-doption @click="handleTag(record)">
                <icon-tags />
                打标签
              </a-doption>
              <a-doption @click="handleDataAnalysis(record)">
                <icon-bar-chart />
                数据分析
              </a-doption>
              <a-doption @click="handleOperationRecommend(record)">
                <icon-fire />
                推荐运营
              </a-doption>
              <a-doption @click="handleScreenInteraction(record)">
                <icon-desktop />
                大屏互动
              </a-doption>
              <a-doption @click="handleDownloadPlayback(record)">
                <icon-download />
                下载回放视频
              </a-doption>
              <a-doption @click="handleRefreshPassword(record)">
                <icon-refresh />
                刷新密码
              </a-doption>
              <a-doption @click="handleEdit(record)">
                <icon-edit />
                编辑
              </a-doption>
              <a-doption @click="handleCopy(record)">
                <icon-copy />
                复制
              </a-doption>
              <a-doption @click="handleRecycle(record)">
                <icon-delete />
                回收
              </a-doption>
              <a-doption @click="handleSetChannel(record)">
                <icon-settings />
                设置直播频道
              </a-doption>
              <a-doption @click="handleAdminMonitor(record)">
                <icon-eye />
                管理员监听
              </a-doption>
            </template>
          </a-dropdown>
        </a-space>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { useNavigationStore } from '../stores/navigation'
import api from '../api/http'
import dayjs from 'dayjs'

const navigationStore = useNavigationStore()
const loading = ref(false)
const tableData = ref([])

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

const rowSelection = reactive({
  type: 'checkbox',
  showCheckedAll: true
})

const columns = [
  {
    title: '直播ID',
    dataIndex: 'id',
    width: 100
  },
  {
    title: '直播',
    slotName: 'roomInfo',
    width: 300
  },
  {
    title: '直播类型',
    slotName: 'roomType',
    width: 100
  },
  {
    title: '直播形式',
    slotName: 'broadcastFormat',
    width: 100
  },
  {
    title: '直播状态',
    slotName: 'status',
    width: 100
  },
  {
    title: '频道',
    dataIndex: 'channel',
    width: 80
  },
  {
    title: '开始',
    slotName: 'startTime',
    width: 180
  },
  {
    title: '操作',
    slotName: 'actions',
    width: 200,
    fixed: 'right'
  }
]

const getRoomTypeText = (type: string) => {
  const map: Record<string, string> = {
    video: '视频直播',
    image: '图片直播',
    vr: 'VR直播',
    audio: '语音直播',
    graphic: '图文直播'
  }
  return map[type] || type
}

const getBroadcastFormatText = (format: string) => {
  const map: Record<string, string> = {
    live: '直播',
    vod: '点播/录播',
    pseudo: '伪直播'
  }
  return map[format] || format
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    draft: '未开始',
    scheduled: '已排期',
    live: '直播中',
    ended: '已结束',
    archived: '已归档'
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
    viewingMethodText: data.VIEWING_METHOD || '公开',
    statusText: data.STATUS || '草稿'
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
      filters: {}
    })

    if (response.data) {
      // 后端返回格式: { code, message, data: { total, page, pageSize, data: [...] } }
      const result = response.data.data
      const rawData = result.data || []

      console.log('原始数据数组:', rawData)

      // 确保 rawData 是数组
      if (Array.isArray(rawData)) {
        tableData.value = rawData.map((item: any) => convertToFrontendFormat(item))
        console.log('转换后的表格数据:', tableData.value)
      } else {
        console.warn('返回的数据不是数组:', rawData)
        tableData.value = []
      }

      pagination.total = result.total || 0
      console.log('分页信息:', pagination)
    }
  } catch (error: any) {
    console.error('获取数据失败:', error)
    Message.error(error.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  navigationStore.navigateTo('LiveRoomForm', '创建直播间', {}, true)
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
  navigationStore.navigateTo('LiveRoomForm', '编辑直播间', { roomId: record.id }, true)
}

const handleManage = (record: any) => {
  // TODO: 跳转到直播间管理页面
  Message.info('管理功能开发中')
}

const handleShare = (record: any) => {
  Message.info('分享功能开发中')
}

const handleRecommend = (record: any) => {
  Message.info('推荐功能开发中')
}

const handleTag = (record: any) => {
  Message.info('打标签功能开发中')
}

const handleDataAnalysis = (record: any) => {
  Message.info('数据分析功能开发中')
}

const handleOperationRecommend = (record: any) => {
  Message.info('推荐运营功能开发中')
}

const handleScreenInteraction = (record: any) => {
  Message.info('大屏互动功能开发中')
}

const handleDownloadPlayback = (record: any) => {
  Message.info('下载回放视频功能开发中')
}

const handleRefreshPassword = (record: any) => {
  Modal.confirm({
    title: '刷新密码',
    content: '确定要刷新该直播间的观看密码吗？',
    onOk: async () => {
      try {
        // 生成新密码
        const newPassword = Math.random().toString(36).slice(-8)
        const getResponse = await api.get(`/data/LIVE_ROOM/${record.id}`)
        if (!getResponse.data?.data) {
          Message.error('获取数据失败')
          return
        }
        await api.put(`/data/LIVE_ROOM/${record.id}`, {
          ...getResponse.data.data,
          VIEWING_PASSWORD: newPassword
        })
        Message.success(`密码已刷新为: ${newPassword}`)
        fetchData()
      } catch (error: any) {
        Message.error(error.message || '刷新密码失败')
      }
    }
  })
}

const handleRecycle = (record: any) => {
  Modal.confirm({
    title: '确认回收',
    content: `确定要将直播间"${record.roomName}"移至回收站吗？`,
    onOk: async () => {
      try {
        const getResponse = await api.get(`/data/LIVE_ROOM/${record.id}`)
        if (!getResponse.data?.data) {
          Message.error('获取数据失败')
          return
        }
        await api.put(`/data/LIVE_ROOM/${record.id}`, {
          ...getResponse.data.data,
          IS_ACTIVE: 'N'
        })
        Message.success('已移至回收站')
        fetchData()
      } catch (error: any) {
        Message.error(error.message || '回收失败')
      }
    }
  })
}

const handleSetChannel = (record: any) => {
  Message.info('设置直播频道功能开发中')
}

const handleAdminMonitor = (record: any) => {
  Message.info('管理员监听功能开发中')
}

const handleCopy = async (record: any) => {
  try {
    // 先获取原记录数据
    const getResponse = await api.get(`/data/LIVE_ROOM/${record.id}`)

    if (!getResponse.data?.data) {
      Message.error('获取数据失败')
      return
    }

    const originalData = getResponse.data.data

    // 复制数据并创建新记录（使用大写下划线格式）
    const copyData = {
      ...originalData,
      ID: undefined, // 移除 ID，让后端自动生成
      ROOM_NAME: `${originalData.ROOM_NAME} - 副本`
    }

    await api.post('/data/LIVE_ROOM', copyData)
    Message.success('复制成功')
    fetchData()
  } catch (error: any) {
    console.error('复制失败:', error)
    Message.error(error.message || '复制失败')
  }
}

const handleStartLive = async (record: any) => {
  try {
    // 先获取完整的原始数据
    const getResponse = await api.get(`/data/LIVE_ROOM/${record.id}`)

    if (!getResponse.data?.data) {
      Message.error('获取数据失败')
      return
    }

    const originalData = getResponse.data.data

    // 更新状态和开始时间（使用MySQL格式）
    await api.put(`/data/LIVE_ROOM/${record.id}`, {
      ...originalData,
      STATUS: 'live',
      START_TIME: dayjs().format('YYYY-MM-DD HH:mm:ss')
    })
    Message.success('直播已开始')
    fetchData()
  } catch (error: any) {
    console.error('操作失败:', error)
    Message.error(error.message || '操作失败')
  }
}

const handleBackToSite = () => {
  // TODO: 跳转到回收站
  Message.info('回收站功能开发中')
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.live-room-list {
  padding: 20px;
  background: #fff;
  height: 100%;
  overflow-y: auto;

  .action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e5e6eb;
  }

  .search-bar {
    margin-bottom: 20px;
  }

  .room-info {
    display: flex;
    gap: 12px;

    .room-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .room-name {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .room-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #86909c;
      }
    }
  }
}
</style>
