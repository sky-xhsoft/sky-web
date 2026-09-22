<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconCheckCircleFill } from '@arco-design/web-vue/es/icon'
import { useNavigationStore } from '@/stores/navigation'
import { useDynamicTableStore } from '../../stores/useDynamicTableStore'
import { useMetadataStore } from '../../stores/useMetadataStore'
import { batchUpdateRecords } from '../../api/metadata'
import type { SysColumn } from '../../types'

const navigationStore = useNavigationStore()

interface Props {
  tableId: number
  tableName: string
  mode: 'selected' | 'all'
  selectedIds?: number[]
}

const props = defineProps<Props>()

const metadataStore = useMetadataStore()
const tableStore = useDynamicTableStore()

const columns = ref<SysColumn[]>([])
const saving = ref(false)
const done = ref(false)

interface FieldEdit {
  column: SysColumn
  enabled: boolean
  value: any
}

const fieldEdits = ref<FieldEdit[]>([])

const editableColumns = computed(() => {
  return columns.value.filter(col => {
    if (!col.IS_ACTIVE || col.IS_ACTIVE !== 'Y') return false
    if (col.SET_VALUE_TYPE === 'pk') return false
    if (col.SET_VALUE_TYPE === 'sysdate') return false
    if (col.SET_VALUE_TYPE === 'createBy') return false
    if (col.DB_NAME === 'ID') return false
    return true
  })
})

onMounted(async () => {
  const config = await metadataStore.loadTableConfig(props.tableId)
  columns.value = config?.columns || []
  fieldEdits.value = editableColumns.value.map(col => ({
    column: col,
    enabled: false,
    value: undefined,
  }))
})

const enabledCount = computed(() => fieldEdits.value.filter(f => f.enabled).length)
const totalFields = computed(() => fieldEdits.value.length)
const searchKeyword = ref('')

const filteredFieldEdits = computed(() => {
  if (!searchKeyword.value) return fieldEdits.value
  const kw = searchKeyword.value.toLowerCase()
  return fieldEdits.value.filter(f =>
    f.column.DISPLAY_NAME?.toLowerCase().includes(kw) ||
    f.column.DB_NAME?.toLowerCase().includes(kw)
  )
})

function toggleAll() {
  const allOn = enabledCount.value === totalFields.value
  fieldEdits.value.forEach(f => f.enabled = !allOn)
}

function isTextType(col: SysColumn) {
  const t = col.DISPLAY_TYPE || ''
  return !t || t === 'text' || t === 'number'
}

function isNumberType(col: SysColumn) {
  const t = col.DISPLAY_TYPE || ''
  return t === 'number' || col.COL_TYPE === 'int' || col.COL_TYPE === 'bigint' || col.COL_TYPE === 'decimal'
}

const recordCount = computed(() => {
  if (props.mode === 'selected') return props.selectedIds?.length || 0
  return tableStore.pagination?.total || 0
})

