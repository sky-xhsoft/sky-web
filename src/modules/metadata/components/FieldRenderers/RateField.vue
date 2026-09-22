<!-- 评分字段渲染器 -->
<template>
  <span v-if="isDisabled || isReadonly" class="rate-field-view">
    <span v-for="i in 5" :key="i" class="rate-star" :class="{ active: i <= displayValue }">
      ★
    </span>
    <span class="rate-text" v-if="showText">{{ displayValue }}/{{ 5 }}</span>
  </span>
  <a-rate
    v-else
    :model-value="numberValue"
    :disabled="disabled || readonly"
    :allow-half="allowHalf"
    :count="count"
    @update:model-value="handleChange"
  />
</template>

<style scoped>
.rate-field-view {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
  min-height: 32px;
}

.rate-star {
  font-size: 18px;
  color: var(--border);
  line-height: 1;
}

.rate-star.active {
  color: var(--warning);
}

.rate-text {
  margin-left: 8px;
  color: var(--text-secondary);
  font-size: 14px;
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

const count = computed(() => {
  return config.value.count || 5
})

const allowHalf = computed(() => {
  return config.value.allowHalf !== false
})

const showText = computed(() => {
  return config.value.showText !== false
})

const numberValue = computed(() => {
  const val = props.modelValue
  if (val == null) return 0
  const num = Number(val)
  return isNaN(num) ? 0 : num
})

const displayValue = computed(() => {
  return Math.round(numberValue.value)
})

function handleChange(value: number) {
  emit('update:modelValue', value)
}
</script>
