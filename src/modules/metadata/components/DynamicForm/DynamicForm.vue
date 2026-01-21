<!-- 动态表单组件 -->
<template>
  <a-spin :loading="loading" class="dynamic-form">
    <a-form
      ref="formRef"
      :model="formData"
      :label-col-props="labelColProps"
      :wrapper-col-props="wrapperColProps"
      :layout="layout"
      :auto-label-width="autoLabelWidth"
      class="dynamic-form__form"
      @submit="handleSubmit"
    >
      <!-- 基础字段组 -->
      <template v-if="basicFields.length > 0">
        <div class="dynamic-form__group">
          <div v-if="showGroupTitle" class="dynamic-form__group-header">
            <icon-folder />
            <span>基本信息</span>
          </div>
          <div class="dynamic-form__group-body">
            <a-row :gutter="rowGutter">
              <a-col
                v-for="column in basicFields"
                :key="column.ID"
                :span="getFieldColSpan(column)"
              >
                <DynamicFormItem
                  v-show="shouldShowField(column)"
                  :column="column"
                  :mode="mode"
                  :model-value="formData[column.DB_NAME]"
                  :error="errors[column.DB_NAME]"
                  @update:model-value="handleFieldChange(column.DB_NAME, $event)"
                  @blur="handleFieldBlur(column)"
                />
              </a-col>
            </a-row>
          </div>
        </div>
      </template>

      <!-- 折叠字段组 -->
      <template v-if="collapsibleGroups.length > 0">
        <a-collapse
          :default-active-key="defaultActiveGroups"
          class="dynamic-form__collapse"
        >
          <a-collapse-item
            v-for="(group, index) in collapsibleGroups"
            :key="index"
            :header="group.title"
          >
            <a-row :gutter="rowGutter">
              <a-col
                v-for="column in group.fields"
                :key="column.ID"
                :span="getFieldColSpan(column)"
              >
                <DynamicFormItem
                  v-show="shouldShowField(column)"
                  :column="column"
                  :mode="mode"
                  :model-value="formData[column.DB_NAME]"
                  :error="errors[column.DB_NAME]"
                  @update:model-value="handleFieldChange(column.DB_NAME, $event)"
                  @blur="handleFieldBlur(column)"
                />
              </a-col>
            </a-row>
          </a-collapse-item>
        </a-collapse>
      </template>

      <!-- 系统字段组 -->
      <template v-if="systemFields.length > 0 && showSystemFields">
        <div class="dynamic-form__group dynamic-form__group--system">
          <div class="dynamic-form__group-header">
            <icon-info-circle />
            <span>系统信息</span>
          </div>
          <div class="dynamic-form__group-body">
            <a-row :gutter="rowGutter">
              <a-col
                v-for="column in systemFields"
                :key="column.ID"
                :span="getFieldColSpan(column)"
              >
                <DynamicFormItem
                  :column="column"
                  :mode="'view'"
                  :model-value="formData[column.DB_NAME]"
                />
              </a-col>
            </a-row>
          </div>
        </div>
      </template>

      <!-- 隐藏的提交按钮（用于支持 Enter 键提交）-->
      <button v-show="false" type="submit" />
    </a-form>
  </a-spin>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconFolder, IconInfoCircle } from '@arco-design/web-vue/es/icon'
import DynamicFormItem from './DynamicFormItem.vue'
import { useDynamicForm } from '../../composables'
import type { FormMode, SysColumn } from '../../types'

// ==================== Props ====================

interface Props {
  tableId: number                // 表单ID
  recordId?: number              // 记录ID（编辑/查看模式）
  mode?: FormMode                // 表单模式
  labelColSpan?: number          // 标签列宽度
  wrapperColSpan?: number        // 输入列宽度
  layout?: 'horizontal' | 'vertical' | 'inline'  // 布局方式
  rowGutter?: number             // 行间距
  showGroupTitle?: boolean       // 显示分组标题
  showSystemFields?: boolean     // 显示系统字段
  autoLabelWidth?: boolean       // 自动标签宽度
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'view',
  labelColSpan: 6,
  wrapperColSpan: 18,
  layout: 'horizontal',
  rowGutter: 16,
  showGroupTitle: true,
  showSystemFields: true,
  autoLabelWidth: false
})

// ==================== Emits ====================

const emit = defineEmits<{
  submit: [data: Record<string, any>]
  change: [field: string, value: any]
  loaded: [config: any]
}>()

