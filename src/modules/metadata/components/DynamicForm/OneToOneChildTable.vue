<!-- 1:1 子表组件 -->
<template>
  <div class="one-to-one-child-table">
    <a-row :gutter="rowGutter">
      <template v-for="column in visibleFields" :key="column.ID || column.id">
        <a-col
          :span="getFieldColSpan(column)"
          class="one-to-one-child-table__field"
        >
          <DynamicFormItem
            :column="column"
            :model-value="getFieldValue(column)"
            :mode="mode"
            :record="record"
            @update:model-value="(value) => handleFieldChange(column, value)"
          />
        </a-col>
      </template>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DynamicFormItem from './DynamicFormItem.vue'
import type { SysColumn, FormMode } from '../../types'

// ==================== Props ====================
interface Props {
  childTable: any
  record: Record<string, any> | undefined
  mode?: FormMode
  rowGutter?: number
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'view',
  rowGutter: 16
})

// ==================== Emits ====================
const emit = defineEmits<{
  'update:record': [record: Record<string, any>]
}>()

// ==================== 计算属性 ====================
/**
 * 获取可见字段
 */
const visibleFields = computed(() => {
  const columns = props.childTable.columns || []
  return columns
    .filter((col: any) => {
      // 兼容 IS_VISIBLE 和 isVisible
      const isVisible = col.IS_VISIBLE || col.isVisible
      if (isVisible !== undefined && isVisible !== 'Y' && isVisible !== true) {
        return false
      }

      // 兼容 IS_ACTIVE 和 isActive
      const isActive = col.IS_ACTIVE || col.isActive
      if (isActive !== undefined && isActive !== 'Y' && isActive !== true) {
        return false
      }

      // 过滤系统字段
      const orderno = col.ORDERNO || col.orderno || 0
      if (orderno > 1000) {
        return false
      }

      // 过滤掉不需要的主键和系统字段
      const dbName = (col.DB_NAME || col.dbName || '').toUpperCase()
      const displayName = (col.DISPLAY_NAME || col.displayName || '').toUpperCase()
      const excludeFields = ['ID', 'SYS_COMPANY_ID', 'CREATE_BY', 'CREATE_TIME', 'UPDATE_BY', 'UPDATE_TIME', 'IS_ACTIVE', 'CREATED_AT', 'UPDATED_AT', 'DELETED_AT']

      // 优先过滤显示名称为"日志"的字段
      if (displayName === '日志' || displayName === 'LOG') {
        return false
      }

      // 不排除包含+号的虚拟字段
      if (!dbName.includes('+')) {
        // 完全匹配的系统字段
        if (excludeFields.includes(dbName)) {
          return false
        }
        // 包含日志关键字的系统字段（字段名或显示名称包含日志）
        if (dbName.includes('LOG') || dbName.includes('日志') || displayName.includes('LOG') || displayName.includes('日志')) {
          return false
        }
      }

      // 过滤掉隐藏字段（兼容大小写）
      const dispName = col.DISPLAY_NAME || col.displayName || ''
      const isHidden = dispName === '' || dispName === null
      if (isHidden) {
        return false
      }

      return true
    })
    .sort((a: any, b: any) => (a.ORDERNO || a.orderno || 0) - (b.ORDERNO || b.orderno || 0))
})

// ==================== 方法 ====================
/**
 * 获取字段跨列数
 */
function getFieldColSpan(column: any): number {
  const displayCols = column.DISPLAY_COLS || column.displayCols || 1
  // 1列占24/2=12 span，2列占24 span，以此类推
  return displayCols * 12
}

/**
 * 获取字段值
 */
function getFieldValue(column: any): any {
  if (!props.record) {
    return undefined
  }

  const fieldName = column.DB_NAME || column.dbName
  // 兼容字段名大小写
  if (props.record[fieldName] !== undefined) {
    return props.record[fieldName]
  }
  if (props.record[fieldName.toLowerCase()] !== undefined) {
    return props.record[fieldName.toLowerCase()]
  }
  // 兼容包含+号的虚拟字段（可能被URL编码为%2B）
  if (fieldName.includes('+')) {
    const encodedFieldName = fieldName.replace(/\+/g, '%2B')
    if (props.record[encodedFieldName] !== undefined) {
      return props.record[encodedFieldName]
    }
    if (props.record[encodedFieldName.toLowerCase()] !== undefined) {
      return props.record[encodedFieldName.toLowerCase()]
    }
  }
  return undefined
}

/**
 * 处理字段值变化
 */
function handleFieldChange(column: any, value: any) {
  let currentRecord = props.record || {}
  const fieldName = column.DB_NAME || column.dbName
  // 只使用数据库字段名（大写）
  currentRecord[fieldName] = value

  emit('update:record', currentRecord)
}
</script>

<style scoped>
.one-to-one-child-table {
  width: 100%;
}

.one-to-one-child-table__field {
  margin-bottom: 16px;
}
</style>