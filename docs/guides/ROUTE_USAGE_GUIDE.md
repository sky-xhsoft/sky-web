# 元数据驱动动态表单系统 - 路由使用指南

## 📍 已创建的路由

### 路由列表

| 路由名称 | 路径 | 组件 | 说明 |
|---------|------|------|------|
| `MetadataList` | `/metadata/list/:tableId?` | MetadataListView | 列表页（带左侧树形导航） |
| `MetadataFormCreate` | `/metadata/:tableId/create` | MetadataFormView | 新增页 |
| `MetadataFormView` | `/metadata/:tableId/:id` | MetadataFormView | 查看页（只读） |
| `MetadataFormEdit` | `/metadata/:tableId/:id/edit` | MetadataFormView | 编辑页 |

---

## 🚀 使用方法

### 1. 在代码中进行路由跳转

#### 方法 1: 使用 `router.push()`（推荐）

```typescript
import { useRouter } from 'vue-router'

const router = useRouter()

// 跳转到列表页
router.push({
  name: 'MetadataList',
  params: { tableId: 1 }  // tableId 可选
})

// 跳转到新增页
router.push({
  name: 'MetadataFormCreate',
  params: { tableId: 1 }  // 必填
})

// 跳转到查看页
router.push({
  name: 'MetadataFormView',
  params: {
    tableId: 1,  // 必填
    id: 123      // 必填
  }
})

// 跳转到编辑页
router.push({
  name: 'MetadataFormEdit',
  params: {
    tableId: 1,  // 必填
    id: 123      // 必填
  }
})
```

#### 方法 2: 使用 `<router-link>`

```vue
<template>
  <!-- 跳转到列表页 -->
  <router-link :to="{ name: 'MetadataList', params: { tableId: 1 } }">
    查看列表
  </router-link>

  <!-- 跳转到新增页 -->
  <router-link :to="{ name: 'MetadataFormCreate', params: { tableId: 1 } }">
    新增记录
  </router-link>

  <!-- 跳转到查看页 -->
  <router-link :to="{ name: 'MetadataFormView', params: { tableId: 1, id: 123 } }">
    查看记录
  </router-link>

  <!-- 跳转到编辑页 -->
  <router-link :to="{ name: 'MetadataFormEdit', params: { tableId: 1, id: 123 } }">
    编辑记录
  </router-link>
</template>
```

#### 方法 3: 使用 URL 路径（直接在浏览器地址栏输入）

```
列表页: http://localhost:5181/metadata/list
列表页（指定表单）: http://localhost:5181/metadata/list/1
新增页: http://localhost:5181/metadata/1/create
查看页: http://localhost:5181/metadata/1/123
编辑页: http://localhost:5181/metadata/1/123/edit
```

---

## 📝 路由详细说明

### 1. MetadataList - 列表页

**路径**: `/metadata/list/:tableId?`

**参数**:
- `tableId` (可选): 表单ID，如果提供则自动显示该表单的数据

**功能**:
- 左侧显示子系统/类别/表单的树形导航
- 右侧显示选中表单的数据列表（DynamicTable）
- 顶部有面包屑导航
- 支持筛选、分页、排序
- 点击树形节点自动加载对应表单数据

**使用示例**:

```typescript
// 场景 1: 进入列表页，不指定表单（显示空状态，等待用户选择）
router.push({ name: 'MetadataList' })
// URL: /metadata/list

// 场景 2: 直接打开指定表单的列表
router.push({
  name: 'MetadataList',
  params: { tableId: 1 }
})
// URL: /metadata/list/1
```

**页面效果**:
```
┌──────────┬─────────────────────────────────┐
│  树形    │  面包屑: 元数据管理 > 用户管理  │
│  导航    ├─────────────────────────────────┤
│          │  筛选栏: [搜索] [状态] [查询]   │
│  系统管理├─────────────────────────────────┤
│  ├─用户  │  表格: 序号 | 姓名 | 状态 | 操作 │
│  ├─角色  │        1    张三   启用   [编辑]│
│  └─菜单  │        2    李四   禁用   [编辑]│
└──────────┴─────────────────────────────────┘
```

