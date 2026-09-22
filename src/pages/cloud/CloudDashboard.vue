<template>
  <div class="dash-page">
    <V2PageHeader :title="t('cloudDash.title')" :description="t('cloudDash.subtitle')">
      <template #actions>
        <V2Button type="secondary" @click="refresh">
          <template #icon><IconRefresh /></template>
          {{ t('layout.refresh') }}
        </V2Button>
        <V2Button type="gradient" @click="goCloud">
          <template #icon><IconUpload /></template>
          {{ t('cloudDash.upload') }}
        </V2Button>
      </template>
    </V2PageHeader>

    <!-- 统计卡 -->
    <div class="dash-grid-4 stagger">
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

    <!-- 快速开始 + 存储趋势 -->
    <div class="dash-grid-3">
      <V2Card class="quick-start-card">
        <div class="card-section-title">{{ t('cloudDash.quickStart') }}</div>
        <div class="quick-start-list stagger">
          <div
            v-for="(s, idx) in quickSteps"
            :key="idx"
            class="quick-start-item row-link"
            @click="goCloud"
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
        <div class="card-section-title">{{ t('cloudDash.trendTitle') }}</div>
        <div ref="chartEl" class="trend-chart" />
      </V2Card>
    </div>

    <!-- 功能模块 -->
    <div class="dash-grid-4 stagger">
      <V2Card v-for="(m, idx) in modules" :key="idx" hover class="module-card" @click="goCloud">
        <div class="module-card__icon"><component :is="m.icon" /></div>
        <div class="module-card__title">{{ m.title }}</div>
        <div class="module-card__desc">{{ m.desc }}</div>
        <div class="module-card__tags">
          <V2Tag v-for="(f, fi) in m.features" :key="fi" type="neutral">{{ f }}</V2Tag>
        </div>
      </V2Card>
    </div>

    <!-- 最近文件 + 动态 -->
    <div class="dash-grid-3">
      <V2Card class="recent-card">
        <div class="card-section-title">{{ t('cloudDash.recentFiles') }}</div>
        <a-table :data="recentFiles" :columns="fileColumns" :pagination="false" size="small" :bordered="false">
          <template #name="{ record }">
            <div class="file-name">
              <IconFile class="file-icon" />
              {{ record.name }}
            </div>
          </template>
          <template #size="{ record }">{{ formatSize(record.size) }}</template>
          <template #type="{ record }">
            <V2Tag :type="fileTypeMap[record.type]?.type || 'neutral'">{{ fileTypeMap[record.type]?.label || record.type }}</V2Tag>
          </template>
        </a-table>
      </V2Card>

      <V2Card class="activity-card">
        <div class="card-section-title">{{ t('cloudDash.latestActivity') }}</div>
        <div class="activity-list">
          <div v-for="item in activities" :key="item.time" class="activity-item">
            <IconCloud class="activity-item__icon" />
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
import * as echarts from 'echarts'
import {
  IconRefresh, IconUpload, IconFolder, IconFile, IconCloud,
  IconStorage, IconShareAlt, IconApps,
  IconSettings, IconSafe, IconHistory, IconPlayCircle,
} from '@arco-design/web-vue/es/icon'
import { V2PageHeader, V2Card, V2Button, V2Tag } from '@/components/ui'
import { useNavigationStore } from '@/stores/navigation'
import { formatFileSize } from '@/utils/format'

const { t, locale } = useI18n()
const navigationStore = useNavigationStore()

// ===== 模拟数据 =====
const statCards = computed(() => [
  { label: t('cloudDash.stats.usedStorage'), value: '128.5 GB', trend: t('cloudDash.stats.usedStorageDesc'), icon: IconStorage },
  { label: t('cloudDash.stats.fileCount'), value: 1864, trend: t('cloudDash.stats.fileCountDesc'), icon: IconFile },
  { label: t('cloudDash.stats.folderCount'), value: 42, trend: t('cloudDash.stats.folderCountDesc'), icon: IconFolder },
  { label: t('cloudDash.stats.shareCount'), value: 18, trend: t('cloudDash.stats.shareCountDesc'), icon: IconShareAlt },
])

const quickSteps = computed(() => [
  { title: t('cloudDash.quick.upload'), desc: t('cloudDash.quick.uploadDesc'), icon: IconUpload },
  { title: t('cloudDash.quick.folder'), desc: t('cloudDash.quick.folderDesc'), icon: IconFolder },
  { title: t('cloudDash.quick.share'), desc: t('cloudDash.quick.shareDesc'), icon: IconShareAlt },
  { title: t('cloudDash.quick.manage'), desc: t('cloudDash.quick.manageDesc'), icon: IconSettings },
])

const modules = computed(() => [
  { title: t('cloudDash.modules.files'), desc: t('cloudDash.modules.filesDesc'), icon: IconFile, features: [t('cloudDash.feat.upload'), t('cloudDash.feat.folder')] },
  { title: t('cloudDash.modules.share'), desc: t('cloudDash.modules.shareDesc'), icon: IconShareAlt, features: [t('cloudDash.feat.shareLink'), t('cloudDash.feat.permission')] },
  { title: t('cloudDash.modules.type'), desc: t('cloudDash.modules.typeDesc'), icon: IconApps, features: [t('cloudDash.feat.video'), t('cloudDash.feat.image')] },
  { title: t('cloudDash.modules.recycle'), desc: t('cloudDash.modules.recycleDesc'), icon: IconSafe, features: [t('cloudDash.feat.restore'), t('cloudDash.feat.clear')] },
])

