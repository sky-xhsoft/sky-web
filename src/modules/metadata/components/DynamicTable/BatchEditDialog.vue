<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import type { SysColumn } from '@/modules/metadata/types'

interface Props {
  visible: boolean
  columns: SysColumn[]
  mode: 'selected' | 'all'
  selectedCount: number
  totalCount?: number
  filterInfo?: string
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

watch(() => props.visible, (v) => {
  if (v) initFields()
})

function handleSubmit() {
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

function handleClose() {
  emit('update:visible', false)
}

function handleHelp() {
  Message.info('帮助功能待实现')
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
    width="700px"
    :footer="false"
    :closable="false"
  >
    <div class="batch-edit-container">
      <!-- 头部按钮区 -->
      <div class="header-actions">
        <div class="header-left">
          <!-- 左侧空，用于平衡布局 -->
        </div>
        <div class="header-right">
          <span class="filter-info" v-if="filterInfo">
            <icon-filter />
            {{ filterInfo }}
          </span>
          <a-space>
            <a-button type="primary" @click="handleSubmit" :loading="loading">
              提交(G)
            </a-button>
            <a-button @click="handleHelp">
              <icon-question-circle />
              帮助
            </a-button>
            <a-button @click="handleClose">
              <icon-close />
              关闭
            </a-button>
          </a-space>
        </div>
      </div>

      <!-- 表单区域 -->
      <div class="form-area">
        <div class="form-grid">
          <div
            v-for="(edit, index) in fieldEdits"
            :key="edit.column.DB_NAME"
            class="form-row"
          >
            <div class="field-label">
              <a-checkbox v-model="edit.enabled">
                {{ edit.column.DISPLAY_NAME }}
                <span v-if="edit.column.IS_REQUIRED === 'Y'" class="required">*</span>
              </a-checkbox>
            </div>
            <div class="field-input">
              <template v-if="edit.enabled">
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
                  <a-option v-if="edit.column.DB_NAME === 'IS_ACTIVE'" value="Y">是</a-option>
                  <a-option v-if="edit.column.DB_NAME === 'IS_ACTIVE'" value="N">否</a-option>
                  <a-option
                    v-for="opt in edit.column.DICT_OPTIONS"
                    :key="opt.value"
                    :value="opt.value"
                  >{{ opt.label }}</a-option>
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
              </template>
              <template v-else>
                <div class="input-placeholder">请先勾选此字段</div>
              </template>
            </div>
            <!-- 奇数行显示在左边，偶数行显示在右边 -->
            <div
              v-if="index % 2 === 0 && index + 1 < fieldEdits.length"
              class="field-label spacer"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
.batch-edit-container {
  border: 1px solid var(--brand-blue);
  border-radius: 0;
  padding: 0;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: linear-gradient(90deg, var(--info-bg) 0%, var(--bg-card) 100%);
  border-bottom: 1px solid var(--brand-blue);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--error);
}

.form-area {
  padding: 24px 32px;
  min-height: 200px;
}

.form-grid {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr;
  gap: 12px 24px;
  align-items: center;
}

.form-row {
  display: contents;
}

.field-label {
  display: flex;
  align-items: center;
  white-space: nowrap;
  font-size: 13px;
  color: var(--text-primary);
}

.field-label .required {
  color: var(--error);
  margin-left: 2px;
}

.field-label.spacer {
  visibility: hidden;
}

.field-input {
  display: flex;
  align-items: center;
}

.input-placeholder {
  width: 100%;
  height: 32px;
  border-bottom: 1px solid var(--text-tertiary);
}

:deep(.arco-input) {
  border: none;
  border-bottom: 1px solid var(--text-tertiary);
  border-radius: 0;
  padding: 2px 4px;
}

:deep(.arco-input:hover) {
  border-color: var(--brand-blue);
}

:deep(.arco-input:focus) {
  border-color: var(--brand-blue);
  box-shadow: none;
}

:deep(.arco-input-number) {
  width: 100%;
}

:deep(.arco-input-number-input-wrapper) {
  border: none;
  border-bottom: 1px solid var(--text-tertiary);
  border-radius: 0;
}

:deep(.arco-select-view) {
  border: none;
  border-bottom: 1px solid var(--text-tertiary);
  border-radius: 0;
}

:deep(.arco-picker) {
  border: none;
  border-bottom: 1px solid var(--text-tertiary);
  border-radius: 0;
  width: 100%;
}
</style>
