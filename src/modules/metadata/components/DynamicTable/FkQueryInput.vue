<template>
  <div class="fk-query-input">
    <div class="fk-query-tags" @click="openDialog">
      <template v-if="selectedLabels.length > 0">
        <a-tag
          v-for="(label, index) in selectedLabels.slice(0, 3)"
          :key="index"
          closable
          size="small"
          @close.stop="removeTag(index)"
        >
          {{ label }}
        </a-tag>
        <span v-if="selectedLabels.length > 3" class="fk-query-tags-more">
          +{{ selectedLabels.length - 3 }}
        </span>
      </template>
      <span v-else class="fk-query-placeholder">
        <icon-search style="margin-right: 4px" />
        请选择{{ column.DISPLAY_NAME || '关联数据' }}
      </span>
    </div>

    <ForeignKeyLookupDialog
      :visible="dialogVisible"
      :table-id="refTableId"
      :column-id="columnId"
      :title="`选择 - ${column.DISPLAY_NAME || '关联数据'}`"
      selection-mode="multiple"
      :init-ids="selectedIds"
      :init-labels="selectedLabels"
      @update:visible="dialogVisible = $event"
      @select="handleDialogSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { IconSearch } from '@arco-design/web-vue/es/icon'
import ForeignKeyLookupDialog from '../ForeignKeyLookupDialog.vue'
import type { SysColumn } from '../../types'

interface Props {
  column: SysColumn
  modelValue?: string | number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const dialogVisible = ref(false)
const selectedLabels = ref<string[]>([])
const selectedIds = ref<(string | number)[]>([])

const refTableId = computed(() => {
  return (props.column as any).REF_TABLE_ID || (props.column as any).refTableId || 0
})

const columnId = computed(() => {
  return (props.column as any).REF_COLUMN_ID || (props.column as any).refColumnId
})

function openDialog() {
  dialogVisible.value = true
}

function removeTag(index: number) {
  selectedLabels.value.splice(index, 1)
  selectedIds.value.splice(index, 1)
  syncValue()
}

function handleDialogSelect(result: { values: any[]; labels: string[]; records: any[] }) {
  selectedLabels.value = result.labels
  selectedIds.value = result.values
  syncValue()
}

function syncValue() {
  const ids = selectedIds.value.length > 0 ? selectedIds.value.join(',') : ''
  emit('update:modelValue', ids)
}

watch(() => props.modelValue, (val) => {
  if (!val) {
    selectedLabels.value = []
    selectedIds.value = []
  }
}, { immediate: true })
</script>

<style scoped>
.fk-query-input {
  width: 100%;
}

.fk-query-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 32px;
  padding: 2px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
  transition: border-color 0.2s;
}

.fk-query-tags:hover {
  border-color: #3370ff;
}

.fk-query-placeholder {
  display: flex;
  align-items: center;
  color: #86909c;
  font-size: 14px;
}

.fk-query-tags-more {
  font-size: 12px;
  color: #86909c;
  line-height: 24px;
}
</style>
