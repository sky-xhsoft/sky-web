<template>
  <div class="stt">
    <div class="stt-toolbar">
      <div class="stt-filters">
        <a-select v-model="status" :style="{ width: '130px' }" aria-label="任务状态" @change="reload">
          <a-option value="">全部状态</a-option>
          <a-option value="active">未结束</a-option>
          <a-option value="running">运行中</a-option>
          <a-option value="prepare">启动中</a-option>
          <a-option value="init">准备中</a-option>
          <a-option value="done">已结束</a-option>
        </a-select>
        <a-input-search v-model="keyword" :placeholder="roomId ? '搜索任务名称' : '搜索任务名称 / 直播间'" allow-clear :style="{ width: '240px' }" @search="reload" @clear="reload" />
      </div>
      <div class="stt-actions">
        <span v-if="autoRefreshing" class="stt-tip">有进行中的任务，每 20 秒自动刷新状态</span>
        <a-button @click="load"><template #icon><icon-refresh /></template>刷新</a-button>
        <a-button type="primary" @click="openCreate"><template #icon><icon-plus /></template>新建任务</a-button>
      </div>
    </div>
    <div v-if="syncError" class="stt-alert">未能从火山同步任务状态：{{ syncError }}</div>

    <a-table :data="items" :loading="loading" :pagination="pagination" row-key="taskId" :scroll="{ x: 1000 }" @page-change="onPage" @page-size-change="onPageSize">
      <template #columns>
        <a-table-column title="任务名称" :width="200">
          <template #cell="{ record }">
            <div class="stt-name">{{ record.name }}</div>
            <div class="stt-sub stt-mono">{{ record.taskId }}</div>
          </template>
        </a-table-column>
        <a-table-column v-if="!roomId" title="直播间" :width="150">
          <template #cell="{ record }">{{ record.roomName || '—' }}</template>
        </a-table-column>
        <a-table-column title="模式" :width="150">
          <template #cell="{ record }">{{ speechModeLabel(record.mode, record.outputLangs) }}</template>
        </a-table-column>
        <a-table-column title="输出语言" :width="90">
          <template #cell="{ record }">{{ record.outputLangs ? record.outputLangs.split(',').map(langLabel).join('、') : '原文' }}</template>
        </a-table-column>
        <a-table-column title="状态" :width="96">
          <template #cell="{ record }">
            <a-tag :color="statusOf(record).color" size="small">{{ statusOf(record).label }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="转推时间" :width="200">
          <template #cell="{ record }"><span class="stt-sub">{{ fmt(record.startTime) }}<br />{{ fmt(record.endTime) }}</span></template>
        </a-table-column>
        <a-table-column title="创建时间" :width="150">
          <template #cell="{ record }"><span class="stt-sub">{{ fmt(record.createTime) }}</span></template>
        </a-table-column>
        <a-table-column title="操作" :width="220" fixed="right">
          <template #cell="{ record }">
            <div class="stt-ops">
              <a-button type="text" size="mini" :loading="busy === record.taskId + 'copy'" @click="copy(record)">复制新建</a-button>
              <a-dropdown v-if="record.status === 'running' || record.status === 'prepare'" @select="(v: any) => restart(record, v === 'reload')">
                <a-button type="text" size="mini" :loading="busy === record.taskId + 'restart'">重启</a-button>
                <template #content>
                  <a-doption value="reload">只重启字幕模块（不中断直播）</a-doption>
                  <a-doption value="full">重启任务（中断直播）</a-doption>
                </template>
              </a-dropdown>
              <a-popconfirm v-if="statusOf(record).active && record.status !== 'prestop'" content="停止后任务结束、不能重新开启，可复制新建。确定停止？" @ok="stop(record)">
                <a-button type="text" size="mini" status="warning" :loading="busy === record.taskId + 'stop'">停止</a-button>
              </a-popconfirm>
              <a-popconfirm :content="statusOf(record).active ? '任务正在进行，删除会先停止任务并删除全部记录。确定删除？' : '删除后火山上的任务记录也会删除，不可恢复。确定删除？'" @ok="remove(record)">
                <a-button type="text" size="mini" status="danger" :loading="busy === record.taskId + 'delete'">删除</a-button>
              </a-popconfirm>
            </div>
          </template>
        </a-table-column>
      </template>
      <template #empty>
        <div class="stt-empty">还没有同传任务</div>
      </template>
    </a-table>

    <SpeechTaskModal v-model:visible="modalVisible" :record="room" :copy-from="copyFrom" @success="onCreated" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus, IconRefresh } from '@arco-design/web-vue/es/icon'