// ==================== 使用 Composable ====================

const {
  loading,
  submitting,
  tableConfig,
  formData,
  errors,
  formColumns,
  loadTableConfig,
  loadRecordData,
  validateField,
  validateForm,
  setFieldValue,
  getChangedFields,
  submitForm,
  shouldShowField,
  isFieldReadonly,
  clearFieldError
} = useDynamicForm(props.tableId, props.mode)

// ==================== 引用 ====================

const formRef = ref()

// ==================== 计算属性 ====================

/**
 * 标签列配置
 */
const labelColProps = computed(() => ({
  span: props.labelColSpan
}))

/**
 * 输入列配置
 */
const wrapperColProps = computed(() => ({
  span: props.wrapperColSpan
}))

/**
 * 系统字段列表
 */
const systemFieldNames = [
  'CREATE_BY', 'CREATE_TIME', 'UPDATE_BY', 'UPDATE_TIME',
  'IS_ACTIVE', 'REMARK', 'LOG'
]

const systemFields = computed(() => {
  return formColumns.value.filter(c =>
    systemFieldNames.includes(c.DB_NAME)
  )
})

/**
 * 基础字段（非系统字段，非折叠字段）
 */
const basicFields = computed(() => {
  return formColumns.value.filter(c =>
    !systemFieldNames.includes(c.DB_NAME) &&
    !isCollapsibleField(c)
  )
})

/**
 * 折叠字段组
 */
const collapsibleGroups = computed(() => {
  if (!tableConfig.value?.props?.groups) {
    return []
  }

  const groups = tableConfig.value.props.groups
  return groups.map((group: any) => ({
    title: group.title,
    fields: formColumns.value.filter(c =>
      group.fields?.includes(c.DB_NAME)
    )
  })).filter((g: any) => g.fields.length > 0)
})

/**
 * 默认展开的折叠组
 */
const defaultActiveGroups = computed(() => {
  return collapsibleGroups.value.map((_, index) => index)
})

// ==================== 方法 ====================

/**
 * 判断是否为折叠字段
 */
function isCollapsibleField(column: SysColumn): boolean {
  if (!tableConfig.value?.props?.groups) {
    return false
  }

  const groups = tableConfig.value.props.groups
  return groups.some((group: any) =>
    group.fields?.includes(column.DB_NAME)
  )
}

/**
 * 获取字段列跨度
 */
function getFieldColSpan(column: SysColumn): number {
  // 优先使用字段配置的跨度
  if (column.FORM_COLSPAN) {
    return column.FORM_COLSPAN
  }

  // 根据表的 SYS_OBJUICONF_ID 配置计算默认列数
  // 1: 1列(24), 2: 2列(12), 3: 3列(8), 4: 4列(6)
  const objUiConfId = tableConfig.value?.table?.SYS_OBJUICONF_ID ||
                      (tableConfig.value?.table as any)?.sysObjuiconfId ||
                      2 // 默认2列

  let defaultSpan = 12 // 默认2列
  switch (objUiConfId) {
    case 1:
      defaultSpan = 24 // 1列
      break
    case 2:
      defaultSpan = 12 // 2列
      break
    case 3:
      defaultSpan = 8  // 3列
      break
    case 4:
      defaultSpan = 6  // 4列
      break
  }

  // 根据控件类型调整（某些控件强制占满一行）
  switch (column.CONTROL_TYPE) {
    case 'textarea':
      return 24  // 文本域占满一行
    case 'checkbox':
    case 'radio':
      return Math.min(defaultSpan, 8) // 复选框/单选框最多占1/3行
    default:
      return defaultSpan
  }
}

/**
 * 字段值变化处理
 */
function handleFieldChange(fieldName: string, value: any) {
  setFieldValue(fieldName, value)
  emit('change', fieldName, value)
}

/**
 * 字段失焦处理
 */
function handleFieldBlur(column: SysColumn) {
  // 失焦时验证字段
  const value = formData.value[column.DB_NAME]
  const error = validateField(column, value)

  if (error) {
    errors.value[column.DB_NAME] = error
  } else {
    clearFieldError(column.DB_NAME)
  }
}

/**
 * 表单提交处理
 */
async function handleSubmit(e: Event) {
  e.preventDefault()

  try {
    const result = await submitForm()
    emit('submit', result)
  } catch (error: any) {
    // 错误已在 composable 中处理
    console.error('Form submit error:', error)
  }
}

