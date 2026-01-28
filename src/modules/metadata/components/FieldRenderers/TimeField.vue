<!-- 时间选择器字段 -->
<template>
  <div class="time-field">
    <!-- 查看模式 -->
    <div v-if="mode === 'view'" class="time-field__view">
      {{ displayValue }}
    </div>

    <!-- 编辑模式 -->
    <a-time-picker
      v-else
      :model-value="modelValue"
      :disabled="disabled || readonly"
      :placeholder="config.placeholder || '请选择时间'"
      :format="config.format || 'HH:mm:ss'"
      :use12-hours="config.use12Hours || false"
      :step="config.step"
      :disabled-hours="config.disabledHours"
      :disabled-minutes="config.disabledMinutes"
      :disabled-seconds="config.disabledSeconds"
      :allow-clear="!isRequired"
      @change="handleChange"
      @blur="handleBlur"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SysColumn, FormMode } from '../../types'

interface Props {
  column: SysColumn
  modelValue: any
  mode: FormMode
  disabled?: boolean
  readonly?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: any]
  'blur': []
}>()

// 解析控件配置
const config = computed(() => {
  try {
    return JSON.parse(props.column.CONTROL_CONFIG || '{}')
  } catch {
    return {}
  }
})

// 是否必填
const isRequired = computed(() => {
  return props.column.NULL_ABLE === 'N'
})

// 显示值
const displayValue = computed(() => {
  if (!props.modelValue) return '-'
  return props.modelValue
})

/**
 * 值变化处理
 */
function handleChange(value: string) {
  emit('update:modelValue', value)
}

/**
 * 失焦处理
 */
function handleBlur() {
  emit('blur')
}
</script>

<style scoped>
.time-field {
  display: inline-block;
  width: 100%;
}

.time-field__view {
  padding: 4px 0;
  color: #1d2129;
}
</style>
