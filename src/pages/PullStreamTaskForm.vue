<template>
  <div class="pull-stream-task-form-page">
    <!-- 顶部面包屑导航 -->
    <div class="page-header">
      <a-breadcrumb>
        <a-breadcrumb-item>
          <a-link @click="goBack">社媒分发</a-link>
        </a-breadcrumb-item>
        <a-breadcrumb-item>{{ isEdit ? '编辑任务' : '创建任务' }}</a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <!-- 表单内容 -->
    <div class="form-container">
      <a-form :model="taskForm" ref="taskFormRef" :label-col-props="{ span: 3 }" :wrapper-col-props="{ span: 21 }">
        <!-- 1. 配置任务基本信息 -->
        <div class="form-section">
          <div class="section-title">1 配置任务基本信息</div>
          <a-form-item label="任务备注" field="comment">
            <a-input v-model="taskForm.comment" placeholder="请输入任务备注" />
          </a-form-item>
          <a-form-item label="任务时间" field="timeRange" :rules="[{ required: true, message: '请选择任务时间' }]">
            <a-range-picker
              v-model="taskForm.timeRange"
              show-time
              format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item label="事件回调通知">
            <a-input v-model="taskForm.callbackUrl" placeholder="请输入用于接收社媒分发任务事件的回调地址" />
          </a-form-item>
        </div>

        <!-- 2. 填写内容来源信息 -->
        <div class="form-section">
          <div class="section-title">2 填写内容来源信息</div>
          <a-form-item label="地域" field="region" :rules="[{ required: true, message: '请选择地域' }]">
            <a-select v-model="taskForm.region" placeholder="请选择地域" :disabled="isEdit">
              <a-option value="ap-bangkok">亚太东南（曼谷）</a-option>
              <a-option value="ap-beijing">华北地区（北京）</a-option>
              <a-option value="ap-chongqing">西南地区（重庆）</a-option>
              <a-option value="ap-guangzhou">华南地区（广州）</a-option>
              <a-option value="ap-hongkong">港澳台地区（中国香港）</a-option>
              <a-option value="ap-seoul">亚太东北（首尔）</a-option>
              <a-option value="ap-shanghai">华东地区（上海）</a-option>
              <a-option value="ap-singapore">亚太东南（新加坡）</a-option>
              <a-option value="ap-tokyo">亚太东北（东京）</a-option>
              <a-option value="eu-frankfurt">欧洲地区（法兰克福）</a-option>
              <a-option value="na-ashburn">美国东部（弗吉尼亚）</a-option>
              <a-option value="na-siliconvalley">美国西部（硅谷）</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="内容类型" field="sourceType" :rules="[{ required: true, message: '请选择内容类型' }]">
            <a-radio-group v-model="taskForm.sourceType">
              <a-radio value="PullLivePushLive">直播</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="直播源地址" field="sourceUrl" :rules="[{ required: true, message: '请输入直播源地址' }]">
            <a-textarea
              v-model="taskForm.sourceUrl"
              :rows="2"
              placeholder="请输入直播源地址"
            />
          </a-form-item>
          <a-form-item label="备用输入源">
            <a-checkbox v-model="taskForm.enableBackupSource">开启备用输入源</a-checkbox>
          </a-form-item>
          <a-form-item v-if="taskForm.enableBackupSource" label="备用源地址">
            <a-input v-model="taskForm.backupSourceUrl" placeholder="请输入备用源地址" />
          </a-form-item>
        </div>

        <!-- 3. 填写接收内容的地址 -->
        <div class="form-section">
          <div class="section-title">3 填写接收内容的地址</div>
          <a-form-item label="目标地址" field="targetUrl" :rules="[{ required: true, message: '请输入目标地址' }]">
            <a-input v-model="taskForm.targetUrl" placeholder="请输入用于接收内容的目标URL" />
            <template #extra>
              <a href="#" @click.prevent>添加目标地址</a> | 通过 <a href="#" @click.prevent>地址生成器</a> 生成
            </template>
          </a-form-item>
        </div>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <a-space>
            <a-button type="primary" @click="submitTask" :loading="submitting">保存</a-button>
            <a-button @click="goBack">取消</a-button>
          </a-space>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useAuthStore } from '../stores/auth'
