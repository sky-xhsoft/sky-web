<template>
  <div class="dash-page">
    <V2PageHeader :title="t('dashboard.title')" :description="t('dashboard.welcomeBack')">
      <template #actions>
        <V2Button type="secondary" @click="refresh">
          <template #icon><IconRefresh /></template>
          {{ t('layout.refresh') }}
        </V2Button>
        <V2Button type="gradient" @click="createRoom">
          <template #icon><IconPlus /></template>
          {{ t('dashboard.createLiveRoom') }}
        </V2Button>
      </template>
    </V2PageHeader>

    <!-- 统计卡 -->
    <div class="stat-grid stagger">
      <V2Card v-for="(card, idx) in statCards" :key="idx" hover>
        <div class="stat-card">
          <div class="stat-card__top">
            <span class="stat-card__label">{{ card.label }}</span>
            <component :is="card.icon" class="stat-card__icon" />
          </div>
          <div class="stat-card__value">{{ card.value }}</div>
          <div class="stat-card__trend">{{ card.trend }}</div>
        </div>
      </V2Card>
    </div>

    <!-- 快速开始 + 观看趋势 -->
    <div class="dash-grid-3">
      <V2Card class="quick-start-card">
        <div class="card-section-title">{{ t('dashboard.quickStart') }}</div>
        <div class="quick-start-list stagger">
          <div
            v-for="(s, idx) in quickSteps"
            :key="idx"
            class="quick-start-item row-link"
            @click="navigateTo(s.component, s.title)"
          >
            <div class="quick-start-item__icon"><component :is="s.icon" /></div>
            <div class="quick-start-item__text">
              <div class="quick-start-item__title">{{ idx + 1 }}. {{ s.title }}</div>
              <div class="quick-start-item__desc">{{ s.desc }}</div>
            </div>
          </div>
        </div>
      </V2Card>

      <V2Card class="trend-card">
        <div class="card-section-title">{{ t('dashboard.trendTitle') }}</div>
        <div ref="chartEl" class="trend-chart" />
      </V2Card>
    </div>

    <!-- 功能模块 -->
    <div class="dash-grid-4 stagger">
      <V2Card v-for="(m, idx) in modules" :key="idx" hover class="module-card" @click="navigateTo(m.component, m.title)">
        <div class="module-card__icon"><component :is="m.icon" /></div>
        <div class="module-card__title">{{ m.title }}</div>
        <div class="module-card__desc">{{ m.desc }}</div>
        <div class="module-card__tags">
          <V2Tag v-for="(f, fi) in m.features" :key="fi" type="neutral">{{ f }}</V2Tag>
        </div>
      </V2Card>
    </div>

    <!-- 最近直播 + 动态 -->
    <div class="dash-grid-3">
      <V2Card class="recent-card">
        <div class="card-section-title">{{ t('dashboard.recentLive') }}</div>
        <a-table :data="recentRooms" :columns="roomColumns" :pagination="false" size="small" :bordered="false">
          <template #name="{ record }">
            <div class="room-name">{{ record.name }}</div>
          </template>
          <template #status="{ record }">
            <V2Tag :type="roomStatusMap[record.status]?.type || 'neutral'">{{ roomStatusMap[record.status]?.label || record.status }}</V2Tag>
          </template>
          <template #ops="{ record }">
            <button class="btn-text" @click.stop="openRoomDetail(record.id)">{{ t('common.detail') }}</button>
          </template>
        </a-table>
      </V2Card>

      <V2Card class="activity-card">
        <div class="card-section-title">{{ t('dashboard.latestActivity') }}</div>
        <div class="activity-list">
          <div v-for="(item, idx) in activities" :key="idx" class="activity-item">
            <IconHistory class="activity-item__icon" />
            <div class="activity-item__body">
              <div class="activity-item__text">
                <b>{{ item.user }}</b> {{ item.action }} <span class="activity-item__target">{{ item.target }}</span>
              </div>
              <div class="activity-item__time">{{ item.time }}</div>
            </div>
          </div>
        </div>
      </V2Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from '@/utils/echarts'
