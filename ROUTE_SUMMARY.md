# 元数据驱动动态表单系统 - 路由配置完成总结

## ✅ 已完成的工作

### 1. 路由配置文件更新

**文件**: `src/router/index.ts`

**新增路由**:
```typescript
{
  path: 'metadata',
  name: 'metadata',
  children: [
    {
      path: 'list/:tableId?',
      name: 'MetadataList',
      component: MetadataListView
    },
    {
      path: ':tableId/create',
      name: 'MetadataFormCreate',
      component: MetadataFormView
    },
    {
      path: ':tableId/:id',
      name: 'MetadataFormView',
      component: MetadataFormView
    },
    {
      path: ':tableId/:id/edit',
      name: 'MetadataFormEdit',
      component: MetadataFormView
    }
  ]
}
```

### 2. 创建的文档

| 文档名称 | 文件路径 | 说明 |
|---------|---------|------|
| 路由使用指南 | `ROUTE_USAGE_GUIDE.md` | 详细的路由使用说明（~500行） |
| 快速开始指南 | `QUICK_START.md` | 5分钟快速上手教程 |
| 本总结文档 | `ROUTE_SUMMARY.md` | 路由配置完成总结 |

---

## 📍 4 个核心路由

### 路由 1: MetadataList - 数据列表页

**路由名称**: `MetadataList`
**路径**: `/metadata/list/:tableId?`
**组件**: `MetadataListView.vue`

**特点**:
- 左侧树形导航（子系统/类别/表单三级结构）
- 右侧动态表格（DynamicTable）
- 支持筛选、分页、排序、批量操作

**访问方式**:
```typescript
// 方式 1: 代码跳转
router.push({ name: 'MetadataList', params: { tableId: 1 } })

// 方式 2: URL 访问
http://localhost:5181/metadata/list
http://localhost:5181/metadata/list/1

// 方式 3: 路由链接
<router-link :to="{ name: 'MetadataList', params: { tableId: 1 } }">
  用户管理
</router-link>
```

---

### 路由 2: MetadataFormCreate - 新增页

**路由名称**: `MetadataFormCreate`
**路径**: `/metadata/:tableId/create`
**组件**: `MetadataFormView.vue`（mode='create'）

**特点**:
- 动态生成表单（DynamicForm）
- 所有字段可编辑
- 保存成功后跳转到查看页

**访问方式**:
```typescript
// 方式 1: 代码跳转
router.push({
  name: 'MetadataFormCreate',
  params: { tableId: 1 }
})

// 方式 2: URL 访问
http://localhost:5181/metadata/1/create

// 方式 3: 带复制参数
router.push({
  name: 'MetadataFormCreate',
  params: { tableId: 1 },
  query: { copyFrom: 123 }
})
```

---

### 路由 3: MetadataFormView - 查看页

**路由名称**: `MetadataFormView`
**路径**: `/metadata/:tableId/:id`
**组件**: `MetadataFormView.vue`（mode='view'）

**特点**:
- 显示记录详情（只读）
- 上一条/下一条导航
- 编辑、复制、打印功能
- 显示系统信息

**访问方式**:
```typescript
// 方式 1: 代码跳转
router.push({
  name: 'MetadataFormView',
  params: { tableId: 1, id: 123 }
})

// 方式 2: URL 访问
http://localhost:5181/metadata/1/123

// 方式 3: 从列表页跳转
@view="router.push({ name: 'MetadataFormView', params: { tableId: 1, id: $event.ID } })"
```

---

### 路由 4: MetadataFormEdit - 编辑页

**路由名称**: `MetadataFormEdit`
**路径**: `/metadata/:tableId/:id/edit`
**组件**: `MetadataFormView.vue`（mode='edit'）

**特点**:
- 显示记录详情（可编辑）
- 保存后停留在当前页
- 离开时提示未保存更改

**访问方式**:
```typescript
// 方式 1: 代码跳转
router.push({
  name: 'MetadataFormEdit',
  params: { tableId: 1, id: 123 }
})

// 方式 2: URL 访问
http://localhost:5181/metadata/1/123/edit

// 方式 3: 从查看页跳转
@click="router.push({ name: 'MetadataFormEdit', params: { tableId, id } })"
```

---

## 🎯 使用方法总结

### 最简单的使用方式

