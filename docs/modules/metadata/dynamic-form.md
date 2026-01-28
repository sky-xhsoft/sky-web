# DynamicForm 组件使用文档

## 📖 组件概述

`DynamicForm` 是一个基于元数据配置的动态表单组件，能够根据 `sys_table` 和 `sys_column` 配置自动生成表单界面。

## ✨ 核心特性

- ✅ **自动表单生成**: 根据元数据配置自动生成表单
- ✅ **字段分组**: 支持基础字段、折叠字段、系统字段分组
- ✅ **智能验证**: 自动生成验证规则（必填、正则、长度）
- ✅ **级联显示**: 根据字段间依赖关系动态显示/隐藏字段
- ✅ **权限控制**: 基于 MASK 控制字段是否可编辑
- ✅ **响应式布局**: 自动适配不同屏幕尺寸
- ✅ **多种模式**: 支持创建、编辑、查看三种模式

## 📦 安装

```typescript
import { DynamicForm } from '@/modules/metadata/components/DynamicForm'
```

## 🔧 Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| tableId | number | - | **必填**，表单ID（sys_table.ID） |
| recordId | number | - | 记录ID（编辑/查看模式时需要） |
| mode | 'create' \| 'edit' \| 'view' | 'view' | 表单模式 |
| labelColSpan | number | 6 | 标签列宽度（24栅格） |
| wrapperColSpan | number | 18 | 输入列宽度（24栅格） |
| layout | 'horizontal' \| 'vertical' \| 'inline' | 'horizontal' | 布局方式 |
| rowGutter | number | 16 | 行间距（px） |
| showGroupTitle | boolean | true | 是否显示分组标题 |
| showSystemFields | boolean | true | 是否显示系统字段 |
| autoLabelWidth | boolean | false | 是否自动标签宽度 |

## 📡 Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| submit | (data: FormData) | 表单提交成功 |
| change | (field: string, value: any) | 字段值变化 |
| loaded | (config: TableConfig) | 表单配置加载完成 |

## 🎯 Expose 方法

| 方法名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| validate | - | Promise\<boolean\> | 手动触发表单验证 |
| getFormData | - | FormData | 获取表单数据 |
| setFormData | (data: FormData) | void | 设置表单数据 |
| reset | - | void | 重置表单 |

## 💡 基础用法

### 1. 创建模式（新增记录）

```vue
<template>
  <div class="page-container">
    <a-page-header title="新增记录" @back="handleBack">
      <template #extra>
        <a-space>
          <a-button @click="handleBack">取消</a-button>
          <a-button type="primary" @click="handleSave">保存</a-button>
        </a-space>
      </template>
    </a-page-header>

    <div class="page-content">
      <DynamicForm
        ref="formRef"
        :table-id="tableId"
        mode="create"
        @submit="handleSubmit"
        @loaded="handleLoaded"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { DynamicForm } from '@/modules/metadata/components/DynamicForm'

const router = useRouter()
const formRef = ref()
const tableId = ref(1) // 表单ID

// 保存按钮点击
async function handleSave() {
  // 验证表单
  const isValid = await formRef.value.validate()
  if (!isValid) {
    Message.error('请检查表单填写')
    return
  }

  // 获取表单数据
  const formData = formRef.value.getFormData()
  console.log('Form data:', formData)

  // 提交数据（DynamicForm 内部会调用 API）
  // 提交成功后会触发 submit 事件
}

// 表单提交成功
function handleSubmit(data: any) {
  Message.success('保存成功')
  router.back()
}

// 表单配置加载完成
function handleLoaded(config: any) {
  console.log('Table config loaded:', config)
}

// 返回
function handleBack() {
  router.back()
}
</script>
```

### 2. 编辑模式（修改记录）

```vue
<template>
  <div class="page-container">
    <a-page-header title="编辑记录" @back="handleBack">
      <template #extra>
        <a-space>
          <a-button @click="handleBack">取消</a-button>
          <a-button type="primary" @click="handleSave">保存</a-button>
        </a-space>
      </template>
    </a-page-header>

    <div class="page-content">
      <DynamicForm
        ref="formRef"
        :table-id="tableId"
        :record-id="recordId"
        mode="edit"
        @submit="handleSubmit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { DynamicForm } from '@/modules/metadata/components/DynamicForm'

const route = useRoute()
const router = useRouter()
const formRef = ref()

const tableId = ref(1)
const recordId = computed(() => Number(route.params.id))

async function handleSave() {
  const isValid = await formRef.value.validate()
  if (!isValid) {
    Message.error('请检查表单填写')
    return
  }
}

function handleSubmit(data: any) {
  Message.success('保存成功')
  router.back()
}

function handleBack() {
  router.back()
}
</script>
```

### 3. 查看模式（只读）

