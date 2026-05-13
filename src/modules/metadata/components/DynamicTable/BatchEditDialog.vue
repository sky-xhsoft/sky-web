<script setup lang="ts">
import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import type { SysColumn } from '@/modules/metadata/types'

interface Props {
  visible: boolean
  columns: SysColumn[]
  mode: 'selected' | 'all'
  selectedCount: number
  totalCount?: number
}

interface Emits {
  (e: 'update:visible', v: boolean): void
  (e: 'confirm', fields: Record<string, any>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)

const editableColumns = computed(() => {
  return props.columns.filter((col) => {
    if (!col.IS_ACTIVE || col.IS_ACTIVE !== 'Y') return false
    if (col.SET_VALUE_TYPE === 'pk') return false
    if (col.SET_VALUE_TYPE === 'sysdate') return false
    if (col.SET_VALUE_TYPE === 'createBy') return false
    if (col.DB_NAME === 'ID') return false
    return true
  })
})

interface FieldEdit {
  column: SysColumn
  enabled: boolean
  value: any
}

const fieldEdits = ref<FieldEdit[]>([])

function initFields() {
  fieldEdits.value = editableColumns.value.map((col) => ({
    column: col,
    enabled: false,
    value: undefined,
  }))
}

import { watch } from 'vue'
watch(() => props.visible, (v) => {
  if (v) initFields()
})

function handleConfirm() {
  const enabled = fieldEdits.value.filter((f) => f.enabled)
  if (enabled.length === 0) {
    Message.warning('请至少选择一个要修改的字段')
    return
  }

  const fields: Record<string, any> = {}
  for (const edit of enabled) {
    if (edit.value === undefined || edit.value === '') {
      Message.warning(`字段"${edit.column.DISPLAY_NAME}"不能为空`)
      return
    }
    fields[edit.column.DB_NAME] = edit.value
  }

  emit('confirm', fields)
}

function getDefaultValue(col: SysColumn): any {
  switch (col.DISPLAY_TYPE) {
    case 'number': return 0
    case 'select':
    case 'text': return ''
    default: return ''
  }
}

const title = computed(() => {
  if (props.mode === 'selected') {
    return `批量修改选中行（共 ${props.selectedCount} 条）`
  }
  return `批量修改结果集（共 ${props.totalCount ?? 0} 条）`
})
</script>

<template>
  <a-modal
    :visible="visible"
    :title="title"
    width="520px"
    :ok-loading="loading"
    @ok="handleConfirm"
    @cancel="emit('update:visible', false)"
    ok-text="确认修改"
    cancel-text="取消"
  >
    <div class="batch-edit-body">
      <div class="hint">
        <icon-info-circle style="color: #3b82f6; margin-right: 4px;" />
        选择要修改的字段并输入新值，将应用到{{ mode === 'selected' ? '选中的' : '当前筛选结果的全部' }}记录
      </div>

      <div class="field-list">
        <div
          v-for="edit in fieldEdits"
          :key="edit.column.DB_NAME"
          class="field-item"
        >
          <div class="field-header">
            <a-checkbox v-model="edit.enabled">
              {{ edit.column.DISPLAY_NAME }}
            </a-checkbox>
            <span class="field-dbname">{{ edit.column.DB_NAME }}</span>
          </div>
          <div v-if="edit.enabled" class="field-input">
            <a-input
              v-if="edit.column.DISPLAY_TYPE === 'text' || edit.column.DISPLAY_TYPE === 'textarea'"
              v-model="edit.value"
              :placeholder="`请输入新的${edit.column.DISPLAY_NAME}`"
            />
            <a-input-number
              v-else-if="edit.column.DISPLAY_TYPE === 'number'"
              v-model="edit.value"
              :placeholder="`请输入新的${edit.column.DISPLAY_NAME}`"
              style="width: 100%"
            />
            <a-select
              v-else-if="edit.column.DISPLAY_TYPE === 'select'"
              v-model="edit.value"
              :placeholder="`请选择${edit.column.DISPLAY_NAME}`"
              allow-clear
            >
              <a-option v-if="edit.column.DB_NAME === 'IS_ACTIVE'" value="Y" label="是" />
              <a-option v-if="edit.column.DB_NAME === 'IS_ACTIVE'" value="N" label="否" />
            </a-select>
            <a-date-picker
              v-else-if="edit.column.DISPLAY_TYPE === 'date' || edit.column.DISPLAY_TYPE === 'datetime'"
              v-model="edit.value"
              :placeholder="`请选择${edit.column.DISPLAY_NAME}`"
              style="width: 100%"
              :show-time="edit.column.DISPLAY_TYPE === 'datetime'"
            />
            <a-input
              v-else
              v-model="edit.value"
              :placeholder="`请输入新的${edit.column.DISPLAY_NAME}`"
            />
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
.batch-edit-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.hint {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  font-size: 13px;
  color: #1e40af;
}
.field-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}
.field-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px 12px;
}
.field-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.field-dbname {
  font-size: 11px;
  color: #9ca3af;
  font-family: monospace;
}
.field-input {
  margin-top: 8px;
}
</style>
