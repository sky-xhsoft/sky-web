<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconSearch, IconDown, IconUp } from '@arco-design/web-vue/es/icon'
import ForeignKeyField from '../FieldRenderers/ForeignKeyField.vue'
import type { SysColumn } from '../../../types'

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

const visibleColumns = computed(() => {
  if (showAdvanced.value) return props.columns
  return props.columns.slice(0, 4)
})

function isFK(col: SysColumn) {
  return col.CONTROL_TYPE === 'foreign_key' || col.SET_VALUE_TYPE === 'fk'
}

function getOptions(col: SysColumn) {
  const dictId = col.SYS_DICT_ID || (col as any).sysDictId
  return dictId ? (props.dictOptions?.[String(dictId)] || []) : []
}

function handleQuery() {
  emit('query', { ...queryForm.value })
}

function handleReset() {
  queryForm.value = {}
  emit('reset')
}

defineExpose({ queryForm, handleQuery })
</script>

<template>
  <div class="dynamic-table__query">
    <div class="query-header">
      <IconSearch class="query-icon" />
      <span class="query-title">查询条件</span>
    </div>

    <a-form :model="queryForm" layout="inline" class="query-form">
      <template v-if="columns.length > 0">
        <a-form-item
          v-for="col in visibleColumns"
          :key="col.DB_NAME"
          :label="col.DISPLAY_NAME"
        >
          <ForeignKeyField
            v-if="isFK(col)"
            :column="col"
            :model-value="queryForm[col.DB_NAME]"
            mode="edit"
            @update:model-value="v => queryForm[col.DB_NAME] = v"
          />
          <a-select
            v-else-if="col.CONTROL_TYPE === 'select'"
            v-model="queryForm[col.DB_NAME]"
            :placeholder="`请选择${col.DISPLAY_NAME}`"
            allow-clear
          >
            <a-option v-for="o in getOptions(col)" :key="o.value" :value="o.value">{{ o.label }}</a-option>
          </a-select>
          <a-date-picker
            v-else-if="col.CONTROL_TYPE === 'date' || col.CONTROL_TYPE === 'datetime'"
            v-model="queryForm[col.DB_NAME]"
            :show-time="col.CONTROL_TYPE === 'datetime'"
            :placeholder="`请选择${col.DISPLAY_NAME}`"
            allow-clear
            style="width:100%"
          />
          <a-input-number
            v-else-if="col.CONTROL_TYPE === 'number'"
            v-model="queryForm[col.DB_NAME]"
            :placeholder="`请输入${col.DISPLAY_NAME}`"
            style="width:100%"
          />
          <a-input
            v-else
            v-model="queryForm[col.DB_NAME]"
            :placeholder="`请输入${col.DISPLAY_NAME}`"
            allow-clear
          />
        </a-form-item>
      </template>
      <div v-else class="query-empty"><span class="query-empty-text">暂无查询字段</span></div>

      <div v-if="columns.length > 0" class="query-actions">
        <a-button v-if="columns.length > 4" type="text" @click="showAdvanced = !showAdvanced">
          {{ showAdvanced ? '收起' : '展开' }}
          <IconDown v-if="!showAdvanced" /><IconUp v-else />
        </a-button>
      </div>
    </a-form>
  </div>
</template>

<style scoped>
.dynamic-table__query { flex-shrink: 0; padding: 0; background: #fff; border: 1px solid #e5e6eb; border-radius: 4px; }
.query-header { display: flex; align-items: center; padding: 8px 12px; background: #f7f8fa; border-bottom: 1px solid #e5e6eb; border-radius: 4px 4px 0 0; }
.query-icon { font-size: 16px; color: #3370ff; margin-right: 8px; }
.query-title { font-size: 14px; font-weight: 500; color: #1d2129; }
.query-form { padding: 10px 12px; padding-right: 260px; position: relative; min-height: 36px; }
.query-form :deep(.arco-form-item) { margin-bottom: 12px !important; margin-right: 16px !important; width: calc(25% - 16px); min-width: 160px; }
.query-actions { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); }
.query-empty { padding: 24px 16px; text-align: center; }
.query-empty-text { color: #86909c; font-size: 14px; }
@media (max-width: 768px) {
  .query-form { padding-right: 16px; padding-bottom: 70px; }
  .query-form :deep(.arco-form-item) { width: 100%; }
  .query-actions { position: static; transform: none; justify-content: flex-start; }
}
</style>
