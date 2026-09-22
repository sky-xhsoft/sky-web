<!-- 下拉选择框字段渲染器 -->
<template>
  <!-- 查看模式或只读模式：显示文本 -->
  <span v-if="isDisabled || isReadonly" class="select-field-view">
    {{ displayText }}
  </span>

  <!-- 编辑模式：显示下拉框 -->
  <a-select
    v-else
    :model-value="modelValue"
    :placeholder="placeholder"
    :loading="loading"
    :allow-clear="allowClear"
    :allow-search="allowSearch"
    :filter-option="filterOption"
    :show-search="allowSearch"
    :options="options"
    @update:model-value="handleChange"
    @blur="handleBlur"
  />
</template>

<style scoped>
.select-field-view {
  display: inline-block;
  padding: 4px 0;
  color: var(--text-primary);
  line-height: 24px;
  min-height: 32px;
  display: flex;
  align-items: center;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useFieldRendererBase, useDictOptions } from '../../composables'
import type { SysColumn, FieldValue, FormMode } from '../../types'

interface Props {
  column: SysColumn
  modelValue?: FieldValue
  mode?: FormMode
  disabled?: boolean
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false
})

const emit = defineEmits<{
  'update:modelValue': [value: FieldValue]
  blur: []
}>()

const { placeholder, isReadonly, isDisabled, allowClear, fieldProps } = useFieldRendererBase(props)
const { dictOptions, loading, hasDictConfig } = useDictOptions({ column: props.column })

// 是否支持搜索
const allowSearch = computed(() => {
  return fieldProps.value.allowSearch !== false
})

// 过滤选项函数
const filterOption = computed(() => {
  return (inputValue: string, option: any) => {
    if (!inputValue) return true
    const input = inputValue.toLowerCase()
    return (option.label?.toLowerCase() || '').includes(input)
  }
})

// 选项列表 - 先使用 dictOptions，没有时看是否有自定义 options
const options = computed(() => {
  // 如果有字典配置，优先使用字典选项
  if (hasDictConfig.value && dictOptions.value.length > 0) {
    return dictOptions.value
  }

  // 从 PROPS 中获取自定义 options
  if (fieldProps.value.options && Array.isArray(fieldProps.value.options)) {
    return fieldProps.value.options
  }

  return []
})

// 显示文本（用于查看模式）
const displayText = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') {
    return '-'
  }

  const option = options.value.find(opt => opt.value === props.modelValue)
  if (option) {
    return option.label
  }

  return String(props.modelValue)
})

// 值变化处理
function handleChange(value: string | number | undefined) {
  emit('update:modelValue', value ?? null)
}

// 失焦处理
function handleBlur() {
  emit('blur')
}
</script>