/**
 * 手动触发验证
 */
async function validate(): Promise<boolean> {
  return validateForm()
}

/**
 * 获取表单数据
 */
function getFormData() {
  return { ...formData.value }
}

/**
 * 设置表单数据
 */
function setFormData(data: Record<string, any>) {
  Object.assign(formData.value, data)
}

/**
 * 重置表单
 */
function reset() {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// ==================== 生命周期 ====================

onMounted(async () => {
  // 加载表单配置
  await loadTableConfig()

  // 如果有 recordId，加载数据
  if (props.recordId) {
    await loadRecordData(props.recordId)
  }

  // 触发 loaded 事件
  if (tableConfig.value) {
    emit('loaded', tableConfig.value)
  }
})

// 监听 recordId 变化
watch(
  () => props.recordId,
  async (newId) => {
    if (newId) {
      await loadRecordData(newId)
    }
  }
)

// ==================== 暴露方法 ====================

defineExpose({
  validate,
  getFormData,
  getChangedFields,  // 获取变更的字段
  setFormData,
  reset,
  loadData: loadRecordData,  // 暴露加载数据方法
  formRef
})
</script>

<style scoped>
.dynamic-form {
  width: 100%;
  display: block;
}

.dynamic-form__form {
  width: 100%;
  display: block;
}

.dynamic-form__group {
  width: 100% !important;
  display: block;
  margin-bottom: 24px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
}

.dynamic-form__group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text-1);
}

.dynamic-form__group-header .arco-icon {
  font-size: 16px;
  color: var(--color-text-3);
}

.dynamic-form__group-body {
  width: 100% !important;
  display: block;
  padding: 16px;
}

.dynamic-form__group-body :deep(.arco-row) {
  width: 100% !important;
  display: flex;
  flex-wrap: wrap;
}

.dynamic-form__group-body :deep(.arco-col) {
  box-sizing: border-box;
}

.dynamic-form__group--system {
  background: #fafafa;
  border-color: #d9d9d9;
}

.dynamic-form__group--system .dynamic-form__group-header {
  background: #f0f0f0;
}

.dynamic-form__collapse {
  width: 100%;
  margin-bottom: 24px;
}

.dynamic-form__collapse :deep(.arco-collapse-item) {
  width: 100%;
}

.dynamic-form__collapse :deep(.arco-collapse-item-header) {
  padding: 12px 16px;
  background: #fafafa;
  font-weight: 600;
}

.dynamic-form__collapse :deep(.arco-collapse-item-content) {
  padding: 16px;
}

.dynamic-form__collapse :deep(.arco-row) {
  width: 100%;
}

/* 表单项间距 */
.dynamic-form__form :deep(.arco-form-item) {
  margin-bottom: 16px;
}

/* 最后一个表单项去掉底部边距 */
.dynamic-form__form :deep(.arco-row:last-child .arco-form-item) {
  margin-bottom: 0;
}

/* 表单标签样式 */
.dynamic-form__form :deep(.arco-form-item-label) {
  font-weight: 500;
  color: var(--color-text-2);
}

/* 必填标记样式 */
.dynamic-form__form :deep(.arco-form-item-label-required-symbol) {
  color: #f5222d;
  margin-right: 4px;
}

/* 错误提示样式 */
.dynamic-form__form :deep(.arco-form-item-message) {
  font-size: 12px;
  line-height: 1.5;
  color: #f5222d;
}

/* 只读字段样式 */
.dynamic-form__form :deep(.arco-input[readonly]),
.dynamic-form__form :deep(.arco-textarea[readonly]) {
  background: #f5f5f5;
  color: var(--color-text-2);
  cursor: not-allowed;
}

/* 禁用字段样式 */
.dynamic-form__form :deep(.arco-input[disabled]),
.dynamic-form__form :deep(.arco-textarea[disabled]),
.dynamic-form__form :deep(.arco-select[disabled]),
.dynamic-form__form :deep(.arco-input-number[disabled]) {
  background: #f5f5f5;
  color: var(--color-text-3);
  cursor: not-allowed;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .dynamic-form__group-body {
    padding: 12px;
  }

  .dynamic-form__form :deep(.arco-col) {
    /* 移动端所有字段占满一行 */
    flex: 0 0 100%;
    max-width: 100%;
  }

  .dynamic-form__form :deep(.arco-form-item) {
    margin-bottom: 12px;
  }
}
</style>
