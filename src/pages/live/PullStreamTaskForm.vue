<template>
  <div class="pull-stream-task-form-page">
    <div class="ptf-wrap">
      <!-- 页头：与直播间页面一致 -->
      <div class="ptf-head">
        <div class="ptf-head-main">
          <div class="ptf-crumb">
            <span class="ptf-link" @click="goBack">社媒分发</span>
            <span>/</span>
            <span>{{ pageTitle }}</span>
          </div>
          <h1 class="ptf-title">{{ pageTitle }}</h1>
        </div>
        <a-button @click="goBack">取消</a-button>
        <a-button type="primary" :loading="submitting" @click="submitTask">{{ isEdit ? '保存' : '创建任务' }}</a-button>
      </div>

      <!-- 左侧表单，右侧任务预览；窄屏上下排列 -->
      <a-form :model="taskForm" ref="taskFormRef" layout="vertical" class="ptf-body">
        <div class="ptf-main">
          <div class="ptf-card">
            <div class="ptf-card-title">任务信息</div>
            <a-form-item label="任务备注" field="comment">
              <a-input v-model="taskForm.comment" placeholder="例如：秋季发布会同步到 YouTube" />
            </a-form-item>
            <div class="ptf-grid2">
              <a-form-item label="任务时间" field="timeRange" :rules="[{ required: true, message: '请选择任务时间' }]">
                <a-range-picker v-model="taskForm.timeRange" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
              </a-form-item>
              <a-form-item label="地域" field="region" :rules="[{ required: true, message: '请选择地域' }]">
                <div class="ptf-field-col">
                  <a-select v-model="taskForm.region" placeholder="请选择地域" :disabled="isEdit">
                    <a-option v-for="r in regions" :key="r.value" :value="r.value">{{ r.label }}</a-option>
                  </a-select>
                  <div class="ptf-tip">推流到海外平台建议选择海外地域（如新加坡、法兰克福、弗吉尼亚），推流更稳定</div>
                </div>
              </a-form-item>
            </div>
          </div>

          <div class="ptf-card">
            <div class="ptf-card-title">直播源</div>
            <a-radio-group v-model="sourceMode" type="button" class="ptf-seg">
              <a-radio value="room">选择直播间</a-radio>
              <a-radio value="custom">自定义地址</a-radio>
            </a-radio-group>
            <a-form-item v-if="sourceMode === 'room'" label="直播间" field="sourceRoomId" :rules="sourceRoomRules">
              <div class="ptf-field-col">
                <a-select
                  v-model="taskForm.sourceRoomId"
                  placeholder="请选择直播间"
                  allow-search
                  :loading="loadingRooms"
                >
                  <a-option v-for="room in rooms" :key="room.id" :value="room.id" :label="room.name">
                    {{ room.name }}<span v-if="room.status === 'live'" class="ptf-live">（直播中）</span>
                  </a-option>
                </a-select>
                <div v-if="roomPullUrl" class="ptf-composed">{{ roomPullUrl }}</div>
                <div class="ptf-tip">{{ loadingRoomUrl ? '正在获取直播间播放地址…' : '自动使用该直播间的播放地址作为直播源' }}</div>
              </div>
            </a-form-item>
            <a-form-item v-else label="直播源地址" field="sourceUrl" :rules="[{ required: true, message: '请输入直播源地址' }]">
              <a-textarea v-model="taskForm.sourceUrl" :rows="2" placeholder="支持 RTMP / FLV / HLS 直播地址" />
            </a-form-item>
          </div>

          <div class="ptf-card">
            <div class="ptf-card-title">分发目标</div>
            <div class="ptf-platforms">
              <div
                v-for="p in platforms"
                :key="p.value"
                :class="['ptf-platform', { 'is-active': targetPlatform === p.value }]"
                @click="targetPlatform = p.value"
              >
                <span class="ptf-platform-mark" :style="{ background: p.color }">{{ p.mark }}</span>
                <span>{{ p.label }}</span>
              </div>
            </div>
            <template v-if="currentPlatform.value !== 'custom'">
              <div class="ptf-grid2">
                <a-form-item label="服务器地址" field="targetServer" :rules="[{ required: true, message: '请输入服务器地址' }]">
                  <a-input v-model="taskForm.targetServer" :placeholder="currentPlatform.serverPlaceholder" class="ptf-mono" />
                </a-form-item>
                <a-form-item label="推流码" field="targetKey" :rules="[{ required: true, message: '请输入推流码' }]">
                  <a-input-password v-model="taskForm.targetKey" placeholder="平台提供的推流码（串流密钥）" class="ptf-mono" />
                </a-form-item>
              </div>
              <div class="ptf-tip">{{ currentPlatform.guide }}获取「服务器地址」和「推流码」，系统自动拼接为推流地址</div>
              <div v-if="currentPlatform.warning" class="ptf-platform-warning">{{ currentPlatform.warning }}</div>
              <div v-if="composedTarget" class="ptf-composed">{{ maskUrl(composedTarget) }}</div>
            </template>
            <a-form-item v-else label="目标地址" field="targetUrl" :rules="[{ required: true, message: '请输入目标地址' }]">
              <a-input v-model="taskForm.targetUrl" placeholder="完整推流地址，如 rtmp://域名/应用/流名称?参数" class="ptf-mono" />
            </a-form-item>
          </div>

          <div class="ptf-notice">分发任务按「任务时间」自动开始和结束，请确保直播源在该时间段内正在推流。</div>
        </div>

        <!-- 任务预览 -->
        <div class="ptf-card ptf-preview">
          <div class="ptf-card-title">任务预览</div>
          <div class="ptf-flow">
            <div class="ptf-node">
              <div class="ptf-node-key">直播源</div>
              <div class="ptf-node-name">{{ previewSourceName }}</div>
              <div class="ptf-node-url">{{ effectiveSource || '未设置' }}</div>
            </div>
            <div class="ptf-arrow">↓</div>
            <div class="ptf-node">
              <div class="ptf-node-key">分发到</div>
              <div class="ptf-node-name">{{ currentPlatform.label }}</div>
              <div class="ptf-node-url">{{ effectiveTarget ? maskUrl(effectiveTarget) : '未设置' }}</div>
            </div>
          </div>
          <div class="ptf-kv">
            <span class="ptf-kv-key">开始</span>
            <span>{{ previewTime.start }}</span>
            <span class="ptf-kv-key">结束</span>
            <span>{{ previewTime.end }}</span>
            <span class="ptf-kv-key">地域</span>
            <span>{{ regionLabel || '未选择' }}</span>
          </div>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import dayjs from 'dayjs'
