<template>
  <div class="live-billing-page">
    <V2PageHeader title="费用中心" description="本公司直播时长、播放流量、存储空间的用量">
      <template #actions>
        <a-select v-model="month" :style="{ width: '150px' }" aria-label="月份" @change="loadAll">
          <a-option v-for="m in months" :key="m" :value="m">{{ m.replace('-', ' 年 ') }} 月</a-option>
        </a-select>
        <V2Button type="secondary" :loading="loading" @click="loadAll"><template #icon><icon-refresh /></template>刷新</V2Button>
      </template>
    </V2PageHeader>

    <div class="lb-trial">试运行阶段：只统计用量，暂不扣费。直播时长每 5 分钟更新；播放流量和存储空间在次日凌晨 4 点后更新前一天的数据。</div>

    <a-tabs v-model:active-key="tab" class="lb-tabs" lazy-load>
      <a-tab-pane key="usage" title="用量概览">
        <div class="lb-meters">
          <section class="lb-meter" aria-label="直播时长">
            <div class="lb-meter-k">直播时长</div>
            <div class="lb-meter-v">{{ summary ? formatMinutes(summary.liveMinutes) : '—' }}</div>
            <div class="lb-meter-sub">
              <span>{{ summary?.liveRooms || 0 }} 个直播间有推流</span>
              <span v-if="summary?.onlineRooms" class="lb-live">● {{ summary.onlineRooms }} 个正在直播</span>
            </div>
            <div class="lb-meter-rule">按实际推流计，每段向上取整到分钟；不足 60 秒的测试推流不计</div>
          </section>
          <section class="lb-meter" aria-label="播放流量">
            <div class="lb-meter-k">播放流量</div>
            <div class="lb-meter-v">{{ summary ? formatGB(summary.playGb) : '—' }}</div>
            <div class="lb-meter-sub"><span>{{ summary?.fluxLatestDay ? `已统计到 ${summary.fluxLatestDay}` : '本月暂无流量数据' }}</span></div>
            <div class="lb-meter-rule">观众观看直播的下行流量，按腾讯云计费流量分摊到直播间；录制回放暂不计</div>
          </section>
          <section class="lb-meter" aria-label="存储空间">
            <div class="lb-meter-k">存储空间（日均）</div>
            <div class="lb-meter-v">{{ summary ? formatGB(summary.storageAvgGb) : '—' }}</div>
            <div class="lb-meter-sub">
              <span v-if="summary?.storageLatestDay">{{ summary.storageLatestDay }} 占用 {{ formatGB(summary.storageLatestGb) }}</span>
              <span v-else>本月暂无存储数据</span>
            </div>
            <div v-if="summary?.storageLatestDay" class="lb-items">
              <span v-for="it in STORAGE_ITEMS" :key="it.key">{{ it.label }} {{ formatGB(summary.storageItems[it.key] || 0) }}</span>
            </div>
          </section>
        </div>

        <V2Card class="lb-card" :padding="false">
          <div class="lb-card-head">
            <span class="lb-card-title">每日用量</span>
            <a-radio-group v-model="chartMeter" type="button" size="small" @change="drawChart">
              <a-radio value="liveMinutes">直播时长</a-radio>
              <a-radio value="playGb">播放流量</a-radio>
              <a-radio value="storageGb">存储空间</a-radio>
            </a-radio-group>
          </div>
          <div ref="chartEl" class="lb-chart" role="img" :aria-label="`${month} 每日${chartLabel}`" />
        </V2Card>
      </a-tab-pane>

      <a-tab-pane key="rooms" title="直播间明细">
        <V2Card :padding="false">
          <a-table :data="rooms" :loading="loading" :pagination="rooms.length > 20 ? { pageSize: 20 } : false" row-key="roomId" :scroll="{ x: 720 }">
            <template #columns>
              <a-table-column title="直播间">
                <template #cell="{ record }">
                  <div class="lb-name">{{ record.roomName || `直播间 ${record.roomId}` }}</div>
                  <div class="lb-sub">ID {{ record.roomId }}</div>
                </template>
              </a-table-column>
              <a-table-column title="直播时长" :width="170" align="right">
                <template #cell="{ record }"><span class="lb-num">{{ formatMinutes(record.liveMinutes) }}</span></template>
              </a-table-column>
              <a-table-column title="推流次数" :width="110" align="right">
                <template #cell="{ record }"><span class="lb-num">{{ record.sessions }}</span></template>
              </a-table-column>
              <a-table-column title="播放流量" :width="150" align="right">
                <template #cell="{ record }"><span class="lb-num">{{ formatGB(record.playGb) }}</span></template>
              </a-table-column>
              <a-table-column title="操作" :width="110">
                <template #cell="{ record }">
                  <a-button type="text" size="mini" @click="showSessions(record)">推流记录</a-button>
                </template>
              </a-table-column>
            </template>
            <template #empty><div class="lb-empty">{{ month }} 没有直播时长和播放流量</div></template>
          </a-table>
        </V2Card>
      </a-tab-pane>

      <a-tab-pane v-if="isPlatform" key="reconcile" title="平台对账">
        <BillingReconcile :month="month" />
      </a-tab-pane>
    </a-tabs>

    <a-modal v-model:visible="sessionsOpen" :title="`推流记录 · ${sessionsRoom?.roomName || ''}`" :footer="false" :width="760">
      <a-table :data="sessions" :loading="sessionsLoading" row-key="id" size="small" :pagination="{ current: sessionsPage, pageSize: 20, total: sessionsTotal, size: 'small' }" @page-change="loadSessions">
        <template #columns>
          <a-table-column title="开始推流"><template #cell="{ record }"><span class="lb-num">{{ fmtTime(record.startTime) }}</span></template></a-table-column>
          <a-table-column title="结束"><template #cell="{ record }">
            <span v-if="record.endTime" class="lb-num">{{ fmtTime(record.endTime) }}</span>
            <a-tag v-else color="green" size="small">直播中</a-tag>
          </template></a-table-column>
          <a-table-column title="时长" align="right" :width="100"><template #cell="{ record }">
            <span class="lb-num">{{ formatSeconds(record.endTime ? record.seconds : secondsSince(record.startTime, record.lastSeenTime)) }}</span>
          </template></a-table-column>
          <a-table-column title="结束方式" :width="150"><template #cell="{ record }">
            <span class="lb-sub">{{ record.endTime ? END_SOURCE[record.endSource] || '—' : '—' }}</span>
          </template></a-table-column>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconRefresh } from '@arco-design/web-vue/es/icon'
