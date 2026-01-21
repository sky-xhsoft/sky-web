<template>
  <span class="foreign-key-cell">
    <a-spin v-if="loading" :size="12" />
    <span v-else>{{ displayValue || '-' }}</span>
  </span>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as api from '../../api/metadata'
import type { SysColumn } from '../../types'

const props = defineProps<{
  columnConfig: any  // TableColumnData with originalColumn
  value: number | string | null
}>()

const displayValue = ref<string>('')
const loading = ref(false)

// 获取显示值
async function fetchDisplayValue() {
  if (!props.value || !props.columnConfig.originalColumn) {
    displayValue.value = ''
    return
  }

  const column: SysColumn = props.columnConfig.originalColumn

  const setValueType = column.SET_VALUE_TYPE || (column as any).setValueType
  const refTableId = column.REF_TABLE_ID || (column as any).refTableId
  const refColumnId = column.REF_COLUMN_ID || (column as any).refColumnId

  if (setValueType !== 'fk' || !refTableId) {
    displayValue.value = String(props.value)
    return
  }

  loading.value = true
  try {
    const result = await api.getForeignKeyDisplayValue(
      refTableId,
      props.value,
      refColumnId
    )
    displayValue.value = result
  } catch (error) {
    console.error('[ForeignKeyCell] 获取显示值失败:', error)
    displayValue.value = String(props.value)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDisplayValue()
})

watch(() => props.value, () => {
  fetchDisplayValue()
})
</script>

<style scoped>
.foreign-key-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
