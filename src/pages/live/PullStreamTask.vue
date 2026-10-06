<template>
  <div class="pull-stream-task-page">
    <V2PageHeader title="社媒分发" description="管理拉流转推任务，实现多平台直播分发">
      <template #actions>
        <V2Button type="secondary" @click="refreshList">
          <template #icon><icon-refresh /></template>
          刷新
        </V2Button>
        <V2Button @click="goToCreate">
          <template #icon><icon-plus /></template>
          创建分发任务
        </V2Button>
      </template>
    </V2PageHeader>

    <div class="stats-grid">
      <V2Card v-for="(stat, idx) in statCards" :key="idx" hover>
        <div class="stat-card">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value">{{ stat.value }}<span v-if="stat.unit" class="stat-unit">{{ stat.unit }}</span></div>
        </div>
      </V2Card>
    </div>

    <V2Card class="search-card" :padding="true">
      <a-space size="medium">
        <a-input-search
          v-model="searchKeyword"
          placeholder="请输入关键字进行搜索"
          style="width: 300px"
          @search="handleSearch"
        />
        <V2Button type="secondary" @click="handleSearch">查询</V2Button>
      </a-space>
    </V2Card>

    <V2Card :padding="false" style="overflow: hidden;">
      <a-table
        :loading="loading"
        :data="taskList"
        :pagination="pagination"
        :bordered="{ wrapper: true, cell: true }"
        row-key="taskId"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <template #columns>
          <a-table-column title="备注/编号" data-index="comment" :width="200">
            <template #cell="{ record }">
              <div class="task-id">
                <div class="task-name">{{ record.comment || '无备注' }}</div>
                <div class="task-id-sub">{{ record.taskId }}</div>
              </div>
            </template>
          </a-table-column>
          <a-table-column title="源类型" :width="100">
            <template #cell="{ record }">
              <V2Tag :type="record.sourceType === 'PullLivePushLive' ? 'success' : 'info'">
                {{ record.sourceType === 'PullLivePushLive' ? '直播' : '点播' }}
              </V2Tag>
            </template>
          </a-table-column>
          <a-table-column title="分发区域" data-index="region" :width="140">
            <template #cell="{ record }">{{ getRegionText(record.region) }}</template>
          </a-table-column>
          <a-table-column title="源地址" :width="260">
            <template #cell="{ record }">
              <div class="source-url">{{ record.sourceUrls && record.sourceUrls[0] }}</div>
            </template>
          </a-table-column>
          <a-table-column title="任务状态" :width="100">
            <template #cell="{ record }">
              <V2Tag :type="getStatusType(record.status)">{{ getStatusText(record.status) }}</V2Tag>
            </template>
          </a-table-column>
          <a-table-column title="运行状态" :width="100">
            <template #cell="{ record }">
              <V2Tag :type="getRunningStatusType(record.runningStatus)">{{ getRunningStatusText(record.runningStatus) }}</V2Tag>
            </template>
          </a-table-column>
          <a-table-column title="开始时间" :width="170">
            <template #cell="{ record }">{{ formatDateTime(record.startTime) }}</template>
          </a-table-column>
          <a-table-column title="结束时间" :width="170">
            <template #cell="{ record }">{{ formatDateTime(record.endTime) }}</template>
          </a-table-column>
          <a-table-column title="操作" fixed="right" :width="240">
            <template #cell="{ record }">
              <a-space>
                <a-link @click="viewTaskStatus(record)">状态</a-link>
                <a-link @click="goToEdit(record)">编辑</a-link>
                <a-link v-if="record.status === 'enable'" @click="pauseTask(record)">禁用</a-link>
                <a-link v-if="record.status === 'pause'" @click="enableTask(record)">启用</a-link>
                <a-link @click="restartTask(record)">重启</a-link>
                <a-link status="danger" @click="deleteTask(record)">删除</a-link>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </V2Card>

    <a-modal v-model:visible="showStatusDialog" title="任务状态" width="1200px" :footer="false">
      <div v-if="taskStatus" class="status-detail">
        <div class="status-query">
          <a-range-picker
            v-model="statusDateRange"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            style="width: 380px"
            @change="handleStatusDateRangeChange"
          />
          <V2Button @click="refreshStatusData">
            <template #icon><icon-refresh /></template>
            查询
          </V2Button>
        </div>

        <div v-if="taskStatus.dataInfoList && taskStatus.dataInfoList.length > 0">
          <h3 class="chart-section-title">流数据统计</h3>
          <div class="chart-container-grid">
            <V2Card class="chart-item">
              <div class="chart-title">视频帧率 (fps)</div>
              <div ref="videoFpsChart" class="chart-body" />
            </V2Card>
            <V2Card class="chart-item">
              <div class="chart-title">音频帧率 (fps)</div>
              <div ref="audioFpsChart" class="chart-body" />
            </V2Card>
            <V2Card class="chart-item">
              <div class="chart-title">视频码率 (kbps)</div>
              <div ref="videoRateChart" class="chart-body" />
            </V2Card>
            <V2Card class="chart-item">
              <div class="chart-title">音频码率 (kbps)</div>
              <div ref="audioRateChart" class="chart-body" />
            </V2Card>
          </div>
        </div>
        <div v-else class="empty-status">
          <a-empty description="暂无流数据统计信息" />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, onUnmounted, watch, onActivated } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { IconPlus, IconRefresh } from '@arco-design/web-vue/es/icon'
