<!-- 下拉选择框字段渲染器 -->
<template>
  <a-select
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :loading="loading"
    :options="options"
    :allow-clear="allowClear"
    :allow-search="allowSearch"
    @update:model-value="handleChange"
    @blur="handleBlur"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDictStore } from '../../stores/useDictStore'
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
  blur: []
}>()

const dictStore = useDictStore()
const loading = ref(false)

// 占位符
const placeholder = computed(() => {
  return props.column.PLACEHOLDER || `请选择${props.column.DISPLAY_NAME}`
})

// 是否显示清除按钮
const allowClear = computed(() => {
  return props.column.NULL_ABLE === 'Y'
})

// 是否支持搜索
const allowSearch = computed(() => true)

// 选项列表
const options = computed(() => {
  if (!props.column.DICT_TABLE_ID) {
    return []
  }
  return dictStore.toSelectOptions(props.column.DICT_TABLE_ID)
})

// 值变化处理
function handleChange(value: string | number | undefined) {
  emit('update:modelValue', value ?? null)
}

// 失焦处理
function handleBlur() {
  emit('blur')
}

// 加载字典数据
async function loadDictData() {
  if (!props.column.DICT_TABLE_ID) return

  loading.value = true
  try {
    await dictStore.loadDictItems(props.column.DICT_TABLE_ID)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDictData()
})
</script>