import api from '../../api/http'
import { Message } from '@arco-design/web-vue'
import { useAuthStore } from '../../stores/auth'
import { useNavigationStore } from '../../stores/navigation'
import {
  getPullStreamTasks,
  createPullStreamTask,
  updatePullStreamTask,
  generatePullURLByRoom
} from '../../api/live'
import type {
  CreatePullStreamTaskRequest,
  UpdatePullStreamTaskRequest
} from '../../api/live'

const authStore = useAuthStore()
const navigationStore = useNavigationStore()

// 从 navigationStore 获取参数
const taskId = computed(() => navigationStore.current.params?.taskId || '')
const isEdit = computed(() => !!taskId.value)
const pageTitle = computed(() => (isEdit.value ? '编辑分发任务' : '创建分发任务'))
const submitting = ref(false)

// 表单
const taskFormRef = ref()
const taskForm = reactive({
  comment: '',
  timeRange: [] as string[], // 未选择时为空，选择后为 [开始, 结束]
  callbackUrl: '',
  region: '',
  sourceType: 'PullLivePushLive',
  sourceUrl: '',
  enableBackupSource: false,
  backupSourceUrl: '',
  targetUrl: '',
  // 直播源选择直播间时的直播间 ID；分发目标为平台时的服务器地址与推流码
  sourceRoomId: undefined as string | undefined,
  targetServer: '',
  targetKey: '',
  // 保留原有字段用于兼容
  streamName: '',
  domainName: '',
  appName: 'live'
})

