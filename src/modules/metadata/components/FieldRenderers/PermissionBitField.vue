<!-- 权限位字段渲染器 -->
<template>
  <div class="permission-bit-field">
    <a-checkbox-group
      :model-value="selectedPermissions"
      :disabled="disabled"
      @update:model-value="handleChange"
    >
      <a-space direction="vertical" :size="8">
        <a-checkbox :value="1">读取 (Read)</a-checkbox>
        <a-checkbox :value="2">创建 (Create)</a-checkbox>
        <a-checkbox :value="4">更新 (Update)</a-checkbox>
        <a-checkbox :value="8">删除 (Delete)</a-checkbox>
        <a-checkbox :value="16">提交 (Submit)</a-checkbox>
        <a-checkbox :value="32">反提交 (Unsubmit)</a-checkbox>
        <a-checkbox :value="64">导出 (Export)</a-checkbox>
        <a-checkbox :value="128">导入 (Import)</a-checkbox>
      </a-space>
    </a-checkbox-group>
    <div v-if="!disabled" class="permission-value">
      当前权限值: {{ permissionValue }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SysColumn, FieldValue } from '../../types'

interface Props {
  column: SysColumn
  modelValue?: FieldValue
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: FieldValue]
}>()

// 权限位常量
const PERMISSION_BITS = {
  Read: 1,       // 1 << 0
  Create: 2,     // 1 << 1
  Update: 4,     // 1 << 2
  Delete: 8,     // 1 << 3
  Submit: 16,    // 1 << 4
  Unsubmit: 32,  // 1 << 5
  Export: 64,    // 1 << 6
  Import: 128    // 1 << 7
}

/**
 * 解析权限值为复选框数组
 * @param value 权限位值（整数）
 * @returns 选中的权限位数组
 */
function parsePermission(value: number): number[] {
  const result: number[] = []
  Object.values(PERMISSION_BITS).forEach(bit => {
    if ((value & bit) === bit) {
      result.push(bit)
    }
  })
  return result
}

/**
 * 计算权限值（位或运算）
 * @param selected 选中的权限位数组
 * @returns 权限位值（整数）
 */
function calculatePermission(selected: number[]): number {
  return selected.reduce((acc, bit) => acc | bit, 0)
}

// 当前选中的权限位
const selectedPermissions = computed(() => {
  const value = props.modelValue
  if (value === null || value === undefined) {
    return []
  }
  // 转换为数字
  const numValue = typeof value === 'number' ? value : parseInt(String(value), 10)
  if (isNaN(numValue)) {
    return []
  }
  return parsePermission(numValue)
})

// 当前权限值
const permissionValue = computed(() => {
  return calculatePermission(selectedPermissions.value)
})

// 值变化处理
function handleChange(selected: number[]) {
  const value = calculatePermission(selected)
  emit('update:modelValue', value)
}
</script>

<style scoped>
.permission-bit-field {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.permission-value {
  color: var(--color-text-3);
  font-size: 12px;
  padding: 8px 12px;
  background-color: var(--color-fill-2);
  border-radius: 4px;
}
</style>
