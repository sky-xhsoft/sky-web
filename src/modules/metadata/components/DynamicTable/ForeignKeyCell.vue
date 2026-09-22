<template>
  <span class="foreign-key-cell" :class="{ 'has-ref': hasRef }">
    <a-spin v-if="loading" :size="12" />
    <template v-else>
      <!-- 有外跳参考记录时: 外跳图标 + 可点击名称 -->
      <span
        v-if="hasRef"
        class="fk-ref-link"
        :title="refTitle"
        @click="handleJump"
      >
        <span class="fk-ref-icon">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
            <path d="M12 8.5V12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3.5a.5.5 0 0 1 0 1H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V8.5a.5.5 0 0 1 1 0z M13.5 2.5V6a.5.5 0 0 1-1 0V3.7L8.85 7.35a.5.5 0 1 1-.7-.7L11.8 3H10a.5.5 0 0 1 0-1h3a.5.5 0 0 1 .5.5z"/>
          </svg>
        </span>
        <span class="fk-ref-text">{{ displayValue || '-' }}</span>
      </span>
      <!-- 无跳转参考: 仅显示值 -->
      <span v-else class="fk-static-text">
        {{ displayValue || '-' }}
      </span>
    </template>
  </span>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useForeignKey } from '../../composables/useForeignKey'
import type { SysColumn } from '../../types'

const props = defineProps<{
  columnConfig: any  // TableColumnData with originalColumn
  value: number | string | null
  jumpRef?: any       // record[dataIndex + '_ref'] 跳转参考(后端填充)
}>()

const emit = defineEmits<{
  (e: 'jump', ref: any): void
}>()

const displayValue = ref<string>('')
const loading = ref(false)

// 关联记录参考(跳转目标)。优先 record 的 _ref(后端填充), 兜底 column 的跳转配置
const hasRef = computed(() => {
  const columnRef = (props.columnConfig as any)?.refRecordPath
    || (props.columnConfig as any)?.originalColumn?.REF_RECORD_PATH
    || (props.columnConfig as any)?.jumpPath
  return !!props.jumpRef || !!columnRef
})

const refTitle = computed(() => `查看关联 ${displayValue.value || props.value || ''}`)

function handleJump() {
  if (props.jumpRef) {
    emit('jump', props.jumpRef)
    return
  }
  const path = (props.columnConfig as any)?.refRecordPath
    || (props.columnConfig as any)?.originalColumn?.REF_RECORD_PATH
    || (props.columnConfig as any)?.jumpPath
  if (props.value && path) {
    window.open(path, '_blank')
  }
}

// 获取显示值
async function fetchDisplayValue() {
  if (!props.value || !props.columnConfig.originalColumn) {
    displayValue.value = ''
    return
  }

  const column: SysColumn = props.columnConfig.originalColumn

  const setValueType = column.SET_VALUE_TYPE || (column as any).setValueType
  const refTableId = column.REF_TABLE_ID || (column as any).refTableId

  if (setValueType !== 'fk' || !refTableId) {
    displayValue.value = String(props.value)
    return
  }

  loading.value = true
  try {
    const { getDisplayValue } = useForeignKey(column)
    const result = await getDisplayValue(props.value)
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
  max-width: 100%;
}

/* 外跳链接(门户风格: 小图标 + 名称) */
.fk-ref-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: var(--brand-blue);
  text-decoration: none;
  max-width: 100%;
  transition: color 0.15s ease;
}
.fk-ref-link:hover {
  color: #0e42d2;
  text-decoration: underline;
}
.fk-ref-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  background: var(--brand-blue);
  color: #fff;
  opacity: 0.85;
}
.fk-ref-link:hover .fk-ref-icon {
  opacity: 1;
}
.fk-ref-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 静态文本 */
.fk-static-text {
  color: var(--text-primary);
}
</style>