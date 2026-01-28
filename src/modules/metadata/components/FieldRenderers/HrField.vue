<!-- 分隔线字段 -->
<template>
  <div class="hr-field">
    <a-divider
      :orientation="orientation"
      :type="dividerType"
    >
      {{ dividerText }}
    </a-divider>
  </div>
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

// 分隔线文本
const dividerText = computed(() => {
  return config.value.text || props.column.DISPLAY_NAME || ''
})

// 文本位置
const orientation = computed(() => {
  return config.value.orientation || 'center'
})

// 分隔线类型
const dividerType = computed(() => {
  return config.value.type || 'solid'
})
</script>

<style scoped>
.hr-field {
  width: 100%;
  margin: 8px 0;
}
</style>
