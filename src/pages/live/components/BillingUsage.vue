<template>
  <div class="bl">
    <div class="bl-grid">
      <section class="bl-tile" aria-label="直播时长">
        <div class="bl-k">直播时长</div>
        <div class="bl-v">{{ summary ? formatMinutes(summary.liveMinutes) : '—' }}</div>
        <div class="bl-row">
          <span>{{ summary?.liveRooms || 0 }} 个直播间有推流</span>
          <span v-if="summary?.onlineRooms" class="bl-pos">● {{ summary.onlineRooms }} 个正在直播</span>
        </div>
        <div class="bl-foot">按实际推流计，每段向上取整到分钟；不足 60 秒的测试推流不计</div>
      </section>
      <section class="bl-tile" aria-label="播放流量">
        <div class="bl-k">播放流量</div>
        <div class="bl-v">{{ summary ? formatGB(summary.playGb) : '—' }}</div>
        <div class="bl-row"><span>{{ meteredText }}</span></div>
        <div class="bl-foot">观众观看直播的下行流量，按腾讯云计费流量分摊到直播间；录制回放暂不计</div>
      </section>
      <section class="bl-tile" aria-label="存储空间">
        <div class="bl-k">存储空间（日均）</div>
        <div class="bl-v">{{ summary ? formatGB(summary.storageAvgGb) : '—' }}</div>
        <div class="bl-row">
          <span v-if="summary?.storageLatestDay">{{ summary.storageLatestDay }} 占用 {{ formatGB(summary.storageLatestGb) }}</span>
          <span v-else>本月暂无存储数据</span>
        </div>
        <div v-if="summary?.storageLatestDay" class="bl-foot">
          <span v-for="it in STORAGE_ITEMS" :key="it.key">{{ it.label }} {{ formatGB(summary.storageItems[it.key] || 0) }}</span>
        </div>
      </section>
    </div>

    <V2Card :padding="false">
      <div class="bl-head">
        <span class="bl-title">每日用量</span>
        <a-radio-group v-model="chartMeter" type="button" size="small" @change="drawChart">
          <a-radio value="liveMinutes">直播时长</a-radio>
          <a-radio value="playGb">播放流量</a-radio>
          <a-radio value="storageGb">存储空间</a-radio>
        </a-radio-group>
      </div>
      <div ref="chartEl" class="bu-chart" role="img" :aria-label="`${month} 每日${chartLabel}`" />
    </V2Card>

    <V2Card :padding="false">
      <div class="bl-head"><span class="bl-title">直播间用量</span><span class="bl-sub">{{ rooms.length }} 个直播间</span></div>
      <a-table :data="rooms" :loading="loading" :pagination="rooms.length > 20 ? { pageSize: 20 } : false" row-key="roomId" :scroll="{ x: 720 }">
        <template #columns>
          <a-table-column title="直播间">
            <template #cell="{ record }">
              <div class="bl-name">{{ record.roomName || `直播间 ${record.roomId}` }}</div>
              <div class="bl-sub">ID {{ record.roomId }}<a-tag v-if="record.deleted" size="small" class="bu-deleted">已删除</a-tag></div>
            </template>
          </a-table-column>
          <a-table-column title="直播时长" :width="170" align="right">
            <template #cell="{ record }"><span class="bl-num">{{ formatMinutes(record.liveMinutes) }}</span></template>
          </a-table-column>
          <a-table-column title="推流次数" :width="110" align="right">
            <template #cell="{ record }"><span class="bl-num">{{ record.sessions }}</span></template>
          </a-table-column>
          <a-table-column title="播放流量" :width="150" align="right">
            <template #cell="{ record }"><span class="bl-num">{{ formatGB(record.playGb) }}</span></template>
          </a-table-column>
          <a-table-column title="操作" :width="110">
            <template #cell="{ record }">
              <a-button type="text" size="mini" @click="showSessions(record)">推流记录</a-button>
            </template>
          </a-table-column>
        </template>
        <template #empty><div class="bl-empty">{{ month }} 没有直播时长和播放流量</div></template>
      </a-table>
    </V2Card>

    <a-modal v-model:visible="sessionsOpen" :title="`推流记录 · ${sessionsRoom?.roomName || ''}`" :footer="false" :width="760">
      <a-table :data="sessions" :loading="sessionsLoading" row-key="id" size="small" :pagination="{ current: sessionsPage, pageSize: 20, total: sessionsTotal, size: 'small' }" @page-change="loadSessions">
        <template #columns>
          <a-table-column title="开始推流"><template #cell="{ record }"><span class="bl-num">{{ fmtTime(record.startTime) }}</span></template></a-table-column>
          <a-table-column title="结束"><template #cell="{ record }">
            <span v-if="record.endTime" class="bl-num">{{ fmtTime(record.endTime) }}</span>
            <a-tag v-else color="green" size="small">直播中</a-tag>
          </template></a-table-column>
          <a-table-column title="时长" align="right" :width="100"><template #cell="{ record }">
            <span class="bl-num">{{ formatSeconds(record.endTime ? record.seconds : secondsSince(record.startTime, record.lastSeenTime)) }}</span>
          </template></a-table-column>
          <a-table-column title="结束方式" :width="200"><template #cell="{ record }">
            <span class="bl-sub">{{ record.endTime ? END_SOURCE[record.endSource] || '—' : '—' }}</span>
            <a-tag v-if="!record.counted" size="small" color="gray" class="bu-uncounted">未计入（不足 60 秒）</a-tag>
          </template></a-table-column>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import * as echarts from '@/utils/echarts'
import { V2Card } from '@/components/ui'
import { useThemeStore } from '@/stores/theme'
import { getLiveSessions, getUsageDaily, getUsageRooms, getUsageSummary, type DailyUsage, type LiveSession, type RoomUsage, type UsageSummary } from '@/api/billing'
import { END_SOURCE, STORAGE_ITEMS, formatGB, formatMinutes, formatSeconds } from './billing'

// 用量明细：三项用量、每日用量图、直播间用量与推流记录
const props = defineProps<{ month: string }>()

const loading = ref(false)
const summary = ref<UsageSummary | null>(null)
const daily = ref<DailyUsage[]>([])
const rooms = ref<RoomUsage[]>([])

// 流量按天计量：以已计量的天数为准，区分「没有计量」和「流量为 0」
const meteredText = computed(() => {
  const s = summary.value
  if (!s || !s.fluxDays) return '本月还没有计量播放流量'
  return `已统计 ${s.fluxDays} 天，截至 ${s.fluxLatestDay}`
})

const errMsg = (e: any, fallback: string) => e?.response?.data?.message || e?.message || fallback

const load = async () => {
  loading.value = true
  try {
    const [s, d, r] = await Promise.all([getUsageSummary(props.month), getUsageDaily(props.month), getUsageRooms(props.month)])
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
watch(() => props.month, load)

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
// 切换明暗主题后按新的颜色重画
const themeStore = useThemeStore()
watch(() => themeStore.theme, () => nextTick(drawChart))

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
    const res = await getLiveSessions({ month: props.month, roomId: sessionsRoom.value.roomId, page, pageSize: 20 })
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
  load()
  window.addEventListener('resize', onResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  chart?.dispose()
  chart = null
})
defineExpose({ reload: load })
</script>

<style scoped src="./billing.css"></style>
<style scoped>
.bu-chart { height: 280px; margin: 8px 12px 12px; }
.bu-deleted { margin-left: 6px; }
.bu-uncounted { display: block; width: fit-content; margin-top: 2px; }
</style>