import dayjs from 'dayjs'
import * as echarts from '@/utils/echarts'
import { V2Button, V2Card, V2PageHeader } from '@/components/ui'
import { useAuthStore } from '@/stores/auth'
import { SYSTEM_CENTER_COMPANY_ID } from '@/constants/subsystems'
import { getLiveSessions, getUsageDaily, getUsageRooms, getUsageSummary, type DailyUsage, type LiveSession, type RoomUsage, type UsageSummary } from '@/api/billing'
import { END_SOURCE, STORAGE_ITEMS, formatGB, formatMinutes, formatSeconds, recentMonths } from './components/billing'
import BillingReconcile from './components/BillingReconcile.vue'

const authStore = useAuthStore()
const isPlatform = computed(() => authStore.currentCompanyId() === SYSTEM_CENTER_COMPANY_ID)

const months = recentMonths(new Date())
const month = ref(months[0])
const tab = ref('usage')
const loading = ref(false)
const summary = ref<UsageSummary | null>(null)
const daily = ref<DailyUsage[]>([])
const rooms = ref<RoomUsage[]>([])

const errMsg = (e: any, fallback: string) => e?.response?.data?.message || e?.message || fallback

const loadAll = async () => {
  loading.value = true
  try {
    const [s, d, r] = await Promise.all([getUsageSummary(month.value), getUsageDaily(month.value), getUsageRooms(month.value)])
    summary.value = s
    daily.value = d || []
    rooms.value = r || []
    await nextTick()
    drawChart()
  } catch (e) {
    Message.error(errMsg(e, '加载用量失败'))
  } finally {
    loading.value = false
  }
}

