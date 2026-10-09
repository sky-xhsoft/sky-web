<template>
  <div class="live-room-detail">
    <!-- 顶部：名称、状态与操作 -->
    <section class="lrd-card lrd-header">
      <div class="lrd-breadcrumb">
        <a class="lrd-link" @click="handleBack">{{ t('liveRoomDetail.page.breadcrumb') }}</a>
        <span>/</span>
        <span>{{ t('liveRoomDetail.page.title') }}</span>
      </div>
      <div class="lrd-title-row">
        <h1 class="lrd-title">{{ roomInfo.roomName || '--' }}</h1>
        <span class="lrd-status" :class="`is-${statusKind}`"><span class="lrd-status-dot" />{{ statusText }}</span>
        <V2Tag v-if="roomInfo.roomStage">{{ optionText('stage', roomInfo.roomStage) }}</V2Tag>
        <span class="lrd-meta">{{ t('liveRoomDetail.page.meta', { id: roomInfo.id ?? '--', stream: streamName || '--' }) }}</span>
        <div class="lrd-actions">
          <template v-if="isLive">
            <V2Button type="secondary" @click="handlePreview">{{ t('liveRoomDetail.page.actions.preview') }}</V2Button>
            <V2Button type="danger" :loading="acting" @click="handleEndLive">{{ t('liveRoomDetail.page.actions.end') }}</V2Button>
          </template>
          <V2Button v-else-if="canStart" :loading="acting" @click="handleStartLive">{{ t('liveRoomDetail.page.actions.start') }}</V2Button>
          <V2Button type="secondary" :disabled="!roomInfo.id" @click="handleEdit">{{ t('liveRoomDetail.edit') }}</V2Button>
          <a-tooltip :content="t('liveRoomDetail.page.deleteDisabledTip')" :disabled="!isLive">
            <span>
              <V2Button type="secondary" class="lrd-danger-outline" :disabled="isLive || !roomInfo.id" @click="handleDelete">{{ t('liveRoomDetail.delete') }}</V2Button>
            </span>
          </a-tooltip>
        </div>
      </div>
      <div v-if="isLive" class="lrd-hint">{{ t('liveRoomDetail.page.liveHint') }}</div>
    </section>

    <!-- 关键指标 -->
    <section class="lrd-kpis">
      <div v-for="k in kpis" :key="k.label" class="lrd-card lrd-kpi">
        <span class="lrd-kpi-label">{{ k.label }}</span>
        <span class="lrd-kpi-value">{{ k.value }}</span>
        <span class="lrd-kpi-sub">{{ k.sub }}</span>
      </div>
    </section>

    <!-- 标签页 -->
    <section class="lrd-card lrd-body">
      <div class="lrd-tabs" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.key"
          class="lrd-tab"
          :class="{ 'is-active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.count !== undefined" class="lrd-tab-badge">{{ tab.count }}</span>
        </button>
      </div>

      <div class="lrd-tab-body">
        <!-- 概览 -->
        <div v-show="activeTab === 'overview'" class="lrd-overview">
          <div class="lrd-col-main">
            <!-- 推流设置 -->
            <div class="lrd-panel">
              <div class="lrd-panel-head">
                <span class="lrd-panel-title">{{ t('liveRoomDetail.page.push.title') }}</span>
                <span class="lrd-panel-desc">{{ t('liveRoomDetail.page.push.hint') }}</span>
              </div>
              <div v-if="pushError" class="lrd-error">
                <span class="lrd-error-title">{{ t('liveRoomDetail.page.push.failTitle') }}</span>
                <span class="lrd-error-text">{{ t('liveRoomDetail.page.push.failReason', { reason: pushError }) }}</span>
                <span class="lrd-error-text">{{ t('liveRoomDetail.page.push.failNote') }}</span>
                <div class="lrd-row-actions">
                  <V2Button size="sm" @click="goDomain">{{ t('liveRoomDetail.page.push.goDomain') }}</V2Button>
                  <V2Button size="sm" type="secondary" :loading="urlLoading" @click="loadUrls">{{ t('liveRoomDetail.page.push.retry') }}</V2Button>
                </div>
              </div>
              <template v-else>
                <div class="lrd-step">
                  <span class="lrd-step-no">1</span>
                  <span class="lrd-step-label">{{ t('liveRoomDetail.page.push.server') }}</span>
                  <code class="lrd-code">{{ pushUrls.obsServer || '--' }}</code>
                  <V2Button size="sm" type="secondary" :disabled="!pushUrls.obsServer" @click="copy(pushUrls.obsServer)">{{ t('liveRoomDetail.settings.copy') }}</V2Button>
                </div>
                <div class="lrd-step">
                  <span class="lrd-step-no">2</span>
                  <span class="lrd-step-label">{{ t('liveRoomDetail.page.push.streamKey') }}</span>
                  <code class="lrd-code">{{ showKey ? (pushUrls.obsStreamKey || '--') : maskedStreamKey }}</code>
                  <V2Button size="sm" type="secondary" :disabled="!pushUrls.obsStreamKey" @click="showKey = !showKey">
                    {{ showKey ? t('liveRoomDetail.page.push.hide') : t('liveRoomDetail.page.push.show') }}
                  </V2Button>
                  <V2Button size="sm" type="secondary" :disabled="!pushUrls.obsStreamKey" @click="copy(pushUrls.obsStreamKey)">{{ t('liveRoomDetail.settings.copy') }}</V2Button>
                </div>
                <span class="lrd-note">{{ t('liveRoomDetail.page.push.keyNote') }}</span>
                <button type="button" class="lrd-text-btn" @click="showOtherPush = !showOtherPush">
                  {{ showOtherPush ? t('liveRoomDetail.page.push.moreHide') : t('liveRoomDetail.page.push.moreShow') }}
                </button>
                <div v-if="showOtherPush" class="lrd-url-list">
                  <div v-for="u in otherPushUrls" :key="u.label" class="lrd-url-row">
                    <span class="lrd-url-label">{{ u.label }}</span>
                    <code class="lrd-code">{{ u.display }}</code>
                    <V2Button size="sm" type="secondary" :disabled="!u.url" @click="copy(u.url)">{{ t('liveRoomDetail.settings.copy') }}</V2Button>
                  </div>
                </div>
              </template>
            </div>

            <!-- 播放地址 -->
            <div class="lrd-panel">
              <div class="lrd-panel-head">
                <span class="lrd-panel-title">{{ t('liveRoomDetail.page.play.title') }}</span>
                <span class="lrd-panel-desc">{{ t('liveRoomDetail.page.play.hint') }}</span>
                <V2Button v-if="!pullError" size="sm" type="secondary" class="lrd-push-right" @click="copyAllPull">{{ t('liveRoomDetail.page.play.copyAll') }}</V2Button>
              </div>
              <div v-if="pullError" class="lrd-error">
                <span class="lrd-error-title">{{ t('liveRoomDetail.page.play.failTitle') }}</span>
                <span class="lrd-error-text">{{ t('liveRoomDetail.page.push.failReason', { reason: pullError }) }}</span>
                <div class="lrd-row-actions">
                  <V2Button size="sm" type="secondary" :loading="urlLoading" @click="loadUrls">{{ t('liveRoomDetail.page.push.retry') }}</V2Button>
                </div>
              </div>
              <div v-else class="lrd-url-list">
                <div v-for="u in playUrlRows" :key="u.label" class="lrd-url-row">
                  <span class="lrd-url-label">{{ u.label }}</span>
                  <code class="lrd-code">{{ u.url || '--' }}</code>
                  <V2Button size="sm" type="secondary" :disabled="!u.url" @click="copy(u.url)">{{ t('liveRoomDetail.settings.copy') }}</V2Button>
                </div>
              </div>
            </div>

            <!-- 实时指标（直播中） -->
            <div v-if="isLive" class="lrd-panel">
              <div class="lrd-panel-head">
                <span class="lrd-panel-title">{{ t('liveRoomDetail.page.metrics.title') }}</span>
                <span v-if="metricsSupported" class="lrd-panel-desc">{{ t('liveRoomDetail.page.metrics.hint') }}</span>
              </div>
              <div v-if="!metricsSupported" class="lrd-empty">{{ t('liveRoomDetail.page.metrics.notSupported') }}</div>
              <div v-else-if="metrics" class="lrd-metrics">
                <div v-for="m in metricRows" :key="m.label" class="lrd-metric">
                  <span class="lrd-kpi-label">{{ m.label }}</span>
                  <span class="lrd-metric-value">{{ m.value }}</span>
                </div>
              </div>
              <div v-else class="lrd-empty">{{ t('liveRoomDetail.page.metrics.unavailable') }}</div>
            </div>
          </div>

          <div class="lrd-col-side">
            <!-- 直播进度 -->
            <div class="lrd-panel">
              <span class="lrd-panel-title">{{ t('liveRoomDetail.page.progress.title') }}</span>
              <ol class="lrd-steps">
                <li v-for="(s, i) in progressSteps" :key="s.title" class="lrd-progress" :class="[`is-${s.state}`]">
                  <div class="lrd-progress-axis">
                    <span class="lrd-progress-dot" />
                    <span v-if="i < progressSteps.length - 1" class="lrd-progress-line" />
                  </div>
                  <div class="lrd-progress-text">
                    <span class="lrd-progress-title">{{ s.title }}</span>
                    <span class="lrd-progress-desc">{{ s.desc }}</span>
                  </div>
                </li>
              </ol>
            </div>

            <!-- 直播信息 -->
            <div class="lrd-panel">
              <div class="lrd-panel-head">
                <span class="lrd-panel-title">{{ t('liveRoomDetail.page.info.title') }}</span>
                <a class="lrd-link lrd-push-right" @click="handleEdit">{{ t('liveRoomDetail.edit') }}</a>
              </div>
              <div class="lrd-cover" :class="{ 'is-empty': !roomInfo.coverImage }">
                <img v-if="roomInfo.coverImage" :src="roomInfo.coverImage" :alt="roomInfo.roomName" />
                <span v-else>{{ t('liveRoomDetail.page.info.noCover') }}</span>
              </div>
              <dl class="lrd-info">
                <template v-for="row in infoRows" :key="row.label">
                  <dt>{{ row.label }}</dt>
                  <dd>
                    {{ row.value }}
                    <a v-if="row.secret" class="lrd-link" @click="showPassword = !showPassword">
                      {{ showPassword ? t('liveRoomDetail.page.push.hide') : t('liveRoomDetail.page.push.show') }}
                    </a>
                  </dd>
                </template>
              </dl>
            </div>
          </div>
        </div>

        <!-- 其他标签：进入时才加载 -->
        <SpeechTaskListPanel
          v-if="roomInfo.id && activeTab === 'speech'"
          :room-id="String(roomInfo.id)"
          :rtmp-pull-url="pullUrls.rtmp"
          :room-name="roomInfo.roomName"
        />
        <PullStreamTask embedded v-if="roomInfo.id && activeTab === 'dispatch'" :room-id="String(roomInfo.id)" />
        <LiveHighlightClips embedded v-if="roomInfo.id && activeTab === 'clips'" :room-id="String(roomInfo.id)" />
        <LiveRecordings embedded v-if="roomInfo.id && activeTab === 'recordings'" :room-id="String(roomInfo.id)" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onDeactivated, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { useNavigationStore } from '../../stores/navigation'
