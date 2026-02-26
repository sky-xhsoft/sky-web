<template>
  <div class="pull-stream-task-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>社媒分发</h2>
    </div>

    <!-- 统计信息 -->
    <div class="stats-container">
      <a-card class="stat-card">
        <div class="stat-label">当前任务/创建任务</div>
        <div class="stat-value">{{ currentTasks }} / {{ totalTasksLimit }}</div>
      </a-card>
      <a-card class="stat-card">
        <div class="stat-label">有效路数</div>
        <div class="stat-value">{{ activeTasks }}</div>
      </a-card>
      <a-card class="stat-card">
        <div class="stat-label">已过期任务</div>
        <div class="stat-value">{{ expiredTasks }}<span class="stat-unit">条</span></div>
      </a-card>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <a-button type="primary" @click="goToCreate">
        <template #icon>
          <icon-plus/>
        </template>
        创建分发任务
      </a-button>
      <div class="action-right">
        <a-range-picker
            v-model="dateRange"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            style="width: 380px"
            @change="handleDateRangeChange"
        />
        <a-input-search
            v-model="searchKeyword"
            placeholder="请输入关键字进行搜索"
            style="width: 300px"
            @search="handleSearch"
        />
        <a-button @click="refreshList">
          <template #icon>
            <icon-refresh/>
          </template>
          刷新
        </a-button>
      </div>
    </div>

    <!-- 任务列表 -->
    <a-table
        :loading="loading"
        :data="taskList"
        :pagination="pagination"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
    >
      <template #columns>
        <a-table-column title="备注/编号" data-index="comment">
          <template #cell="{ record }">
            <div class="task-id">
              <div>{{ record.comment || '无备注' }}</div>
              <div class="task-id-sub">{{ record.taskId }}</div>
            </div>
          </template>
        </a-table-column>
        <a-table-column title="源类型" data-index="sourceType">
          <template #cell="{ record }">
            <a-tag :color="record.sourceType === 'PullLivePushLive' ? 'green' : 'blue'">
              {{ record.sourceType === 'PullLivePushLive' ? '直播' : '点播' }}
            </a-tag>
          </template>
        </a-table-column>
        <a-table-column title="分发区域" data-index="region">
          <template #cell="{ record }">
            {{ getRegionText(record.region) }}
          </template>
        </a-table-column>
        <a-table-column title="源地址" data-index="sourceUrls">
          <template #cell="{ record }">
            <div class="source-url">{{ record.sourceUrls && record.sourceUrls[0] }}</div>
          </template>
        </a-table-column>
        <a-table-column title="任务状态" data-index="status">
          <template #cell="{ record }">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
        </a-table-column>
        <a-table-column title="运行状态" data-index="runningStatus">
          <template #cell="{ record }">
            <a-tag :color="getRunningStatusColor(record.runningStatus)">
              {{ getRunningStatusText(record.runningStatus) }}
            </a-tag>
          </template>
        </a-table-column>
        <a-table-column title="任务开始时间" data-index="startTime">
          <template #cell="{ record }">
            {{ formatDateTime(record.startTime) }}
          </template>
        </a-table-column>
        <a-table-column title="任务结束时间" data-index="endTime">
          <template #cell="{ record }">
            {{ formatDateTime(record.endTime) }}
          </template>
        </a-table-column>
        <a-table-column title="操作" fixed="right">
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

    <!-- 任务状态对话框 -->
    <a-modal
        v-model:visible="showStatusDialog"
        title="任务状态"
        width="1200px"
        :footer="false"
    >
      <div v-if="taskStatus" class="status-detail">
        <!-- 时间查询 -->
        <div class="status-query">
          <a-range-picker
              v-model="statusDateRange"
              show-time
              format="YYYY-MM-DD HH:mm:ss"
              style="width: 380px"
              @change="handleStatusDateRangeChange"
          />
          <a-button type="primary" @click="refreshStatusData">
            <template #icon>
              <icon-refresh/>
            </template>
            查询
          </a-button>
        </div>

        <div v-if="taskStatus.dataInfoList && taskStatus.dataInfoList.length > 0">
          <h3 style="margin-bottom: 12px;">流数据统计</h3>

          <!-- 四个独立的图表 -->
          <div class="chart-container-grid">
            <!-- 视频帧率 -->
            <div class="chart-item">
              <div class="chart-title">视频帧率 (fps)</div>
              <div ref="videoFpsChart" style="width: 100%; height: 250px;"></div>
            </div>
            <!-- 音频帧率 -->
            <div class="chart-item">
              <div class="chart-title">音频帧率 (fps)</div>
              <div ref="audioFpsChart" style="width: 100%; height: 250px;"></div>
            </div>
            <!-- 视频码率 -->
            <div class="chart-item">
              <div class="chart-title">视频码率 (kbps)</div>
              <div ref="videoRateChart" style="width: 100%; height: 250px;"></div>
            </div>
            <!-- 音频码率 -->
            <div class="chart-item">
              <div class="chart-title">音频码率 (kbps)</div>
              <div ref="audioRateChart" style="width: 100%; height: 250px;"></div>
            </div>
          </div>
        </div>
        <div v-else>
          <p style="text-align: center; color: var(--color-text-3); padding: 40px;">
            暂无流数据统计信息
          </p>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, computed, onUnmounted, watch} from 'vue'
