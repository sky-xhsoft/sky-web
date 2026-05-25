<!-- 下拉多选字段渲染器 -->
<template>
  <!-- 查看模式或只读模式：显示标签列表 -->
  <span v-if="isDisabled || isReadonly" class="dropdown-multiselect-view">
    <template v-if="displayValues.length > 0">
      <a-tag
        v-for="(label, index) in displayValues"
        :key="index"
        :color="getTagColor(index)"
        size="small"
        class="tag-item"
      >
        {{ label }}
      </a-tag>
    </template>
    <span v-else>-</span>
  </span>

  <!-- 编辑模式：显示多选下拉框 -->
  <a-select
    v-else
    :model-value="arrayValue"
    :placeholder="placeholder"
    :loading="loading"
    :allow-clear="allowClear"
    :allow-search="allowSearch"
    :multiple="true"
    :max-tag-count="maxTagCount"
    :show-search="allowSearch"
    :filter-option="filterOption"
    :options="options"
    @update:model-value="handleChange"
    @blur="handleBlur"
  />
</template>

<style scoped>
.dropdown-multiselect-view {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px 0;
  min-height: 32px;
  align-items: center;
}

.tag-item {
  line-height: 20px;
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

// 标签颜色配置
const tagColors = [
  'arcoblue',
  'green',
  'purple',
  'red',
  'orange',
  'cyan',
  'lime',
  'pink'
] as const

// 是否支持搜索
const allowSearch = computed(() => {
  return fieldProps.value.allowSearch !== false
})

// 最大标签显示数量
const maxTagCount = computed(() => {
  return fieldProps.value.maxTagCount ?? 5
})

// 过滤选项函数
const filterOption = computed(() => {
  return (inputValue: string, option: any) => {
    if (!inputValue) return true
    const input = inputValue.toLowerCase()
    return (option.label?.toLowerCase() || '').includes(input)
  }
})

// 选项列表
const options = computed(() => {
  if (hasDictConfig.value && dictOptions.value.length > 0) {
    return dictOptions.value
  }

  if (fieldProps.value.options && Array.isArray(fieldProps.value.options)) {
    return fieldProps.value.options
  }

  return []
})

// 转换为数组值
const arrayValue = computed((): Array<string | number> => {
  if (!props.modelValue) {
    return []
  }

  if (Array.isArray(props.modelValue)) {
    return props.modelValue.filter(v => v !== null && v !== undefined && v !== '')
  }

  if (typeof props.modelValue === 'string') {
    try {
      const parsed = JSON.parse(props.modelValue)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      // 如果是逗号分隔的字符串
      return props.modelValue.split(',').map(s => s.trim()).filter(Boolean)
    }
  }

  return [props.modelValue]
})

// 显示的标签文本
const displayValues = computed((): string[] => {
  if (!arrayValue.value || arrayValue.value.length === 0) {
    return []
  }

  return arrayValue.value.map(v => {
    const option = options.value.find(opt => opt.value === v)
    return option?.label || String(v)
  })
})

// 获取标签颜色
function getTagColor(index: number) {
  return tagColors[index % tagColors.length]
}

// 值变化处理
function handleChange(value: Array<string | number>) {
  if (!value || value.length === 0) {
    emit('update:modelValue', null)
    return
  }
  emit('update:modelValue', value)
}

// 失焦处理
function handleBlur() {
  emit('blur')
}
</script>