import api from '../../api/http'
import {
  generatePushURLByRoom,
  generatePullURLByRoom,
  getStreamMetrics,
  listClips,
  listRecordings,
  type LiveRoomDetail,
} from '../../api/live'
import { V2Button, V2Tag } from '@/components/ui'
import PullStreamTask from './PullStreamTask.vue'
import LiveHighlightClips from './LiveHighlightClips.vue'
import LiveRecordings from './LiveRecordings.vue'
import SpeechTaskListPanel from './components/SpeechTaskListPanel.vue'

const { t } = useI18n()
const route = useRoute()
const navigationStore = useNavigationStore()

// 直播间 ID 来自打开本页时的标签页参数（详情页以标签形式打开，不走路由参数）
const roomId = String(navigationStore.current.params?.id || route.params.id || '')

type RoomInfo = Partial<LiveRoomDetail> & {
  isRecord?: string
  isClip?: string
  createBy?: string
  createTime?: string
}

const roomInfo = ref<RoomInfo>({})
const activeTab = ref<'overview' | 'speech' | 'dispatch' | 'clips' | 'recordings'>('overview')
const acting = ref(false)
const urlLoading = ref(false)
const showKey = ref(false)
const showOtherPush = ref(false)
const showPassword = ref(false)

const pushUrls = ref({ rtmp: '', webrtc: '', srt: '', obsServer: '', obsStreamKey: '' })
const pullUrls = ref({ rtmp: '', flv: '', hls: '' })
const pushError = ref('')
const pullError = ref('')
const metrics = ref<Record<string, any> | null>(null)
// 后端尚未接入实时统计时为 false：停止轮询，不再重复请求
const metricsSupported = ref(true)
const clipCount = ref<number | undefined>()
const recordingCount = ref<number | undefined>()
const now = ref(Date.now())

