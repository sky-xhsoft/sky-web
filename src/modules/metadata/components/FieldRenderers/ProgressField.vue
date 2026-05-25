<!-- 进度条字段渲染器 -->
<template>
  <div class="progress-field">
    <div v-if="isDisabled || isReadonly || mode === 'view'" class="progress-field__view">
      <a-progress
        :percent="percentValue"
        :status="status"
        :show-text="showText"
        :color="color"
        :stroke-color="strokeColor"
        :size="size"
      />
    </div>
    <div v-else class="progress-field__edit">
      <a-slider
        :model-value="percentValue"
        :disabled="disabled || readonly"
        :min="0"
        :max="100"
        :step="step"
        :show-input="showInput"
        @update:model-value="handleChange"
      />
    </div>
  </div>
</template>

<style scoped>
.progress-field {
  width: 100%;
}

.progress-field__view {
  padding: 8px 0;
}

.progress-field__edit {
  padding: 4px 0;
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
  mode: 'edit',
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

const step = computed(() => {
  return config.value.step ?? 1
})

const showInput = computed(() => {
  return config.value.showInput !== false
})

const showText = computed(() => {
  return config.value.showText !== false
})

const size = computed(() => {
  return config.value.size || 'default'
})

const color = computed(() => {
  return config.value.color || undefined
})

const strokeColor = computed(() => {
  const cfg = config.value
  if (cfg.strokeColor) return cfg.strokeColor
  const percent = percentValue.value
  if (percent >= 100) return '#00b42a'
  if (percent >= 80) return '#165dff'
  if (percent >= 50) return '#ff7d00'
  if (percent >= 30) return '#ff7d00'
  return '#f53f3f'
})

const status = computed(() => {
  const percent = percentValue.value
  if (percent >= 100) return 'success'
  if (config.value.status) return config.value.status
  return undefined
})

const percentValue = computed(() => {
  const val = props.modelValue
  if (val == null) return 0
  const num = Number(val)
  if (isNaN(num)) return 0
  return Math.min(100, Math.max(0, num))
})

function handleChange(value: number) {
  emit('update:modelValue', value)
}
</script>