import { useNavigationStore } from '../stores/navigation'
import {
  getPullStreamTasks,
  createPullStreamTask,
  updatePullStreamTask
} from '../api/live'
import type {
  CreatePullStreamTaskRequest,
  UpdatePullStreamTaskRequest
} from '../api/live'

const authStore = useAuthStore()
const navigationStore = useNavigationStore()

// 从 navigationStore 获取参数
const taskId = computed(() => navigationStore.current.params?.taskId || '')
const isEdit = computed(() => !!taskId.value)
const submitting = ref(false)

// 表单
const taskFormRef = ref()
const taskForm = reactive({
  comment: '',
  timeRange: [] as [string, string],
  callbackUrl: '',
  region: '',
  sourceType: 'PullLivePushLive',
  sourceUrl: '',
  enableBackupSource: false,
  backupSourceUrl: '',
  targetUrl: '',
  // 保留原有字段用于兼容
  streamName: '',
  domainName: '',
  appName: 'live'
})

// 返回列表
const goBack = () => {
  navigationStore.goBack()
}

// 加载任务详情
const loadTaskDetail = async (id: string) => {
  try {
    const result = await getPullStreamTasks(id)
    if (result && result.length > 0) {
      const task = result[0]
      taskForm.comment = task.comment || task.Comment || ''
      taskForm.timeRange = [
        task.startTime || task.StartTime,
        task.endTime || task.EndTime
      ]
      taskForm.region = task.region || task.Region || ''
      taskForm.sourceType = task.sourceType || task.SourceType
      taskForm.sourceUrl = (task.sourceUrls || task.SourceURLs)?.[0] || ''
      taskForm.streamName = task.streamName || task.StreamName
      taskForm.domainName = task.domainName || task.DomainName
      taskForm.appName = task.appName || task.AppName

      // 组合生成目标地址
      const domainName = task.domainName || task.DomainName
      const appName = task.appName || task.AppName
      const streamName = task.streamName || task.StreamName
      let targetUrl = `rtmp://${domainName}/${appName}/${streamName}`

      // 如果任务有推流参数，添加到 URL 中
      const pushArgs = task.pushArgs || task.PushArgs || ''
      if (pushArgs) {
        targetUrl += `?${pushArgs}`
      }

      taskForm.targetUrl = targetUrl
    }
  } catch (error) {
    console.error('加载任务详情失败:', error)
    Message.error('加载任务详情失败')
  }
}

// 解析目标URL
const parseTargetUrl = (url: string) => {
  const parts = {
    domainName: '',
    appName: 'live',
    streamName: '',
    pushArgs: ''
  }

  if (url) {
    try {
      // 处理 RTMP URL，RTMP URL 可能不遵循标准 URL 格式，需要特殊处理
      if (url.startsWith('rtmp://')) {
        // RTMP URL 格式: rtmp://domain/app/stream?arg1=value1&arg2=value2
        let urlWithoutProtocol = url.slice(7) // 移除 rtmp://
        let queryIndex = urlWithoutProtocol.indexOf('?')
        if (queryIndex !== -1) {
          parts.pushArgs = urlWithoutProtocol.slice(queryIndex + 1)
          urlWithoutProtocol = urlWithoutProtocol.slice(0, queryIndex)
        }

        const pathParts = urlWithoutProtocol.split('/').filter(p => p)
        if (pathParts.length >= 1) parts.domainName = pathParts[0]
        if (pathParts.length >= 2) parts.appName = pathParts[1]
        if (pathParts.length >= 3) parts.streamName = pathParts[2]
      } else {
        // 其他协议的 URL 按照标准 URL 解析
        const urlObj = new URL(url)
        parts.domainName = urlObj.hostname
        const pathParts = urlObj.pathname.split('/').filter(p => p)
        if (pathParts.length >= 1) parts.appName = pathParts[0]
        if (pathParts.length >= 2) parts.streamName = pathParts[1]
        if (urlObj.search) {
          parts.pushArgs = urlObj.search.slice(1) // 移除开头的 ?
        }
      }
    } catch (e) {
      console.error('解析URL失败:', e)
    }
  }

  return parts
}

