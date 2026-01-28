# 快速开始 - 5 分钟上手元数据动态表单系统

## 🎯 最简单的使用方式

### 步骤 1: 在浏览器地址栏输入

```
http://localhost:5181/metadata/list
```

这将打开列表页，你会看到：
- 左侧：子系统/类别/表单的树形导航
- 右侧：空状态，提示"请从左侧选择表单"

### 步骤 2: 点击左侧树形节点

点击任意表单节点（如"用户管理"），右侧会自动显示该表单的数据列表。

### 步骤 3: 点击"新增"按钮

点击表格上方的"新增"按钮，会自动跳转到新增页，并显示动态生成的表单。

### 步骤 4: 填写表单并保存

填写必填字段后点击"保存"，会自动跳转到查看页。

### 步骤 5: 编辑/删除记录

在查看页点击"编辑"按钮可以修改记录，或在列表页点击"删除"按钮删除记录。

---

## 💡 在代码中使用

### 最简单的示例 - 只需 3 行代码

```vue
<template>
  <DynamicTable
    :table-id="1"
    @create="$router.push({ name: 'MetadataFormCreate', params: { tableId: 1 } })"
    @edit="$router.push({ name: 'MetadataFormEdit', params: { tableId: 1, id: $event.ID } })"
  />
</template>

<script setup>
import { DynamicTable } from '@/modules/metadata'
</script>
```

这就是一个完整的可用列表页！

---

## 📖 4 个核心路由

### 1️⃣ 列表页
```
URL: /metadata/list/1
用途: 显示表单数据列表
```

### 2️⃣ 新增页
```
URL: /metadata/1/create
用途: 新增一条记录
```

### 3️⃣ 查看页
```
URL: /metadata/1/123
用途: 查看记录详情（只读）
```

### 4️⃣ 编辑页
```
URL: /metadata/1/123/edit
用途: 编辑记录
```

---

## 🚀 在菜单中添加链接

在你的侧边栏菜单中添加：

```vue
<a-menu-item>
  <router-link :to="{ name: 'MetadataList', params: { tableId: 1 } }">
    <icon-user />
    用户管理
  </router-link>
</a-menu-item>
```

点击菜单就能直接打开用户管理的列表页！

---

## 🎨 完整示例 - 复制即用

```vue
<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <h2>用户管理</h2>

    <!-- 动态表格 -->
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
import { DynamicTable } from '@/modules/metadata'

const router = useRouter()

function handleCreate() {
  router.push({ name: 'MetadataFormCreate', params: { tableId: 1 } })
}

function handleView(record: any) {
  router.push({ name: 'MetadataFormView', params: { tableId: 1, id: record.ID } })
}

function handleEdit(record: any) {
  router.push({ name: 'MetadataFormEdit', params: { tableId: 1, id: record.ID } })
}
</script>

<style scoped>
.page-container {
  padding: 16px;
}
</style>
```

---

## 📋 需要准备什么？

### 数据库配置（必须）

在数据库中需要有以下表和数据：

1. **sys_subsystem** - 子系统表（至少 1 条记录）
2. **sys_table_category** - 表类别表（至少 1 条记录）
3. **sys_table** - 表单配置表（至少 1 条记录）
   - 重要字段：TABLE_NAME（物理表名）、DISPLAY_NAME（显示名称）
4. **sys_column** - 字段配置表（每个表单至少 1 条记录）
   - 重要字段：DB_NAME（数据库字段名）、CONTROL_TYPE（控件类型）
5. **业务数据表** - 与 TABLE_NAME 对应的实际数据表

### 后端 API（必须）

确保以下 API 端点可用：

```
GET  /api/v1/metadata/subsystems
GET  /api/v1/metadata/categories?subsystemId={id}
GET  /api/v1/metadata/tables?categoryId={id}
GET  /api/v1/metadata/tables/{id}
GET  /api/v1/metadata/columns?tableId={id}
GET  /api/v1/metadata/data/{tableName}
POST /api/v1/metadata/data/{tableName}
PUT  /api/v1/metadata/data/{tableName}/{id}
DELETE /api/v1/metadata/data/{tableName}/{id}
```

---

## ⚡ 零配置使用

如果数据库已配置好，你只需：

1. 在浏览器输入 `/metadata/list`
2. 点击左侧树形节点
3. 开始使用！

**不需要写任何代码！**

---

## 🎁 已有功能

### 列表页自动包含：
- ✅ 分页（每页 20 条，可切换 10/20/50/100）
- ✅ 排序（点击列标题）
- ✅ 筛选（顶部筛选栏）
- ✅ 批量删除
- ✅ 列设置（自定义显示列）
- ✅ 导出（点击导出按钮）
- ✅ 权限控制（基于 MASK 字段）

### 表单页自动包含：
- ✅ 字段验证（必填、长度、正则）
- ✅ 字段分组（基础/折叠/系统）
- ✅ 级联显示（字段依赖关系）
- ✅ 三种模式（新增/编辑/查看）
- ✅ 上一条/下一条导航
- ✅ 复制/打印功能
- ✅ 子表支持（选项卡显示）

---

## 🆘 遇到问题？

### 问题 1: 页面显示"没有可用的子系统"
**原因**: 数据库中没有元数据配置
**解决**: 运行数据库初始化脚本

### 问题 2: 点击树形节点没反应
**原因**: 后端 API 未启动或返回错误
**解决**: 检查浏览器控制台的网络请求

### 问题 3: 表单字段没有显示
**原因**: sys_column 表中没有该表单的字段配置
**解决**: 在 sys_column 表中添加字段配置

---

## 📚 更多资源

- [完整路由使用指南](./ROUTE_USAGE_GUIDE.md)
- [DynamicForm 组件文档](./src/modules/metadata/components/DynamicForm/README.md)
- [DynamicTable 组件文档](./src/modules/metadata/components/DynamicTable/README.md)
- [自动化测试文档](./TEST_DOCUMENTATION.md)

---

## 🎉 开始使用

现在你已经知道了所有基础知识，打开浏览器输入：

```
http://localhost:5181/metadata/list
```

开始探索吧！🚀

---

**提示**: 如果这是你第一次使用，建议先在浏览器中手动访问各个页面，熟悉流程后再在代码中集成。