// ---------- 状态 ----------
const status = computed(() => roomInfo.value.status || 'draft')
const isLive = computed(() => status.value === 'live')
const isEnded = computed(() => status.value === 'ended' || status.value === 'archived')
const canStart = computed(() => !!roomInfo.value.id && !isLive.value && !isEnded.value && !pushError.value)
const statusKind = computed(() => (isLive.value ? 'live' : isEnded.value ? 'ended' : 'idle'))
const statusText = computed(() => t(`liveRoomDetail.statusOptions.${status.value}`))
const streamName = computed(() => roomInfo.value.streamName || (roomInfo.value.id ? String(roomInfo.value.id) : ''))

const fmt = (v?: string | null, pattern = 'MM-DD HH:mm') => (v ? dayjs(v).format(pattern) : '--')
const fmtDuration = (seconds: number) => {
  if (!seconds || seconds < 0) return '--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}
const optionText = (group: string, value?: string) => (value ? t(`liveRoomDetail.page.options.${group}.${value}`) : '--')

// ---------- 指标卡 ----------
const elapsedSeconds = computed(() => {
  if (isLive.value && roomInfo.value.startTime) return Math.floor((now.value - dayjs(roomInfo.value.startTime).valueOf()) / 1000)
  return roomInfo.value.duration || 0
})

const kpis = computed(() => {
  const started = isLive.value || isEnded.value
  const viewers = metrics.value?.viewers ?? metrics.value?.onlineUsers ?? roomInfo.value.viewerCount
  return [
    {
      label: t('liveRoomDetail.startTime'),
      value: fmt(roomInfo.value.startTime),
      sub: started ? t('liveRoomDetail.page.kpi.actualStart') : t('liveRoomDetail.page.kpi.plannedStart'),
    },
    {
      label: isLive.value ? t('liveRoomDetail.page.kpi.elapsed') : t('liveRoomDetail.page.kpi.duration'),
      value: started ? fmtDuration(elapsedSeconds.value) : '--',
      sub: isLive.value
        ? t('liveRoomDetail.page.kpi.liveTiming')
        : isEnded.value
          ? t('liveRoomDetail.page.kpi.endedAt', { time: fmt(roomInfo.value.endTime) })
          : t('liveRoomDetail.page.kpi.notStarted'),
    },
    {
      label: t('liveRoomDetail.page.kpi.viewers'),
      value: started ? String(isLive.value ? viewers ?? 0 : roomInfo.value.viewerCount ?? 0) : '--',
      sub: started ? t('liveRoomDetail.page.kpi.peak', { n: roomInfo.value.peakViewerCount ?? 0 }) : t('liveRoomDetail.page.kpi.afterStart'),
    },
    {
      label: t('liveRoomDetail.recordings'),
      value: recordingCount.value === undefined ? '--' : t('liveRoomDetail.page.kpi.count', { n: recordingCount.value }),
      sub: isLive.value
        ? t('liveRoomDetail.page.kpi.recordingNow')
        : isEnded.value ? t('liveRoomDetail.page.kpi.archived') : t('liveRoomDetail.page.kpi.archiveAfterEnd'),
    },
    {
      label: t('liveRoomDetail.highlightClips'),
      value: clipCount.value === undefined ? '--' : t('liveRoomDetail.page.kpi.count', { n: clipCount.value }),
      sub: t('liveRoomDetail.page.kpi.auto'),
    },
  ]
})

const tabs = computed(() => [
  { key: 'overview' as const, label: t('liveRoomDetail.page.tabs.overview'), count: undefined },
  { key: 'dispatch' as const, label: t('liveRoomDetail.pullStreamTask'), count: undefined },
  { key: 'clips' as const, label: t('liveRoomDetail.highlightClips'), count: clipCount.value },
  { key: 'recordings' as const, label: t('liveRoomDetail.recordings'), count: recordingCount.value },
  { key: 'speech' as const, label: t('liveRoomDetail.subtitle'), count: undefined },
])

// ---------- 推流 / 播放地址 ----------
// 推流地址中的鉴权签名默认打码，点「显示」后再展示完整地址（复制始终复制完整地址）
const maskSecret = (url: string) => url.replace(/(txSecret=)[^&,]+/, '$1••••••••••••')
const maskedStreamKey = computed(() => (pushUrls.value.obsStreamKey ? maskSecret(pushUrls.value.obsStreamKey) : '--'))

const otherPushUrls = computed(() => [
  { label: t('liveRoomDetail.page.push.rtmpFull'), url: pushUrls.value.rtmp },
  { label: 'WebRTC', url: pushUrls.value.webrtc },
  { label: 'SRT', url: pushUrls.value.srt },
].map((u) => ({ ...u, display: u.url ? (showKey.value ? u.url : maskSecret(u.url)) : '--' })))

const playUrlRows = computed(() => [
  { label: 'RTMP', url: pullUrls.value.rtmp },
  { label: 'HTTP-FLV', url: pullUrls.value.flv },
  { label: 'HLS', url: pullUrls.value.hls },
])

const errorReason = (e: any) => e?.response?.data?.message || e?.message || t('liveRoomDetail.messages.fetchFailed')

const loadPushUrls = async () => {
  pushError.value = ''
  try {
    const res = await generatePushURLByRoom(roomId)
    const data = res.data?.data || res.data
    const pushUrl: string = data?.pushUrl || ''
    if (!pushUrl) throw new Error(t('liveRoomDetail.page.push.emptyReason'))
    const u = new URL(pushUrl)
    const segments = u.pathname.split('/').filter(Boolean)
    pushUrls.value = {
      rtmp: pushUrl,
      webrtc: data?.pushUrlWebRtc || '',
      srt: data?.pushUrlSrt || '',
      // OBS 服务器 = 域名 + app；推流码 = 流名 + 鉴权参数（不含 app，避免与服务器里的 app 重复）
      obsServer: `rtmp://${u.host}/${segments[0] || 'live'}/`,
      obsStreamKey: segments.slice(1).join('/') + u.search,
    }
  } catch (e: any) {
    // 不再回退到示例地址：带假签名的地址无法推流，只会误导
    pushUrls.value = { rtmp: '', webrtc: '', srt: '', obsServer: '', obsStreamKey: '' }
    pushError.value = errorReason(e)
  }
}

const loadPullUrls = async () => {
  pullError.value = ''
  try {
    const res = await generatePullURLByRoom(roomId)
    const data = res.data?.data || res.data
    pullUrls.value = { rtmp: data?.rtmp || '', flv: data?.flv || '', hls: data?.hls || '' }
    if (!pullUrls.value.rtmp && !pullUrls.value.flv && !pullUrls.value.hls) throw new Error(t('liveRoomDetail.page.push.emptyReason'))
  } catch (e: any) {
    pullUrls.value = { rtmp: '', flv: '', hls: '' }
    pullError.value = errorReason(e)
  }
}

const loadUrls = async () => {
  urlLoading.value = true
  try {
    await Promise.all([loadPushUrls(), loadPullUrls()])
  } finally {
    urlLoading.value = false
  }
}

// ---------- 实时指标（直播中每 10 秒刷新） ----------
const metricRows = computed(() => {
  const m = metrics.value || {}
  return [
    { label: t('liveRoomDetail.page.metrics.bitrate'), value: m.bitrate ? `${Number(m.bitrate).toLocaleString()} kbps` : '--' },
    { label: t('liveRoomDetail.page.metrics.fps'), value: m.fps ? `${m.fps} fps` : '--' },
    { label: t('liveRoomDetail.page.metrics.resolution'), value: m.resolution || '--' },
    { label: t('liveRoomDetail.page.metrics.viewers'), value: String(m.viewers ?? m.onlineUsers ?? '--') },
  ]
})

const loadMetrics = async () => {
  if (!metricsSupported.value || !isLive.value || !streamName.value) return
  try {
    const host = pushUrls.value.rtmp ? new URL(pushUrls.value.rtmp).host : ''
    const data = await getStreamMetrics(streamName.value, { domainName: host || undefined, appName: 'live' })
    if (data?.supported === false) {
      metricsSupported.value = false
      metrics.value = null
      if (metricsTimer) clearInterval(metricsTimer)
      metricsTimer = undefined
      return
    }
    metrics.value = data
  } catch {
    metrics.value = null
  }
}

let metricsTimer: ReturnType<typeof setInterval> | undefined
let clockTimer: ReturnType<typeof setInterval> | undefined
const startTimers = () => {
  stopTimers()
  if (!isLive.value) return
  loadMetrics()
  metricsTimer = setInterval(loadMetrics, 10000)
  clockTimer = setInterval(() => { now.value = Date.now() }, 1000)
}
const stopTimers = () => {
  if (metricsTimer) clearInterval(metricsTimer)
  if (clockTimer) clearInterval(clockTimer)
  metricsTimer = clockTimer = undefined
}

// ---------- 进度与信息 ----------
const progressSteps = computed(() => {
  const created = { title: t('liveRoomDetail.page.progress.created'), desc: `${fmt(roomInfo.value.createTime)} · ${roomInfo.value.createBy || '--'}` }
  const configured = {
    title: t('liveRoomDetail.page.progress.configured'),
    desc: pushError.value ? t('liveRoomDetail.page.progress.configuredFail') : t('liveRoomDetail.page.progress.configuredOk'),
  }
  const live = {
    title: t('liveRoomDetail.page.progress.live'),
    desc: isLive.value || isEnded.value
      ? t('liveRoomDetail.page.progress.liveStarted', { time: fmt(roomInfo.value.startTime) })
      : t('liveRoomDetail.page.progress.liveWaiting'),
  }
  const ended = {
    title: t('liveRoomDetail.page.progress.ended'),
    desc: isEnded.value
      ? t('liveRoomDetail.page.progress.endedDone', { time: fmt(roomInfo.value.endTime) })
      : t('liveRoomDetail.page.progress.endedWaiting'),
  }
  // 已完成的步骤数：创建、配置推流（地址生成成功）、开播、结束
  const reached = pushError.value ? 1 : isEnded.value ? 4 : isLive.value ? 3 : 2
  return [created, configured, live, ended].map((s, i) => ({
    ...s,
    state: pushError.value && i === 1 ? 'error' : i < reached - 1 ? 'done' : i === reached - 1 ? 'current' : 'todo',
  }))
})

const infoRows = computed(() => {
  const r = roomInfo.value
  const plan = r.endTime ? `${fmt(r.startTime, 'YYYY-MM-DD HH:mm')} ${t('liveRoomDetail.page.info.to')} ${fmt(r.endTime, 'HH:mm')}` : fmt(r.startTime, 'YYYY-MM-DD HH:mm')
  const viewing = optionText('viewing', r.viewingMethod || 'public')
  const hasPassword = r.viewingMethod === 'encrypted' && !!r.viewingPassword
  const flag = (v?: string) => (v === 'N' ? t('liveRoomDetail.page.info.off') : t('liveRoomDetail.page.info.on'))
  return [
    { label: t('liveRoomDetail.broadcastFormat'), value: r.broadcastFormat ? t(`liveRoomDetail.broadcastFormatOptions.${r.broadcastFormat}`) : '--' },
    { label: t('liveRoomDetail.page.info.roomType'), value: optionText('roomType', r.roomType || 'video') },
    { label: t('liveRoomDetail.page.info.displayMode'), value: optionText('displayMode', r.displayMode || 'landscape') },
    { label: t('liveRoomDetail.page.info.plannedTime'), value: plan },
    {
      label: t('liveRoomDetail.page.info.viewingMethod'),
      value: hasPassword ? `${viewing} · ${showPassword.value ? r.viewingPassword : '••••••'}` : viewing,
      secret: hasPassword,
    },
    {
      label: t('liveRoomDetail.page.info.playback'),
      value: `${optionText('playback', r.playbackMethod || 'post_end')} · ${optionText('validity', r.playbackValidity || 'unlimited')}`,
    },
    { label: t('liveRoomDetail.page.info.record'), value: flag(r.isRecord) },
    { label: t('liveRoomDetail.page.info.clip'), value: flag(r.isClip) },
    { label: t('liveRoomDetail.page.info.description'), value: r.description || t('liveRoomDetail.page.info.noDescription') },
  ]
})

// ---------- 数据加载 ----------
const loadCounts = async () => {
  const [clips, recordings] = await Promise.allSettled([
    listClips({ roomId, page: 1, pageSize: 1 }),
    listRecordings({ roomId, page: 1, pageSize: 1 }),
  ])
  clipCount.value = clips.status === 'fulfilled' ? clips.value?.pagination?.total ?? clips.value?.list?.length ?? 0 : undefined
  recordingCount.value = recordings.status === 'fulfilled' ? recordings.value?.pagination?.total ?? recordings.value?.list?.length ?? 0 : undefined
}

const fetchRoomInfo = async () => {
  if (!roomId) {
    Message.error(t('liveRoomDetail.messages.fetchFailed'))
    return
  }
  try {
    const response = await api.get(`/live/rooms/${roomId}`)
    roomInfo.value = response.data.data || {}
    await loadUrls()
    loadCounts()
    startTimers()
  } catch (error: any) {
    Message.error(error.message || t('liveRoomDetail.messages.fetchFailed'))
  }
}

// ---------- 操作 ----------
const handleBack = () => {
  navigationStore.navigateTo('LiveRoomList', t('liveRoomList.title'), {}, false)
}

const handleEdit = () => {
  if (!roomInfo.value.id) return
  navigationStore.navigateTo('LiveRoomForm', t('liveRoomList.edit'), { roomId: roomInfo.value.id }, true)
}

const goDomain = () => {
  navigationStore.navigateTo('LiveDomain', t('liveDomain.pageTitle'), {}, false)
}

const handlePreview = () => {
  const playDomain = pullUrls.value.flv ? new URL(pullUrls.value.flv).host : ''
  if (!playDomain) {
    Message.warning(t('liveRoomDetail.page.play.failTitle'))
    return
  }
  navigationStore.navigateTo('LivePreview', t('liveRoomList.preview'), { streamName: streamName.value, appName: 'live', playDomain, roomName: roomInfo.value.roomName })
}

const changeLiveState = (action: 'start' | 'end') => {
  Modal.confirm({
    title: t(`liveRoomDetail.page.confirm.${action}Title`),
    content: t(`liveRoomDetail.page.confirm.${action}Content`),
    okButtonProps: action === 'end' ? { status: 'danger' } : undefined,
    onOk: async () => {
      acting.value = true
      try {
        await api.post(`/live/rooms/${roomId}/${action}`)
        Message.success(t(`liveRoomDetail.page.confirm.${action}Success`))
        await fetchRoomInfo()
      } catch (error: any) {
        Message.error(errorReason(error))
      } finally {
        acting.value = false
      }
    },
  })
}
const handleStartLive = () => changeLiveState('start')
const handleEndLive = () => changeLiveState('end')

const handleDelete = () => {
  if (isLive.value || !roomInfo.value.id) return
  Modal.confirm({
    title: t('liveRoomDetail.messages.deleteConfirm.title'),
    content: t('liveRoomDetail.messages.deleteConfirm.content', { name: roomInfo.value.roomName }),
    okButtonProps: { status: 'danger' },
    onOk: async () => {
      try {
        const id = String(roomInfo.value.id)
        await api.delete(`/live/rooms/${id}`)
        Message.success(t('liveRoomDetail.messages.deleteSuccess'))
        handleBack()
        // 已删除直播间的详情页、编辑页标签不再有意义，一并关闭
        navigationStore.tabs
          .filter((tab) => (tab.componentName === 'LiveRoomDetail' && String(tab.params?.id) === id)
            || (tab.componentName === 'LiveRoomForm' && String(tab.params?.roomId) === id))
          .forEach((tab) => navigationStore.removeTab(tab.key))
      } catch (error: any) {
        Message.error(errorReason(error) || t('liveRoomDetail.messages.deleteFailed'))
      }
    },
  })
}

const copy = async (text: string) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    Message.success(t('liveRoomDetail.messages.copySuccess'))
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
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
}

