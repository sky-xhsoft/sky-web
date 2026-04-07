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
        <a-button @click="handlePullStreamTask">
          <template #icon>
            <icon-export />
          </template>
          社媒分发
        </a-button>
        <a-button @click="handleHighlightClips">
          <template #icon>
            <icon-scissor />
          </template>
          直播切片
        </a-button>
        <a-button @click="handleRecordings">
          <template #icon>
            <icon-file />
          </template>
          直播录制
        </a-button>
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
          <a-form layout="inline" size="small" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-row :gutter="8">
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
                <a-form-item label="播出形式">
                  {{ getBroadcastFormatText(roomInfo.broadcastFormat) }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="开始时间">
                  {{ formatDateTime(roomInfo.startTime) }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="状态">
                  {{ getStatusText(roomInfo.status) }}
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item label="直播间封面">
              <a-image
                :src="roomInfo.coverImage || '/default-cover.png'"
                width="200"
                height="113"
                fit="cover"
              />
            </a-form-item>
            <a-divider style="margin: 20px 0;" />
            <div class="settings-container">
              <div class="section-header">推流信息</div>
                <a-form layout="vertical" size="small">
                  <a-form-item label="推流地址">
                    <div class="push-addresses">
                      <div class="address-item">
                        <span class="address-label">RTMP 地址：</span>
                        <a-space>
                          <span class="address-value">{{ getRtmpPushUrl() }}</span>
                          <a-button size="mini" type="text" @click="copyToClipboard(getRtmpPushUrl())">复制</a-button>
                        </a-space>
                      </div>
                      <div class="address-item">
                        <span class="address-label">WebRTC 地址：</span>
                        <a-space>
                          <span class="address-value">{{ getWebrtcPushUrl() }}</span>
                          <a-button size="mini" type="text" @click="copyToClipboard(getWebrtcPushUrl())">复制</a-button>
                        </a-space>
                      </div>
                      <div class="address-item">
                        <span class="address-label">SRT 地址：</span>
                        <a-space>
                          <span class="address-value">{{ getSrtPushUrl() }}</span>
                          <a-button size="mini" type="text" @click="copyToClipboard(getSrtPushUrl())">复制</a-button>
                        </a-space>
                      </div>
                      <div class="address-item">
                        <span class="address-label">OBS服务器：</span>
                        <a-space>
                          <span class="address-value">{{ getObsServerUrl() }}</span>
                          <a-button size="mini" type="text" @click="copyToClipboard(getObsServerUrl())">复制</a-button>
                        </a-space>
                      </div>
                      <div class="address-item">
                        <span class="address-label">OBS推流码：</span>
                        <a-space>
                          <span class="address-value">{{ getObsStreamKey() }}</span>
                          <a-button size="mini" type="text" @click="copyToClipboard(getObsStreamKey())">复制</a-button>
                        </a-space>
                      </div>
                      <div style="margin-top: 16px;">
                        <a-button type="primary" size="small" @click="copyAllPushUrls()">
                          <template #icon>
                            <icon-copy />
                          </template>
                          一键复制所有地址
                        </a-button>
                      </div>
                    </div>
                  </a-form-item>
                </a-form>
              <div class="section-header" style="margin-top: 20px;">拉流信息</div>
                <a-form layout="vertical" size="small">
                  <a-form-item label="播放地址">
                    <div class="pull-addresses">
                      <div class="address-item">
                        <span class="address-label">RTMP 地址：</span>
                        <a-space>
                          <span class="address-value">{{ getRtmpPullUrl() }}</span>
                          <a-button size="mini" type="text" @click="copyToClipboard(getRtmpPullUrl())">复制</a-button>
                        </a-space>
                      </div>
                      <div class="address-item">
                        <span class="address-label">HTTP-FLV 地址：</span>
                        <a-space>
                          <span class="address-value">{{ getFlvPullUrl() }}</span>
                          <a-button size="mini" type="text" @click="copyToClipboard(getFlvPullUrl())">复制</a-button>
                        </a-space>
                      </div>
                      <div class="address-item">
                        <span class="address-label">HLS 地址：</span>
                        <a-space>
                          <span class="address-value">{{ getHlsPullUrl() }}</span>
                          <a-button size="mini" type="text" @click="copyToClipboard(getHlsPullUrl())">复制</a-button>
                        </a-space>
                      </div>
                      <div style="margin-top: 16px;">
                        <a-button type="primary" size="small" @click="copyAllPullUrls()">
                          <template #icon>
                            <icon-copy />
                          </template>
                          一键复制所有地址
                        </a-button>
                      </div>
                    </div>
                  </a-form-item>
                </a-form>
            </div>
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
import { useNavigationStore } from '../stores/navigation'
import api from '../api/http'
import dayjs from 'dayjs'
import { generatePushURL, generatePlayURL } from '../api/live'
import { IconExport, IconScissor, IconFile } from '@arco-design/web-vue/es/icon'

const route = useRoute()
const router = useRouter()
const navigationStore = useNavigationStore()

const activeKey = ref('basic')
const roomInfo = ref({})
const settingsActiveKey = ref(['push'])

// 推流地址数据
const pushUrls = ref({
  rtmp: '',
  webrtc: '',
  srt: '',
  obsServer: '',
  obsStreamKey: ''
})

// 拉流地址数据
const pullUrls = ref({
  rtmp: '',
  flv: '',
  hls: ''
})

// 生成推流地址
const generatePushUrls = async () => {
  try {
    const expireTime = dayjs().add(7, 'day').unix()
    const response = await generatePushURL({
      domainName: roomInfo.value.pushDomain || 'upload.skyzhou.cn',
      appName: roomInfo.value.pushApp || 'live',
      streamName: String(roomInfo.value.streamName || roomInfo.value.id),
      streamKey: 'd0d87c303d4df45fd648af77ea4a9516',
      expireTime: expireTime
    })
    if (response.data?.data) {
      const data = response.data.data
      pushUrls.value.rtmp = data.pushUrl || ''
      pushUrls.value.webrtc = data.pushUrlWebRtc || ''
      pushUrls.value.srt = data.pushUrlSrt || ''
      pushUrls.value.obsServer = `rtmp://${roomInfo.value.pushDomain || 'upload.skyzhou.cn'}/${roomInfo.value.pushApp || 'live'}/`
      pushUrls.value.obsStreamKey = String(roomInfo.value.streamName || roomInfo.value.id) + '?' + new URLSearchParams(new URL(data.pushUrl || '').search)
    }
  } catch (error: any) {
    console.error('生成推流地址失败:', error)
    // 使用默认地址
    const streamName = String(roomInfo.value.streamName || roomInfo.value.id)
    pushUrls.value.rtmp = `rtmp://${roomInfo.value.pushDomain || 'upload.skyzhou.cn'}/${roomInfo.value.pushApp || 'live'}/${streamName}?txSecret=a88a10b5546f11fb27d03f49163f0d2f&txTime=69AB479A`
    pushUrls.value.webrtc = `webrtc://${roomInfo.value.pushDomain || 'upload.skyzhou.cn'}/${roomInfo.value.pushApp || 'live'}/${streamName}?txSecret=a88a10b5546f11fb27d03f49163f0d2f&txTime=69AB479A`
    pushUrls.value.srt = `srt://${roomInfo.value.pushDomain || 'upload.skyzhou.cn'}:9000?streamid=#!::h=${roomInfo.value.pushDomain || 'upload.skyzhou.cn'}/${roomInfo.value.pushApp || 'live'}/${streamName},txSecret=a88a10b5546f11fb27d03f49163f0d2f,txTime=69AB479A`
    pushUrls.value.obsServer = `rtmp://${roomInfo.value.pushDomain || 'upload.skyzhou.cn'}/${roomInfo.value.pushApp || 'live'}/`
    pushUrls.value.obsStreamKey = `${streamName}?txSecret=a88a10b5546f11fb27d03f49163f0d2f&txTime=69AB479A`
  }
}

// 生成拉流地址
const generatePullUrls = async () => {
  try {
    const expireTime = dayjs().add(7, 'day').unix()
    const response = await generatePlayURL({
      playDomain: roomInfo.value.playDomain || 'play.skyzhou.cn',
      appName: roomInfo.value.playApp || 'live',
      streamName: String(roomInfo.value.streamName || roomInfo.value.id),
      playKey: '',
      expireTime: expireTime
    })
    if (response.data?.data) {
      const data = response.data.data
      pullUrls.value.rtmp = data.rtmp || ''
      pullUrls.value.flv = data.flv || ''
      pullUrls.value.hls = data.hls || ''
    }
  } catch (error: any) {
    console.error('生成拉流地址失败:', error)
    // 使用默认地址
    const streamName = String(roomInfo.value.streamName || roomInfo.value.id)
    pullUrls.value.rtmp = `rtmp://${roomInfo.value.playDomain || 'play.skyzhou.cn'}/${roomInfo.value.playApp || 'live'}/${streamName}`
    pullUrls.value.flv = `http://${roomInfo.value.playDomain || 'play.skyzhou.cn'}/${roomInfo.value.playApp || 'live'}/${streamName}.flv`
    pullUrls.value.hls = `http://${roomInfo.value.playDomain || 'play.skyzhou.cn'}/${roomInfo.value.playApp || 'live'}/${streamName}.m3u8`
  }
}

// 生成推流地址函数
const getRtmpPushUrl = () => {
  return pushUrls.value.rtmp
}

const getWebrtcPushUrl = () => {
  return pushUrls.value.webrtc
}

const getSrtPushUrl = () => {
  return pushUrls.value.srt
}

const getObsServerUrl = () => {
  return pushUrls.value.obsServer
}

const getObsStreamKey = () => {
  return pushUrls.value.obsStreamKey
}

// 复制到剪贴板
const copyToClipboard = (text: string) => {
  if (!text) return
  navigator.clipboard.writeText(text)
    .then(() => {
      Message.success('已复制到剪贴板')
    })
    .catch(() => {
      // 降级方案：使用传统方法复制
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      textarea.style.top = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        Message.success('已复制到剪贴板')
      } catch (err) {
        Message.error('复制失败')
      } finally {
        document.body.removeChild(textarea)
      }
    })
}

// 一键复制所有推流地址
const copyAllPushUrls = () => {
  const urls = [
    'RTMP 地址：' + getRtmpPushUrl(),
    'WebRTC 地址：' + getWebrtcPushUrl(),
    'SRT 地址：' + getSrtPushUrl(),
    'OBS服务器：' + getObsServerUrl(),
    'OBS推流码：' + getObsStreamKey()
  ].filter(url => url && url.includes('：') && url.split('：')[1].trim())

  const text = urls.join('\n')
  copyToClipboard(text)
}

// 一键复制所有拉流地址
const copyAllPullUrls = () => {
  const urls = [
    'RTMP 地址：' + getRtmpPullUrl(),
    'HTTP-FLV 地址：' + getFlvPullUrl(),
    'HLS 地址：' + getHlsPullUrl()
  ].filter(url => url && url.includes('：') && url.split('：')[1].trim())

  const text = urls.join('\n')
  copyToClipboard(text)
}

// 生成拉流地址函数
const getRtmpPullUrl = () => {
  return pullUrls.value.rtmp
}

const getFlvPullUrl = () => {
  return pullUrls.value.flv
}

const getHlsPullUrl = () => {
  return pullUrls.value.hls
}

const handleBack = () => {
  navigationStore.navigateTo('LiveRoomList', '直播间管理', {}, false)
}

const handlePullStreamTask = () => {
  navigationStore.navigateTo('PullStreamTask', '社媒分发', { roomId: roomInfo.value.id }, false)
}

const handleHighlightClips = () => {
  navigationStore.navigateTo('LiveHighlightClips', '直播切片', { roomId: roomInfo.value.id }, false)
}

const handleRecordings = () => {
  navigationStore.navigateTo('LiveRecordings', '直播录制', { roomId: roomInfo.value.id }, false)
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

const getBroadcastFormatText = (broadcastFormat: string) => {
  const map: Record<string, string> = {
    'live': '直播',
    'vod': '点播/录播',
    'pseudo': '伪直播'
  }
  return map[broadcastFormat] || broadcastFormat
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    'draft': '未开始',
    'scheduled': '已排期',
    'live': '直播中',
    'ended': '已结束',
    'archived': '已归档'
  }
  return map[status] || status
}

const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '--'
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm')
}

