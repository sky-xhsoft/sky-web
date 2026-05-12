<template>
  <div class="live-room-detail">
    <div class="header">
      <a-button type="primary" @click="handleBack">
        <template #icon>
          <icon-arrow-left />
        </template>
        {{ t('liveRoomDetail.return') }}
      </a-button>
      <a-space>
        <a-button @click="handlePullStreamTask">
          <template #icon>
            <icon-export />
          </template>
          {{ t('liveRoomDetail.pullStreamTask') }}
        </a-button>
        <a-button @click="handleHighlightClips">
          <template #icon>
            <icon-scissor />
          </template>
          {{ t('liveRoomDetail.highlightClips') }}
        </a-button>
        <a-button @click="handleRecordings">
          <template #icon>
            <icon-file />
          </template>
          {{ t('liveRoomDetail.recordings') }}
        </a-button>
        <a-button @click="handleEdit">
          <template #icon>
            <icon-edit />
          </template>
          {{ t('liveRoomDetail.edit') }}
        </a-button>
        <a-button @click="handleShare">
          <template #icon>
            <icon-share-alt />
          </template>
          {{ t('liveRoomDetail.share') }}
        </a-button>
        <a-button @click="handleDelete">
          <template #icon>
            <icon-delete />
          </template>
          {{ t('liveRoomDetail.delete') }}
        </a-button>
      </a-space>
    </div>

    <div class="content">
      <a-tabs v-model:activeKey="activeKey" type="line" size="large">
        <a-tab-pane key="basic" :title="t('liveRoomDetail.basicInfo')">
          <a-form layout="inline" size="small" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-row :gutter="8">
              <a-col :span="12">
                <a-form-item :label="t('liveRoomDetail.roomId')">
                  {{ roomInfo.id }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item :label="t('liveRoomDetail.roomName')">
                  {{ roomInfo.roomName }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item :label="t('liveRoomDetail.broadcastFormat')">
                  {{ getBroadcastFormatText(roomInfo.broadcastFormat) }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item :label="t('liveRoomDetail.startTime')">
                  {{ formatDateTime(roomInfo.startTime) }}
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item :label="t('liveRoomDetail.status')">
                  {{ getStatusText(roomInfo.status) }}
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item :label="t('liveRoomDetail.coverImage')">
              <a-image
                :src="roomInfo.coverImage || '/default-cover.png'"
                width="200"
                height="113"
                fit="cover"
              />
            </a-form-item>
            <a-divider style="margin: 20px 0;" />
            <div class="settings-container">
              <div class="section-header">{{ t('liveRoomDetail.settings.pushInfo') }}</div>
                <a-form layout="vertical" size="small">
                  <a-form-item label="推流地址">
                    <div class="push-addresses">
                      <div class="address-item">
                        <span class="address-label">{{ t('liveRoomDetail.urlLabels.rtmpPush') }}</span>
                        <a-space>
                          <span class="address-value">{{ getRtmpPushUrl() }}</span>
                          <a-button size="mini" type="text" @click="copyToClipboard(getRtmpPushUrl())">{{ t('liveRoomDetail.settings.copy') }}</a-button>
                        </a-space>
                      </div>
                      <div class="address-item">
                        <span class="address-label">{{ t('liveRoomDetail.urlLabels.webrtcPush') }}</span>
                        <a-space>
                          <span class="address-value">{{ getWebrtcPushUrl() }}</span>
                          <a-button size="mini" type="text" @click="copyToClipboard(getWebrtcPushUrl())">{{ t('liveRoomDetail.settings.copy') }}</a-button>
                        </a-space>
                      </div>
                      <div class="address-item">
                        <span class="address-label">{{ t('liveRoomDetail.urlLabels.srtPush') }}</span>
                        <a-space>
                          <span class="address-value">{{ getSrtPushUrl() }}</span>
                          <a-button size="mini" type="text" @click="copyToClipboard(getSrtPushUrl())">{{ t('liveRoomDetail.settings.copy') }}</a-button>
                        </a-space>
                      </div>
                      <div class="address-item">
                        <span class="address-label">{{ t('liveRoomDetail.urlLabels.obsServer') }}</span>
                        <a-space>
                          <span class="address-value">{{ getObsServerUrl() }}</span>
                          <a-button size="mini" type="text" @click="copyToClipboard(getObsServerUrl())">{{ t('liveRoomDetail.settings.copy') }}</a-button>
                        </a-space>
                      </div>
                      <div class="address-item">
                        <span class="address-label">{{ t('liveRoomDetail.urlLabels.obsStreamKey') }}</span>
                        <a-space>
                          <span class="address-value">{{ getObsStreamKey() }}</span>
                          <a-button size="mini" type="text" @click="copyToClipboard(getObsStreamKey())">{{ t('liveRoomDetail.settings.copy') }}</a-button>
                        </a-space>
                      </div>
                      <div style="margin-top: 16px;">
                        <a-button type="primary" size="small" @click="copyAllPushUrls()">
                          <template #icon>
                            <icon-copy />
                          </template>
                          {{ t('liveRoomDetail.settings.copyAll') }}
                        </a-button>
                      </div>
                    </div>
                  </a-form-item>
                </a-form>
              <div class="section-header" style="margin-top: 20px;">{{ t('liveRoomDetail.settings.pullInfo') }}</div>
                <a-form layout="vertical" size="small">
                  <a-form-item label="播放地址">
                    <div class="pull-addresses">
                      <div class="address-item">
                        <span class="address-label">{{ t('liveRoomDetail.urlLabels.rtmpPull') }}</span>
                        <a-space>
                          <span class="address-value">{{ getRtmpPullUrl() }}</span>
                          <a-button size="mini" type="text" @click="copyToClipboard(getRtmpPullUrl())">{{ t('liveRoomDetail.settings.copy') }}</a-button>
                        </a-space>
                      </div>
                      <div class="address-item">
                        <span class="address-label">{{ t('liveRoomDetail.urlLabels.flvPull') }}</span>
                        <a-space>
                          <span class="address-value">{{ getFlvPullUrl() }}</span>
                          <a-button size="mini" type="text" @click="copyToClipboard(getFlvPullUrl())">{{ t('liveRoomDetail.settings.copy') }}</a-button>
                        </a-space>
                      </div>
                      <div class="address-item">
                        <span class="address-label">{{ t('liveRoomDetail.urlLabels.hlsPull') }}</span>
                        <a-space>
                          <span class="address-value">{{ getHlsPullUrl() }}</span>
                          <a-button size="mini" type="text" @click="copyToClipboard(getHlsPullUrl())">{{ t('liveRoomDetail.settings.copy') }}</a-button>
                        </a-space>
                      </div>
                      <div style="margin-top: 16px;">
                        <a-button type="primary" size="small" @click="copyAllPullUrls()">
                          <template #icon>
                            <icon-copy />
                          </template>
                          {{ t('liveRoomDetail.settings.copyAll') }}
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
import config from '../config/index'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
    const pushDomain = roomInfo.value.pushDomain || config.live.defaultPushDomain
    const pushApp = roomInfo.value.pushApp || config.live.defaultApp
    const streamName = String(roomInfo.value.streamName || roomInfo.value.id)
    const response = await generatePushURL({
      domainName: pushDomain,
      appName: pushApp,
      streamName: streamName,
      streamKey: config.live.defaultStreamKey,
      expireTime: expireTime
    })
    if (response.data?.data) {
      const data = response.data.data
      pushUrls.value.rtmp = data.pushUrl || ''
      pushUrls.value.webrtc = data.pushUrlWebRtc || ''
      pushUrls.value.srt = data.pushUrlSrt || ''
      pushUrls.value.obsServer = `rtmp://${pushDomain}/${pushApp}/`
      pushUrls.value.obsStreamKey = streamName + '?' + new URLSearchParams(new URL(data.pushUrl || '').search)
    }
  } catch (error: any) {
    console.error('生成推流地址失败:', error)
    // 使用默认地址
    const pushDomain = roomInfo.value.pushDomain || config.live.defaultPushDomain
    const pushApp = roomInfo.value.pushApp || config.live.defaultApp
    const streamName = String(roomInfo.value.streamName || roomInfo.value.id)
    pushUrls.value.rtmp = `rtmp://${pushDomain}/${pushApp}/${streamName}?txSecret=a88a10b5546f11fb27d03f49163f0d2f&txTime=69AB479A`
    pushUrls.value.webrtc = `webrtc://${pushDomain}/${pushApp}/${streamName}?txSecret=a88a10b5546f11fb27d03f49163f0d2f&txTime=69AB479A`
    pushUrls.value.srt = `srt://${pushDomain}:9000?streamid=#!::h=${pushDomain}/${pushApp}/${streamName},txSecret=a88a10b5546f11fb27d03f49163f0d2f,txTime=69AB479A`
    pushUrls.value.obsServer = `rtmp://${pushDomain}/${pushApp}/`
    pushUrls.value.obsStreamKey = `${streamName}?txSecret=a88a10b5546f11fb27d03f49163f0d2f&txTime=69AB479A`
  }
}

// 生成拉流地址
const generatePullUrls = async () => {
  try {
    const expireTime = dayjs().add(7, 'day').unix()
    const playDomain = roomInfo.value.playDomain || config.live.defaultPlayDomain
    const playApp = roomInfo.value.playApp || config.live.defaultApp
    const streamName = String(roomInfo.value.streamName || roomInfo.value.id)
    const response = await generatePlayURL({
      playDomain: playDomain,
      appName: playApp,
      streamName: streamName,
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
    const playDomain = roomInfo.value.playDomain || config.live.defaultPlayDomain
    const playApp = roomInfo.value.playApp || config.live.defaultApp
    const streamName = String(roomInfo.value.streamName || roomInfo.value.id)
    pullUrls.value.rtmp = `rtmp://${playDomain}/${playApp}/${streamName}`
    pullUrls.value.flv = `http://${playDomain}/${playApp}/${streamName}.flv`
    pullUrls.value.hls = `http://${playDomain}/${playApp}/${streamName}.m3u8`
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

  // 先检查 navigator.clipboard 是否可用
  if (navigator.clipboard && window.isSecureContext) {
    // 在安全上下文（HTTPS）中使用新 API
    navigator.clipboard.writeText(text)
      .then(() => {
        Message.success(t('liveRoomDetail.messages.copySuccess'))
      })
      .catch(() => {
        fallbackCopy(text)
      })
  } else {
    // 在非安全上下文（HTTP）或不支持的浏览器中使用降级方案
    fallbackCopy(text)
  }
}

// 降级方案：使用传统方法复制
const fallbackCopy = (text: string) => {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
    Message.success(t('liveRoomDetail.messages.copySuccess'))
  } catch (err) {
    Message.error(t('liveRoomDetail.messages.copyFailed'))
  } finally {
    document.body.removeChild(textarea)
  }
}

// 一键复制所有推流地址
const copyAllPushUrls = () => {
  const urls = [
    t('liveRoomDetail.urlLabels.rtmpPush') + getRtmpPushUrl(),
    t('liveRoomDetail.urlLabels.webrtcPush') + getWebrtcPushUrl(),
    t('liveRoomDetail.urlLabels.srtPush') + getSrtPushUrl(),
    t('liveRoomDetail.urlLabels.obsServer') + getObsServerUrl(),
    t('liveRoomDetail.urlLabels.obsStreamKey') + getObsStreamKey()
  ].filter(url => url && url.includes('：') && url.split('：')[1].trim())

  const text = urls.join('\n')
  copyToClipboard(text)
}

// 一键复制所有拉流地址
const copyAllPullUrls = () => {
  const urls = [
    t('liveRoomDetail.urlLabels.rtmpPull') + getRtmpPullUrl(),
    t('liveRoomDetail.urlLabels.flvPull') + getFlvPullUrl(),
    t('liveRoomDetail.urlLabels.hlsPull') + getHlsPullUrl()
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
  // 直接导航到直播间列表页面
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
  Message.info(t('liveRoomDetail.shareFeature'))
}

const handleDelete = () => {
  Modal.confirm({
    title: t('liveRoomDetail.messages.deleteConfirm.title'),
    content: t('liveRoomDetail.messages.deleteConfirm.content', { name: roomInfo.value.roomName }),
    onOk: async () => {
      try {
        await api.delete(`/live/rooms/${route.params.id}`)
        Message.success(t('liveRoomDetail.messages.deleteSuccess'))
        router.push('/live/rooms')
      } catch (error: any) {
        Message.error(error.message || t('liveRoomDetail.messages.deleteFailed'))
      }
    }
  })
}

const getBroadcastFormatText = (broadcastFormat: string) => {
  const map: Record<string, string> = {
    'live': t('liveRoomDetail.broadcastFormatOptions.live'),
    'vod': t('liveRoomDetail.broadcastFormatOptions.vod'),
    'pseudo': t('liveRoomDetail.broadcastFormatOptions.pseudo')
  }
  return map[broadcastFormat] || broadcastFormat
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    'draft': t('liveRoomDetail.statusOptions.draft'),
    'scheduled': t('liveRoomDetail.statusOptions.scheduled'),
    'live': t('liveRoomDetail.statusOptions.live'),
    'ended': t('liveRoomDetail.statusOptions.ended'),
    'archived': t('liveRoomDetail.statusOptions.archived')
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
    Message.error(error.message || t('liveRoomDetail.messages.fetchFailed'))
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