const copyAllPull = () => copy(playUrlRows.value.filter((u) => u.url).map((u) => `${u.label}: ${u.url}`).join('\n'))

// 首次进入加载；标签页缓存后再次切回时刷新（编辑或开播后数据可能已变化）
let loaded = false
onMounted(async () => {
  await fetchRoomInfo()
  loaded = true
})
onActivated(() => {
  if (loaded) fetchRoomInfo()
})
onDeactivated(stopTimers)
onBeforeUnmount(stopTimers)
</script>

<style scoped>
.live-room-detail {
  padding: 20px;
  background: var(--bg-page);
  min-height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lrd-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
}

.lrd-header {
  padding: 18px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lrd-breadcrumb {
  display: flex;
  gap: 6px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.lrd-link {
  color: var(--brand-blue);
  cursor: pointer;
}

.lrd-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.lrd-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
}

.lrd-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: var(--info-bg);
  color: var(--brand-blue);
}

.lrd-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: currentColor;
}

.lrd-status.is-live {
  background: var(--error-bg);
  color: var(--error);
}

.lrd-status.is-live .lrd-status-dot {
  animation: lrd-pulse 1.4s ease-in-out infinite;
}

.lrd-status.is-ended {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

@keyframes lrd-pulse {
  50% { opacity: 0.3; }
}

.lrd-meta,
.lrd-hint,
.lrd-note,
.lrd-panel-desc,
.lrd-kpi-sub,
.lrd-progress-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}

