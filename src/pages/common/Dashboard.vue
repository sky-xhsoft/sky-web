<template>
  <div class="dashboard-page">
    <V2PageHeader
      :title="t('dashboard.title')"
      :description="t('dashboard.welcomeBack')"
    >
      <template #actions>
        <V2Button type="secondary" @click="refresh">
          <template #icon>
            <icon-refresh />
          </template>
          {{ t('layout.refresh') }}
        </V2Button>
        <V2Button type="gradient" @click="createRoom">
          <template #icon>
            <icon-plus />
          </template>
          {{ t('dashboard.createLiveRoom') }}
        </V2Button>
      </template>
    </V2PageHeader>

    <!-- 统计卡 -->
    <div class="dashboard-grid-4 stagger">
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

    <!-- 快速开始 + 趋势图 -->
    <div class="dashboard-grid-3">
      <V2Card class="quick-start-card">
        <div class="card-section-title">{{ t('dashboard.quickStart') }}</div>
        <div class="quick-start-list stagger">
          <div
            v-for="(step, idx) in quickStartSteps"
            :key="idx"
            class="quick-start-item row-link"
            @click="navigateTo(step.component, step.title, step.params)"
          >
            <div class="quick-start-item__icon">
              <component :is="step.icon" />
            </div>
            <div class="quick-start-item__text">
              <div class="quick-start-item__title">{{ idx + 1 }}. {{ step.title }}</div>
              <div class="quick-start-item__desc">{{ step.desc }}</div>
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
    <div class="dashboard-grid-4 stagger">
      <V2Card
        v-for="(module, idx) in modules"
        :key="idx"
        hover
        class="module-card"
        @click="navigateTo(module.component, module.title)"
      >
        <div class="module-card__icon">
          <component :is="module.icon" />
        </div>
        <div class="module-card__title">{{ module.title }}</div>
        <div class="module-card__desc">{{ module.desc }}</div>
        <div class="module-card__tags">
          <V2Tag v-for="(feature, fIdx) in module.features" :key="fIdx" type="neutral">
            {{ feature }}
          </V2Tag>
        </div>
      </V2Card>
    </div>

    <!-- 最近直播 + 动态 -->
    <div class="dashboard-grid-3">
      <V2Card class="recent-table-card">
        <div class="card-section-title">{{ t('dashboard.recentLive') }}</div>
        <a-table
          :data="recentRooms"
          :columns="recentColumns"
          :pagination="false"
          :loading="loading.rooms"
          size="small"
          :bordered="false"
        >
          <template #name="{ record }">
            <div class="room-name">{{ record.roomName }}</div>
          </template>
          <template #status="{ record }">
            <V2Tag :type="roomStatusMap[record.status]?.type || 'neutral'">
              {{ roomStatusMap[record.status]?.label || record.status }}
            </V2Tag>
          </template>
          <template #startTime="{ record }">
            {{ record.startTime ? formatDateTime(record.startTime) : '-' }}
          </template>
          <template #ops="{ record }">
            <button class="btn-text" @click.stop="openRoomDetail(record.id)">
              {{ t('common.detail') }}
            </button>
          </template>
        </a-table>
      </V2Card>

      <V2Card class="activity-card">
        <div class="card-section-title">{{ t('dashboard.latestActivity') }}</div>
        <div class="activity-list">
          <div v-for="item in activities" :key="item.id" class="activity-item">
            <icon-history class="activity-item__icon" />
            <div class="activity-item__body">
              <div class="activity-item__text">
                <b>{{ item.username || '-' }}</b>
                {{ item.action }}
                <span class="activity-item__target">{{ item.resourceName }}</span>
              </div>
              <div class="activity-item__time">{{ formatDateTime(item.createdAt) }}</div>
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
  IconRefresh,
  IconPlus,
  IconLink,
  IconVideoCamera,
  IconLiveBroadcast,
  IconCloud,
  IconSettings,
  IconHistory,
  IconPlayCircle,
  IconFile,
} from '@arco-design/web-vue/es/icon'

import { V2PageHeader, V2Card, V2Button, V2Tag } from '@/components/ui'
import { useNavigationStore } from '@/stores/navigation'
import { formatFileSize, formatDateTime } from '@/utils/format'
import {
  getDashboardStats,
  getDashboardTrend,
  getRecentRooms,
  getActivities,
  type DashboardStats,
  type DashboardTrend,
  type RecentRoom,
  type Activity,
} from '@/api/dashboard'

const { t, locale } = useI18n()
const navigationStore = useNavigationStore()

const stats = ref<DashboardStats>({
  totalRooms: 0,
  todayLiveSessions: 0,
  recordingStorage: 0,
  usedStorage: 0,
  groupCount: 0,
})
const trend = ref<DashboardTrend>({ dates: [], liveSessions: [], recordings: [] })
const recentRooms = ref<RecentRoom[]>([])
const activities = ref<Activity[]>([])