import {Message, Modal} from '@arco-design/web-vue'
import {IconPlus, IconRefresh} from '@arco-design/web-vue/es/icon'
import {formatDateTime} from '../utils/date'
import {useAuthStore} from '../stores/auth'
import {useNavigationStore} from '../stores/navigation'
import {
  getPullStreamTasks,
  updatePullStreamTask,
  deletePullStreamTask,
  getPullStreamTaskStatus,
  restartPullStreamTask,
  describePullTransformPushInfoList
} from '../api/live'
import type {
  PullStreamTaskInfo,
  DescribePullTransformPushInfoListResponse
} from '../api/live'
import * as echarts from 'echarts'

const authStore = useAuthStore()
const navigationStore = useNavigationStore()

// 列表数据
const loading = ref(false)
const taskList = ref<PullStreamTaskInfo[]>([])
const allTaskList = ref<PullStreamTaskInfo[]>([]) // 存储所有任务（未过滤）
const searchKeyword = ref('')
const dateRange = ref<[string, string]>([])

// 统计数据（动态计算）
const totalTasksLimit = ref(188) // 任务配额上限，可以从后端获取
const currentTasks = computed(() => allTaskList.value.length) // 当前任务总数
const activeTasks = computed(() => {
  // 有效路数：状态为启用的任务数
  return allTaskList.value.filter(task => task.status === 'enable').length
})
const expiredTasks = computed(() => {
  // 已过期任务：结束时间早于当前时间的任务数
  const now = new Date().getTime()
  return allTaskList.value.filter(task => {
    const endTime = new Date(task.endTime).getTime()
    return endTime < now
  }).length
})

// 初始化默认时间范围（前7天到当前时间）
const initDefaultDateRange = () => {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  dateRange.value = [formatDate(sevenDaysAgo), formatDate(now)]
}

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: true,
  showPageSize: true
})

// 对话框
const showStatusDialog = ref(false)
const taskStatus = ref<DescribePullTransformPushInfoListResponse | null>(null)
// 四个图表容器和实例
const videoFpsChart = ref<HTMLDivElement | null>(null)
const audioFpsChart = ref<HTMLDivElement | null>(null)
const videoRateChart = ref<HTMLDivElement | null>(null)
const audioRateChart = ref<HTMLDivElement | null>(null)
let videoFpsChartInstance: echarts.ECharts | null = null
let audioFpsChartInstance: echarts.ECharts | null = null
let videoRateChartInstance: echarts.ECharts | null = null
let audioRateChartInstance: echarts.ECharts | null = null

// 当前查看状态的任务ID
const currentTaskId = ref<string>('')

// 时间查询范围
const statusDateRange = ref<[string, string]>([])

