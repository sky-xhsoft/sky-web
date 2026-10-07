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
        <a-button size="small" @click="handleEdit">
          <template #icon>
            <icon-edit />
          </template>
          {{ t('liveRoomDetail.edit') }}
        </a-button>
        <a-button size="small" status="danger" @click="handleDelete">
          <template #icon>
            <icon-delete />
          </template>
          {{ t('liveRoomDetail.delete') }}
        </a-button>
      </a-space>
    </div>

    <div class="content">
          <a-layout class="detail-layout">
            <a-layout-sider :width="180" class="detail-sider">
              <a-menu :selected-keys="[activeKey]" @menu-item-click="activeKey = $event" class="detail-menu">
                <a-menu-item key="basic">
                  <template #icon><icon-info-circle /></template>
                  {{ t('liveRoomDetail.basicInfo') }}
                </a-menu-item>
                <a-menu-item key="subtitle">
                  <template #icon><icon-language /></template>
                  {{ t('liveRoomDetail.subtitle') }}
                </a-menu-item>
                <a-menu-item key="dispatch">
                  <template #icon><icon-export /></template>
                  {{ t('liveRoomDetail.pullStreamTask') }}
                </a-menu-item>
                <a-menu-item key="clips">
                  <template #icon><icon-scissor /></template>
                  {{ t('liveRoomDetail.highlightClips') }}
                </a-menu-item>
                <a-menu-item key="recordings">
                  <template #icon><icon-file /></template>
                  {{ t('liveRoomDetail.recordings') }}
                </a-menu-item>
              </a-menu>
            </a-layout-sider>
            <a-layout-content class="detail-content">
              <div v-show="activeKey === 'basic'" class="panel">
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
        </div>

        <div v-if="roomInfo.id && activeKey === 'subtitle'" class="panel">
          <SpeechTaskListPanel :room-id="String(roomInfo.id)" :rtmp-pull-url="pullUrls.rtmp" :room-name="roomInfo.roomName" />
        </div>

        <div v-if="roomInfo.id && activeKey === 'dispatch'" class="panel">
          <PullStreamTask :room-id="String(roomInfo.id)" />
        </div>

        <div v-if="roomInfo.id && activeKey === 'clips'" class="panel">
          <LiveHighlightClips :room-id="String(roomInfo.id)" />
        </div>

        <div v-if="roomInfo.id && activeKey === 'recordings'" class="panel">
          <LiveRecordings :room-id="String(roomInfo.id)" />
        </div>
        </a-layout-content>
        </a-layout>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import { useNavigationStore } from '../../stores/navigation'
import api from '../../api/http'
import dayjs from 'dayjs'
import { generatePushURLByRoom, generatePullURLByRoom, type LiveRoomDetail } from '../../api/live'
import { IconArrowLeft, IconEdit, IconDelete, IconCopy } from '@arco-design/web-vue/es/icon'
import config from '../../config/index'
import { useI18n } from 'vue-i18n'
import PullStreamTask from './PullStreamTask.vue'
import LiveHighlightClips from './LiveHighlightClips.vue'
import LiveRecordings from './LiveRecordings.vue'
import SpeechTaskListPanel from './components/SpeechTaskListPanel.vue'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const navigationStore = useNavigationStore()

const activeKey = ref('basic')
// 接口返回的直播间信息；推/拉流域名与 app 仅在生成地址失败时作为兜底使用
type RoomInfo = Partial<LiveRoomDetail> & {
  pushDomain?: string
  pushApp?: string
  playDomain?: string
  playApp?: string
}
const roomInfo = ref<RoomInfo>({})

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

// 生成推流地址（由后端根据直播间ID取推流域名、鉴权主KEY、开始时间生成带txSecret地址）
const generatePushUrls = async () => {
  try {
    const roomId = String(roomInfo.value.id || '')
    const response = await generatePushURLByRoom(roomId)
    const data = response.data?.data || response.data
    const pushUrl = data?.pushUrl || ''
    if (pushUrl) {
      // 直接使用后端返回的三种协议地址，保证 OBS/srt/webrtc 域名一致
      pushUrls.value.rtmp = pushUrl
      pushUrls.value.webrtc = data?.pushUrlWebRtc || pushUrl.replace(/^rtmp:\/\//, 'webrtc://')
      pushUrls.value.srt = data?.pushUrlSrt || ''
      // OBS 服务器前缀 = 推流地址的域名 + app
            const u = new URL(pushUrl)
            const obsHost = u.hostname // 例如 tl.skyzhou.cn
            const app = u.pathname.split('/').filter(Boolean)[0] || 'live'
            pushUrls.value.obsServer = `rtmp://${obsHost}/${app}/`
            // OBS 推流码 = 流名 + 鉴权参数（不含 app，避免与 OBS 服务器里的 live/ 重复）
            const streamPart = u.pathname.split('/').filter(Boolean).slice(1).join('/')
            pushUrls.value.obsStreamKey = streamPart + (u.search ? u.search : '')
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

// 生成拉流地址（由后端取当前公司播放域名、鉴权主KEY、直播间开始时间）
const generatePullUrls = async () => {
  try {
    const roomId = String(roomInfo.value.id || '')
    const response = await generatePullURLByRoom(roomId)
    const data = response.data?.data || response.data
    pullUrls.value.rtmp = data?.rtmp || ''
    pullUrls.value.flv = data?.flv || ''
    pullUrls.value.hls = data?.hls || ''
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

const copyToClipboard = (text: string) => {
  if (!text) return

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => {
        Message.success(t('liveRoomDetail.messages.copySuccess'))
      })
      .catch(() => {
        fallbackCopy(text)
      })
  } else {
    fallbackCopy(text)
  }
}

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
  } catch {
    Message.error(t('liveRoomDetail.messages.copyFailed'))
  } finally {
    document.body.removeChild(textarea)
  }
}

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

const copyAllPullUrls = () => {
  const urls = [
    t('liveRoomDetail.urlLabels.rtmpPull') + getRtmpPullUrl(),
    t('liveRoomDetail.urlLabels.flvPull') + getFlvPullUrl(),
    t('liveRoomDetail.urlLabels.hlsPull') + getHlsPullUrl()
  ].filter(url => url && url.includes('：') && url.split('：')[1].trim())

  const text = urls.join('\n')
  copyToClipboard(text)
}

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

const handleEdit = () => {
  router.push(`/live/rooms/edit/${route.params.id}`)
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
    const roomId = navigationStore.current.params?.id || route.params.id
    if (!roomId) {
      Message.error(t('liveRoomDetail.messages.fetchFailed'))
      return
    }
    const response = await api.get(`/live/rooms/${roomId}`)
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

    .detail-content {
      margin-left: 50px;
    }

    :deep(.detail-left-tabs .arco-tabs-content) {
      padding: 0 8px 0 20px;
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