import { formatDateTime } from '@/utils/date'
import { useAuthStore } from '@/stores/auth'
import { useNavigationStore } from '@/stores/navigation'
import {
  getPullStreamTasks,
  updatePullStreamTask,
  deletePullStreamTask,
  getPullStreamTaskStatus,
  restartPullStreamTask,
  describePullTransformPushInfoList
} from '@/api/live'
import type { PullStreamTaskInfo, DescribePullTransformPushInfoListResponse } from '@/api/live'
import { V2PageHeader, V2Card, V2Button, V2Tag } from '@/components/ui'
import * as echarts from '@/utils/echarts'

const authStore = useAuthStore()
const navigationStore = useNavigationStore()

const props = defineProps<{
  roomId?: string
}>()

const loading = ref(false)
const taskList = ref<PullStreamTaskInfo[]>([])
const allTaskList = ref<PullStreamTaskInfo[]>([])
const searchKeyword = ref('')
const totalTasksLimit = ref(188)

const currentTasks = computed(() => allTaskList.value.length)
const activeTasks = computed(() => allTaskList.value.filter(task => task.status === 'enable').length)
const expiredTasks = computed(() => {
  const now = new Date().getTime()
  return allTaskList.value.filter(task => new Date(task.endTime).getTime() < now).length
})

const statCards = computed(() => [
  { label: '当前任务/创建任务', value: `${currentTasks.value} / ${totalTasksLimit.value}`, unit: '' },
  { label: '有效路数', value: activeTasks.value, unit: '路' },
  { label: '已过期任务', value: expiredTasks.value, unit: '条' }
])

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: true,
  showPageSize: true
})

const showStatusDialog = ref(false)
const taskStatus = ref<DescribePullTransformPushInfoListResponse | null>(null)
const videoFpsChart = ref<HTMLDivElement | null>(null)
const audioFpsChart = ref<HTMLDivElement | null>(null)
const videoRateChart = ref<HTMLDivElement | null>(null)
const audioRateChart = ref<HTMLDivElement | null>(null)
let videoFpsChartInstance: echarts.ECharts | null = null
let audioFpsChartInstance: echarts.ECharts | null = null
let videoRateChartInstance: echarts.ECharts | null = null
let audioRateChartInstance: echarts.ECharts | null = null

const currentTaskId = ref<string>('')
const statusDateRange = ref<[string, string] | []>([])

const initStatusDateRange = () => {
  const now = new Date()
  const endTime = new Date(now.getTime() - 1000)
  const startTime = new Date(endTime.getTime() - 30 * 60 * 1000)
  const fmt = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
  statusDateRange.value = [fmt(startTime), fmt(endTime)]
}

const refreshStatusData = async () => {
  if (!currentTaskId.value) return
  try {
    const [startTime, endTime] = statusDateRange.value
    const result = await describePullTransformPushInfoList({
      taskId: currentTaskId.value,
      startTime: new Date(startTime).toISOString().slice(0, 19) + 'Z',
      endTime: new Date(endTime).toISOString().slice(0, 19) + 'Z'
    })
    taskStatus.value = result
  } catch (error) {
    console.error('获取任务状态失败:', error)
    Message.error('获取任务状态失败')
  }
}

const handleStatusDateRangeChange = () => refreshStatusData()