const recentFiles = [
  { id: 1, name: '产品白皮书-v3.pdf', type: 'pdf', size: 8.4 * 1024 * 1024, time: '2026-09-06 14:00' },
  { id: 2, name: '发布会切片合集.mp4', type: 'video', size: 256 * 1024 * 1024, time: '2026-09-06 09:30' },
  { id: 3, name: '宣传海报.jpg', type: 'image', size: 3.2 * 1024 * 1024, time: '2026-09-05 17:20' },
  { id: 4, name: '直播录制-产品周会.mp4', type: 'video', size: 1800 * 1024 * 1024, time: '2026-09-05 10:10' },
] as { id: number; name: string; type: string; size: number; time: string }[]

const fileTypeMap = computed(() => ({
  pdf: { type: 'warning' as const, label: 'PDF' },
  video: { type: 'success' as const, label: t('cloudDash.fileType.video') },
  image: { type: 'info' as const, label: t('cloudDash.fileType.image') },
}))

const fileColumns = computed(() => [
  { title: t('cloudDash.fileTable.name'), dataIndex: 'name', slotName: 'name' },
  { title: t('cloudDash.fileTable.type'), dataIndex: 'type', slotName: 'type', width: 90 },
  { title: t('cloudDash.fileTable.size'), dataIndex: 'size', slotName: 'size', width: 110 },
])

const activities = computed(() => [
  { time: t('cloudDash.activity.10m'), user: '李工', action: t('cloudDash.activity.uploaded'), target: '产品白皮书-v3.pdf' },
  { time: t('cloudDash.activity.1h'), user: '张晓', action: t('cloudDash.activity.createdShare'), target: '发布会切片合集' },
  { time: t('cloudDash.activity.2h'), user: '系统', action: t('cloudDash.activity.autoRecording'), target: '产品周会 · 第 38 期' },
  { time: t('cloudDash.activity.yesterday'), user: '王产品', action: t('cloudDash.activity.createdFolder'), target: '2026-09-市场素材' },
])

// ===== 趋势图 =====
const chartEl = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
const trend = {
  dates: ['09-01', '09-02', '09-03', '09-04', '09-05', '09-06', '09-07'],
  uploads: [12, 15, 14, 18, 22, 17, 26],
  files: [103, 121, 98, 145, 162, 138, 190],
}

function initChart() {
  if (!chartEl.value) return
  if (!chart) {
    chart = echarts.init(chartEl.value)
    window.addEventListener('resize', handleResize)
  }
  const blue = getComputedStyle(document.documentElement).getPropertyValue('--brand-blue').trim()
  const green = getComputedStyle(document.documentElement).getPropertyValue('--brand-green').trim()
  const ts = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
  const bd = getComputedStyle(document.documentElement).getPropertyValue('--border').trim()
  const bdl = getComputedStyle(document.documentElement).getPropertyValue('--border-light').trim()
  chart.setOption({
    grid: { left: 40, right: 20, top: 30, bottom: 25 },
    tooltip: { trigger: 'axis' },
    legend: { data: [t('cloudDash.trend.uploads'), t('cloudDash.trend.files')], top: 0, textStyle: { fontSize: 11, color: ts } },
    xAxis: { type: 'category', data: trend.dates, axisLine: { lineStyle: { color: bd } }, axisLabel: { color: ts } },
    yAxis: [
      { type: 'value', splitLine: { lineStyle: { color: bdl } }, axisLabel: { color: ts } },
      { type: 'value', splitLine: { show: false }, axisLabel: { color: ts } },
    ],
    series: [
      { name: t('cloudDash.trend.uploads'), type: 'bar', data: trend.uploads, itemStyle: { color: blue, borderRadius: [4, 4, 0, 0] }, barWidth: 12 },
      { name: t('cloudDash.trend.files'), type: 'line', yAxisIndex: 1, smooth: true, data: trend.files, lineStyle: { color: green }, itemStyle: { color: green } },
    ],
  })
}

function handleResize() { chart?.resize() }

function refresh() { nextTick(() => initChart()) }
function goCloud() { navigationStore.navigateTo('Cloud', t('layout.cloud'), {}) }
function formatSize(n: number) { return formatFileSize(n, 1) }

onMounted(() => { nextTick(() => initChart()) })
onUnmounted(() => { window.removeEventListener('resize', handleResize); chart?.dispose(); chart = null })
watch(locale, () => nextTick(() => initChart()))
</script>

<style scoped>
.dash-page { display: flex; flex-direction: column; gap: 16px; padding: 8px; height: 100%; overflow-y: auto; }
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
.file-name { display: flex; align-items: center; gap: 8px; font-weight: 500; }
.file-icon { color: var(--brand-blue); }
.activity-list { display: flex; flex-direction: column; }
.activity-item { display: flex; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--border-light); }
.activity-item:last-child { border-bottom: none; }
.activity-item__icon { color: var(--brand-blue); font-size: 16px; margin-top: 2px; flex-shrink: 0; }
.activity-item__text { font-size: 13px; color: var(--text-primary); }
.activity-item__target { color: var(--brand-blue); }
.activity-item__time { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
.stagger > * { animation: fadeInUp .4s ease both; }
</style>