const fetchRoomInfo = async () => {
  try {
    const response = await api.get(`/live/rooms/${navigationStore.current.params.id}`)
    roomInfo.value = response.data.data
    // 生成推流和拉流地址
    await generatePushUrls()
    await generatePullUrls()
  } catch (error: any) {
    Message.error(error.message || '获取直播间信息失败')
  }
}

onBeforeMount(() => {
  fetchRoomInfo()
})
</script>

<style scoped lang="scss">
.live-room-detail {
  padding: 20px;
  background: #fff;
  height: 100%;
  overflow-y: auto;

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

  :deep(.arco-form-item) {
    margin-bottom: 12px;
  }

  :deep(.arco-form-label-item) {
    font-size: 13px;
    margin-bottom: 4px;
  }

  :deep(.arco-form-value-item) {
    font-size: 13px;
  }

  .settings-container {
    .section-header {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e6eb;
    }
  }

  .push-addresses, .pull-addresses {
    .address-item {
      margin-bottom: 8px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;

      .address-label {
        font-weight: 500;
        color: #333;
        margin-right: 8px;
        min-width: 100px;
      }

      .address-value {
        color: #666;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 12px;
        background: #f5f5f5;
        padding: 2px 6px;
        border-radius: 3px;
        word-break: break-all;
      }
    }
  }
}
</style>