const initSingleChart = (
  chartContainer: HTMLDivElement | null,
  chartInstance: echarts.ECharts | null,
  times: string[],
  data: number[],
  title: string,
  unit: string,
  color: string,
  min?: number,
  max?: number
): echarts.ECharts | null => {
  if (!chartContainer) return null
  if (chartInstance) chartInstance.dispose()
  const newChartInstance = echarts.init(chartContainer)

  const calculateLabelInterval = (timeData: string[]) => {
    if (timeData.length <= 1) return []
    const intervalMinutes = 5
    const firstTime = timeData[0]
    const firstTotalSeconds = parseInt(firstTime.split(':')[0]) * 3600 + parseInt(firstTime.split(':')[1]) * 60 + parseInt(firstTime.split(':')[2])
    const visibleIndices: number[] = []
    for (let i = 0; i < timeData.length; i++) {
      const currentTime = timeData[i]
      const currentTotalSeconds = parseInt(currentTime.split(':')[0]) * 3600 + parseInt(currentTime.split(':')[1]) * 60 + parseInt(currentTime.split(':')[2])
      const minutesSinceFirst = (currentTotalSeconds - firstTotalSeconds) / 60
      if (minutesSinceFirst % intervalMinutes === 0) {
        visibleIndices.push(i)
      } else if (parseInt(currentTime.split(':')[2]) === 0 && Math.abs(minutesSinceFirst % intervalMinutes) < 0.5) {
        visibleIndices.push(i)
      }
    }
    return visibleIndices.length > 0 ? visibleIndices : []
  }

  const visibleIndices = calculateLabelInterval(times)

  const option: any = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const time = params[0].axisValue
        let result = `<div style="font-weight: bold; margin-bottom: 8px;">${time}</div>`
        params.forEach((param: any) => {
          const value = param.seriesName.includes('码率') ? `${param.value.toFixed(1)}kbps` : `${param.value}fps`
          result += `<div style="display: flex; align-items: center; margin-bottom: 4px;">
            <span style="display: inline-block; width: 8px; height: 8px; background-color: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
            <span style="margin-right: 8px;">${param.seriesName}:</span>
            <span style="font-weight: bold;">${value}</span>
          </div>`
        })
        return result
      },
      axisPointer: { type: 'cross' }
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: times,
      axisLabel: {
        formatter: (value: string, index: number) => (visibleIndices.includes(index) ? value : ''),
        rotate: 0,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      min,
      max,
      axisLine: { lineStyle: { color } },
      axisLabel: { formatter: `{value}${unit}` }
    },
    series: [
      {
        name: title,
        type: 'line',
        data,
        smooth: true,
        lineStyle: { width: 3, type: 'solid', color },
        itemStyle: { color },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `${color}33` },
            { offset: 1, color: `${color}11` }
          ])
        },
        showSymbol: false
      }
    ]
  }

  newChartInstance.setOption(option)
  const resizeObserver = new ResizeObserver(() => newChartInstance?.resize())
  resizeObserver.observe(chartContainer)
  return newChartInstance
}

const initChart = () => {
  if (!taskStatus.value?.dataInfoList) return
  const data = taskStatus.value.dataInfoList
  const times = data.map(item => formatDateTime(item.time).split(' ')[1])
  const videoFpsData = data.map(item => item.videoFps)
  const audioFpsData = data.map(item => item.audioFps)
  const videoRateData = data.map(item => item.videoRate / 1000)
  const audioRateData = data.map(item => item.audioRate / 1000)

  videoFpsChartInstance = initSingleChart(videoFpsChart.value, videoFpsChartInstance, times, videoFpsData, '视频帧率', 'fps', '#165dff', 0, 60)
  audioFpsChartInstance = initSingleChart(audioFpsChart.value, audioFpsChartInstance, times, audioFpsData, '音频帧率', 'fps', '#34c759', 0, 60)
  videoRateChartInstance = initSingleChart(videoRateChart.value, videoRateChartInstance, times, videoRateData, '视频码率', 'kbps', '#f7ba1e', 0)
  audioRateChartInstance = initSingleChart(audioRateChart.value, audioRateChartInstance, times, audioRateData, '音频码率', 'kbps', '#f53f3f', 0)
}

watch(() => taskStatus.value, (newValue) => {
  if (newValue?.dataInfoList?.length) {
    setTimeout(() => initChart(), 100)
  }
})