**零代码使用**:
1. 在浏览器地址栏输入: `http://localhost:5181/metadata/list`
2. 点击左侧树形节点选择表单
3. 点击"新增"/"编辑"/"查看"按钮进行操作

**在代码中使用**:
```vue
<template>
  <DynamicTable
    :table-id="1"
    @create="$router.push({ name: 'MetadataFormCreate', params: { tableId: 1 } })"
    @view="$router.push({ name: 'MetadataFormView', params: { tableId: 1, id: $event.ID } })"
    @edit="$router.push({ name: 'MetadataFormEdit', params: { tableId: 1, id: $event.ID } })"
  />
</template>

<script setup>
import { DynamicTable } from '@/modules/metadata'
</script>
```

### 在菜单中添加链接

```vue
<a-menu>
  <a-menu-item>
    <router-link :to="{ name: 'MetadataList', params: { tableId: 1 } }">
      <icon-user />
      用户管理
    </router-link>
  </a-menu-item>
  <a-menu-item>
    <router-link :to="{ name: 'MetadataList', params: { tableId: 2 } }">
      <icon-lock />
      角色管理
    </router-link>
  </a-menu-item>
  <a-menu-item>
    <router-link :to="{ name: 'MetadataList', params: { tableId: 3 } }">
      <icon-menu />
      菜单管理
    </router-link>
  </a-menu-item>
</a-menu>
```

---

## 🔄 完整的业务流程

### 流程图

```
┌─────────────┐
│  列表页     │ /metadata/list/1
│  (查看列表) │
└──────┬──────┘
       │
       ├─→ 点击"新增" ──→ ┌─────────────┐
       │                  │  新增页     │ /metadata/1/create
       │                  │  (填写表单) │
       │                  └──────┬──────┘
       │                         │ 保存成功
       │                         ↓
       ├─→ 点击"查看" ──→ ┌─────────────┐
       │                  │  查看页     │ /metadata/1/123
       │                  │  (只读)     │
       │                  └──────┬──────┘
       │                         │ 点击"编辑"
       │                         ↓
       └─→ 点击"编辑" ──→ ┌─────────────┐
                          │  编辑页     │ /metadata/1/123/edit
                          │  (修改数据) │
                          └─────────────┘
```

### 代码示例

```typescript
// 1. 从列表页开始
router.push({ name: 'MetadataList', params: { tableId: 1 } })

// 2. 用户点击"新增"
router.push({ name: 'MetadataFormCreate', params: { tableId: 1 } })

// 3. 填写表单，点击保存
// -> 自动跳转到查看页: /metadata/1/123

// 4. 在查看页点击"编辑"
router.push({ name: 'MetadataFormEdit', params: { tableId: 1, id: 123 } })

// 5. 修改数据，点击保存
// -> 停留在编辑页，数据刷新

// 6. 点击"返回"
router.back()
```

---

## 📊 路由参数说明

| 路由 | tableId | id | 说明 |
|------|---------|----|----- |
| MetadataList | 可选 | - | 不提供则显示空状态，提供则自动打开该表单 |
| MetadataFormCreate | 必填 | - | 指定要创建记录的表单 |
| MetadataFormView | 必填 | 必填 | 指定表单和记录 |
| MetadataFormEdit | 必填 | 必填 | 指定表单和记录 |

### tableId 的值

`tableId` 对应数据库中 `sys_table` 表的 `ID` 字段。

建议在项目中创建常量文件统一管理：

```typescript
// src/constants/metadata.ts
export const TABLE_IDS = {
  USER: 1,          // 用户表
  ROLE: 2,          // 角色表
  MENU: 3,          // 菜单表
  DEPT: 4,          // 部门表
  // ... 其他表单
}

// 使用
import { TABLE_IDS } from '@/constants/metadata'

router.push({
  name: 'MetadataList',
  params: { tableId: TABLE_IDS.USER }
})
```

---

## 🛡️ 权限控制

### 路由级权限

所有元数据路由都需要登录认证：
```typescript
meta: { requiresAuth: true }
```

### 功能级权限

基于 `sys_table.MASK` 字段控制：

