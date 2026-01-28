<!-- 开关字段 -->
<template>
  <div class="switch-field">
    <!-- 查看模式 -->
    <div v-if="mode === 'view'" class="switch-field__view">
      <a-tag :color="displayValue.color">
        {{ displayValue.text }}
      </a-tag>
    </div>

    <!-- 编辑模式 -->
    <a-switch
      v-else
      :model-value="booleanValue"
      :disabled="disabled || readonly"
      :checked-value="config.checkedValue !== undefined ? config.checkedValue : true"
      :unchecked-value="config.uncheckedValue !== undefined ? config.uncheckedValue : false"
      :checked-text="config.checkedText"
      :unchecked-text="config.uncheckedText"
      :size="config.size || 'medium'"
      :type="config.type || 'circle'"
      @change="handleChange"
    >
      <template v-if="config.checkedIcon" #checked-icon>
        <component :is="config.checkedIcon" />
      </template>
      <template v-if="config.uncheckedIcon" #unchecked-icon>
        <component :is="config.uncheckedIcon" />
      </template>
    </a-switch>
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

// 转换为布尔值
const booleanValue = computed(() => {
  const checkedValue = config.value.checkedValue !== undefined ? config.value.checkedValue : true
  return props.modelValue === checkedValue
})

// 显示值
const displayValue = computed(() => {
  const checkedValue = config.value.checkedValue !== undefined ? config.value.checkedValue : true
  const checkedText = config.value.checkedText || '是'
  const uncheckedText = config.value.uncheckedText || '否'

  if (props.modelValue === checkedValue) {
    return {
      text: checkedText,
      color: 'green'
    }
  } else {
    return {
      text: uncheckedText,
      color: 'gray'
    }
  }
})

/**
 * 值变化处理
 */
function handleChange(value: any) {
  emit('update:modelValue', value)
}
</script>

<style scoped>
.switch-field {
  display: inline-block;
}

.switch-field__view {
  display: inline-block;
}
</style>