// 初始化状态查询时间范围
const initStatusDateRange = () => {
  const now = new Date()
  const endTime = new Date(now.getTime() - 1000) // 稍微减去一点时间，确保不包含未来时间
  const startTime = new Date(endTime.getTime() - 30 * 60 * 1000) // 当前时间前30分钟

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  statusDateRange.value = [formatDate(startTime), formatDate(endTime)]
}

// 查询任务状态
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

// 处理时间范围变化
const handleStatusDateRangeChange = () => {
  refreshStatusData()
}

// 初始化单个图表的通用函数
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

  // 销毁之前的实例
  if (chartInstance) {
    chartInstance.dispose()
  }

  const newChartInstance = echarts.init(chartContainer)

  // 计算时间轴标签显示间隔（每5分钟显示一个标签）
  const calculateLabelInterval = (timeData: string[]) => {
    if (timeData.length <= 1) return []

    const intervalMinutes = 5
    const firstTime = timeData[0] // 格式: HH:mm:ss
    const firstTotalSeconds = parseInt(firstTime.split(':')[0]) * 3600 + parseInt(firstTime.split(':')[1]) * 60 + parseInt(firstTime.split(':')[2])

    const visibleIndices: number[] = []
    for (let i = 0; i < timeData.length; i++) {
      const currentTime = timeData[i]
      const currentTotalSeconds = parseInt(currentTime.split(':')[0]) * 3600 + parseInt(currentTime.split(':')[1]) * 60 + parseInt(currentTime.split(':')[2])

      const timeDifference = currentTotalSeconds - firstTotalSeconds
      const timeDifferenceMinutes = timeDifference / 60
      const minutesSinceFirst = timeDifferenceMinutes

      if (minutesSinceFirst % intervalMinutes === 0) {
        visibleIndices.push(i)
      } else if (parseInt(currentTime.split(':')[2]) === 0 && Math.abs(minutesSinceFirst % intervalMinutes) < 0.5) {
        visibleIndices.push(i)
      }
    }

    return visibleIndices.length > 0 ? visibleIndices : []
  }

  const visibleIndices = calculateLabelInterval(times)

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const time = params[0].axisValue
        let result = `<div style="font-weight: bold; margin-bottom: 8px;">${time}</div>`
        params.forEach((param: any) => {
          const value = param.seriesName.includes('码率')
              ? `${param.value.toFixed(1)}kbps`
              : `${param.value}fps`
          result += `<div style="display: flex; align-items: center; margin-bottom: 4px;">
            <span style="display: inline-block; width: 8px; height: 8px; background-color: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
            <span style="margin-right: 8px;">${param.seriesName}:</span>
            <span style="font-weight: bold;">${value}</span>
          </div>`
        })
        return result
      },
      axisPointer: {
        type: 'cross'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: times,
      axisLabel: {
        formatter: (value: string, index: number) => {
          if (visibleIndices.includes(index)) {
            return value
          }
          return ''
        },
        rotate: 0,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      min: min,
      max: max,
      axisLine: {
        lineStyle: {
          color: color
        }
      },
      axisLabel: {
        formatter: `{value}${unit}`
      }
    },
    series: [
      {
        name: title,
        type: 'line',
        data: data,
        smooth: true,
        lineStyle: {
          width: 3,
          type: 'solid',
          color: color
        },
        itemStyle: {
          color: color
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {offset: 0, color: `${color}33`},
            {offset: 1, color: `${color}11`}
          ])
        },
        showSymbol: false
      }
    ]
  }

  newChartInstance.setOption(option)

  // 监听窗口大小变化
  const resizeObserver = new ResizeObserver(() => {
    newChartInstance?.resize()
  })
  resizeObserver.observe(chartContainer)

  return newChartInstance
}