---

### 2. MetadataFormCreate - 新增页

**路径**: `/metadata/:tableId/create`

**参数**:
- `tableId` (必填): 表单ID

**查询参数**:
- `copyFrom` (可选): 要复制的记录ID，用于复制现有记录

**功能**:
- 显示动态生成的表单（DynamicForm）
- 所有字段可编辑
- 顶部有保存、返回按钮
- 支持字段验证
- 保存成功后自动跳转到查看页

**使用示例**:

```typescript
// 场景 1: 新增记录
router.push({
  name: 'MetadataFormCreate',
  params: { tableId: 1 }
})
// URL: /metadata/1/create

// 场景 2: 复制现有记录
router.push({
  name: 'MetadataFormCreate',
  params: { tableId: 1 },
  query: { copyFrom: 123 }
})
// URL: /metadata/1/create?copyFrom=123
```

**页面效果**:
```
┌─────────────────────────────────────────┐
│  面包屑: 元数据管理 > 用户管理 > 新增   │
│  [保存] [返回]                          │
├─────────────────────────────────────────┤
│  基础信息                               │
│  ┌───────────────────────────────────┐ │
│  │ 姓名: [__________]               │ │
│  │ 邮箱: [__________]               │ │
│  │ 状态: [▼ 启用  ]                 │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

### 3. MetadataFormView - 查看页

**路径**: `/metadata/:tableId/:id`

**参数**:
- `tableId` (必填): 表单ID
- `id` (必填): 记录ID

**功能**:
- 显示记录详情（只读模式）
- 所有字段不可编辑
- 顶部有编辑、复制、打印、上一条、下一条、返回按钮
- 底部显示系统信息（创建人、创建时间、修改人、修改时间）
- 如果有子表，显示子表选项卡

**使用示例**:

```typescript
// 查看记录
router.push({
  name: 'MetadataFormView',
  params: {
    tableId: 1,
    id: 123
  }
})
// URL: /metadata/1/123
```

**页面效果**:
```
┌─────────────────────────────────────────┐
│  面包屑: 元数据管理 > 用户管理 > 查看   │
│  [上一条] [下一条] [编辑] [复制] [返回]│
├─────────────────────────────────────────┤
│  基础信息                               │
│  ┌───────────────────────────────────┐ │
│  │ 姓名: 张三                        │ │
│  │ 邮箱: zhangsan@example.com       │ │
│  │ 状态: 启用                        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  系统信息                               │
│  创建人: admin  创建时间: 2026-01-19   │
│  修改人: admin  修改时间: 2026-01-19   │
└─────────────────────────────────────────┘
```

---

### 4. MetadataFormEdit - 编辑页

**路径**: `/metadata/:tableId/:id/edit`

**参数**:
- `tableId` (必填): 表单ID
- `id` (必填): 记录ID

**功能**:
- 显示记录详情（可编辑模式）
- 所有字段可编辑
- 顶部有保存、刷新、返回按钮
- 支持字段验证
- 保存成功后自动刷新数据
- 离开页面时提示未保存更改

**使用示例**:

```typescript
// 编辑记录
router.push({
  name: 'MetadataFormEdit',
  params: {
    tableId: 1,
    id: 123
  }
})
// URL: /metadata/1/123/edit
```

**页面效果**:
```
┌─────────────────────────────────────────┐
│  面包屑: 元数据管理 > 用户管理 > 编辑   │
│  [保存] [刷新] [返回]                   │
├─────────────────────────────────────────┤
│  基础信息                               │
│  ┌───────────────────────────────────┐ │
│  │ 姓名: [_张三_____]               │ │
│  │ 邮箱: [_zhangsan@example.com____]│ │
│  │ 状态: [▼ 启用  ]                 │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🔄 完整的使用流程

### 流程 1: 从列表页进入

