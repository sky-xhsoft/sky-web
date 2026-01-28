<!-- 按钮字段 -->
<template>
  <div class="button-field">
    <a-button
      :type="buttonType"
      :size="buttonSize"
      :status="buttonStatus"
      :disabled="disabled"
      :loading="loading"
      @click="handleClick"
    >
      <template v-if="config.icon" #icon>
        <component :is="iconComponent" />
      </template>
      {{ buttonText }}
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import * as ArcoIcons from '@arco-design/web-vue/es/icon'
import type { SysColumn, FormMode } from '../../types'

interface Props {
  column: SysColumn
  modelValue?: any
  mode?: FormMode
  disabled?: boolean
  record?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'view',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'action': [actionId: number, record: Record<string, any>]
}>()

const loading = ref(false)

// 解析控件配置
const config = computed(() => {
  try {
    const configStr = props.column.CONTROL_CONFIG || (props.column as any).controlConfig || '{}'
    return JSON.parse(configStr)
  } catch {
    return {}
  }
})

// 按钮文本
const buttonText = computed(() => {
  return config.value.text || props.column.DISPLAY_NAME || '按钮'
})

// 按钮类型
const buttonType = computed(() => {
  return config.value.type || 'primary'
})

// 按钮尺寸
const buttonSize = computed(() => {
  return config.value.size || 'medium'
})

// 按钮状态
const buttonStatus = computed(() => {
  return config.value.status || undefined
})

// 图标组件
const iconComponent = computed(() => {
  if (!config.value.icon) return null
  const iconName = `Icon${config.value.icon}`
  return (ArcoIcons as any)[iconName] || null
})

// 按钮点击处理
async function handleClick() {
  if (props.disabled || loading.value) return

  // 获取关联的 action ID
  const actionId = config.value.actionId || props.column.ACTION_ID || (props.column as any).actionId

  if (!actionId) {
    Message.warning('未配置关联的操作')
    return
  }

  try {
    loading.value = true
    // 触发 action 事件，由父组件处理具体的操作逻辑
    emit('action', actionId, props.record || {})
  } catch (error: any) {
    Message.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.button-field {
  display: inline-flex;
  align-items: center;
}
</style>