// 初始化所有四个图表
const initChart = () => {
  if (!taskStatus.value?.dataInfoList) return

  const data = taskStatus.value.dataInfoList
  const times = data.map(item => formatDateTime(item.time).split(' ')[1]) // 只显示时间

  // 准备各维度数据
  const videoFpsData = data.map(item => item.videoFps)
  const audioFpsData = data.map(item => item.audioFps)
  const videoRateData = data.map(item => item.videoRate / 1000) // 转换为 kbps
  const audioRateData = data.map(item => item.audioRate / 1000) // 转换为 kbps

  // 初始化每个图表
  videoFpsChartInstance = initSingleChart(
    videoFpsChart.value,
    videoFpsChartInstance,
    times,
    videoFpsData,
    '视频帧率',
    'fps',
    '#5470c6',
    0,
    60
  )

  audioFpsChartInstance = initSingleChart(
    audioFpsChart.value,
    audioFpsChartInstance,
    times,
    audioFpsData,
    '音频帧率',
    'fps',
    '#91cc75',
    0,
    60
  )

  videoRateChartInstance = initSingleChart(
    videoRateChart.value,
    videoRateChartInstance,
    times,
    videoRateData,
    '视频码率',
    'kbps',
    '#fac858',
    0
  )

  audioRateChartInstance = initSingleChart(
    audioRateChart.value,
    audioRateChartInstance,
    times,
    audioRateData,
    '音频码率',
    'kbps',
    '#ee6666',
    0
  )
}

// 监听任务状态变化
watch(() => taskStatus.value, (newValue) => {
  if (newValue && newValue.dataInfoList && newValue.dataInfoList.length > 0) {
    // 等待 DOM 更新
    setTimeout(() => {
      initChart()
    }, 100)
  }
})

// 组件卸载时销毁图表和定时器
onUnmounted(() => {
  if (videoFpsChartInstance) {
    videoFpsChartInstance.dispose()
  }
  if (audioFpsChartInstance) {
    audioFpsChartInstance.dispose()
  }
  if (videoRateChartInstance) {
    videoRateChartInstance.dispose()
  }
  if (audioRateChartInstance) {
    audioRateChartInstance.dispose()
  }
  stopRunningStatusTimer()
})

// 加载任务列表
const loadTaskList = async () => {
  loading.value = true
  try {
    const result = await getPullStreamTasks()

    // 转换字段名：大写转小驼峰
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
      runningStatus: 'inactive', // 默认运行状态为不活跃
      createTime: task.createTime || task.CreateTime,
      comment: task.comment || task.Comment,
      region: task.region || task.Region,
      pushArgs: task.pushArgs || task.PushArgs
    }))

    // 保存所有任务（用于统计）
    allTaskList.value = convertedList

    // 根据时间范围过滤数据（基于任务开始时间）
    if (dateRange.value && dateRange.value.length === 2) {
      const [startTime, endTime] = dateRange.value
      const startTimestamp = new Date(startTime).getTime()
      const endTimestamp = new Date(endTime).getTime()

      taskList.value = convertedList.filter((task: any) => {
        const taskStartTime = new Date(task.startTime).getTime()
        return taskStartTime >= startTimestamp && taskStartTime <= endTimestamp
      })
    } else {
      taskList.value = convertedList
    }

    pagination.total = taskList.value.length
  } catch (error) {
    console.error('加载任务列表失败:', error)
    Message.error('加载任务列表失败')
  } finally {
    loading.value = false
  }
}

// 任务状态映射
const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    'enable': 'green',
    'pause': 'orange',
    'finished': 'gray',
    'error': 'red'
  }
  return statusMap[status] || 'gray'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'enable': '启用',
    'pause': '暂停',
    'finished': '已完成',
    'error': '错误'
  }
  return statusMap[status] || status
}

// 运行状态映射
const getRunningStatusColor = (runningStatus: string) => {
  const statusMap: Record<string, string> = {
    'active': 'green',
    'inactive': 'gray'
  }
  return statusMap[runningStatus] || 'gray'
}

const getRunningStatusText = (runningStatus: string) => {
  const statusMap: Record<string, string> = {
    'active': '活跃',
    'inactive': '不活跃'
  }
  return statusMap[runningStatus] || runningStatus
}

// 定时更新运行状态
let runningStatusTimer: any = null

