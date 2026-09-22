<!--
  RecordLogPanel - 操作日志面板
  对齐门户「销售价调整单」编辑页的「日志」区块：
  展示当前记录的操作历史（创建 / 修改 的人员与时间），来源为记录的内建系统字段。
-->
<template>
  <div class="record-log-panel">
    <a-descriptions
      :column="2"
      bordered
      size="medium"
      class="record-log-panel__desc"
    >
      <a-descriptions-item label="创建人">
        {{ displayValue(record, 'CREATE_BY') }}
      </a-descriptions-item>
      <a-descriptions-item label="创建时间">
        {{ displayValue(record, 'CREATE_TIME') }}
      </a-descriptions-item>
      <a-descriptions-item label="最后修改人">
        {{ displayValue(record, 'UPDATE_BY') }}
      </a-descriptions-item>
      <a-descriptions-item label="最后修改时间">
        {{ displayValue(record, 'UPDATE_TIME') }}
      </a-descriptions-item>
      <a-descriptions-item label="数据表">
        {{ tableDisplayName }}
      </a-descriptions-item>
      <a-descriptions-item label="记录 ID">
        {{ recordIdText }}
      </a-descriptions-item>
      <a-descriptions-item label="是否可用">
        {{ displayActive(record) }}
      </a-descriptions-item>
    </a-descriptions>

    <a-divider />

    <a-empty
      v-if="!hasLog"
      description="暂无操作日志"
      class="record-log-panel__empty"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    record?: any
    tableDisplayName?: string
  }>(),
  { record: null, tableDisplayName: '' }
)

/** 从记录中读取系统字段（兼容大小写 / 驼峰） */
function pick(rec: any, keys: string[]) {
  if (!rec) return ''
  for (const k of keys) {
    if (rec[k] !== undefined && rec[k] !== null && rec[k] !== '') return rec[k]
  }
  return ''
}

function displayValue(rec: any, field: 'CREATE_BY' | 'CREATE_TIME' | 'UPDATE_BY' | 'UPDATE_TIME') {
  const map: Record<string, string[]> = {
    CREATE_BY: ['CREATE_BY', 'createBy', 'CREATEBY', 'create_by'],
    CREATE_TIME: ['CREATE_TIME', 'createTime', 'CREATETIME', 'create_time'],
    UPDATE_BY: ['UPDATE_BY', 'updateBy', 'UPDATEBY', 'update_by'],
    UPDATE_TIME: ['UPDATE_TIME', 'updateTime', 'UPDATETIME', 'update_time']
  }
  return pick(props.record, map[field])
}

/** 是否可用显示 */
function displayActive(rec: any) {
  const v = pick(rec, ['IS_ACTIVE', 'isActive'])
  if (v === '' || v === undefined || v === null) return '-'
  return String(v).toUpperCase() === 'Y' ? '可用' : '不可用'
}

const recordIdText = computed(() => {
  const r = props.record
  if (!r) return ''
  return String(pick(r, ['ID', 'id']) ?? '')
})

const hasLog = computed(() => {
  const r = props.record
  if (!r) return false
  return (
    !!pick(r, ['CREATE_BY', 'createBy', 'CREATEBY', 'create_by']) ||
    !!pick(r, ['CREATE_TIME', 'createTime', 'CREATETIME', 'create_time']) ||
    !!pick(r, ['UPDATE_BY', 'updateBy', 'UPDATEBY', 'update_by']) ||
    !!pick(r, ['UPDATE_TIME', 'updateTime', 'UPDATETIME', 'update_time']) ||
    !!pick(r, ['IS_ACTIVE', 'isActive'])
  )
})
</script>

<style scoped>
.record-log-panel {
  padding: 4px 2px;
}
.record-log-panel__desc {
  max-width: 860px;
}
.record-log-panel__empty {
  margin-top: 12px;
}
</style>