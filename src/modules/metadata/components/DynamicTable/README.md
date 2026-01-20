# DynamicTable 组件使用文档

## 📖 组件概述

`DynamicTable` 是一个基于元数据配置的动态表格组件，能够根据 `sys_table` 和 `sys_column` 配置自动生成表格界面，支持分页、排序、筛选、批量操作等功能。

## ✨ 核心特性

- ✅ **自动列生成**: 根据元数据配置自动生成表格列
- ✅ **分页支持**: 前后端分页，支持跳转和页码切换
- ✅ **排序功能**: 支持多列排序
- ✅ **行选择**: 支持单选、多选、全选
- ✅ **批量操作**: 批量删除等批量操作
- ✅ **列设置**: 用户可自定义显示列
- ✅ **权限控制**: 基于 MASK 控制操作按钮显示
- ✅ **响应式布局**: 自动适配不同屏幕尺寸
- ✅ **自定义渲染**: 支持自定义列渲染和操作列

## 📦 安装

```typescript
import { DynamicTable } from '@/modules/metadata/components/DynamicTable'
```

## 🔧 Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| tableId | number | - | **必填**，表单ID（sys_table.ID） |
| filters | Record<string, any> | - | 筛选条件 |
| pageSize | number | 20 | 每页显示条数 |
| showToolbar | boolean | true | 是否显示工具栏 |
| showExport | boolean | true | 是否显示导出按钮 |
| bordered | boolean | true | 是否显示边框 |
| stripe | boolean | true | 是否显示斑马纹 |
| hoverable | boolean | true | 是否显示悬停效果 |
| size | 'mini' \| 'small' \| 'medium' \| 'large' | 'medium' | 表格尺寸 |
| customColumns | string[] | [] | 自定义列名称（使用插槽） |

## 📡 Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| create | - | 点击新增按钮 |
| view | (record: FormData) | 点击查看按钮 |
| edit | (record: FormData) | 点击编辑按钮 |
| delete | (record: FormData) | 删除记录成功 |
| selection-change | (keys: Array) | 选中行变化 |

## 🎯 Slots

| 插槽名 | 参数 | 说明 |
|--------|------|------|
| toolbar-left | - | 工具栏左侧自定义内容 |
| toolbar-right | - | 工具栏右侧自定义内容 |
| actions | { record } | 自定义操作列 |
| [columnName] | { record, column } | 自定义列渲染 |

## 🎯 Expose 方法

| 方法名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| refresh | - | Promise\<void\> | 刷新表格数据 |
| loadData | - | Promise\<void\> | 重新加载数据 |

## 💡 基础用法

### 1. 最简单的使用

```vue
<template>
  <div class="page-container">
    <DynamicTable
      :table-id="1"
      @create="handleCreate"
      @view="handleView"
      @edit="handleEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { DynamicTable } from '@/modules/metadata/components/DynamicTable'

const router = useRouter()

function handleCreate() {
  router.push({
    name: 'MetadataFormCreate',
    params: { tableId: 1 }
  })
}

function handleView(record: any) {
  router.push({
    name: 'MetadataFormView',
    params: { tableId: 1, id: record.ID }
  })
}

function handleEdit(record: any) {
  router.push({
    name: 'MetadataFormEdit',
    params: { tableId: 1, id: record.ID }
  })
}
</script>
```

### 2. 带筛选条件

```vue
<template>
  <div class="page-container">
    <!-- 筛选栏 -->
    <a-form
      :model="filterForm"
      layout="inline"
      class="filter-form"
    >
      <a-form-item label="名称">
        <a-input
          v-model="filterForm.name"
          placeholder="请输入名称"
          allow-clear
        />
      </a-form-item>

      <a-form-item label="状态">
        <a-select
          v-model="filterForm.status"
          placeholder="请选择状态"
          allow-clear
        >
          <a-option value="Y">启用</a-option>
          <a-option value="N">禁用</a-option>
        </a-select>
      </a-form-item>

      <a-form-item>
        <a-space>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="handleReset">重置</a-button>
        </a-space>
      </a-form-item>
    </a-form>

    <!-- 表格 -->
    <DynamicTable
      ref="tableRef"
      :table-id="1"
      :filters="currentFilters"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { DynamicTable } from '@/modules/metadata/components/DynamicTable'

const tableRef = ref()
const filterForm = reactive({
  name: '',
  status: undefined
})
const currentFilters = ref({})

function handleSearch() {
  currentFilters.value = { ...filterForm }
}

function handleReset() {
  filterForm.name = ''
  filterForm.status = undefined
  currentFilters.value = {}
  tableRef.value.refresh()
}
</script>
```

### 3. 自定义工具栏