import dayjs from 'dayjs'
import { deleteSpeechTask, getSpeechTaskRule, listSpeechTasks, restartSpeechTask, stopSpeechTask, type SpeechTaskItem } from '@/api/live'
import SpeechTaskModal from './SpeechTaskModal.vue'
import { SPEECH_STATUS, langLabel, speechModeLabel } from './speechTask'

// roomId：嵌入直播间详情时只看该直播间的任务；roomName、rtmpPullUrl 用于新建时默认源流
const props = defineProps<{ roomId?: string; roomName?: string; rtmpPullUrl?: string }>()

const items = ref<SpeechTaskItem[]>([])
const loading = ref(false)
const syncError = ref('')
const status = ref('')
const keyword = ref('')
const busy = ref('')
const pagination = reactive({ current: 1, pageSize: 20, total: 0, showTotal: true, showPageSize: true })

const room = computed(() => (props.roomId ? { id: props.roomId, roomName: props.roomName || '', sourceUrlHint: props.rtmpPullUrl || '' } : null))
const statusOf = (r: SpeechTaskItem) => SPEECH_STATUS[r.status] || SPEECH_STATUS.init
const fmt = (v?: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—')

const load = async () => {
  loading.value = true
  try {
    const res = await listSpeechTasks({ roomId: props.roomId || undefined, keyword: keyword.value.trim() || undefined, status: status.value || undefined, page: pagination.current, pageSize: pagination.pageSize })
    items.value = res.items || []
    pagination.total = res.total || 0
    syncError.value = res.syncError || ''
  } catch (e: any) {
    Message.error(e?.response?.data?.message || e?.message || '加载同传任务失败')
  } finally {
    loading.value = false
  }
}
const reload = () => {
  pagination.current = 1
  load()
}
const onPage = (p: number) => {
  pagination.current = p
  load()
}
const onPageSize = (s: number) => {
  pagination.pageSize = s
  reload()
}

// 有进行中的任务时每 20 秒刷新状态
const autoRefreshing = computed(() => items.value.some((r) => statusOf(r).active))
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  load()
  timer = setInterval(() => {
    if (autoRefreshing.value && !loading.value && !document.hidden) load()
  }, 20000)
})
onBeforeUnmount(() => clearInterval(timer))

const act = async (r: SpeechTaskItem, key: string, fn: () => Promise<unknown>, ok: string) => {
  busy.value = r.taskId + key
  try {
    await fn()
    Message.success(ok)
    await load()
  } catch (e: any) {
    Message.error(e?.response?.data?.message || e?.message || '操作失败')
  } finally {
    busy.value = ''
  }
}
const stop = (r: SpeechTaskItem) => act(r, 'stop', () => stopSpeechTask(r.taskId), '已停止')
const remove = (r: SpeechTaskItem) => act(r, 'delete', () => deleteSpeechTask(r.taskId), '已删除')
const restart = (r: SpeechTaskItem, reload: boolean) => act(r, 'restart', () => restartSpeechTask(r.taskId, reload), reload ? '已重启字幕模块' : '已重启任务')

// ---------- 新建 / 复制新建 ----------
const modalVisible = ref(false)
const copyFrom = ref<{ name: string; rule: any } | null>(null)
const openCreate = () => {
  copyFrom.value = null
  modalVisible.value = true
}
const copy = async (r: SpeechTaskItem) => {
  busy.value = r.taskId + 'copy'
  try {
    copyFrom.value = { name: r.name, rule: await getSpeechTaskRule(r.taskId) }
    modalVisible.value = true
  } catch (e: any) {
    Message.error(e?.response?.data?.message || e?.message || '读取任务参数失败')
  } finally {
    busy.value = ''
  }
}
const onCreated = () => {
  copyFrom.value = null
  reload()
}

defineExpose({ reload })
</script>

<style scoped>
.stt { display: flex; flex-direction: column; gap: 12px; }
.stt-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.stt-filters, .stt-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.stt-tip { font-size: 12px; color: var(--color-text-3); }
.stt-alert { padding: 8px 12px; border-radius: 6px; background: var(--warning-bg); color: var(--warning); font-size: 13px; }
.stt-name { font-weight: 600; }
.stt-sub { font-size: 12px; color: var(--color-text-3); }
.stt-mono { font-family: Consolas, monospace; }
.stt-ops { display: flex; flex-wrap: wrap; gap: 2px; }
.stt-empty { padding: 28px 0; color: var(--color-text-3); }
</style>