| 权限 | 字母 | 说明 |
|------|------|------|
| 新增 | A | Add - 显示"新增"按钮 |
| 修改 | M | Modify - 显示"编辑"按钮 |
| 删除 | D | Delete - 显示"删除"按钮 |
| 查询 | Q | Query - 允许查看列表 |
| 提交 | S | Submit - 显示"提交"按钮 |
| 反提交 | U | Unsubmit - 显示"反提交"按钮 |
| 作废 | V | Void - 显示"作废"按钮 |

**示例**:
```sql
-- 完整权限
MASK = 'AMDQSUV'

-- 只读权限（只能查看）
MASK = 'Q'

-- 常规权限（增删改查）
MASK = 'AMDQ'
```

---

## 📱 响应式设计

所有路由对应的组件都已适配移动端：

- **列表页**: 侧边栏可折叠，表格横向滚动
- **表单页**: 字段自动换行，按钮堆叠显示

测试方法：
1. 打开浏览器开发者工具
2. 切换到手机模拟模式
3. 访问路由查看效果

---

## 🔧 高级配置

### 自定义面包屑

```typescript
// 在路由 meta 中配置
meta: {
  breadcrumb: ['系统管理', '用户管理', '编辑用户']
}

// 在组件中使用
const breadcrumb = route.meta.breadcrumb
```

### 路由守卫示例

```typescript
// router/index.ts
router.beforeEach((to, from, next) => {
  // 检查表单访问权限
  if (to.name?.toString().startsWith('Metadata')) {
    const tableId = to.params.tableId
    if (tableId) {
      // 检查用户是否有访问该表单的权限
      const hasPermission = checkPermission(tableId)
      if (!hasPermission) {
        Message.error('没有访问权限')
        return next({ name: 'dashboard' })
      }
    }
  }
  next()
})
```

---

## 📚 相关文档索引

| 文档 | 路径 | 内容 |
|------|------|------|
| 快速开始 | `QUICK_START.md` | 5分钟快速上手 |
| 路由使用指南 | `ROUTE_USAGE_GUIDE.md` | 详细的路由文档 |
| DynamicForm 文档 | `src/modules/metadata/components/DynamicForm/README.md` | 表单组件使用 |
| DynamicTable 文档 | `src/modules/metadata/components/DynamicTable/README.md` | 表格组件使用 |
| 测试文档 | `TEST_DOCUMENTATION.md` | 自动化测试说明 |
| 实施总结 | `METADATA_IMPLEMENTATION_SUMMARY.md` | 整体实施情况 |

---

## ✅ 检查清单

在使用路由之前，请确认：

- [x] 路由已配置在 `src/router/index.ts`
- [x] MetadataListView 组件已创建
- [x] MetadataFormView 组件已创建
- [x] 数据库元数据表已初始化（sys_subsystem, sys_table_category, sys_table, sys_column）
- [x] 后端 API 已实现并可访问
- [ ] 在菜单中添加了入口链接（根据需要）
- [ ] 测试了所有 4 个路由

---

## 🎉 下一步

现在路由已配置完成，你可以：

1. **测试路由**: 在浏览器中访问 `/metadata/list`
2. **添加菜单**: 在侧边栏菜单中添加入口链接
3. **集成业务**: 在业务页面中使用 DynamicTable 和路由跳转
4. **自定义扩展**: 根据需要自定义组件和功能

---

## 📞 常见问题

### Q: 路由跳转后页面是空白的？

**A**: 检查以下几点：
1. 组件是否正确导入（懒加载语法是否正确）
2. 浏览器控制台是否有错误
3. 后端 API 是否正常返回数据

### Q: 如何知道我的 tableId 是多少？

**A**: 查询数据库：
```sql
SELECT ID, DISPLAY_NAME, TABLE_NAME FROM sys_table;
```

### Q: 可以不使用列表页，直接使用表单页吗？

**A**: 可以！直接创建一个页面，在其中使用 DynamicTable 组件即可：
```vue
<template>
  <DynamicTable :table-id="1" />
</template>
```

### Q: 如何自定义列表页的筛选条件？

**A**: 使用 DynamicTable 的 `filters` prop：
```vue
<DynamicTable
  :table-id="1"
  :filters="{ status: 'Y', type: 'admin' }"
/>
```

---

**配置完成时间**: 2026-01-19
**路由数量**: 4 个
**文档数量**: 3 个
**状态**: ✅ 已完成并可用