```vue
<template>
  <div class="page-container">
    <a-page-header title="查看记录" @back="handleBack" />

    <div class="page-content">
      <DynamicForm
        :table-id="tableId"
        :record-id="recordId"
        mode="view"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DynamicForm } from '@/modules/metadata/components/DynamicForm'

const route = useRoute()
const router = useRouter()

const tableId = ref(1)
const recordId = computed(() => Number(route.params.id))

function handleBack() {
  router.back()
}
</script>
```

## 🎨 高级用法

### 1. 自定义布局

```vue
<template>
  <DynamicForm
    :table-id="tableId"
    :record-id="recordId"
    mode="edit"
    :label-col-span="4"
    :wrapper-col-span="20"
    :row-gutter="24"
    layout="horizontal"
  />
</template>
```

### 2. 监听字段变化

```vue
<template>
  <DynamicForm
    :table-id="tableId"
    mode="create"
    @change="handleFieldChange"
  />
</template>

<script setup lang="ts">
function handleFieldChange(field: string, value: any) {
  console.log(`Field ${field} changed to:`, value)

  // 可以根据字段变化执行特定逻辑
  if (field === 'PROVINCE') {
    // 省份改变时，重新加载城市列表
    loadCities(value)
  }
}
</script>
```

### 3. 手动设置字段值

```vue
<template>
  <div>
    <a-button @click="fillTestData">填充测试数据</a-button>

    <DynamicForm
      ref="formRef"
      :table-id="tableId"
      mode="create"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const formRef = ref()

function fillTestData() {
  formRef.value.setFormData({
    NAME: '测试名称',
    CODE: 'TEST001',
    STATUS: 'Y',
    DESCRIPTION: '这是测试描述'
  })
}
</script>
```

### 4. 字段分组配置

在 `sys_table` 的 `PROPS` 字段中配置分组：

```json
{
  "groups": [
    {
      "title": "界面展示配置",
      "fields": ["ALLOW_BROWSE", "BROWSE_AFTER_ADD", "BROWSE_AFTER_DELETE", "MASK"]
    },
    {
      "title": "权限配置",
      "fields": ["SECURITY_DIR_ID", "PARENT_TABLE_ID", "DISPLAY_CONFIG_ID"]
    }
  ]
}
```

这些字段会自动渲染为折叠面板。

## 🔍 字段类型支持

DynamicForm 支持以下字段类型（通过 `CONTROL_TYPE` 配置）：

| 控件类型 | 说明 | 对应组件 |
|---------|------|---------|
| text | 文本输入框 | TextField |
| textarea | 多行文本 | TextareaField |
| number | 数字输入 | NumberField |
| select | 下拉选择 | SelectField |
| checkbox | 复选框 | CheckboxField |
| date | 日期选择 | DateField |
| datetime | 日期时间选择 | DatetimeField |
| radio | 单选框 | RadioField (待实现) |
| file | 文件上传 | FileField (待实现) |
| image | 图片上传 | ImageField (待实现) |
| foreign_key | 外键关联 | ForeignKeyField (待实现) |
| password | 密码输入 | PasswordField (待实现) |
| email | 邮箱输入 | EmailField (待实现) |
| url | URL输入 | UrlField (待实现) |

## ⚙️ 字段配置说明

### 必填验证

```sql
-- 设置字段为必填
NULL_ABLE = 'N'
```

### 正则验证

```sql
-- 设置手机号正则验证
REG_EXPRESSION = '^1[3-9]\d{9}$'
ERROR_MSG = '请输入正确的手机号'
```

### 字段长度

```sql
-- 限制字段长度
LENGTH = 100
```

### 字段只读

```sql
-- 设置字段只读
IS_READONLY = 'Y'
```

### 级联显示

```sql
-- 当 TYPE 字段值为 'custom' 时才显示此字段
SHOW_COLUMN_ID = 123  -- TYPE 字段的 ID
SHOW_COLUMN_VALUE = 'custom'

-- 支持多个值（逗号分隔）
SHOW_COLUMN_VALUE = 'custom,special'
```

### 默认值

```sql
-- 设置默认值
DEFAULT_VALUE = 'Y'
```

### 字段跨度

```sql
-- 设置字段占据的列数（24栅格）
FORM_COLSPAN = 12  -- 占半行
FORM_COLSPAN = 24  -- 占满一行
FORM_COLSPAN = 8   -- 占1/3行
```

## 🎯 完整示例

