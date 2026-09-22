<!-- 滑块字段渲染器 -->
<template>
  <span v-if="isDisabled || isReadonly" class="slider-field-view">
    <span class="slider-value">{{ modelValue ?? defaultValue }}</span>
    <span class="slider-unit" v-if="unit">{{ unit }}</span>
  </span>
  <div v-else class="slider-field-edit">
    <a-slider
      :model-value="numberValue"
      :disabled="disabled || readonly"
      :min="min"
      :max="max"
      :step="step"
      :show-input="showInput"
      @update:model-value="handleChange"
    />
    <span class="slider-unit" v-if="unit">{{ unit }}</span>
  </div>
</template>

<style scoped>
.slider-field-view {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
  min-height: 32px;
}

.slider-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.slider-unit {
  font-size: 14px;
  color: var(--text-secondary);
}

.slider-field-edit {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.slider-field-edit .arco-slider {
  flex: 1;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useFieldRendererBase } from '../../composables'
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
}>()

const { isReadonly, isDisabled } = useFieldRendererBase(props)

const config = computed(() => {
  try {
    const configStr = props.column.CONTROL_CONFIG || (props.column as any).controlConfig || '{}'
    return JSON.parse(configStr)
  } catch {
    return {}
  }
})

const min = computed(() => {
  return config.value.min ?? 0
})

const max = computed(() => {
  return config.value.max ?? 100
})

const step = computed(() => {
  return config.value.step ?? 1
})

const defaultValue = computed(() => {
  return config.value.default ?? min.value
})

const unit = computed(() => {
  return config.value.unit || ''
})

const showInput = computed(() => {
  return config.value.showInput !== false
})

const numberValue = computed(() => {
  const val = props.modelValue
  if (val == null) return defaultValue.value
  const num = Number(val)
  if (isNaN(num)) return defaultValue.value
  return Math.min(max.value, Math.max(min.value, num))
})

function handleChange(value: number) {
  emit('update:modelValue', value)
}
</script>
