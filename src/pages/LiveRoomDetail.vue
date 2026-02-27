<template>
  <div class="live-room-detail">
    <div class="header">
      <a-button type="primary" @click="handleBack">
        <template #icon>
          <icon-arrow-left />
        </template>
        返回
      </a-button>
      <a-space>
        <a-button @click="handleEdit">
          <template #icon>
            <icon-edit />
          </template>
          编辑
        </a-button>
        <a-button @click="handleShare">
          <template #icon>
            <icon-share-alt />
          </template>
          分享
        </a-button>
        <a-button @click="handleDelete">
          <template #icon>
            <icon-delete />
          </template>
          删除
        </a-button>
      </a-space>
    </div>

    <div class="content">
      <a-tabs v-model:activeKey="activeKey" type="line" size="large">
        <a-tab-pane key="basic" title="基本信息">
          <a-form layout="vertical">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="直播间ID">
                  {{ roomInfo.id }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="直播间名称">
                  {{ roomInfo.roomName }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="直播间类型">
                  {{ roomInfo.roomType }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="播出形式">
                  {{ roomInfo.broadcastFormat }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="直播间阶段">
                  {{ roomInfo.roomStage }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="显示方式">
                  {{ roomInfo.displayMode }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="开始时间">
                  {{ formatDateTime(roomInfo.startTime) }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="结束时间">
                  {{ formatDateTime(roomInfo.endTime) }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="观看方式">
                  {{ roomInfo.viewingMethod }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="观看密码">
                  {{ roomInfo.viewingPassword }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="观看价格">
                  {{ roomInfo.viewingPrice }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="回放方式">
                  {{ roomInfo.playbackMethod }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="回放有效期">
                  {{ roomInfo.playbackValidity }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="推流地址">
                  {{ roomInfo.pushUrl }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="播放地址">
                  {{ roomInfo.playUrl }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="状态">
                  {{ roomInfo.status }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="观看人数">
                  {{ roomInfo.viewerCount }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="峰值观看人数">
                  {{ roomInfo.peakViewerCount }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="直播时长">
                  {{ roomInfo.duration }} 秒
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item label="直播间描述">
              {{ roomInfo.description }}
            </a-form-item>
            <a-form-item label="直播间封面">
              <a-image
                :src="roomInfo.coverImage || '/default-cover.png'"
                width="200"
                height="113"
                fit="cover"
              />
            </a-form-item>
          </a-form>
        </a-tab-pane>
        <a-tab-pane key="settings" title="直播设置">
          <a-form layout="vertical">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="流名称">
                  {{ roomInfo.streamName }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="推流域名">
                  {{ roomInfo.pushDomain }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="推流应用">
                  {{ roomInfo.pushApp }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="推流路径">
                  {{ roomInfo.pushPath }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="播放域名">
                  {{ roomInfo.playDomain }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="播放应用">
                  {{ roomInfo.playApp }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="播放路径">
                  {{ roomInfo.playPath }}
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-tab-pane>
        <a-tab-pane key="records" title="直播记录">
          <a-table :columns="recordColumns" :data="recordData" :loading="recordLoading">
            <template #playTime="{ record }">
              {{ formatDateTime(record.playTime) }}
            </template>
            <template #duration="{ record }">
              {{ record.duration }} 秒
            </template>
            <template #actions="{ record }">
              <a-space>
                <a-link @click="handlePlay(record)">播放</a-link>
                <a-link @click="handleDownload(record)">下载</a-link>
              </a-space>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="statistics" title="数据分析">
          <a-form layout="vertical">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="总观看人数">
                  {{ statistics.totalViewerCount }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="总观看时长">
                  {{ statistics.totalDuration }} 秒
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="平均观看时长">
                  {{ statistics.avgDuration }} 秒
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="最高同时在线人数">
                  {{ statistics.maxConcurrentViewers }}
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import api from '../api/http'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const activeKey = ref('basic')
const roomInfo = ref({})
const statistics = ref({})
const recordData = ref([])
const recordLoading = ref(false)

const recordColumns = [
  {
    title: '播放时间',
    slotName: 'playTime',
    width: 180
  },
  {
    title: '播放地址',
    dataIndex: 'playUrl',
    width: 400
  },
  {
    title: '播放时长',
    slotName: 'duration',
    width: 120
  },
  {
    title: '操作',
    slotName: 'actions',
    width: 120,
    fixed: 'right'
  }
]

const handleBack = () => {
  router.push('/live/rooms')
}

const handleEdit = () => {
  router.push(`/live/rooms/edit/${route.params.id}`)
}

const handleShare = () => {
  Message.info('分享功能开发中')
}

const handleDelete = () => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除直播间"${roomInfo.value.roomName}"吗？`,
    onOk: async () => {
      try {
        await api.delete(`/live/rooms/${route.params.id}`)
        Message.success('删除成功')
        router.push('/live/rooms')
      } catch (error: any) {
        Message.error(error.message || '删除失败')
      }
    }
  })
}

const handlePlay = (record: any) => {
  window.open(record.playUrl)
}

const handleDownload = (record: any) => {
  Message.info('下载功能开发中')
}

const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '--'
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm')
}

const fetchRoomInfo = async () => {
  try {
    const response = await api.get(`/live/rooms/${route.params.id}`)
    roomInfo.value = response.data.data
  } catch (error: any) {
    Message.error(error.message || '获取直播间信息失败')
  }
}

const fetchStatistics = async () => {
  try {
    const response = await api.get(`/live/rooms/${route.params.id}/statistics`)
    statistics.value = response.data.data
  } catch (error: any) {
    Message.error(error.message || '获取统计信息失败')
  }
}

const fetchRecords = async () => {
  recordLoading.value = true
  try {
    const response = await api.get(`/live/rooms/${route.params.id}/records`)
    recordData.value = response.data.data
  } catch (error: any) {
    Message.error(error.message || '获取播放记录失败')
  } finally {
    recordLoading.value = false
  }
}

onBeforeMount(() => {
  fetchRoomInfo()
  fetchStatistics()
  fetchRecords()
})
</script>

<style scoped lang="scss">
.live-room-detail {
  padding: 20px;
  background: #fff;
  min-height: 100vh;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .content {
    margin-top: 20px;
  }

  .tab-content {
    padding: 20px;
  }
}
</style>