```vue
<template>
  <DynamicTable :table-id="1">
    <!-- 工具栏左侧自定义按钮 -->
    <template #toolbar-left>
      <a-button @click="handleImport">
        <template #icon><icon-upload /></template>
        导入
      </a-button>
    </template>

    <!-- 工具栏右侧自定义内容 -->
    <template #toolbar-right>
      <a-button type="text" @click="handleAdvancedFilter">
        <template #icon><icon-filter /></template>
        高级筛选
      </a-button>
    </template>
  </DynamicTable>
</template>

<script setup lang="ts">
import { IconUpload, IconFilter } from '@arco-design/web-vue/es/icon'

function handleImport() {
  console.log('导入')
}

function handleAdvancedFilter() {
  console.log('高级筛选')
}
</script>
```

### 4. 自定义列渲染

```vue
<template>
  <DynamicTable
    :table-id="1"
    :custom-columns="['avatar', 'tags']"
  >
    <!-- 自定义头像列 -->
    <template #avatar="{ record }">
      <a-avatar :image-url="record.AVATAR" />
    </template>

    <!-- 自定义标签列 -->
    <template #tags="{ record }">
      <a-space wrap>
        <a-tag
          v-for="tag in record.TAGS"
          :key="tag"
          color="blue"
        >
          {{ tag }}
        </a-tag>
      </a-space>
    </template>
  </DynamicTable>
</template>
```

### 5. 自定义操作列

```vue
<template>
  <DynamicTable :table-id="1">
    <template #actions="{ record }">
      <!-- 在默认操作按钮后添加自定义按钮 -->
      <a-button
        type="text"
        size="small"
        @click="handleApprove(record)"
      >
        审批
      </a-button>
      <a-button
        type="text"
        size="small"
        status="warning"
        @click="handleReject(record)"
      >
        驳回
      </a-button>
    </template>
  </DynamicTable>
</template>

<script setup lang="ts">
function handleApprove(record: any) {
  console.log('审批', record)
}

function handleReject(record: any) {
  console.log('驳回', record)
}
</script>
```

## 🎨 高级用法

### 1. 监听选中变化

```vue
<template>
  <div>
    <div class="selection-info">
      已选中 {{ selectedCount }} 条记录
    </div>

    <DynamicTable
      :table-id="1"
      @selection-change="handleSelectionChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const selectedCount = ref(0)

function handleSelectionChange(keys: (string | number)[]) {
  selectedCount.value = keys.length
  console.log('Selected keys:', keys)
}
</script>
```

### 2. 手动刷新表格

```vue
<template>
  <div>
    <a-button @click="handleManualRefresh">手动刷新</a-button>

    <DynamicTable ref="tableRef" :table-id="1" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const tableRef = ref()

async function handleManualRefresh() {
  await tableRef.value.refresh()
  Message.success('刷新成功')
}
</script>
```

### 3. 完整的列表页示例

