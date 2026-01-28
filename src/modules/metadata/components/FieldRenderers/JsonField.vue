<!-- JSON 编辑器字段 -->
<template>
  <div class="json-field">
    <!-- 查看模式 -->
    <div v-if="mode === 'view'" class="json-field__view">
      <pre class="json-field__pre">{{ formattedValue }}</pre>
    </div>

    <!-- 编辑模式 -->
    <a-textarea
      v-else
      :model-value="textValue"
      :placeholder="placeholder"
      :disabled="disabled || readonly"
      :auto-size="{ minRows: minRows, maxRows: maxRows }"
      :max-length="config.maxLength"
      :show-word-limit="!!config.maxLength"
      class="json-field__textarea"
      @update:model-value="handleChange"
      @blur="handleBlur"
    />

    <!-- 错误提示 -->
    <div v-if="parseError && mode !== 'view'" class="json-field__error">
      <icon-exclamation-circle-fill />
      <span>{{ parseError }}</span>
    </div>

    <!-- 格式化按钮 -->
    <div v-if="mode !== 'view'" class="json-field__actions">
      <a-button size="mini" @click="handleFormat">
        <template #icon>
          <icon-code />
        </template>
        格式化
      </a-button>
      <a-button size="mini" @click="handleCompress">
        <template #icon>
          <icon-minus-circle />
        </template>
        压缩
      </a-button>
      <a-button size="mini" @click="handleValidate">
        <template #icon>
          <icon-check-circle />
        </template>
        验证
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconExclamationCircleFill,
  IconCode,
  IconCheckCircle,
  IconMinusCircle
} from '@arco-design/web-vue/es/icon'
import type { SysColumn, FormMode } from '../../types'

interface Props {
  column: SysColumn
  modelValue?: any
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
  'update:modelValue': [value: any]
  'blur': []
}>()

// 解析控件配置
const config = computed(() => {
  try {
    const configStr = props.column.CONTROL_CONFIG || (props.column as any).controlConfig || '{}'
    return JSON.parse(configStr)
  } catch (error) {
    console.warn('[JsonField] 解析 CONTROL_CONFIG 失败:', error)
    return {}
  }
})

// 计算行数（优先使用 DISPLAY_ROWS）
const minRows = computed(() => {
  const displayRows = props.column.DISPLAY_ROWS || (props.column as any).displayRows
  if (displayRows && displayRows > 1) {
    return displayRows
  }
  return config.value.minRows || 5
})

const maxRows = computed(() => {
  const min = minRows.value
  const configMax = config.value.maxRows || 20
  return Math.max(min, configMax)
})

// 文本值（用于编辑）
const textValue = ref('')
const parseError = ref('')
// 标志：是否跳过 watch 的自动格式化
const skipAutoFormat = ref(false)

// 占位符
const placeholder = computed(() => {
  return config.value.placeholder || '请输入 JSON 格式的数据'
})

// 格式化后的值（用于显示）
const formattedValue = computed(() => {
  try {
    // 如果值为 null 或 undefined，显示空对象
    if (props.modelValue === null || props.modelValue === undefined) {
      return '{}'
    }

    // 如果是空字符串，显示空对象
    if (props.modelValue === '') {
      return '{}'
    }

    // 如果是字符串，尝试解析
    if (typeof props.modelValue === 'string') {
      // 去除首尾空格
      const trimmed = props.modelValue.trim()
      if (trimmed === '') {
        return '{}'
      }

      try {
        const obj = JSON.parse(trimmed)
        return JSON.stringify(obj, null, 2)
      } catch (e) {
        // 如果解析失败，显示原始字符串（可能是无效的 JSON）
        console.warn('[JsonField] JSON 解析失败:', e, '原始值:', props.modelValue)
        return trimmed
      }
    }

    // 如果是对象，直接格式化
    return JSON.stringify(props.modelValue, null, 2)
  } catch (error) {
    console.error('[JsonField] 格式化失败:', error)
    return String(props.modelValue || '{}')
  }
})