// 提交表单
const submitTask = async () => {
  if (!taskFormRef.value) return

  try {
    await taskFormRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    const [startTime, endTime] = taskForm.timeRange || []

    if (isEdit.value) {
      // 更新任务
      // 决定使用 ToUrl 还是分解后的字段
      const isCompleteUrl = taskForm.targetUrl.startsWith('rtmp://') ||
                           taskForm.targetUrl.startsWith('rtmps://') ||
                           taskForm.targetUrl.startsWith('rtsp://') ||
                           taskForm.targetUrl.startsWith('rtp://') ||
                           taskForm.targetUrl.startsWith('srt://')

      let updateData: UpdatePullStreamTaskRequest = {
        operator: authStore.user?.username || 'admin',
        sourceUrls: [taskForm.sourceUrl],
        startTime: startTime,
        endTime: endTime,
        comment: taskForm.comment
      }

      if (isCompleteUrl) {
        updateData.toUrl = taskForm.targetUrl
      }

      await updatePullStreamTask(taskId.value, updateData)
      Message.success('更新任务成功')
    } else {
      // 创建任务

      // 决定使用 ToUrl 还是分解后的字段
      // 如果目标地址包含完整的协议和路径，使用 ToUrl
      const isCompleteUrl = taskForm.targetUrl.startsWith('rtmp://') ||
                           taskForm.targetUrl.startsWith('rtmps://') ||
                           taskForm.targetUrl.startsWith('rtsp://') ||
                           taskForm.targetUrl.startsWith('rtp://') ||
                           taskForm.targetUrl.startsWith('srt://')

      let createData: CreatePullStreamTaskRequest

      if (isCompleteUrl) {
        // 使用 ToUrl 字段
        createData = {
          sourceType: taskForm.sourceType,
          sourceUrls: [taskForm.sourceUrl],
          toUrl: taskForm.targetUrl,
          domainName: '',
          appName: '',
          streamName: '',
          startTime: startTime,
          endTime: endTime,
          operator: authStore.user?.username || 'admin',
          comment: taskForm.comment,
          region: taskForm.region
        }
      } else {
        // 解析 URL 并使用分解后的字段
        const urlParts = parseTargetUrl(taskForm.targetUrl)
        createData = {
          sourceType: taskForm.sourceType,
          sourceUrls: [taskForm.sourceUrl],
          domainName: urlParts.domainName || taskForm.domainName,
          appName: urlParts.appName || taskForm.appName,
          streamName: urlParts.streamName || taskForm.streamName || 'stream_' + Date.now(),
          startTime: startTime,
          endTime: endTime,
          operator: authStore.user?.username || 'admin',
          comment: taskForm.comment,
          region: taskForm.region,
          pushArgs: urlParts.pushArgs // 从目标地址中解析出推流参数
        }
      }

      await createPullStreamTask(createData)
      Message.success('创建任务成功')
    }
    goBack()
  } catch (error) {
    console.error('提交任务失败:', error)
    Message.error('操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  // 检查是否是编辑模式
  if (taskId.value) {
    loadTaskDetail(taskId.value)
  }
})
</script>

<style scoped>
.pull-stream-task-form-page {
  padding: 16px;
  background: var(--color-bg-1);
  min-height: calc(100vh - 60px);
  overflow-y: auto;
}

.page-header {
  margin-bottom: 16px;
}

.form-container {
  background: var(--color-bg-2);
  padding: 20px;
  border-radius: 4px;
  max-width: 1000px;
}

/* 表单分节样式 */
.form-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border-2);
}

.form-section:last-of-type {
  border-bottom: none;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-1);
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid rgb(var(--primary-6));
}

.form-actions {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-2);
  text-align: center;
}

/* 调整表单项间距 */
:deep(.arco-form-item) {
  margin-bottom: 12px;
}

:deep(.arco-form-item:last-child) {
  margin-bottom: 0;
}
</style>
