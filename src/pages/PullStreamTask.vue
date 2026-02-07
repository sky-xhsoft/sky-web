<template>
  <div class="pull-stream-task-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>拉流转推</h2>
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
        <template #icon><icon-plus /></template>
        创建任务
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
          <template #icon><icon-refresh /></template>
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
        <a-table-column title="主源类型" data-index="sourceType">
          <template #cell="{ record }">
            <a-tag :color="record.sourceType === 'PullLivePushLive' ? 'green' : 'blue'">
              {{ record.sourceType === 'PullLivePushLive' ? '直播' : '点播' }}
            </a-tag>
          </template>
        </a-table-column>
        <a-table-column title="推流区域" data-index="region">
          <template #cell="{ record }">
            {{ getRegionText(record.region) }}
          </template>
        </a-table-column>
        <a-table-column title="目标拉流地址" data-index="sourceUrls">
          <template #cell="{ record }">
            <div class="source-url">{{ record.sourceUrls && record.sourceUrls[0] }}</div>
          </template>
        </a-table-column>
        <a-table-column title="状态" data-index="status">
          <template #cell="{ record }">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
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
      width="500px"
      :footer="false"
    >
      <div v-if="taskStatus" class="status-detail">
        <a-descriptions :column="1" bordered>
          <a-descriptions-item label="任务ID">
            {{ taskStatus.taskId }}
          </a-descriptions-item>
          <a-descriptions-item label="运行状态">
            <a-tag :color="taskStatus.runStatus === 'active' ? 'green' : 'gray'">
              {{ taskStatus.runStatus === 'active' ? '活跃' : '不活跃' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="文件地址" v-if="taskStatus.fileUrl">
            {{ taskStatus.fileUrl }}
          </a-descriptions-item>
          <a-descriptions-item label="循环次数" v-if="taskStatus.loopedTimes">
            {{ taskStatus.loopedTimes }}
          </a-descriptions-item>
          <a-descriptions-item label="播放偏移" v-if="taskStatus.offsetTime">
            {{ taskStatus.offsetTime }}秒
          </a-descriptions-item>
          <a-descriptions-item label="心跳时间" v-if="taskStatus.reportTime">
            {{ formatDateTime(taskStatus.reportTime) }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { IconPlus, IconRefresh } from '@arco-design/web-vue/es/icon'
import { formatDateTime } from '../utils/date'
import { useAuthStore } from '../stores/auth'
import { useNavigationStore } from '../stores/navigation'
import {
  getPullStreamTasks,
  updatePullStreamTask,
  deletePullStreamTask,
  getPullStreamTaskStatus,
  restartPullStreamTask
} from '../api/live'
import type {
  PullStreamTaskInfo
} from '../api/live'

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
const taskStatus = ref<any>(null)

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
      createTime: task.createTime || task.CreateTime,
      comment: task.comment || task.Comment,
      region: task.region || task.Region
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

// 状态映射
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
  navigationStore.navigateTo('PullStreamTaskForm', '创建拉流任务', {})
}

const goToEdit = (task: PullStreamTaskInfo) => {
  navigationStore.navigateTo('PullStreamTaskForm', '编辑拉流任务', { taskId: task.taskId })
}

const deleteTask = async (task: PullStreamTaskInfo) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除该任务吗？',
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
    content: '确定要禁用该任务吗？禁用后任务将暂停拉流。',
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
    const result = await getPullStreamTaskStatus(task.taskId)
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
})
</script>

<style scoped>
.pull-stream-task-page {
  padding: 16px;
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

/* 调整表格行高 */
:deep(.arco-table-td) {
  padding: 6px 12px !important;
}

:deep(.arco-table-th) {
  padding: 8px 12px !important;
}
</style>