// ==================== 直播源：选择直播间 / 自定义地址 ====================
interface RoomOption {
  id: string
  name: string
  status: string
  startTime?: string
  endTime?: string
}

// 从直播间页面进入时带入直播间 ID，默认选中
const roomIdParam = computed(() => String(navigationStore.current.params?.roomId || ''))
const sourceMode = ref<'room' | 'custom'>('room')
const rooms = ref<RoomOption[]>([])
const loadingRooms = ref(false)
const roomPullUrl = ref('')
const loadingRoomUrl = ref(false)

const loadRooms = async () => {
  loadingRooms.value = true
  try {
    const res = await api.post('/data/LIVE_ROOM/query', { page: 1, pageSize: 200, filters: { IS_ACTIVE: 'Y' } })
    const list = res.data?.data?.data || []
    rooms.value = (Array.isArray(list) ? list : []).map((r: any) => ({
      id: String(r.ID),
      name: r.ROOM_NAME,
      status: r.STATUS,
      startTime: r.START_TIME,
      endTime: r.END_TIME,
    }))
  } catch {
    rooms.value = []
  } finally {
    loadingRooms.value = false
  }
}

// 选中直播间后取其播放地址作为直播源；任务时间未填时默认取直播间的开始、结束时间
watch(() => taskForm.sourceRoomId, async (id) => {
  roomPullUrl.value = ''
  if (!id) return
  loadingRoomUrl.value = true
  try {
    const res = await generatePullURLByRoom(id)
    const urls = res.data?.data || {}
    roomPullUrl.value = urls.flv || urls.rtmp || urls.hls || ''
  } catch {
    roomPullUrl.value = ''
  } finally {
    loadingRoomUrl.value = false
  }
  const room = rooms.value.find((r) => r.id === id)
  if (room?.startTime && room?.endTime && !taskForm.timeRange?.length) {
    taskForm.timeRange = [room.startTime, room.endTime]
  }
  taskFormRef.value?.validateField?.('sourceRoomId')
})

const sourceRoomRules = [
  { required: true, message: '请选择直播间' },
  {
    validator: (_value: unknown, callback: (error?: string) => void) => {
      if (loadingRoomUrl.value || roomPullUrl.value) callback()
      else callback('未获取到该直播间的播放地址，请先在域名管理中配置播放域名')
    },
  },
]

const effectiveSource = computed(() => (sourceMode.value === 'room' ? roomPullUrl.value : taskForm.sourceUrl.trim()))
const previewSourceName = computed(() => {
  if (sourceMode.value === 'custom') return '自定义地址'
  return rooms.value.find((r) => r.id === taskForm.sourceRoomId)?.name || '未选择直播间'
})

// ==================== 分发目标：平台（服务器地址 + 推流码）/ 自定义地址 ====================
// 海外平台：服务器地址固定的平台选中时自动预填（defaultServer），其余只给示例
const platforms = [
  { value: 'youtube', label: 'YouTube', mark: 'YT', color: '#ff0000', defaultServer: 'rtmp://a.rtmp.youtube.com/live2', serverPlaceholder: 'rtmp://a.rtmp.youtube.com/live2', guide: '在 YouTube Studio「直播」→「串流设置」中' },
  { value: 'facebook', label: 'Facebook', mark: 'f', color: '#1877f2', defaultServer: 'rtmps://live-api-s.facebook.com:443/rtmp/', serverPlaceholder: 'rtmps://live-api-s.facebook.com:443/rtmp/', guide: '在 Facebook「直播制作工具」→「串流软件」中' },
  { value: 'instagram', label: 'Instagram', mark: 'IG', color: '#e1306c', defaultServer: '', serverPlaceholder: 'rtmps://edgetee-upload-xxx.fbcdn.net:443/rtmp/', guide: '在 Instagram 网页版「创建」→「直播」（Live Producer）中', warning: '需专业账号（创作者或商家）。推流码每次直播重新生成、只能使用一次，生成后约 1 小时内未开始推流即失效，请在开播前获取并创建任务。' },
  { value: 'tiktok', label: 'TikTok', mark: 'TT', color: '#000000', defaultServer: '', serverPlaceholder: 'rtmp://xxx.tiktokcdn.com/stage/', guide: '在 TikTok LIVE Studio 或 LIVE Producer 中' },
  { value: 'twitch', label: 'Twitch', mark: 'Tw', color: '#9146ff', defaultServer: 'rtmp://live.twitch.tv/app', serverPlaceholder: 'rtmp://live.twitch.tv/app', guide: '在 Twitch 创作者仪表板「设置」→「串流」中' },
  { value: 'x', label: 'X', mark: 'X', color: '#000000', defaultServer: '', serverPlaceholder: 'rtmps://xx.pscp.tv:443/x', guide: '在 X Media Studio「Producer」→「来源」中' },
  { value: 'custom', label: '自定义', mark: '+', color: '#86909c', defaultServer: '', serverPlaceholder: '', guide: '' },
]
const targetPlatform = ref('youtube')
const currentPlatform = computed(() => platforms.find((p) => p.value === targetPlatform.value) || platforms[0])