import {
  IconRefresh, IconPlus, IconLink, IconVideoCamera, IconLiveBroadcast,
  IconCloud, IconCamera, IconHistory, IconPlayCircle, IconFile,
} from '@arco-design/web-vue/es/icon'
import { V2PageHeader, V2Card, V2Button, V2Tag } from '@/components/ui'
import { useNavigationStore } from '@/stores/navigation'
import { getDashboardStats, getDashboardTrend, getRecentRooms, getActivities } from '@/api/dashboard'
import type { DashboardStats, DashboardTrend, RecentRoom as ApiRecentRoom, Activity as ApiActivity } from '@/api/dashboard'

const { t, locale } = useI18n()
const navigationStore = useNavigationStore()

// ===== 数据状态（真实 API + mock 兜底）=====
const loading = ref(false)
const statsData = ref<DashboardStats | null>(null)
const trendData = ref<DashboardTrend | null>(null)
const recentRoomData = ref<ApiRecentRoom[] | null>(null)
const activityData = ref<ApiActivity[] | null>(null)

// mock 兜底数据
const mockStats = () => ({
  totalRooms: 128,
  todayLiveSessions: 12,
  recordingStorage: 137710093112 + 22222222222,
})
const mockTrend = () => ({
  dates: ['09-01', '09-02', '09-03', '09-04', '09-05', '09-06', '09-07'],
  liveSessions: [12, 15, 14, 18, 22, 17, 26],
  recordings: [3200, 4100, 3800, 5200, 6100, 4800, 5600],
})
const mockRecentRooms: ApiRecentRoom[] = [
  { id: 101, roomName: '2026 秋季新品发布会', status: 'living', viewerCount: 1286, startTime: '2026-09-06 14:00' as any },
  { id: 102, roomName: '前端技术分享会', status: 'living', viewerCount: 862, startTime: '2026-09-06 15:30' as any },
  { id: 103, roomName: '产品周会 · 第 38 期', status: 'ended', viewerCount: 305, startTime: '2026-09-05 10:00' as any },
  { id: 104, roomName: '客户培训 · 云盘专题', status: 'ended', viewerCount: 178, startTime: '2026-09-04 16:00' as any },
]

function formatBytes(bytes: number): string {
  if (!bytes) return '0 GB'
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB'
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB'
  return (bytes / 1024).toFixed(1) + ' KB'
}

async function loadDashboard() {
  loading.value = true
  try {
    const [stats, trend, rooms, acts] = await Promise.allSettled([
      getDashboardStats(),
      getDashboardTrend(7),
      getRecentRooms(5),
      getActivities(5),
    ])
    if (stats.status === 'fulfilled') statsData.value = stats.value
    if (trend.status === 'fulfilled') trendData.value = trend.value
    if (rooms.status === 'fulfilled' && rooms.value.length) recentRoomData.value = rooms.value
    if (acts.status === 'fulfilled' && acts.value.length) activityData.value = acts.value
  } finally {
    loading.value = false
    nextTick(() => initChart())
  }
}

const statCards = computed(() => {
  const s = statsData.value
  return [
    { label: t('dashboard.stats.totalRooms'), value: s ? s.totalRooms : mockStats().totalRooms, trend: t('dashboard.stats.totalRoomsDesc'), icon: IconVideoCamera },
    { label: t('dashboard.stats.todayLiveSessions'), value: s ? s.todayLiveSessions : mockStats().todayLiveSessions, trend: t('dashboard.stats.todayLiveSessionsDesc'), icon: IconLiveBroadcast },
    { label: t('dashboard.stats.recordingStorage'), value: s ? formatBytes(s.recordingStorage) : formatBytes(mockStats().recordingStorage), trend: t('dashboard.stats.recordingStorageDesc'), icon: IconCloud },
  ]
})

const quickSteps = computed(() => [
  { title: t('dashboard.quickStartSteps.domainConfig'), desc: t('dashboard.quickStartSteps.domainConfigDesc'), icon: IconLink, component: 'LiveDomain' },
  { title: t('dashboard.quickStartSteps.createRoom'), desc: t('dashboard.quickStartSteps.createRoomDesc'), icon: IconVideoCamera, component: 'LiveRoomForm' },
  { title: t('dashboard.quickStartSteps.startStreaming'), desc: t('dashboard.quickStartSteps.startStreamingDesc'), icon: IconPlayCircle, component: 'LiveStream' },
  { title: t('dashboard.quickStartSteps.contentManage'), desc: t('dashboard.quickStartSteps.contentManageDesc'), icon: IconFile, component: 'Cloud' },
])