// 初始化文本值
watch(
  () => props.modelValue,
  (newValue) => {
    // 如果设置了跳过标志，则不自动格式化
    if (skipAutoFormat.value) {
      skipAutoFormat.value = false
      return
    }

    // 如果值为 null 或 undefined，设置为空对象字符串
    if (newValue === null || newValue === undefined) {
      textValue.value = '{}'
      return
    }

    // 如果是空字符串，设置为空对象字符串
    if (newValue === '') {
      textValue.value = '{}'
      return
    }

    try {
      if (typeof newValue === 'string') {
        const trimmed = newValue.trim()

        if (trimmed === '') {
          textValue.value = '{}'
          return
        }

        try {
          // 尝试解析并格式化
          const obj = JSON.parse(trimmed)
          textValue.value = JSON.stringify(obj, null, 2)
          parseError.value = ''
        } catch (e) {
          // 如果解析失败，显示原始字符串
          textValue.value = trimmed
          parseError.value = 'JSON 格式错误'
        }
      } else {
        // 如果是对象，直接格式化
        textValue.value = JSON.stringify(newValue, null, 2)
        parseError.value = ''
      }
    } catch (error) {
      textValue.value = String(newValue)
      parseError.value = '数据格式错误'
    }
  },
  { immediate: true }
)

/**
 * 值变化处理
 */
function handleChange(value: string) {
  textValue.value = value

  // 尝试解析 JSON
  try {
    if (!value.trim()) {
      emit('update:modelValue', null)
      parseError.value = ''
      return
    }

    const parsed = JSON.parse(value)
    emit('update:modelValue', parsed)
    parseError.value = ''
  } catch (error: any) {
    // 保存原始字符串，但标记错误
    parseError.value = `JSON 格式错误: ${error.message}`
    // 仍然发送值，让表单验证处理
    emit('update:modelValue', value)
  }
}

/**
 * 失焦处理
 */
function handleBlur() {
  emit('blur')
}

/**
 * 格式化 JSON
 */
function handleFormat() {
  try {
    if (!textValue.value.trim()) {
      Message.warning('请先输入 JSON 数据')
      return
    }

    const parsed = JSON.parse(textValue.value)
    const formatted = JSON.stringify(parsed, null, 2)

    // 设置跳过标志，直接更新 textValue
    skipAutoFormat.value = true
    textValue.value = formatted
    emit('update:modelValue', parsed)
    parseError.value = ''
    Message.success('格式化成功')
  } catch (error: any) {
    parseError.value = `JSON 格式错误: ${error.message}`
    Message.error('格式化失败：' + error.message)
  }
}

/**
 * 压缩 JSON
 */
function handleCompress() {
  try {
    if (!textValue.value.trim()) {
      Message.warning('请先输入 JSON 数据')
      return
    }

    const parsed = JSON.parse(textValue.value)
    const compressed = JSON.stringify(parsed)

    // 设置跳过标志，直接更新 textValue
    skipAutoFormat.value = true
    textValue.value = compressed
    emit('update:modelValue', parsed)
    parseError.value = ''
    Message.success('压缩成功')
  } catch (error: any) {
    parseError.value = `JSON 格式错误: ${error.message}`
    Message.error('压缩失败：' + error.message)
  }
}

/**
 * 验证 JSON
 */
function handleValidate() {
  try {
    if (!textValue.value.trim()) {
      Message.warning('请先输入 JSON 数据')
      return
    }

    JSON.parse(textValue.value)
    parseError.value = ''
    Message.success('JSON 格式正确')
  } catch (error: any) {
    parseError.value = `JSON 格式错误: ${error.message}`
    Message.error('JSON 格式错误：' + error.message)
  }
}
</script>

<style scoped>
.json-field {
  width: 100%;
}

.json-field__view {
  padding: 8px 12px;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  max-height: 400px;
  overflow: auto;
}

.json-field__pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #1d2129;
  white-space: pre-wrap;
  word-break: break-all;
}

.json-field__textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.json-field__error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #ffece8;
  border: 1px solid #f53f3f;
  border-radius: 4px;
  color: #f53f3f;
  font-size: 13px;
}

.json-field__actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
</style>