```typescript
// 1. 进入列表页
router.push({ name: 'MetadataList' })

// 2. 用户点击左侧树形节点，自动显示表单数据

// 3. 点击"新增"按钮
router.push({
  name: 'MetadataFormCreate',
  params: { tableId: currentTable.ID }
})

// 4. 填写表单，点击"保存"
// -> 自动跳转到查看页

// 5. 在查看页点击"编辑"
router.push({
  name: 'MetadataFormEdit',
  params: {
    tableId: currentTable.ID,
    id: record.ID
  }
})

// 6. 修改数据，点击"保存"
// -> 停留在当前页，刷新数据

// 7. 点击"返回"
router.back()
```

### 流程 2: 直接访问表单

```typescript
// 1. 直接进入指定表单的列表页
router.push({
  name: 'MetadataList',
  params: { tableId: 1 }
})

// 2. 点击表格中的"查看"按钮
router.push({
  name: 'MetadataFormView',
  params: { tableId: 1, id: 123 }
})

// 3. 在查看页使用"上一条"/"下一条"浏览其他记录
// 自动更新 URL: /metadata/1/124, /metadata/1/125, ...

// 4. 点击"复制"按钮
router.push({
  name: 'MetadataFormCreate',
  params: { tableId: 1 },
  query: { copyFrom: 123 }
})
```

---

## 🎯 常见使用场景

### 场景 1: 在菜单中添加链接

```vue
<!-- 在侧边栏菜单中 -->
<template>
  <a-menu>
    <a-menu-item>
      <router-link :to="{ name: 'MetadataList', params: { tableId: 1 } }">
        <icon-user />
        用户管理
      </router-link>
    </a-menu-item>
    <a-menu-item>
      <router-link :to="{ name: 'MetadataList', params: { tableId: 2 } }">
        <icon-users />
        角色管理
      </router-link>
    </a-menu-item>
  </a-menu>
</template>
```

### 场景 2: 在 DynamicTable 中处理操作

```vue
<template>
  <DynamicTable
    :table-id="1"
    @create="handleCreate"
    @view="handleView"
    @edit="handleEdit"
  />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { DynamicTable } from '@/modules/metadata'

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

### 场景 3: 在表单提交后跳转

```typescript
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'

const router = useRouter()

async function handleSubmit(formData: any) {
  try {
    // 保存数据
    const result = await api.saveData(formData)

    Message.success('保存成功')

    // 新增模式：跳转到查看页
    if (mode.value === 'create') {
      router.push({
        name: 'MetadataFormView',
        params: {
          tableId: tableId.value,
          id: result.ID
        }
      })
    }
    // 编辑模式：停留在当前页
    else {
      await refreshData()
    }
  } catch (error) {
    Message.error('保存失败')
  }
}
```

### 场景 4: 面包屑导航

```vue
<template>
  <a-breadcrumb>
    <a-breadcrumb-item>
      <router-link :to="{ name: 'dashboard' }">
        <icon-home />
        首页
      </router-link>
    </a-breadcrumb-item>
    <a-breadcrumb-item>
      <router-link :to="{ name: 'MetadataList' }">
        元数据管理
      </router-link>
    </a-breadcrumb-item>
    <a-breadcrumb-item v-if="currentTable">
      {{ currentTable.DISPLAY_NAME }}
    </a-breadcrumb-item>
    <a-breadcrumb-item v-if="mode === 'create'">
      新增
    </a-breadcrumb-item>
    <a-breadcrumb-item v-if="mode === 'edit'">
      编辑
    </a-breadcrumb-item>
  </a-breadcrumb>
