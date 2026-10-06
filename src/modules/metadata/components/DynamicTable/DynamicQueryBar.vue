<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconDown, IconUp, IconSearch } from '@arco-design/web-vue/es/icon'
import FkQueryInput from './FkQueryInput.vue'
import type { SysColumn } from '../../types'

interface Props {
  columns: SysColumn[]
  dictOptions?: Record<string, { value: string; label: string }[]>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'query', form: Record<string, any>): void
  (e: 'reset'): void
}>()

const queryForm = ref<Record<string, any>>({})
const showAdvanced = ref(false)
const expanded = ref(true)

const visibleColumns = computed(() => {
  if (showAdvanced.value) return props.columns
  return props.columns.slice(0, 4)
})

function getFieldKey(col: SysColumn, index: number): string {
  return (col.DB_NAME || (col as any).dbName) || `field_${index}`
}

function isFK(col: SysColumn) {
  return col.CONTROL_TYPE === 'foreign_key' || col.SET_VALUE_TYPE === 'fk'
}

function getLabel(col: SysColumn): string {
  return col.DISPLAY_NAME || (col as any).displayName || col.DB_NAME || (col as any).dbName || ''
}
function getPlaceholder(col: SysColumn): string {
  const label = getLabel(col)
  return label ? `请输入${label}` : `请输入`
}
function getOptions(col: SysColumn) {
  const dictId = col.SYS_DICT_ID || (col as any).sysDictId
  return dictId ? (props.dictOptions?.[String(dictId)] || []) : []
}

function handleQuery() {
  emit('query', { ...queryForm.value })
}
defineExpose({ queryForm, handleQuery })
</script>

<template>
  <div class="dynamic-table__query" :class="{ 'is-collapsed': !expanded }">
    <!-- 门户风格：查询面板标题栏 + 折叠 -->
    <div class="query-panel-header">
      <div class="query-panel-title">
        <span class="query-panel-dot"></span>
        <icon-search class="query-panel-icon" />
        <span class="query-panel-text">查询条件</span>
        <span class="query-panel-count" v-if="columns.length > 0">共 {{ columns.length }} 项</span>
      </div>
      <div class="query-panel-tools">
        <slot name="extra" />
        <a-button
          class="query-collapse-btn"
          type="text"
          size="mini"
          @click="expanded = !expanded"
        >
          {{ expanded ? '收起' : '展开' }}
          <IconUp v-if="expanded" /><IconDown v-else />
        </a-button>
      </div>
    </div>

    <!-- 折叠面板体 -->
    <div v-show="expanded" class="query-panel-body">
      <a-form :model="queryForm" layout="inline" class="query-form" @submit.prevent="handleQuery">
        <template v-if="columns.length > 0">
          <a-form-item
            v-for="(col, idx) in visibleColumns"
            :key="getFieldKey(col, idx)"
            :label="getLabel(col)"
          >
            <FkQueryInput
              v-if="isFK(col)"
              :column="col"
              :model-value="queryForm[col.DB_NAME || (col as any).dbName]"
              @update:model-value="v => queryForm[col.DB_NAME || (col as any).dbName] = v"
            />
            <a-select
              v-else-if="col.CONTROL_TYPE === 'select'"
              v-model="queryForm[col.DB_NAME || (col as any).dbName]"
              :placeholder="`请选择${getLabel(col)}`"
              allow-clear
            >
              <a-option v-for="o in getOptions(col)" :key="o.value" :value="o.value">{{ o.label }}</a-option>
            </a-select>
            <a-date-picker
              v-else-if="col.CONTROL_TYPE === 'date' || col.CONTROL_TYPE === 'datetime'"
              v-model="queryForm[col.DB_NAME || (col as any).dbName]"
              :show-time="col.CONTROL_TYPE === 'datetime'"
              :placeholder="`请选择${getLabel(col)}`"
              allow-clear
              style="width:100%"
            />
            <a-input-number
              v-else-if="col.CONTROL_TYPE === 'number'"
              v-model="queryForm[col.DB_NAME || (col as any).dbName]"
              :placeholder="getPlaceholder(col)"
              style="width:100%"
            />
            <a-input
              v-else
              v-model="queryForm[col.DB_NAME || (col as any).dbName]"
              :placeholder="getPlaceholder(col)"
              allow-clear
            />
          </a-form-item>
        </template>
        <div v-else class="query-empty"><span class="query-empty-text">暂无查询字段</span></div>

        <div v-if="columns.length > 0" class="query-actions">
          <a-button
            v-if="columns.length > 4"
            type="text"
            size="mini"
            @click="showAdvanced = !showAdvanced"
          >
            {{ showAdvanced ? '收起' : '展开' }}
            <IconDown v-if="!showAdvanced" /><IconUp v-else />
          </a-button>
        </div>
      </a-form>
    </div>
  </div>
</template>

<style scoped>
.dynamic-table__query {
  flex-shrink: 0;
  padding: 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
}

/* —— 门户风格查询面板标题栏 —— */
.query-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px 8px 16px;
  border-bottom: 1px solid var(--border-light);
  background: linear-gradient(180deg, var(--bg-hover), var(--bg-card));
  cursor: pointer;
  user-select: none;
}
.query-panel-header:hover {
  background: var(--bg-hover);
}
.query-panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}
.query-panel-dot {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--brand-blue), rgba(22,93,255,0.3));
}
.query-panel-icon {
  color: var(--brand-blue);
  font-size: 14px;
}
.query-panel-text {
  letter-spacing: 0.3px;
}
.query-panel-count {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-tertiary);
  margin-left: 4px;
}
.query-panel-tools {
  display: flex;
  align-items: center;
  gap: 4px;
}
.query-collapse-btn {
  height: 24px;
  padding: 0 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

/* —— 折叠时只留标题栏 —— */
.dynamic-table__query.is-collapsed .query-panel-body {
  display: none;
}

/* —— 表单体 —— */
.query-form {
  padding: 14px 16px 6px;
  padding-right: 120px;
  position: relative;
  min-height: 36px;
}
.query-form :deep(.arco-form-item) {
  margin-bottom: 14px !important;
  margin-right: 18px !important;
  width: calc(25% - 18px);
  min-width: 180px;
}
.query-form :deep(.arco-form-item-label) {
  color: var(--text-secondary);
  font-weight: 500;
}
.query-form :deep(.arco-input),
.query-form :deep(.arco-select),
.query-form :deep(.arco-picker) {
  border-radius: 6px;
}
.query-actions {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 4px;
}
.query-empty {
  padding: 24px 16px;
  text-align: center;
  width: 100%;
}
.query-empty-text {
  color: var(--text-tertiary);
  font-size: 14px;
}
@media (max-width: 768px) {
  .query-form {
    padding-right: 16px;
    padding-bottom: 70px;
  }
  .query-form :deep(.arco-form-item) {
    width: 100%;
  }
  .query-actions {
    position: static;
    transform: none;
    justify-content: flex-start;
    margin-top: 8px;
  }
}
</style>