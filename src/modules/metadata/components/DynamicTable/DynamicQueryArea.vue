<!-- 动态表格查询区域组件 -->
<template>
  <div class="dynamic-query-area">
    <div class="query-header" @click="toggleCollapse">
      <div class="query-header-left">
        <icon-search class="query-icon" />
        <span class="query-title">查询条件</span>
      </div>
      <div class="query-header-right">
        <a-button type="text" size="small">
          {{ collapsed ? '展开' : '收起' }}
          <icon-down v-if="collapsed" />
          <icon-up v-else />
        </a-button>
      </div>
    </div>

    <transition name="slide-collapse">
      <div v-show="!collapsed" class="query-content">
        <a-form
          :model="queryForm"
          layout="inline"
          @submit="handleQuery"
          class="query-form"
        >
          <template v-if="queryColumns.length > 0">
            <a-form-item
              v-for="column in visibleQueryColumns"
              :key="column.DB_NAME || column.dbName"
              :label="column.DISPLAY_NAME || column.displayName"
              :field="column.DB_NAME || column.dbName"
            >
              <!-- 外键下拉选择 -->
              <ForeignKeyField
                v-if="isForeignKeyColumn(column)"
                :column="column"
                :model-value="queryForm[column.DB_NAME || column.dbName]"
                mode="edit"
                @update:model-value="val => queryForm[column.DB_NAME || column.dbName] = val"
              />

              <!-- 文本输入 -->
              <a-input
                v-else-if="column.CONTROL_TYPE === 'text' || column.CONTROL_TYPE === 'email' || column.CONTROL_TYPE === 'url'"
                v-model="queryForm[column.DB_NAME || column.dbName]"
                :placeholder="`请输入${column.DISPLAY_NAME || column.displayName}`"
                allow-clear
                @input="(value: string) => handleQueryInputChange(column, value)"
              />

              <!-- 数字输入 -->
              <a-input-number
                v-else-if="column.CONTROL_TYPE === 'number'"
                v-model="queryForm[column.DB_NAME || column.dbName]"
                :placeholder="`请输入${column.DISPLAY_NAME || column.displayName}`"
                style="width: 100%"
              />

              <!-- 下拉选择 -->
              <a-select
                v-else-if="column.CONTROL_TYPE === 'select'"
                v-model="queryForm[column.DB_NAME || column.dbName]"
                :placeholder="`请选择${column.DISPLAY_NAME || column.displayName}`"
                allow-clear
              >
                <a-option
                  v-for="option in getDictOptions(column)"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-option>
              </a-select>

              <!-- 日期选择 -->
              <a-date-picker
                v-else-if="column.CONTROL_TYPE === 'date'"
                v-model="queryForm[column.DB_NAME || column.dbName]"
                :placeholder="`请选择${column.DISPLAY_NAME || column.displayName}`"
                allow-clear
                style="width: 100%"
              />

              <!-- 日期时间选择 -->
              <a-date-picker
                v-else-if="column.CONTROL_TYPE === 'datetime'"
                v-model="queryForm[column.DB_NAME || column.dbName]"
                :placeholder="`请选择${column.DISPLAY_NAME || column.displayName}`"
                show-time
                allow-clear
                style="width: 100%"
              />

              <!-- 默认文本输入 -->
              <a-input
                v-else
                v-model="queryForm[column.DB_NAME || column.dbName]"
                :placeholder="`请输入${column.DISPLAY_NAME || column.displayName}`"
                allow-clear
                @input="(value: string) => handleQueryInputChange(column, value)"
              />
            </a-form-item>
          </template>

          <!-- 无查询字段提示 -->
          <div v-else class="query-empty">
            <span class="query-empty-text">暂无查询字段</span>
          </div>

          <!-- 查询按钮区域 -->
          <div v-if="queryColumns.length > 0" class="query-actions">
            <a-space>
              <a-button @click="handleReset">
                <template #icon><icon-refresh /></template>
                重置
              </a-button>
              <a-button
                type="primary"
                html-type="submit"
                :loading="loading"
              >
                <template #icon><icon-search /></template>
                查询
              </a-button>
            </a-space>
          </div>
        </a-form>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconSearch, IconDown, IconUp, IconRefresh } from '@arco-design/web-vue/es/icon'
import ForeignKeyField from './ForeignKeyField.vue'

interface Props {
  queryColumns: any[]
  loading?: boolean
  showAdvancedQuery?: boolean
}

interface Emits {
  (e: 'query', queryForm: Record<string, any>): void
  (e: 'reset'): void
  (e: 'inputChange', column: any, value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showAdvancedQuery: false
})

const emit = defineEmits<Emits>()

// 折叠状态
const collapsed = ref(false)

// 查询表单
const queryForm = ref<Record<string, any>>({})

// 可见的查询列（默认显示前3个）
const visibleQueryColumns = computed(() => {
  if (props.showAdvancedQuery) {
    return props.queryColumns
  }
  return props.queryColumns.slice(0, 3)
})

// 切换折叠
function toggleCollapse() {
  collapsed.value = !collapsed.value
}

// 处理查询
function handleQuery(e: Event) {
  e.preventDefault()
  emit('query', queryForm.value)
}

// 处理重置
function handleReset() {
  queryForm.value = {}
  emit('reset')
}

// 处理查询输入变化
function handleQueryInputChange(column: any, value: string) {
  emit('inputChange', column, value)
}

// 判断是否是外键列
function isForeignKeyColumn(column: any): boolean {
  return column.IS_FOREIGN_KEY || column.foreignKey
}

// 获取字典选项
function getDictOptions(column: any): any[] {
  return column.DICT_OPTIONS || column.dictOptions || []
}
</script>

<style scoped>
.dynamic-query-area {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 16px;
  overflow: hidden;
}

.query-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f9fafb;
  cursor: pointer;
  border-bottom: 1px solid #e5e7eb;
}

.query-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.query-icon {
  color: #165dff;
  font-size: 16px;
}

.query-title {
  font-weight: 500;
  color: #1f2937;
}

.query-content {
  padding: 16px;
}

.query-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.query-form :deep(.arco-form-item) {
  margin-bottom: 0;
  min-width: 240px;
  flex: 1;
}

.query-actions {
  margin-left: auto;
  flex-shrink: 0;
  display: flex;
  gap: 8px;
}

.query-empty {
  width: 100%;
  text-align: center;
  padding: 24px 0;
  color: #9ca3af;
}

/* 折叠动画 */
.slide-collapse-enter-active,
.slide-collapse-leave-active {
  transition: all 0.3s ease;
}

.slide-collapse-enter-from,
.slide-collapse-leave-to {
  height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  overflow: hidden;
}

/* 响应式 */
@media (max-width: 768px) {
  .query-form :deep(.arco-form-item) {
    min-width: 100%;
  }

  .query-actions {
    width: 100%;
    justify-content: center;
    margin: 8px 0 0 0;
  }
}
</style>