onUnmounted(() => {
  videoFpsChartInstance?.dispose()
  audioFpsChartInstance?.dispose()
  videoRateChartInstance?.dispose()
  audioRateChartInstance?.dispose()
  stopRunningStatusTimer()
})

const loadTaskList = async () => {
  loading.value = true
  try {
    const result = await getPullStreamTasks()
    const convertedList = (result || []).map((task: any) => ({
      taskId: task.taskId || task.TaskID,
      sourceType: task.sourceType || task.SourceType,
      sourceUrls: task.sourceUrls || task.SourceURLs,
      domainName: task.domainName || task.DomainName,
      appName: task.appName || task.AppName,
      streamName: task.streamName || task.StreamName,
      startTime: task.startTime || task.StartTime,
      endTime: task.endTime || task.EndTime,
      status: task.status || task.Status,
      runningStatus: 'inactive',
      createTime: task.createTime || task.CreateTime,
      comment: task.comment || task.Comment,
      region: task.region || task.Region,
      pushArgs: task.pushArgs || task.PushArgs
    }))

    allTaskList.value = convertedList
    let filtered = convertedList
    if (props.roomId) {
      filtered = convertedList.filter((task: any) =>
        task.streamId === props.roomId || task.streamId?.includes(props.roomId) ||
        task.streamName === props.roomId || task.streamName?.includes(props.roomId)
      )
    }
    if (searchKeyword.value) {
      const kw = searchKeyword.value.toLowerCase()
      filtered = filtered.filter((task: any) =>
        (task.comment || '').toLowerCase().includes(kw) ||
        (task.taskId || '').toLowerCase().includes(kw) ||
        (task.streamName || '').toLowerCase().includes(kw)
      )
    }
    taskList.value = filtered
    pagination.total = taskList.value.length
  } catch (error) {
    console.error('加载任务列表失败:', error)
    Message.error('加载任务列表失败')
  } finally {
    loading.value = false
  }
}

const getStatusType = (status: string) => {
  const map: Record<string, any> = { enable: 'success', pause: 'warning', finished: 'neutral', error: 'error' }
  return map[status] || 'neutral'
}
const getStatusText = (status: string) => {
  const map: Record<string, string> = { enable: '启用', pause: '暂停', finished: '已完成', error: '错误' }
  return map[status] || status
}
const getRunningStatusType = (runningStatus: string) => {
  return runningStatus === 'active' ? 'success' : 'neutral'
}
const getRunningStatusText = (runningStatus: string) => {
  return runningStatus === 'active' ? '活跃' : '不活跃'
}

const getRegionText = (region: string) => {
  const regionMap: Record<string, string> = {
    'ap-bangkok': '亚太东南（曼谷）',
    'ap-beijing': '华北地区（北京）',
    'ap-chongqing': '西南地区（重庆）',
    'ap-guangzhou': '华南地区（广州）',
    'ap-hongkong': '港澳台地区（中国香港）',
    'ap-seoul': '亚太东北（首尔）',
    'ap-shanghai': '华东地区（上海）',
    'ap-singapore': '亚太东南（新加坡）',
    'ap-tokyo': '亚太东北（东京）',
    'eu-frankfurt': '欧洲地区（法兰克福）',
    'na-ashburn': '美国东部（弗吉尼亚）',
    'na-siliconvalley': '美国西部（硅谷）'
  }
  return regionMap[region] || region || '-'
}

const handleSearch = () => {
  pagination.current = 1
  loadTaskList()
}
const refreshList = () => loadTaskList()
const handlePageChange = (page: number) => {
  pagination.current = page
  loadTaskList()
}
const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.current = 1
  loadTaskList()
}

const goToCreate = () => navigationStore.navigateTo('PullStreamTaskForm', '创建分发任务', {})
const goToEdit = (task: PullStreamTaskInfo) => navigationStore.navigateTo('PullStreamTaskForm', '编辑分发任务', { taskId: task.taskId })

const deleteTask = async (task: PullStreamTaskInfo) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除该分发任务吗？',
    onOk: async () => {
      try {
        await deletePullStreamTask(task.taskId, authStore.user?.username || 'admin')
        Message.success('删除任务成功')
        loadTaskList()
      } catch (error) {
        console.error('删除任务失败:', error)
        Message.error('删除任务失败')
      }
    }
  })
}