const updateRunningStatus = async () => {
  // 查找任务状态为启用但运行状态为不活跃的任务
  const tasksToUpdate = allTaskList.value.filter(task =>
      task.status === 'enable' && (!task.runningStatus || task.runningStatus === 'inactive')
  )

  if (tasksToUpdate.length > 0) {
    for (const task of tasksToUpdate) {
      try {
        const statusResult = await getPullStreamTaskStatus(task.taskId)

        if (statusResult && statusResult.runStatus === 'active') {
          // 更新任务运行状态
          const taskIndex = allTaskList.value.findIndex(t => t.taskId === task.taskId)
          if (taskIndex !== -1) {
            allTaskList.value[taskIndex].runningStatus = 'active'
          }
        } else {
          // 如果接口返回错误或任务未运行，则设置为不活跃
          const taskIndex = allTaskList.value.findIndex(t => t.taskId === task.taskId)
          if (taskIndex !== -1) {
            allTaskList.value[taskIndex].runningStatus = 'inactive'
          }
        }
      } catch (error) {
        console.error('更新任务运行状态失败:', error)
        const taskIndex = allTaskList.value.findIndex(t => t.taskId === task.taskId)
        if (taskIndex !== -1) {
          allTaskList.value[taskIndex].runningStatus = 'inactive'
        }
      }
    }
  }
}

// 启动定时更新
const startRunningStatusTimer = () => {
  if (runningStatusTimer) {
    clearInterval(runningStatusTimer)
  }

  runningStatusTimer = setInterval(() => {
    updateRunningStatus()
  }, 5000) // 每5秒更新一次
}

// 停止定时更新
const stopRunningStatusTimer = () => {
  if (runningStatusTimer) {
    clearInterval(runningStatusTimer)
    runningStatusTimer = null
  }
}

// 区域映射
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

// 操作方法
const handleDateRangeChange = () => {
  loadTaskList()
}

const handleSearch = () => {
  loadTaskList()
}

const refreshList = () => {
  loadTaskList()
}

const handlePageChange = (page: number) => {
  pagination.current = page
  loadTaskList()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  loadTaskList()
}

// Navigation functions
const goToCreate = () => {
  navigationStore.navigateTo('PullStreamTaskForm', '创建分发任务', {})
}

const goToEdit = (task: PullStreamTaskInfo) => {
  navigationStore.navigateTo('PullStreamTaskForm', '编辑分发任务', {taskId: task.taskId})
}

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
        await updatePullStreamTask(task.taskId, {
          operator: authStore.user?.username || 'admin',
          status: 'pause'
        })
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
    await updatePullStreamTask(task.taskId, {
      operator: authStore.user?.username || 'admin',
      status: 'enable'
    })
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

onMounted(() => {
  initDefaultDateRange()
  loadTaskList()
  startRunningStatusTimer()
})
</script>

<style scoped>
.pull-stream-task-page {
  padding: 16px;
  overflow-y: auto;
}

.page-header {
  margin-bottom: 12px;
}

.page-header h2 {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.stat-card {
  padding: 8px 12px;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-2);
  margin-bottom: 2px;
  line-height: 1.3;
}

.stat-value {
  font-size: 18px;
  font-weight: 500;
  color: var(--color-text-1);
  line-height: 1.2;
}

.stat-unit {
  font-size: 13px;
  color: var(--color-text-2);
  margin-left: 4px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.action-right {
  display: flex;
  gap: 8px;
}

.task-id {
  line-height: 1.2;
}

.task-id-sub {
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 1px;
}

.source-url {
  word-break: break-all;
  font-size: 12px;
  color: var(--color-text-2);
  line-height: 1.3;
}

.status-detail {
  padding: 8px 0;
}

.status-query {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: var(--color-fill-1);
  border-radius: 8px;
}

.chart-container-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-item {
  background-color: var(--color-fill-1);
  border-radius: 8px;
  padding: 12px;
}

.chart-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
  margin-bottom: 8px;
  text-align: center;
}

/* 调整表格行高 */
:deep(.arco-table-td) {
  padding: 6px 12px !important;
}

:deep(.arco-table-th) {
  padding: 8px 12px !important;
}
</style>