// 切换平台：服务器地址为空或仍是上一个平台的默认值时，换成新平台的默认地址
watch(targetPlatform, (next, prev) => {
  const prevDefault = platforms.find((p) => p.value === prev)?.defaultServer || ''
  const nextDefault = platforms.find((p) => p.value === next)?.defaultServer || ''
  if (!taskForm.targetServer || taskForm.targetServer === prevDefault) taskForm.targetServer = nextDefault
})
if (!taskForm.targetServer) taskForm.targetServer = currentPlatform.value.defaultServer

// 服务器地址 + 推流码 拼接为完整推流地址
const composedTarget = computed(() => {
  const server = taskForm.targetServer.trim().replace(/\/+$/, '')
  const key = taskForm.targetKey.trim().replace(/^\/+/, '')
  return server && key ? `${server}/${key}` : ''
})
const effectiveTarget = computed(() =>
  targetPlatform.value === 'custom' ? taskForm.targetUrl.trim() : composedTarget.value,
)

// 推流码等密钥只显示前 4 位
const maskUrl = (url: string) => {
  const idx = url.lastIndexOf('/')
  const tail = url.slice(idx + 1)
  if (idx < 0 || tail.length <= 4) return url
  return `${url.slice(0, idx + 1)}${tail.slice(0, 4)}••••••`
}

// ==================== 预览 ====================
const regions = [
  { value: 'ap-bangkok', label: '亚太东南（曼谷）' },
  { value: 'ap-beijing', label: '华北地区（北京）' },
  { value: 'ap-chongqing', label: '西南地区（重庆）' },
  { value: 'ap-guangzhou', label: '华南地区（广州）' },
  { value: 'ap-hongkong', label: '港澳台地区（中国香港）' },
  { value: 'ap-seoul', label: '亚太东北（首尔）' },
  { value: 'ap-shanghai', label: '华东地区（上海）' },
  { value: 'ap-singapore', label: '亚太东南（新加坡）' },
  { value: 'ap-tokyo', label: '亚太东北（东京）' },
  { value: 'eu-frankfurt', label: '欧洲地区（法兰克福）' },
  { value: 'na-ashburn', label: '美国东部（弗吉尼亚）' },
  { value: 'na-siliconvalley', label: '美国西部（硅谷）' },
]
const regionLabel = computed(() => regions.find((r) => r.value === taskForm.region)?.label || '')

