<template>
  <div class="speech-task-list-panel">
    <div class="panel-toolbar">
      <a-space>
        <a-button type="primary" size="small" @click="openCreate">
          <template #icon><icon-plus /></template>
          {{ t('speechTaskList.addTask') }}
        </a-button>
        <a-button size="small" @click="load">
          <template #icon><icon-refresh /></template>
          {{ t('speechTaskList.refresh') }}
        </a-button>
      </a-space>
      <span class="toolbar-tip" v-if="roomId">{{ t('speechTaskList.forRoom', { id: roomId }) }}</span>
    </div>

    <a-table
      :data="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
      size="small"
      :bordered="false"
      class="speech-task-table"
    >
      <template #columns>
        <a-table-column title="#" :width="44">
          <template #cell="{ rowIndex }">{{ rowIndex + 1 }}</template>
        </a-table-column>
        <a-table-column :title="t('speechTaskList.name')" min-width="150">
          <template #cell="{ record }">{{ record.name }}</template>
        </a-table-column>
        <a-table-column :title="t('speechTaskList.mode')" :width="80">
          <template #cell="{ record }">
            <a-tag :color="modeColor(record.mode)">{{ modeText(record.mode) }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column :title="t('speechTaskList.subtitleLangs')" min-width="140">
          <template #cell="{ record }">
            <template v-if="langList(record.outputLangs).length">
              <a-tag
                v-for="lang in langList(record.outputLangs)"
                :key="lang"
                color="arcoblue"
                size="small"
                style="margin: 2px 4px 2px 0;"
              >{{ langLabel(lang) }}</a-tag>
            </template>
            <span v-else class="text-muted">--</span>
          </template>
        </a-table-column>
        <a-table-column :title="t('speechTaskList.time')" min-width="200">
          <template #cell="{ record }">
            <span class="text-muted">{{ record.startTime }} ~ {{ record.endTime }}</span>
          </template>
        </a-table-column>
        <a-table-column :title="t('speechTaskList.operations')" :width="120" align="center">
          <template #cell="{ record }">
            <a-button size="mini" type="text" status="danger" @click="remove(record)">
              <template #icon><icon-delete /></template>
              {{ t('speechTaskList.delete') }}
            </a-button>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <a-empty
      v-if="!loading && !list.length"
      :description="t('speechTaskList.empty')"
      style="margin-top: 24px;"
    />

    <!-- 新增/编辑字幕同传任务弹窗 -->
    <SpeechTaskModal
      v-model:visible="modalVisible"
      :record="createRecord"
      :title="t('speechTaskList.addTaskTitle')"
      :ok-text="t('speechTaskList.createTask')"
      @success="onCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import api from '../../../api/http'
import SpeechTaskModal from './SpeechTaskModal.vue'

const { t } = useI18n()

const props = defineProps<{
  roomId?: string
  rtmpPullUrl?: string
  roomName?: string
}>()

const list = ref<any[]>([])
const loading = ref(false)
const modalVisible = ref(false)
const createRecord = ref<any>(null)

const LANG_LABELS: Record<string, string> = {
  zh: '中文', en: 'English', ja: '日本語', ko: '한국어', es: 'Español',
  fr: 'Français', de: 'Deutsch', ru: 'Русский'
}

const langList = (s: string): string[] => {
  if (!s) return []
  return s.split(',').map(x => x.trim()).filter(Boolean)
}

const langLabel = (v: string) => LANG_LABELS[v] || v.toUpperCase()

const modeText = (m: string) => {
  const map: Record<string, string> = { si: t('speechTask.modeSi'), realtime: t('speechTask.modeRealtime'), mix: t('speechTask.modeMix') }
  return map[m] || (m || '--')
}

const modeColor = (m: string) => {
  const map: Record<string, string> = { si: 'arcoblue', realtime: 'green', mix: 'orange' }
  return map[m] || 'gray'
}

const load = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (props.roomId && props.roomId !== 'undefined') params.roomId = props.roomId
    const resp = await api.get('/live/speech-tasks', { params })
    const data = resp.data?.data
    list.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    Message.error(error?.response?.data?.message || error.message || t('speechTaskList.loadFailed'))
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  createRecord.value = {
    id: props.roomId,
    roomName: props.roomName || '',
    // 源地址默认用直播间 RTMP 拉流地址
    sourceUrlHint: props.rtmpPullUrl || ''
  }
  modalVisible.value = true
}

const onCreated = () => {
  load()
}

const remove = (record: any) => {
  Modal.confirm({
    title: t('speechTaskList.deleteConfirmTitle'),
    content: record.name ? `${t('speechTaskList.deleteConfirmContent')}「${record.name}」` : t('speechTaskList.deleteConfirmContent'),
    okButtonProps: { status: 'danger' },
    onOk: async () => {
      try {
        await api.post('/live/speech-tasks/delete', { taskID: record.taskId })
        Message.success(t('speechTaskList.deleteSuccess'))
        load()
      } catch (error: any) {
        Message.error(error?.response?.data?.message || error.message || t('speechTaskList.deleteFailed'))
      }
    }
  })
}

onMounted(() => {
  load()
})
</script>

<style scoped lang="scss">
.speech-task-list-panel {
  .panel-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    .toolbar-tip {
      font-size: 12px;
      color: var(--text-tertiary, #86909c);
    }
  }

  .speech-task-table {
    :deep(.arco-table-th) {
      background: #f7f8fa;
      font-size: 13px;
    }
    :deep(.arco-table-td) {
      font-size: 13px;
    }
  }

  .text-muted {
    color: var(--text-tertiary, #86909c);
    font-size: 12px;
  }
}
</style>