<!-- 空白字段 -->
<template>
  <div class="blank-field" :style="blankStyle"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SysColumn, FormMode } from '../../types'

interface Props {
  column: SysColumn
  mode?: FormMode
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'view'
})

// 解析控件配置
const config = computed(() => {
  try {
    const configStr = props.column.CONTROL_CONFIG || (props.column as any).controlConfig || '{}'
    return JSON.parse(configStr)
  } catch {
    return {}
  }
})

// 空白区域样式
const blankStyle = computed(() => {
  const style: Record<string, string> = {}

  // 高度配置
  if (config.value.height) {
    style.height = `${config.value.height}px`
  } else {
    // 使用 DISPLAY_ROWS 计算高度
    const displayRows = props.column.DISPLAY_ROWS || (props.column as any).displayRows || 1
    const height = displayRows * 32 + (displayRows - 1) * 8
    style.height = `${height}px`
  }

  // 背景色
  if (config.value.backgroundColor) {
    style.backgroundColor = config.value.backgroundColor
  }

  return style
})
</script>

<style scoped>
.blank-field {
  width: 100%;
  min-height: 32px;
}
</style>