const previewTime = computed(() => {
  const [start, end] = taskForm.timeRange || []
  if (!start || !end) return { start: '未设置', end: '未设置' }
  const minutes = dayjs(end).diff(dayjs(start), 'minute')
  const duration = minutes >= 60 ? `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分` : `${minutes} 分钟`
  return {
    start: dayjs(start).format('MM-DD HH:mm'),
    end: `${dayjs(end).format('MM-DD HH:mm')}（${duration}）`,
  }
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
      // 已有任务只保存完整地址：直播源与分发目标均按自定义地址显示
      sourceMode.value = 'custom'
      targetPlatform.value = 'custom'
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

  // Arco 的 validate() 校验失败时返回错误对象而不是抛异常，必须检查返回值
  try {
    if (await taskFormRef.value.validate()) return
  } catch {
    return
  }

  if (sourceMode.value === 'room') taskForm.sourceUrl = roomPullUrl.value
  if (targetPlatform.value !== 'custom') taskForm.targetUrl = composedTarget.value

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
    // 直接调用 loadTaskList 可能不够，因为我们需要刷新整个列表
    goBack()
  } catch (error: any) {
      console.error('提交任务失败:', error)
      // 透传后端/腾讯云具体错误信息，避免笼统的"操作失败"掩盖原因
      Message.error(error?.message || '操作失败')
    } finally {
      submitting.value = false
    }
}

onMounted(async () => {
  // 检查是否是编辑模式
  if (taskId.value) {
    loadTaskDetail(taskId.value)
  }
  await loadRooms()
  if (!isEdit.value && roomIdParam.value) {
    taskForm.sourceRoomId = roomIdParam.value
  }
})
</script>

<style scoped>
.pull-stream-task-form-page {
  height: 100%;
  padding: 8px;
  overflow-y: auto;
}

.ptf-wrap {
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ptf-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
}

.ptf-head-main {
  flex: 1;
  min-width: 0;
}

.ptf-crumb {
  display: flex;
  gap: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.ptf-link {
  color: var(--brand-blue);
  cursor: pointer;
}

.ptf-title {
  margin: 4px 0 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.ptf-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 12px;
  align-items: start;
}

.ptf-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.ptf-card {
  padding: 16px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
}

.ptf-card :deep(.arco-form-item) {
  margin-bottom: 14px;
}

.ptf-card :deep(.arco-form-item:last-child) {
  margin-bottom: 0;
}

.ptf-card-title {
  margin-bottom: 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.ptf-grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.ptf-field-col {
  width: 100%;
}

.ptf-tip {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.ptf-seg {
  margin-bottom: 12px;
}

.ptf-live {
  color: var(--error);
}

.ptf-mono :deep(input) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.ptf-composed {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  background: var(--bg-page);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  color: var(--text-secondary);
  word-break: break-all;
}

/* 平台卡片 */
.ptf-platforms {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}

.ptf-platform {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.ptf-platform:hover {
  border-color: var(--brand-blue);
}

.ptf-platform.is-active {
  border-color: var(--brand-blue);
  background: var(--info-bg);
  color: var(--brand-blue);
}

.ptf-platform-mark {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  line-height: 28px;
  text-align: center;
  font-weight: 600;
  color: #fff;
}

.ptf-platform-warning {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  background: var(--warning-bg);
  font-size: 12px;
  color: var(--warning);
}

.ptf-notice {
  padding: 9px 14px;
  border-radius: var(--radius-md);
  background: var(--warning-bg);
  font-size: 12px;
  color: var(--warning);
}

/* 任务预览 */
.ptf-preview {
  position: sticky;
  top: 0;
}

.ptf-flow {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ptf-node {
  padding: 10px 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
}

.ptf-node-key {
  font-size: 12px;
  color: var(--text-tertiary);
}

.ptf-node-name {
  margin-top: 2px;
  overflow: hidden;
  font-weight: 600;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ptf-node-url {
  margin-top: 2px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  color: var(--text-secondary);
  word-break: break-all;
}

.ptf-arrow {
  line-height: 1;
  text-align: center;
  font-size: 16px;
  color: var(--brand-blue);
}

.ptf-kv {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 8px 10px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border-light);
  font-size: 12px;
  color: var(--text-primary);
}

.ptf-kv-key {
  color: var(--text-tertiary);
}

@media (max-width: 1000px) {
  .ptf-body {
    grid-template-columns: minmax(0, 1fr);
  }

  .ptf-preview {
    position: static;
  }
}
</style>