const modules = computed(() => [
  { title: t('dashboard.liveRoomManagement'), desc: t('dashboard.liveRoomManagementDesc'), icon: IconVideoCamera, features: [t('dashboard.moduleFeatures.createRoom'), t('dashboard.moduleFeatures.manageRoom')], component: 'LiveRoomList' },
  { title: t('dashboard.cloudStorageManagement'), desc: t('dashboard.cloudStorageManagementDesc'), icon: IconCloud, features: [t('dashboard.moduleFeatures.uploadFile'), t('dashboard.moduleFeatures.shareFile')], component: 'Cloud' },
  { title: t('dashboard.domainManagement'), desc: t('dashboard.domainManagementDesc'), icon: IconLink, features: [t('dashboard.moduleFeatures.pushDomain'), t('dashboard.moduleFeatures.playDomain')], component: 'LiveDomain' },
  { title: t('dashboard.liveRecording'), desc: t('dashboard.liveRecordingDesc'), icon: IconCamera, features: [t('dashboard.moduleFeatures.recordingList'), t('dashboard.moduleFeatures.recordingManage')], component: 'LiveRecordings' },
])

const recentRooms = computed(() => {
  const list = recentRoomData.value || mockRecentRooms
  return list.map(r => ({
    id: r.id,
    name: r.roomName,
    streamName: r.roomName,
    status: r.status,
    viewers: r.viewerCount,
    startTime: r.startTime ? new Date(r.startTime).toLocaleString('zh-CN', { hour12: false }).slice(0, 16) : '-',
  }))
})

const roomStatusMap = computed(() => ({
  living: { type: 'success' as const, label: t('roomStatus.live') },
  ended: { type: 'neutral' as const, label: t('roomStatus.ended') },
  preview: { type: 'info' as const, label: t('roomStatus.scheduled') },
}))

const roomColumns = computed(() => [
  { title: t('dashboard.table.room'), dataIndex: 'name', slotName: 'name' },
  { title: t('dashboard.table.status'), dataIndex: 'status', slotName: 'status', width: 90 },
  { title: '观看', dataIndex: 'viewers', width: 90 },
  { title: t('dashboard.table.ops'), slotName: 'ops', width: 80 },
])

const activities = computed(() => {
  if (activityData.value && activityData.value.length) {
    return activityData.value.map(a => ({
      time: new Date(a.createdAt).toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      user: a.username,
      action: a.action,
      target: a.resourceName || a.resource,
    }))
  }
  return [
    { time: '10 分钟前', user: '张晓', action: '创建了直播间', target: '2026 秋季新品发布会' },
    { time: '1 小时前', user: '李工', action: '上传文件到云盘', target: '产品白皮书-v3.pdf' },
    { time: '2 小时前', user: '系统', action: '录制完成', target: '产品周会 · 第 38 期' },
    { time: '昨天', user: '管理员', action: '更新了权限组', target: '直播运营组' },
  ]
})

// ===== 趋势图 =====
const chartEl = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
const trend = ref({
  dates: ['09-01', '09-02', '09-03', '09-04', '09-05', '09-06', '09-07'],
  views: [3200, 4100, 3800, 5200, 6100, 4800, 5600],
  lives: [12, 15, 14, 18, 22, 17, 26],
})
function activeTrend() {
  if (trendData.value) {
    return {
      dates: trendData.value.dates.map(d => d.slice(5)),
      views: trendData.value.recordings,
      lives: trendData.value.liveSessions,
    }
  }
  return trend.value
}