async function handleSave() {
  const enabled = fieldEdits.value.filter(f => f.enabled)
  if (enabled.length === 0) {
    Message.warning('请至少勾选一个字段')
    return
  }

  const fields: Record<string, any> = {}
  for (const edit of enabled) {
    const val = edit.value
    if (val === undefined || val === '') {
      Message.warning(`字段"${edit.column.DISPLAY_NAME}"的值不能为空`)
      return
    }
    fields[edit.column.DB_NAME] = val
  }

  saving.value = true
  try {
    const ids = props.mode === 'selected'
      ? (props.selectedIds || [])
      : tableStore.records.map((r: any) => Number(r.ID))

    await batchUpdateRecords(props.tableName, ids, fields)
    Message.success(`成功修改 ${ids.length} 条记录`)
    done.value = true
  } catch (e: any) {
    Message.error(e?.message || '批量修改失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="batch-edit-page">
    <div class="page-toolbar">
      <h2>批量修改 — {{ tableName }}</h2>
      <div class="toolbar-info">
        <a-tag color="arcoblue">
          {{ mode === 'selected' ? `选中 ${recordCount} 条` : `结果集 ${recordCount} 条` }}
        </a-tag>
        <a-tag v-if="enabledCount > 0" color="green">已选 {{ enabledCount }} 个字段</a-tag>
      </div>
    </div>

    <div v-if="done" class="success-state">
      <icon-check-circle-fill :size="64" style="color: #22c55e;" />
      <h3>修改已提交</h3>
      <p>已成功修改 {{ recordCount }} 条记录。可关闭此页面继续操作。</p>
    </div>

    <div v-else class="edit-grid">
      <div class="grid-toolbar">
        <a-input-search
          v-model="searchKeyword"
          placeholder="搜索字段名或DB_NAME..."
          size="small"
          style="width: 260px"
          allow-clear
        />
        <a-space size="small">
          <a-button size="small" @click="toggleAll">
            {{ enabledCount === totalFields ? '全部取消' : '全选字段' }}
          </a-button>
          <span class="field-summary">{{ enabledCount }} / {{ totalFields }} 个字段</span>
        </a-space>
      </div>

      <div class="grid-header">
        <div class="col-check">选择</div>
        <div class="col-name">字段名</div>
        <div class="col-dbname">DB_NAME</div>
        <div class="col-type">类型</div>
        <div class="col-value">新值</div>
      </div>

      <div
        v-for="edit in filteredFieldEdits"
        :key="edit.column.DB_NAME"
        class="grid-row"
        :class="{ active: edit.enabled }"
      >
        <div class="col-check">
          <a-switch v-model="edit.enabled" size="small" />
        </div>
        <div class="col-name">
          <span class="field-label">{{ edit.column.DISPLAY_NAME }}</span>
        </div>
        <div class="col-dbname">
          <code>{{ edit.column.DB_NAME }}</code>
        </div>
        <div class="col-type">
          <a-tag size="small">{{ edit.column.DISPLAY_TYPE || edit.column.COL_TYPE || '-' }}</a-tag>
        </div>
        <div class="col-value">
          <template v-if="edit.enabled">
            <a-input
              v-if="isTextType(edit.column)"
              v-model="edit.value"
              :placeholder="`输入新的${edit.column.DISPLAY_NAME}`"
              size="small"
              allow-clear
            />
            <a-input-number
              v-else-if="isNumberType(edit.column)"
              v-model="edit.value"
              :placeholder="`输入新的${edit.column.DISPLAY_NAME}`"
              size="small"
              style="width: 100%"
            />
            <a-select
              v-else-if="edit.column.DISPLAY_TYPE === 'select'"
              v-model="edit.value"
              :placeholder="`选择${edit.column.DISPLAY_NAME}`"
              size="small"
              allow-clear
            >
              <a-option v-if="edit.column.DB_NAME === 'IS_ACTIVE'" value="Y">是</a-option>
              <a-option v-if="edit.column.DB_NAME === 'IS_ACTIVE'" value="N">否</a-option>
            </a-select>
            <a-date-picker
              v-else-if="edit.column.DISPLAY_TYPE === 'datetime'"
              v-model="edit.value"
              :placeholder="`选择${edit.column.DISPLAY_NAME}`"
              size="small"
              show-time
              style="width: 100%"
            />
            <a-date-picker
              v-else-if="edit.column.DISPLAY_TYPE === 'date'"
              v-model="edit.value"
              :placeholder="`选择${edit.column.DISPLAY_NAME}`"
              size="small"
              style="width: 100%"
            />
            <a-textarea
              v-else-if="edit.column.DISPLAY_TYPE === 'textarea'"
              v-model="edit.value"
              :placeholder="`输入新的${edit.column.DISPLAY_NAME}`"
              :auto-size="{ minRows: 2, maxRows: 4 }"
            />
            <a-input
              v-else
              v-model="edit.value"
              :placeholder="`输入新的${edit.column.DISPLAY_NAME}`"
              size="small"
              allow-clear
            />
          </template>
          <span v-else class="disabled-hint">—</span>
        </div>
      </div>
    </div>

    <div v-if="!done" class="page-footer">
      <a-button @click="navigationStore.removeTab(navigationStore.activeTabKey)">取消</a-button>
      <a-space>
        <a-button v-if="enabledCount > 0" @click="fieldEdits.forEach(f => f.enabled = false)">全部取消</a-button>
        <a-button type="primary" :loading="saving" @click="handleSave" :disabled="enabledCount === 0">
          确认修改（{{ recordCount }} 条记录）
        </a-button>
      </a-space>
    </div>
  </div>
</template>

<style scoped>
.batch-edit-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px 24px;
  gap: 16px;
}

.page-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.page-toolbar h2 {
  margin: 0;
  font-size: 18px;
}
.toolbar-info {
  display: flex;
  gap: 8px;
}

.success-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-secondary);
}
.success-state h3 { margin: 0; }
.success-state p { margin: 0; font-size: 14px; color: var(--text-secondary); }

.edit-grid {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.grid-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: var(--bg-hover);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.field-summary {
  font-size: 13px;
  color: var(--text-secondary);
}

.grid-header {
  display: grid;
  grid-template-columns: 60px 1fr 160px 80px 240px;
  padding: 10px 16px;
  background: var(--bg-hover);
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  position: sticky;
  top: 0;
  z-index: 1;
  flex-shrink: 0;
}

.grid-row {
  display: grid;
  grid-template-columns: 60px 1fr 160px 80px 240px;
  padding: 10px 16px;
  align-items: center;
  border-bottom: 1px solid var(--bg-hover);
  transition: background 0.15s;
  flex-shrink: 0;
}
.grid-row:hover { background: var(--bg-hover); }
.grid-row.active { background: var(--info-bg); }

.col-name .field-label { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.col-dbname code { font-size: 11px; color: var(--text-tertiary); background: var(--bg-hover); padding: 1px 4px; border-radius: 3px; }
.disabled-hint { color: var(--text-tertiary); }

.page-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid var(--border);
}
</style>