// ---------- 每日用量图 ----------
const chartEl = ref<HTMLElement | null>(null)
const chartMeter = ref<'liveMinutes' | 'playGb' | 'storageGb'>('liveMinutes')
const chartLabel = computed(() => ({ liveMinutes: '直播时长（分钟）', playGb: '播放流量（GB）', storageGb: '存储空间（GB）' })[chartMeter.value])
let chart: echarts.ECharts | null = null
const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
const drawChart = () => {
  if (!chartEl.value) return
  if (!chart) chart = echarts.init(chartEl.value)
  const color = cssVar('--brand-blue') || '#3370ff'
  const muted = cssVar('--text-secondary') || '#86909c'
  const line = cssVar('--border-light') || '#e5e6eb'
  const key = chartMeter.value
  chart.setOption({
    grid: { left: 52, right: 16, top: 28, bottom: 28 },
    tooltip: { trigger: 'axis', valueFormatter: (v: number) => (key === 'liveMinutes' ? formatMinutes(v) : formatGB(v)) },
    xAxis: { type: 'category', data: daily.value.map((d) => d.date.slice(5)), axisLabel: { color: muted }, axisLine: { lineStyle: { color: line } } },
    yAxis: { type: 'value', name: key === 'liveMinutes' ? '分钟' : 'GB', nameTextStyle: { color: muted }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: line } } },
    series: [{ type: 'bar', name: chartLabel.value, data: daily.value.map((d) => d[key]), itemStyle: { color, borderRadius: [3, 3, 0, 0] }, barMaxWidth: 18 }],
  }, true)
}
const onResize = () => chart?.resize()
watch(tab, async (v) => {
  if (v === 'usage') {
    await nextTick()
    chart?.resize()
  }
})

// ---------- 推流记录 ----------
const sessionsOpen = ref(false)
const sessionsRoom = ref<RoomUsage | null>(null)
const sessions = ref<LiveSession[]>([])
const sessionsTotal = ref(0)
const sessionsPage = ref(1)
const sessionsLoading = ref(false)
const fmtTime = (v: string) => dayjs(v).format('MM-DD HH:mm:ss')
const secondsSince = (from: string, to: string) => dayjs(to).diff(dayjs(from), 'second')
const loadSessions = async (page = 1) => {
  if (!sessionsRoom.value) return
  sessionsPage.value = page
  sessionsLoading.value = true
  try {
    const res = await getLiveSessions({ month: month.value, roomId: sessionsRoom.value.roomId, page, pageSize: 20 })
    sessions.value = res.items || []
    sessionsTotal.value = res.total || 0
  } catch (e) {
    Message.error(errMsg(e, '加载推流记录失败'))
  } finally {
    sessionsLoading.value = false
  }
}
const showSessions = (r: RoomUsage) => {
  sessionsRoom.value = r
  sessions.value = []
  sessionsOpen.value = true
  loadSessions(1)
}

onMounted(() => {
  loadAll()
  window.addEventListener('resize', onResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.live-billing-page { display: flex; flex-direction: column; gap: 16px; }
.lb-trial { padding: 10px 14px; border-radius: 6px; background: rgb(var(--arcoblue-1)); color: rgb(var(--arcoblue-7)); font-size: 13px; }
.lb-tabs :deep(.arco-tabs-content) { padding-top: 16px; }
.lb-meters { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; }
.lb-meter { background: var(--color-bg-2); border: 1px solid var(--color-border-2); border-radius: 8px; padding: 18px 20px; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.lb-meter-k { font-size: 13px; color: var(--color-text-3); }
.lb-meter-v { font-size: 26px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--color-text-1); }
.lb-meter-sub { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 13px; color: var(--color-text-2); }
.lb-live { color: rgb(var(--green-6)); }
.lb-meter-rule { margin-top: auto; padding-top: 8px; border-top: 1px solid var(--color-border-1); font-size: 12px; color: var(--color-text-3); line-height: 1.6; }
.lb-items { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: auto; padding-top: 8px; border-top: 1px solid var(--color-border-1); font-size: 12px; color: var(--color-text-3); }
.lb-card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 20px 0; flex-wrap: wrap; }
.lb-card-title { font-weight: 600; }
.lb-chart { height: 280px; margin: 8px 12px 12px; }
.lb-name { font-weight: 500; }
.lb-sub { font-size: 12px; color: var(--color-text-3); }
.lb-num { font-variant-numeric: tabular-nums; }
.lb-empty { padding: 28px 0; color: var(--color-text-3); }
@media (max-width: 900px) {
  .lb-meters { grid-template-columns: minmax(0, 1fr); }
}
</style>