```vue
<template>
  <div class="metadata-list-page">
    <!-- 页面标题 -->
    <a-page-header
      :title="pageTitle"
      :subtitle="subtitle"
    />

    <!-- 筛选区域 -->
    <a-card class="filter-card" :bordered="false">
      <a-form
        :model="filterForm"
        layout="inline"
        @submit="handleSearch"
      >
        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item label="显示名称" field="displayName">
              <a-input
                v-model="filterForm.displayName"
                placeholder="请输入显示名称"
                allow-clear
              />
            </a-form-item>
          </a-col>

          <a-col :span="6">
            <a-form-item label="类型" field="type">
              <a-select
                v-model="filterForm.type"
                placeholder="请选择类型"
                allow-clear
              >
                <a-option value="table">表</a-option>
                <a-option value="view">视图</a-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :span="6">
            <a-form-item label="状态" field="status">
              <a-select
                v-model="filterForm.status"
                placeholder="请选择状态"
                allow-clear
              >
                <a-option value="Y">启用</a-option>
                <a-option value="N">禁用</a-option>
              </a-select>
            </a-form-item>
          </a-col>

          <a-col :span="6">
            <a-form-item>
              <a-space>
                <a-button
                  type="primary"
                  html-type="submit"
                >
                  <template #icon><icon-search /></template>
                  查询
                </a-button>
                <a-button @click="handleReset">
                  <template #icon><icon-refresh /></template>
                  重置
                </a-button>
              </a-space>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 高级筛选 -->
        <a-row v-if="showAdvancedFilter" :gutter="16">
          <a-col :span="6">
            <a-form-item label="创建人" field="createBy">
              <a-input
                v-model="filterForm.createBy"
                placeholder="请输入创建人"
                allow-clear
              />
            </a-form-item>
          </a-col>

          <a-col :span="6">
            <a-form-item label="创建时间" field="createTime">
              <a-range-picker
                v-model="filterForm.createTimeRange"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :span="24">
            <a-button
              type="text"
              @click="showAdvancedFilter = !showAdvancedFilter"
            >
              <template #icon>
                <icon-down v-if="!showAdvancedFilter" />
                <icon-up v-else />
              </template>
              {{ showAdvancedFilter ? '收起' : '展开' }}高级筛选
            </a-button>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 表格区域 -->
    <a-card class="table-card" :bordered="false">
      <DynamicTable
        ref="tableRef"
        :table-id="tableId"
        :filters="currentFilters"
        @create="handleCreate"
        @view="handleView"
        @edit="handleEdit"
        @delete="handleDelete"
      >
        <!-- 自定义工具栏按钮 -->
        <template #toolbar-left>
          <a-button @click="handleImport">
            <template #icon><icon-upload /></template>
            导入
          </a-button>
        </template>
      </DynamicTable>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import {
  IconSearch,
  IconRefresh,
  IconDown,
  IconUp,
  IconUpload
} from '@arco-design/web-vue/es/icon'
import { DynamicTable } from '@/modules/metadata/components/DynamicTable'

const route = useRoute()
const router = useRouter()
const tableRef = ref()

const tableId = computed(() => Number(route.params.tableId))
const pageTitle = computed(() => route.meta.title || '数据列表')
const subtitle = computed(() => `共 ${tableRef.value?.pagination?.total || 0} 条记录`)

const filterForm = reactive({
  displayName: '',
  type: undefined,
  status: undefined,
  createBy: '',
  createTimeRange: []
})

const currentFilters = ref({})
const showAdvancedFilter = ref(false)

function handleSearch() {
  currentFilters.value = { ...filterForm }
}

function handleReset() {
  Object.assign(filterForm, {
    displayName: '',
    type: undefined,
    status: undefined,
    createBy: '',
    createTimeRange: []
  })
  currentFilters.value = {}
  tableRef.value?.refresh()
}

function handleCreate() {
  router.push({
    name: 'MetadataFormCreate',
    params: { tableId: tableId.value }
  })
}

function handleView(record: any) {
  router.push({
    name: 'MetadataFormView',
    params: {
      tableId: tableId.value,
      id: record.ID
    }
  })
}

function handleEdit(record: any) {
  router.push({
    name: 'MetadataFormEdit',
    params: {
      tableId: tableId.value,
      id: record.ID
    }
  })
}

function handleDelete(record: any) {
  Message.success(`删除成功: ${record.DISPLAY_NAME}`)
}

function handleImport() {
  Message.info('导入功能开发中')
}
</script>

<style scoped>
.metadata-list-page {
  padding: 16px;
  background: #f5f5f5;
  min-height: 100vh;
}

.filter-card {
  margin-bottom: 16px;
}

.table-card {
  /* 表格卡片样式 */
}

.selection-info {
  padding: 8px 16px;
  background: #e6f7ff;
  border-left: 3px solid #1890ff;
  margin-bottom: 16px;
}
</style>
```

## 🔍 列类型说明

DynamicTable 会根据字段配置自动识别列类型并应用不同的渲染方式：

| 列类型 | 识别规则 | 渲染方式 |
|--------|---------|---------|
| 状态列 | 字段名包含 STATUS/STATE/IS_ACTIVE | Tag 标签，绿色/红色 |
| 日期列 | CONTROL_TYPE = 'date' | 格式化为 YYYY-MM-DD |
| 日期时间列 | CONTROL_TYPE = 'datetime' | 格式化为 YYYY-MM-DD HH:mm:ss |
| 数字列 | CONTROL_TYPE = 'number' | 右对齐显示 |
| 文本列 | 其他 | 默认左对齐 |

## ⚙️ 列设置功能

用户可以通过列设置功能自定义显示哪些列：

1. 点击工具栏右侧的"列设置"按钮
2. 在弹出的抽屉中勾选要显示的列
3. 点击确定应用设置

**注意**: 序号列和操作列始终显示，不可隐藏。

## 🐛 常见问题

### 1. 表格数据不显示

**原因**：
- tableId 错误
- 后端 API 未正确实现
- 权限不足（MASK 不包含 Q）

**解决**：
检查 tableId 和后端 API，确保配置正确。

### 2. 操作按钮不显示

**原因**：
- MASK 权限配置不正确
- canCreate/canEdit/canDelete 为 false

**解决**：
检查 sys_table 的 MASK 字段，确保包含相应权限。

### 3. 排序不生效

**原因**：
- 后端未实现排序逻辑
- 列配置 sortable 为 false

**解决**：
检查后端 API 和列配置。

### 4. 分页数据重复

**原因**：
- 后端分页逻辑错误
- 缓存问题

**解决**：
检查后端分页实现，清除缓存。

## 📚 相关文档

- [useDynamicList Composable](../../composables/useDynamicList.ts)
- [DynamicTable Store](../../stores/useDynamicTableStore.ts)
- [元数据系统设计文档](../../METADATA_SYSTEM_DESIGN_PART2.md)

---

**最后更新**: 2026-01-19
**版本**: 1.0.0