.lrd-actions {
  margin-left: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.lrd-danger-outline:not(:disabled) {
  color: var(--error);
}

.lrd-kpis {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.lrd-kpi {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lrd-kpi-label {
  font-size: 13px;
  color: var(--text-tertiary);
}

.lrd-kpi-value {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
}

.lrd-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-light);
}

.lrd-tab {
  height: 46px;
  padding: 0 14px;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  font-size: 14px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.lrd-tab.is-active {
  color: var(--brand-blue);
  border-bottom-color: var(--brand-blue);
  font-weight: 600;
}

.lrd-tab-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.lrd-tab.is-active .lrd-tab-badge {
  background: var(--info-bg);
  color: var(--brand-blue);
}

.lrd-tab-body {
  padding: 20px;
}

.lrd-overview {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
}

.lrd-col-main {
  flex: 3 1 560px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lrd-col-side {
  flex: 2 1 340px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lrd-panel {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lrd-panel-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.lrd-panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.lrd-push-right {
  margin-left: auto;
}

.lrd-step {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--bg-hover);
}

.lrd-step-no {
  width: 22px;
  height: 22px;
  border-radius: 11px;
  background: var(--brand-blue);
  color: #fff;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.lrd-step-label {
  width: 64px;
  font-size: 13px;
  color: var(--text-secondary);
}

.lrd-code {
  flex: 1 1 260px;
  min-width: 0;
  font-family: ui-monospace, Consolas, 'SF Mono', monospace;
  font-size: 13px;
  color: var(--text-primary);
  word-break: break-all;
}

.lrd-text-btn {
  align-self: flex-start;
  padding: 4px 0;
  border: none;
  background: none;
  color: var(--brand-blue);
  font-size: 13px;
  cursor: pointer;
}

.lrd-url-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lrd-url-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.lrd-url-label {
  width: 110px;
  color: var(--text-secondary);
}

.lrd-error {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: var(--error-bg);
}

.lrd-error-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--error);
}

.lrd-error-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.lrd-row-actions {
  display: flex;
  gap: 8px;
}

.lrd-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.lrd-metric {
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--bg-hover);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lrd-metric-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.lrd-empty {
  padding: 16px 0;
  font-size: 13px;
  color: var(--text-tertiary);
}

.lrd-steps {
  margin: 0;
  padding: 0;
  list-style: none;
}

.lrd-progress {
  display: flex;
  gap: 12px;
}

.lrd-progress-axis {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lrd-progress-dot {
  width: 12px;
  height: 12px;
  margin-top: 4px;
  border-radius: 6px;
  box-sizing: border-box;
  border: 2px solid var(--border);
  background: var(--bg-card);
}

.lrd-progress-line {
  flex: 1;
  width: 2px;
  min-height: 22px;
  background: var(--border-light);
}

.lrd-progress.is-done .lrd-progress-dot,
.lrd-progress.is-current .lrd-progress-dot {
  border-color: var(--brand-blue);
  background: var(--brand-blue);
}

.lrd-progress.is-done .lrd-progress-line {
  background: var(--brand-blue);
}

.lrd-progress.is-error .lrd-progress-dot {
  border-color: var(--error);
  background: var(--error);
}

.lrd-progress-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 14px;
}

.lrd-progress-title {
  font-size: 14px;
  color: var(--text-tertiary);
}

.lrd-progress.is-done .lrd-progress-title {
  color: var(--text-primary);
}

.lrd-progress.is-current .lrd-progress-title,
.lrd-progress.is-error .lrd-progress-title {
  color: var(--text-primary);
  font-weight: 600;
}

.lrd-cover {
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-md);
  background: var(--bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 13px;
  color: var(--text-tertiary);
}

.lrd-cover.is-empty {
  aspect-ratio: auto;
  height: 64px;
}

.lrd-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lrd-info {
  margin: 0;
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  row-gap: 10px;
  column-gap: 12px;
  font-size: 13px;
}

.lrd-info dt {
  color: var(--text-tertiary);
}

.lrd-info dd {
  margin: 0;
  color: var(--text-primary);
  word-break: break-all;
}

@media (max-width: 960px) {
  .lrd-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .lrd-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .lrd-actions {
    margin-left: 0;
  }
}
</style>
