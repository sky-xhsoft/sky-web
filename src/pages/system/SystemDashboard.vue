<template>
  <div class="dash-page">
    <V2PageHeader :title="t('sysDash.title')" :description="t('sysDash.subtitle')">
      <template #actions>
        <V2Button type="secondary" @click="refresh">
          <template #icon><IconRefresh /></template>
          {{ t('layout.refresh') }}
        </V2Button>
        <V2Button type="gradient" @click="goPermission">
          <template #icon><IconSafe /></template>
          {{ t('sysDash.managePermission') }}
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

    <!-- 快速操作 + 系统趋势 -->
    <div class="dash-grid-3">
      <V2Card class="quick-start-card">
        <div class="card-section-title">{{ t('sysDash.quickActions') }}</div>
        <div class="quick-start-list stagger">
          <div
            v-for="(s, idx) in quickActions"
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
        <div class="card-section-title">{{ t('sysDash.trendTitle') }}</div>
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

    <!-- 最近操作 + 动态 -->
    <div class="dash-grid-3">
      <V2Card class="recent-card">
        <div class="card-section-title">{{ t('sysDash.recentOps') }}</div>
        <a-table :data="recentOps" :columns="opColumns" :pagination="false" size="small" :bordered="false">
          <template #user="{ record }">{{ record.user }}</template>
          <template #target="{ record }"><span class="op-target">{{ record.target }}</span></template>
          <template #time="{ record }">{{ record.time }}</template>
        </a-table>
      </V2Card>

      <V2Card class="activity-card">
        <div class="card-section-title">{{ t('sysDash.systemNotice') }}</div>
        <div class="activity-list">
          <div v-for="n in notices" :key="n.time" class="activity-item">
            <IconInfoCircle class="activity-item__icon" :style="{ color: n.important ? '#f53f3f' : '' }" />
            <div class="activity-item__body">
              <div class="activity-item__text">
                <b>{{ n.title }}</b>
                <V2Tag v-if="n.important" type="danger" size="small">{{ t('sysDash.important') }}</V2Tag>
              </div>
              <div class="activity-item__time">{{ n.time }} · {{ n.desc }}</div>
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
  IconRefresh, IconSafe, IconUser, IconIdcard,
  IconSettings, IconApps, IconBook, IconCommand, IconDesktop,
  IconInfoCircle, IconFile,
} from '@arco-design/web-vue/es/icon'
import { V2PageHeader, V2Card, V2Button, V2Tag } from '@/components/ui'
import { useNavigationStore } from '@/stores/navigation'

const { t, locale } = useI18n()
const navigationStore = useNavigationStore()

// ===== 模拟数据 =====
const statCards = computed(() => [
  { label: t('sysDash.stats.users'), value: 128, trend: t('sysDash.stats.usersDesc'), icon: IconUser },
  { label: t('sysDash.stats.groups'), value: 16, trend: t('sysDash.stats.groupsDesc'), icon: IconSafe },
  { label: t('sysDash.stats.tables'), value: 54, trend: t('sysDash.stats.tablesDesc'), icon: IconDesktop },
  { label: t('sysDash.stats.companies'), value: 3, trend: t('sysDash.stats.companiesDesc'), icon: IconIdcard },
])

const quickActions = computed(() => [
  { title: t('sysDash.quick.users'), desc: t('sysDash.quick.usersDesc'), icon: IconUser, component: 'UserProfile' },
  { title: t('sysDash.quick.groups'), desc: t('sysDash.quick.groupsDesc'), icon: IconSafe, component: 'PermissionManagement' },
  { title: t('sysDash.quick.companies'), desc: t('sysDash.quick.companiesDesc'), icon: IconIdcard, component: 'CompanyConfig' },
  { title: t('sysDash.quick.tables'), desc: t('sysDash.quick.tablesDesc'), icon: IconApps, component: 'SystemManagement' },
])

