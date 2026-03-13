<!-- 单选框字段渲染器 -->
<template>
  <a-radio-group
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="handleChange"
  >
    <a-radio
      v-for="option in options"
      :key="option.value"
      :value="option.value"
    >
      {{ option.label }}
    </a-radio>
  </a-radio-group>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMetadataStore } from '../../stores'
import type { SysColumn, FieldValue } from '../../types'

interface Props {
  column: SysColumn
  modelValue?: FieldValue
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: FieldValue]
}>()

const metadataStore = useMetadataStore()

// 选项列表
const options = computed(() => {
  // 获取字典ID
  const sysDictID = props.column.SYS_DICT_ID || (props.column as any).sysDictId
  if (!sysDictID) {
    // 如果没有字典ID，返回默认的 Y/N 选项
    return [
      { value: 'Y', label: '是' },
      { value: 'N', label: '否' }
    ]
  }

  // 从 metadataStore 的 tableConfig 中获取字典项
  const tableId = props.column.TABLE_ID || (props.column as any).tableId || (props.column as any).sysTableId
  if (tableId) {
    const tableConfig = metadataStore.getTableConfig(tableId)
    const dictID = typeof sysDictID === 'string' ? parseInt(sysDictID, 10) : sysDictID
    const dictItems = tableConfig?.dictData?.[dictID]

    if (dictItems && dictItems.length > 0) {
      // 转换为选项格式
      return dictItems.map(item => ({
        value: item.VALUE || (item as any).value,
        label: item.DISPLAY_NAME || (item as any).displayName
      }))
    }
  }

  return [
    { value: 'Y', label: '是' },
    { value: 'N', label: '否' }
  ]
})

// 值变化处理
function handleChange(value: string | number | undefined) {
  emit('update:modelValue', value ?? null)
}
</script>