const loading = ref({
  stats: false,
  trend: false,
  rooms: false,
  activities: false,
})

const statCards = computed(() => [
  {
    label: t('dashboard.stats.totalRooms'),
    value: stats.value.totalRooms,
    trend: t('dashboard.stats.totalRoomsDesc'),
    icon: IconVideoCamera,
  },
  {
    label: t('dashboard.stats.todayLiveSessions'),
    value: stats.value.todayLiveSessions,
    trend: t('dashboard.stats.todayLiveSessionsDesc'),
    icon: IconLiveBroadcast,
  },
  {
    label: t('dashboard.stats.usedStorage'),
    value: formatFileSize(stats.value.usedStorage, 1),
    trend: t('dashboard.stats.usedStorageDesc'),
    icon: IconCloud,
  },
  {
    label: t('dashboard.stats.groupCount'),
    value: stats.value.groupCount,
    trend: t('dashboard.stats.groupCountDesc'),
    icon: IconSettings,
  },
])

const quickStartSteps = computed(() => [
  {
    title: t('dashboard.quickStartSteps.domainConfig'),
    desc: t('dashboard.quickStartSteps.domainConfigDesc'),
    component: 'LiveDomain',
    titleKey: 'layout.liveDomain',
    icon: IconLink,
  },
  {
    title: t('dashboard.quickStartSteps.createRoom'),
    desc: t('dashboard.quickStartSteps.createRoomDesc'),
    component: 'LiveRoomForm',
    titleKey: 'dashboard.createLiveRoom',
    icon: IconVideoCamera,
    params: { mode: 'create' },
  },
  {
    title: t('dashboard.quickStartSteps.startStreaming'),
    desc: t('dashboard.quickStartSteps.startStreamingDesc'),
    component: 'LiveStream',
    titleKey: 'layout.liveStreams',
    icon: IconPlayCircle,
  },
  {
    title: t('dashboard.quickStartSteps.contentManage'),
    desc: t('dashboard.quickStartSteps.contentManageDesc'),
    component: 'Cloud',
    titleKey: 'layout.cloud',
    icon: IconFile,
  },
].map(s => ({
  ...s,
  title: t(s.titleKey),
})))

const modules = computed(() => [
  {
    title: t('dashboard.liveRoomManagement'),
    desc: t('dashboard.liveRoomManagementDesc'),
    component: 'LiveRoomList',
    titleKey: 'layout.liveRooms',
    icon: IconVideoCamera,
    features: [t('dashboard.moduleFeatures.createRoom'), t('dashboard.moduleFeatures.manageRoom')],
  },
  {
    title: t('dashboard.cloudStorageManagement'),
    desc: t('dashboard.cloudStorageManagementDesc'),
    component: 'Cloud',
    titleKey: 'layout.cloud',
    icon: IconCloud,
    features: [t('dashboard.moduleFeatures.uploadFile'), t('dashboard.moduleFeatures.shareFile')],
  },
  {
    title: t('dashboard.domainManagement'),
    desc: t('dashboard.domainManagementDesc'),
    component: 'LiveDomain',
    titleKey: 'layout.liveDomain',
    icon: IconLink,
    features: [t('dashboard.moduleFeatures.pushDomain'), t('dashboard.moduleFeatures.playDomain')],
  },
  {
    title: t('dashboard.systemSettings'),
    desc: t('dashboard.systemSettingsDesc'),
    component: 'SystemManagement',
    titleKey: 'layout.systemManagement',
    icon: IconSettings,
    features: [t('dashboard.moduleFeatures.userPermission'), t('dashboard.moduleFeatures.systemConfig')],
  },
].map(m => ({
  ...m,
  title: t(m.titleKey),
})))

const roomStatusMap = computed(() => ({
  draft: { type: 'neutral' as const, label: t('roomStatus.draft') },
  scheduled: { type: 'info' as const, label: t('roomStatus.scheduled') },
  live: { type: 'success' as const, label: t('roomStatus.live') },
  ended: { type: 'warning' as const, label: t('roomStatus.ended') },
  archived: { type: 'neutral' as const, label: t('roomStatus.archived') },
}))

const recentColumns = computed(() => [
  { title: t('dashboard.table.room'), dataIndex: 'name', slotName: 'name' },
  { title: t('dashboard.table.status'), dataIndex: 'status', slotName: 'status', width: 100 },
  { title: t('dashboard.table.startTime'), dataIndex: 'startTime', slotName: 'startTime', width: 170 },
  { title: t('dashboard.table.ops'), slotName: 'ops', width: 80 },
])

const chartEl = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