function initChart() {
  if (!chartEl.value) return
  if (!chart) { chart = echarts.init(chartEl.value); window.addEventListener('resize', handleResize) }
  const blue = getComputedStyle(document.documentElement).getPropertyValue('--brand-blue').trim()
  const green = getComputedStyle(document.documentElement).getPropertyValue('--brand-green').trim()
  const ts = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
  const bd = getComputedStyle(document.documentElement).getPropertyValue('--border').trim()
  const bdl = getComputedStyle(document.documentElement).getPropertyValue('--border-light').trim()
  chart.setOption({
    grid: { left: 40, right: 20, top: 30, bottom: 25 },
    tooltip: { trigger: 'axis' },
    legend: { data: [t('dashboard.trend.liveSessions'), t('dashboard.trend.recordings')], top: 0, textStyle: { fontSize: 11, color: ts } },
    xAxis: { type: 'category', data: activeTrend().dates, axisLine: { lineStyle: { color: bd } }, axisLabel: { color: ts } },
    yAxis: [
      { type: 'value', splitLine: { lineStyle: { color: bdl } }, axisLabel: { color: ts } },
      { type: 'value', splitLine: { show: false }, axisLabel: { color: ts } },
    ],
    series: [
      { name: t('dashboard.trend.liveSessions'), type: 'line', smooth: true, data: activeTrend().views, lineStyle: { color: blue }, itemStyle: { color: blue },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${blue}30` }, { offset: 1, color: `${blue}00` }] } } },
      { name: t('dashboard.trend.recordings'), type: 'line', smooth: true, data: activeTrend().lives, lineStyle: { color: green }, itemStyle: { color: green } },
    ],
  })
}

function handleResize() { chart?.resize() }
function refresh() { loadDashboard() }
function navigateTo(component: string, title: string, params?: Record<string, any>) { navigationStore.navigateTo(component, title, params) }
function createRoom() { navigationStore.navigateTo('LiveRoomForm', t('dashboard.createLiveRoom'), { mode: 'create' }) }
function openRoomDetail(id: number) { navigationStore.navigateTo('LiveRoomDetail', t('layout.roomDetail'), { id }) }

onMounted(() => {
  loadDashboard()
  nextTick(() => initChart())
})
onUnmounted(() => { window.removeEventListener('resize', handleResize); chart?.dispose(); chart = null })
watch(locale, () => nextTick(() => initChart()))
</script>

<style scoped>
.dash-page { display: flex; flex-direction: column; gap: 16px; padding: 8px; height: 100%; overflow-y: auto; }
.stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.dash-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.dash-grid-3 { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; }
.card-section-title { font-weight: 600; font-size: 15px; margin-bottom: 14px; color: var(--text-primary); }
.stat-card { display: flex; flex-direction: column; gap: 6px; }
.stat-card__top { display: flex; align-items: center; justify-content: space-between; }
.stat-card__label { font-size: 12px; color: var(--text-secondary); }
.stat-card__icon { font-size: 18px; color: var(--brand-blue); }
.stat-card__value { font-size: 26px; font-weight: 700; color: var(--text-primary); }
.stat-card__trend { font-size: 12px; color: var(--text-tertiary); }
.quick-start-list { display: flex; flex-direction: column; }
.quick-start-item { display: flex; gap: 12px; align-items: center; padding: 10px; border-radius: var(--radius-md); cursor: pointer; }
.quick-start-item:hover { background: var(--bg-hover); }
.quick-start-item__icon { width: 34px; height: 34px; border-radius: var(--radius-md); background: var(--brand-gradient); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.quick-start-item__title { font-weight: 500; font-size: 13px; color: var(--text-primary); }
.quick-start-item__desc { font-size: 12px; color: var(--text-secondary); }
.trend-chart { height: 240px; }
.module-card__icon { font-size: 22px; color: var(--brand-blue); margin-bottom: 8px; }
.module-card__title { font-weight: 600; font-size: 14px; margin-bottom: 4px; color: var(--text-primary); }
.module-card__desc { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
.module-card__tags { display: flex; flex-wrap: wrap; }
.room-name { font-weight: 500; }
.activity-list { display: flex; flex-direction: column; }
.activity-item { display: flex; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--border-light); }
.activity-item:last-child { border-bottom: none; }
.activity-item__icon { color: var(--brand-blue); font-size: 16px; margin-top: 2px; flex-shrink: 0; }
.activity-item__text { font-size: 13px; color: var(--text-primary); }
.activity-item__target { color: var(--brand-blue); }
.activity-item__time { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
.stagger > * { animation: fadeInUp .4s ease both; }
</style>