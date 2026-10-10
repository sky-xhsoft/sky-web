<!-- 数字输入框字段渲染器 -->
<template>
  <!-- 查看模式下直接显示文本 -->
  <span v-if="isDisabled || isReadonly" class="number-field-view">
    {{ formattedValue }}
  </span>
  <!-- 编辑模式下显示输入框 -->
  <a-input-number
    v-else
    :model-value="numberValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :precision="precision"
    :min="min"
    :max="max"
    :step="step"
    style="width: 100%"
    @update:model-value="handleChange"
    @blur="handleBlur"
  >
    <template v-if="unit" #suffix>{{ unit.unit }}</template>
  </a-input-number>
</template>

<style scoped>
.number-field-view {
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
import { useFieldRendererBase } from '../../composables'
import { getColumnUnit, formatUnitValue } from '../../types'
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

const { placeholder, isReadonly, isDisabled, formatValue, fieldProps } = useFieldRendererBase(props)

// 字段单位（如库中存字节、界面按 GB 输入）
const unit = computed(() => getColumnUnit(props.column))

// 转换为数字类型（有单位时换算为单位值）
const numberValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') {
    return undefined
  }
  const num = Number(props.modelValue)
  if (isNaN(num)) return undefined
  return unit.value ? num / unit.value.scale : num
})

// 小数位数
const precision = computed(() => {
  // 优先从 PROPS 读取
  if (fieldProps.value.precision !== undefined) {
    return fieldProps.value.precision
  }
  // 从 column 配置读取
  const colPrecision = props.column.COL_PRECISION || (props.column as any).COL_PRECISION
  if (colPrecision !== undefined) {
    return colPrecision
  }
  return undefined
})

// 最小值
const min = computed(() => {
  if (fieldProps.value.min !== undefined) {
    return fieldProps.value.min
  }
  return undefined
})

// 最大值
const max = computed(() => {
  if (fieldProps.value.max !== undefined) {
    return fieldProps.value.max
  }
  return undefined
})

// 步长
const step = computed(() => {
  if (fieldProps.value.step !== undefined) {
    return fieldProps.value.step
  }
  const prec = precision.value
  if (prec !== undefined && prec > 0) {
    return 1 / Math.pow(10, prec)
  }
  return 1
})

// 格式化值用于显示
const formattedValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') {
    return '-'
  }
  if (unit.value) return formatUnitValue(props.modelValue, unit.value)
  return formatValue(props.modelValue)
})

// 值变化处理（有单位时换算回库值）
function handleChange(value: number | undefined) {
  if (value === undefined || value === null) {
    emit('update:modelValue', null)
    return
  }
  emit('update:modelValue', unit.value ? Math.round(value * unit.value.scale) : value)
}

// 失焦处理
function handleBlur() {
  emit('blur')
}
</script>