```vue
<template>
  <div class="metadata-form-page">
    <!-- 顶部操作栏 -->
    <a-page-header
      :title="pageTitle"
      :subtitle="subtitle"
      @back="handleBack"
    >
      <template #extra>
        <a-space>
          <!-- 查看模式下的编辑按钮 -->
          <a-button
            v-if="mode === 'view' && canEdit"
            @click="handleEdit"
          >
            <template #icon><icon-edit /></template>
            编辑
          </a-button>

          <!-- 编辑模式下的按钮 -->
          <template v-if="mode === 'edit' || mode === 'create'">
            <a-button @click="handleCancel">取消</a-button>
            <a-button
              type="primary"
              :loading="submitting"
              @click="handleSave"
            >
              <template #icon><icon-save /></template>
              保存
            </a-button>
          </template>
        </a-space>
      </template>
    </a-page-header>

    <!-- 表单内容 -->
    <div class="page-content">
      <DynamicForm
        ref="formRef"
        :table-id="tableId"
        :record-id="recordId"
        :mode="mode"
        :label-col-span="6"
        :wrapper-col-span="18"
        @submit="handleSubmit"
        @change="handleFieldChange"
        @loaded="handleLoaded"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import { IconEdit, IconSave } from '@arco-design/web-vue/es/icon'
import { DynamicForm } from '@/modules/metadata/components/DynamicForm'
import type { FormMode } from '@/modules/metadata/types'

const route = useRoute()
const router = useRouter()

const formRef = ref()
const tableId = ref(Number(route.params.tableId))
const recordId = computed(() => route.params.id ? Number(route.params.id) : undefined)
const mode = ref<FormMode>((route.meta.mode as FormMode) || 'view')
const submitting = ref(false)
const tableConfig = ref<any>(null)

const pageTitle = computed(() => {
  if (!tableConfig.value) return ''
  const name = tableConfig.value.table.DISPLAY_NAME
  if (mode.value === 'create') return `新增${name}`
  if (mode.value === 'edit') return `编辑${name}`
  return `查看${name}`
})

const subtitle = computed(() => {
  if (recordId.value) {
    return `ID: ${recordId.value}`
  }
  return ''
})

const canEdit = computed(() => {
  if (!tableConfig.value) return false
  const mask = tableConfig.value.table.MASK || ''
  return mask.includes('M')
})

// 保存
async function handleSave() {
  const isValid = await formRef.value.validate()
  if (!isValid) {
    Message.error('请检查表单填写')
    return
  }

  submitting.value = true
  try {
    // DynamicForm 内部会调用 API 提交
    // 这里只需要等待 submit 事件
  } catch (error) {
    submitting.value = false
  }
}

// 提交成功
function handleSubmit(data: any) {
  submitting.value = false
  Message.success('保存成功')

  // 如果是新增，跳转到编辑页
  if (mode.value === 'create' && data.ID) {
    router.replace({
      name: 'MetadataFormEdit',
      params: {
        tableId: tableId.value,
        id: data.ID
      }
    })
  } else {
    router.back()
  }
}

// 编辑
function handleEdit() {
  mode.value = 'edit'
}

// 取消
async function handleCancel() {
  const confirmed = await Modal.confirm({
    title: '确认取消',
    content: '确定要取消编辑吗？未保存的数据将丢失。'
  })

  if (confirmed) {
    if (mode.value === 'create') {
      router.back()
    } else {
      mode.value = 'view'
    }
  }
}

// 返回
function handleBack() {
  router.back()
}

// 字段变化
function handleFieldChange(field: string, value: any) {
  console.log('Field changed:', field, value)
}

// 配置加载完成
function handleLoaded(config: any) {
  tableConfig.value = config
  console.log('Config loaded:', config)
}
</script>

<style scoped>
.metadata-form-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.page-content :deep(.dynamic-form) {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
```

## 🐛 常见问题

### 1. 字段不显示

**原因**：
- 字段的 `IS_VISIBLE` 设置为 'N'
- 字段的 `IS_ACTIVE` 设置为 'N'
- 级联显示条件不满足（`SHOW_COLUMN_ID` 和 `SHOW_COLUMN_VALUE`）

**解决**：
检查字段配置，确保字段可见且激活。

### 2. 验证不生效

**原因**：
- 字段的 `NULL_ABLE` 和 `REG_EXPRESSION` 配置错误
- 表单模式为 'view'（查看模式不验证）

**解决**：
检查字段配置，确保验证规则正确。

### 3. 字典数据不显示

**原因**：
- `DICT_TABLE_ID` 未配置
- 字典数据未维护
- 字典表中没有激活的数据

**解决**：
检查字典配置，确保字典数据存在。

### 4. 表单提交失败

**原因**：
- 后端 API 未正确实现
- 数据格式不正确
- 权限不足（MASK 不包含 A 或 M）

**解决**：
检查后端 API 和权限配置。

## 📚 相关文档

- [useDynamicForm Composable](../composables/useDynamicForm.md)
- [字段渲染器开发指南](../FieldRenderers/README.md)
- [元数据系统设计文档](../../METADATA_SYSTEM_DESIGN_PART2.md)

---

**最后更新**: 2026-01-19
**版本**: 1.0.0