</template>
```

---

## 🛡️ 权限控制

所有路由都需要登录认证（`requiresAuth: true`）。

如果需要更细粒度的权限控制，可以在路由守卫中添加：

```typescript
// router/index.ts
router.beforeEach(async (to, from, next) => {
  // ... 现有的认证逻辑 ...

  // 检查元数据模块权限
  if (to.name?.toString().startsWith('Metadata')) {
    const auth = useAuthStore()
    const tableId = to.params.tableId

    // 检查用户是否有访问该表单的权限
    if (tableId) {
      const hasPermission = await auth.checkTablePermission(tableId)
      if (!hasPermission) {
        Message.error('没有访问权限')
        next({ name: 'dashboard' })
        return
      }
    }
  }

  next()
})
```

---

## 🔧 路由配置说明

### 懒加载

所有元数据模块的路由都使用懒加载：

```typescript
component: () => import('../modules/metadata/views/MetadataListView.vue')
```

**优点**:
- 减少初始加载时间
- 按需加载组件
- 提升应用性能

### Meta 信息

每个路由都包含 meta 信息：

```typescript
meta: {
  title: '数据列表',        // 页面标题
  requiresAuth: true,      // 需要认证
  breadcrumb: ['...']      // 面包屑导航
}
```

可以在组件中访问：

```typescript
import { useRoute } from 'vue-router'

const route = useRoute()
const pageTitle = route.meta.title
```

---

## 📖 完整示例

### 创建一个完整的管理页面

```vue
<!-- pages/UserManagement.vue -->
<template>
  <div class="user-management">
    <a-page-header :title="pageTitle" @back="handleBack">
      <template #extra>
        <a-space>
          <a-button type="primary" @click="handleCreate">
            <template #icon><icon-plus /></template>
            新增用户
          </a-button>
          <a-button @click="handleExport">
            <template #icon><icon-download /></template>
            导出
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <DynamicTable
      :table-id="USER_TABLE_ID"
      :filters="filters"
      @create="handleCreate"
      @view="handleView"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { DynamicTable } from '@/modules/metadata'
import { IconPlus, IconDownload } from '@arco-design/web-vue/es/icon'

const USER_TABLE_ID = 1
const router = useRouter()

const pageTitle = ref('用户管理')
const filters = ref({})

function handleBack() {
  router.push({ name: 'dashboard' })
}

function handleCreate() {
  router.push({
    name: 'MetadataFormCreate',
    params: { tableId: USER_TABLE_ID }
  })
}

function handleView(record: any) {
  router.push({
    name: 'MetadataFormView',
    params: {
      tableId: USER_TABLE_ID,
      id: record.ID
    }
  })
}

function handleEdit(record: any) {
  router.push({
    name: 'MetadataFormEdit',
    params: {
      tableId: USER_TABLE_ID,
      id: record.ID
    }
  })
}

function handleDelete(record: any) {
  Message.success(`已删除用户: ${record.USERNAME}`)
}

function handleExport() {
  Message.info('导出功能开发中')
}
</script>

<style scoped>
.user-management {
  padding: 16px;
}
</style>
```

---

## 📞 常见问题

### Q1: 如何获取当前路由的 tableId？

```typescript
import { useRoute } from 'vue-router'

const route = useRoute()
const tableId = computed(() => Number(route.params.tableId))
```

### Q2: 如何在表单保存后跳转？

```typescript
// 在 MetadataFormView 组件中已经实现
// 新增模式：保存后跳转到查看页
// 编辑模式：保存后停留在当前页并刷新
```

### Q3: 如何添加返回上一页功能？

```typescript
import { useRouter } from 'vue-router'

const router = useRouter()

function handleBack() {
  router.back()  // 返回上一页
  // 或
  router.push({ name: 'MetadataList' })  // 返回列表页
}
```

### Q4: 如何实现列表页默认打开某个表单？

```typescript
// 在菜单中配置
<a-menu-item>
  <router-link :to="{ name: 'MetadataList', params: { tableId: 1 } }">
    用户管理
  </router-link>
</a-menu-item>

// 或在代码中跳转
router.push({
  name: 'MetadataList',
  params: { tableId: 1 }
})
```

---

## ✅ 快速开始清单

- [x] 路由已配置在 `src/router/index.ts`
- [x] MetadataListView 组件已创建
- [x] MetadataFormView 组件已创建
- [ ] 在菜单中添加链接（根据需要）
- [ ] 配置表单ID常量（建议在 `src/constants/metadata.ts`）
- [ ] 测试路由跳转

---

**最后更新**: 2026-01-19
**路由数量**: 4 个
**文档版本**: v1.0