function navigateTo(componentName: string, title: string, params?: Record<string, any>) {
  navigationStore.navigateTo(componentName, title, params)
}

function createRoom() {
  navigationStore.navigateTo('LiveRoomForm', t('dashboard.createLiveRoom'), { mode: 'create' })
}

function openRoomDetail(id: number) {
  navigationStore.navigateTo('LiveRoomDetail', t('layout.roomDetail'), { id })
}

function initChart() {
  if (!chartEl.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartEl.value)
    window.addEventListener('resize', handleResize)
  }

  const brandBlue = getComputedStyle(document.documentElement).getPropertyValue('--brand-blue').trim()
  const brandGreen = getComputedStyle(document.documentElement).getPropertyValue('--brand-green').trim()
  const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
  const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim()
  const borderLight = getComputedStyle(document.documentElement).getPropertyValue('--border-light').trim()

  chartInstance.setOption({
    grid: { left: 40, right: 20, top: 30, bottom: 25 },
    tooltip: { trigger: 'axis' },
    legend: {
      data: [t('dashboard.trend.liveSessions'), t('dashboard.trend.recordings')],
      top: 0,
      textStyle: { fontSize: 11, color: textSecondary },
    },
    xAxis: {
      type: 'category',
      data: trend.value.dates,
      axisLine: { lineStyle: { color: borderColor } },
      axisLabel: { color: textSecondary },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: borderLight } },
      axisLabel: { color: textSecondary },
    },
    series: [
      {
        name: t('dashboard.trend.liveSessions'),
        type: 'line',
        smooth: true,
        data: trend.value.liveSessions,
        lineStyle: { color: brandBlue },
        itemStyle: { color: brandBlue },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${brandBlue}30` },
              { offset: 1, color: `${brandBlue}00` },
            ],
          },
        },
      },
      {
        name: t('dashboard.trend.recordings'),
        type: 'bar',
        data: trend.value.recordings,
        itemStyle: { color: brandGreen, borderRadius: [4, 4, 0, 0] },
        barWidth: 12,
      },
    ],
  })
}

function handleResize() {
  chartInstance?.resize()
}

async function fetchAll() {
  loading.value.stats = true
  loading.value.trend = true
  loading.value.rooms = true
  loading.value.activities = true

  try {
    const [statsRes, trendRes, roomsRes, activitiesRes] = await Promise.all([
      getDashboardStats(),
      getDashboardTrend(),
      getRecentRooms(5),
      getActivities(10),
    ])
    stats.value = statsRes
    trend.value = trendRes
    recentRooms.value = roomsRes
    activities.value = activitiesRes

    await nextTick()
    initChart()
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value.stats = false
    loading.value.trend = false
    loading.value.rooms = false
    loading.value.activities = false
  }
}

function refresh() {
  fetchAll()
}

onMounted(fetchAll)

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})

watch(locale, () => {
  nextTick(() => initChart())
})
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px;
  height: 100%;
  overflow-y: auto;
}

.dashboard-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.dashboard-grid-3 {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
}

.card-section-title {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 14px;
  color: var(--text-primary);
}

/* 统计卡 */
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-card__label {
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-card__icon {
  font-size: 18px;
  color: var(--brand-blue);
}

.stat-card__value {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-card__trend {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 快速开始 */
.quick-start-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quick-start-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-primary);
  transition: background var(--duration-fast) var(--ease-out);
}

.quick-start-item:hover {
  background: var(--bg-hover);
}

.quick-start-item__icon {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  background: var(--brand-gradient);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.quick-start-item__title {
  font-weight: 500;
  font-size: 13px;
}

.quick-start-item__desc {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 趋势图 */
.trend-card {
  display: flex;
  flex-direction: column;
}

.trend-chart {
  flex: 1;
  height: 240px;
  min-height: 240px;
}

/* 模块卡 */
.module-card {
  cursor: pointer;
}

.module-card__icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: var(--brand-gradient);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  margin-bottom: 10px;
}

.module-card__title {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.module-card__desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 10px;
  line-height: 1.5;
}

.module-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 最近直播表格 */
.recent-table-card {
  min-height: 320px;
}

.room-name {
  font-weight: 500;
}

/* 动态 */
.activity-list {
  display: flex;
  flex-direction: column;
}

.activity-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-light);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item__icon {
  color: var(--brand-blue);
  font-size: 16px;
  margin-top: 2px;
  flex-shrink: 0;
}

.activity-item__body {
  flex: 1;
  min-width: 0;
}

.activity-item__text {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.5;
}

.activity-item__target {
  color: var(--brand-blue);
}

.activity-item__time {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

@media (max-width: 1200px) {
  .dashboard-grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-grid-3 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-grid-4 {
    grid-template-columns: 1fr;
  }
}
</style>