const modules = computed(() => [
  { title: t('sysDash.modules.users'), desc: t('sysDash.modules.usersDesc'), icon: IconUser, features: [t('sysDash.feat.account'), t('sysDash.feat.bind')], component: 'UserProfile' },
  { title: t('sysDash.modules.permission'), desc: t('sysDash.modules.permissionDesc'), icon: IconSafe, features: [t('sysDash.feat.group'), t('sysDash.feat.permMatrix')], component: 'PermissionManagement' },
  { title: t('sysDash.modules.metadata'), desc: t('sysDash.modules.metadataDesc'), icon: IconDesktop, features: [t('sysDash.feat.dict'), t('sysDash.feat.columns')], component: 'SystemManagement' },
  { title: t('sysDash.modules.company'), desc: t('sysDash.modules.companyDesc'), icon: IconIdcard, features: [t('sysDash.feat.tenant'), t('sysDash.feat.credential')], component: 'CompanyConfig' },
])

const recentOps = [
  { id: 1, user: '管理员', action: t('sysDash.op.createUser'), target: '运营专员-小李', time: '2026-09-06 14:20' },
  { id: 2, user: '管理员', action: t('sysDash.op.updateGroup'), target: '直播运营组', time: '2026-09-06 10:00' },
  { id: 3, user: '张晓', action: t('sysDash.op.updatePermission'), target: '仪表盘查看权限', time: '2026-09-05 17:40' },
  { id: 4, user: '系统', action: t('sysDash.op.updateDict'), target: 'room_type', time: '2026-09-05 09:10' },
] as { id: number; user: string; action: string; target: string; time: string }[]

const opColumns = computed(() => [
  { title: t('sysDash.opTable.user'), dataIndex: 'user', slotName: 'user', width: 90 },
  { title: t('sysDash.opTable.action'), dataIndex: 'action' },
  { title: t('sysDash.opTable.target'), dataIndex: 'target', slotName: 'target' },
  { title: t('sysDash.opTable.time'), dataIndex: 'time', slotName: 'time', width: 140 },
])

const notices = computed(() => [
  { title: t('sysDash.noticeMaintenance'), desc: t('sysDash.noticeMaintenanceDesc'), time: '2026-03-10', important: true },
  { title: t('sysDash.noticeFeature'), desc: t('sysDash.noticeFeatureDesc'), time: '2026-03-08', important: false },
  { title: t('sysDash.noticeStorage'), desc: t('sysDash.noticeStorageDesc'), time: '2026-03-05', important: false },
])

// ===== 趋势图 =====
const chartEl = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
const trend = {
  dates: ['09-01', '09-02', '09-03', '09-04', '09-05', '09-06', '09-07'],
  logins: [86, 92, 78, 105, 118, 96, 132],
  ops: [320, 380, 350, 420, 500, 460, 560],
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
    grid: { left: 40, right: 40, top: 30, bottom: 25 },
    tooltip: { trigger: 'axis' },
    legend: { data: [t('sysDash.trend.logins'), t('sysDash.trend.ops')], top: 0, textStyle: { fontSize: 11, color: ts } },
    xAxis: { type: 'category', data: trend.dates, axisLine: { lineStyle: { color: bd } }, axisLabel: { color: ts } },
    yAxis: [
      { type: 'value', splitLine: { lineStyle: { color: bdl } }, axisLabel: { color: ts } },
      { type: 'value', splitLine: { show: false }, axisLabel: { color: ts } },
    ],
    series: [
      { name: t('sysDash.trend.ops'), type: 'bar', data: trend.ops, itemStyle: { color: blue, borderRadius: [4, 4, 0, 0] }, barWidth: 12 },
      { name: t('sysDash.trend.logins'), type: 'line', yAxisIndex: 1, smooth: true, data: trend.logins, lineStyle: { color: green }, itemStyle: { color: green } },
    ],
  })
}

function handleResize() { chart?.resize() }
function refresh() { nextTick(() => initChart()) }
function navigateTo(component: string, title: string) { navigationStore.navigateTo(component, title, {}) }
function goPermission() { navigationStore.navigateTo('PermissionManagement', t('layout.permissionManagement'), {}) }

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
.op-target { color: var(--brand-blue); font-weight: 500; }
.activity-list { display: flex; flex-direction: column; }
.activity-item { display: flex; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--border-light); }
.activity-item:last-child { border-bottom: none; }
.activity-item__icon { color: var(--brand-blue); font-size: 16px; margin-top: 2px; flex-shrink: 0; }
.activity-item__text { font-size: 13px; color: var(--text-primary); }
.activity-item__target { color: var(--brand-blue); }
.activity-item__time { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
.stagger > * { animation: fadeInUp .4s ease both; }
</style>