const restartTask = async (task: PullStreamTaskInfo) => {
  try {
    await restartPullStreamTask(task.taskId, authStore.user?.username || 'admin')
    Message.success('重启任务成功')
    loadTaskList()
  } catch (error) {
    console.error('重启任务失败:', error)
    Message.error('重启任务失败')
  }
}

const pauseTask = async (task: PullStreamTaskInfo) => {
  Modal.confirm({
    title: '确认禁用',
    content: '确定要禁用该任务吗？禁用后任务将暂停分发。',
    onOk: async () => {
      try {
        await updatePullStreamTask(task.taskId, { operator: authStore.user?.username || 'admin', status: 'pause' })
        Message.success('禁用任务成功')
        loadTaskList()
      } catch (error) {
        console.error('禁用任务失败:', error)
        Message.error('禁用任务失败')
      }
    }
  })
}

const enableTask = async (task: PullStreamTaskInfo) => {
  try {
    await updatePullStreamTask(task.taskId, { operator: authStore.user?.username || 'admin', status: 'enable' })
    Message.success('启用任务成功')
    loadTaskList()
  } catch (error) {
    console.error('启用任务失败:', error)
    Message.error('启用任务失败')
  }
}

const viewTaskStatus = async (task: PullStreamTaskInfo) => {
  try {
    currentTaskId.value = task.taskId
    initStatusDateRange()
    const [startTime, endTime] = statusDateRange.value
    const result = await describePullTransformPushInfoList({
      taskId: task.taskId,
      startTime: new Date(startTime).toISOString().slice(0, 19) + 'Z',
      endTime: new Date(endTime).toISOString().slice(0, 19) + 'Z'
    })
    taskStatus.value = result
    showStatusDialog.value = true
  } catch (error) {
    console.error('获取任务状态失败:', error)
    Message.error('获取任务状态失败')
  }
}

let runningStatusTimer: any = null
const updateRunningStatus = async () => {
  const tasksToUpdate = allTaskList.value.filter(task => task.status === 'enable' && (!task.runningStatus || task.runningStatus === 'inactive'))
  if (tasksToUpdate.length === 0) return
  for (const task of tasksToUpdate) {
    try {
      const statusResult = await getPullStreamTaskStatus(task.taskId)
      const idx = allTaskList.value.findIndex(t => t.taskId === task.taskId)
      if (idx !== -1) {
        allTaskList.value[idx].runningStatus = statusResult?.runStatus === 'active' ? 'active' : 'inactive'
      }
    } catch {
      const idx = allTaskList.value.findIndex(t => t.taskId === task.taskId)
      if (idx !== -1) allTaskList.value[idx].runningStatus = 'inactive'
    }
  }
}
const startRunningStatusTimer = () => {
  stopRunningStatusTimer()
  runningStatusTimer = setInterval(updateRunningStatus, 5000)
}
const stopRunningStatusTimer = () => {
  if (runningStatusTimer) {
    clearInterval(runningStatusTimer)
    runningStatusTimer = null
  }
}

onMounted(() => {
  loadTaskList()
  startRunningStatusTimer()
  navigationStore.onBack((fromComponent: string, toComponent: string) => {
    if (fromComponent === 'PullStreamTaskForm' && toComponent === 'PullStreamTask') {
      loadTaskList()
    }
  })
})

onActivated(() => loadTaskList())
</script>

<style scoped>
.pull-stream-task-page {
  padding: 12px;
  background: var(--bg-page);
  height: 100%;
  overflow-y: auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-unit {
  font-size: 13px;
  color: var(--text-secondary);
  margin-left: 4px;
  font-weight: 500;
}

.search-card {
  margin-bottom: 16px;
}

.task-id {
  line-height: 1.4;
}

.task-name {
  font-weight: 500;
  color: var(--text-primary);
}

.task-id-sub {
  font-size: 12px;
  color: var(--text-secondary);
}

.source-url {
  word-break: break-all;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.status-detail {
  padding: 8px 0;
}

.status-query {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.chart-section-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 14px 0;
  color: var(--text-primary);
}

.chart-container-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.chart-item {
  padding: 12px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  text-align: center;
}

.chart-body {
  width: 100%;
  height: 250px;
}

.empty-status {
  padding: 40px 0;
}

@media (max-width: 1200px) {
  .chart-container-grid {
    grid-template-columns: 1fr;
  }
}
</style>
