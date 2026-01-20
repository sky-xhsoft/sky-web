# 元数据管理系统 UI/UX 设计规范

## 1. 整体布局设计

### 1.1 经典三栏布局

```
┌─────────────────────────────────────────────────────────────┐
│  顶部导航栏 (Header)                                          │
│  [系统名称]  [系统模块] [数据管理] [合作管理] ... [用户]       │
├────────┬────────────────────────────────────────────────────┤
│        │  面包屑导航 (Breadcrumb)                            │
│        │  > 数据配置 > 表                                     │
│  左侧  ├────────────────────────────────────────────────────┤
│  导航  │  查询条件区 (Filter Bar)                            │
│  树    │  [显示名称] [类型▼] [状态▼] ... [查询][配置][刷新]  │
│        ├────────────────────────────────────────────────────┤
│  (树型 │  数据表格区 (Data Table)                            │
│  菜单) │  ┌──┬────┬────┬────────┬────────┬────────┐        │
│        │  │☑│序号│名称│输入主键│显示主键│操作    │        │
│        │  ├──┼────┼────┼────────┼────────┼────────┤        │
│        │  │☐│1   │省份│PK      │NAME    │[编辑]  │        │
│        │  │☐│2   │城市│ID      │CITY    │[编辑]  │        │
│        │  └──┴────┴────┴────────┴────────┴────────┘        │
│        ├────────────────────────────────────────────────────┤
│        │  分页区 (Pagination)                                │
│        │  总记录:1-10/508 页 [<][>] [跳转]                   │
└────────┴────────────────────────────────────────────────────┘
```

### 1.2 响应式设计

**桌面端（>1200px）**
- 左侧导航：固定宽度 240px
- 主内容区：自适应宽度
- 表格：水平滚动

**平板端（768px-1200px）**
- 左侧导航：可折叠
- 主内容区：占满宽度
- 表格：缩小字体，水平滚动

**移动端（<768px）**
- 左侧导航：抽屉式
- 卡片式数据展示
- 表格改为列表

---

## 2. 颜色系统

### 2.1 主题色

```css
:root {
  /* 主色调 - 青绿色系（参考原界面） */
  --primary-color: #2B9E91;
  --primary-light: #3DB5A7;
  --primary-dark: #1F7A6F;
  --primary-bg: #E8F5F3;

  /* 辅助色 */
  --success-color: #52C41A;
  --warning-color: #FAAD14;
  --danger-color: #F5222D;
  --info-color: #1890FF;

  /* 中性色 */
  --text-primary: #262626;
  --text-secondary: #595959;
  --text-tertiary: #8C8C8C;
  --text-disabled: #BFBFBF;

  /* 背景色 */
  --bg-white: #FFFFFF;
  --bg-gray-1: #FAFAFA;
  --bg-gray-2: #F5F5F5;
  --bg-gray-3: #E8E8E8;

  /* 边框色 */
  --border-color: #D9D9D9;
  --border-light: #E8E8E8;

  /* 表格色 */
  --table-header-bg: #FAFAFA;
  --table-row-hover: #E6F7FF;
  --table-row-selected: #BAE7FF;
  --table-border: #E8E8E8;
}
```

### 2.2 功能色使用场景

| 颜色 | 使用场景 |
|------|---------|
| 主色调 | 按钮、链接、选中状态、导航高亮 |
| 成功色 | 成功提示、启用状态 |
| 警告色 | 警告提示、待处理状态 |
| 危险色 | 删除按钮、错误提示、禁用状态 |
| 信息色 | 一般信息提示、帮助文本 |

---

## 3. 组件设计规范

### 3.1 左侧导航树

```vue
<template>
  <aside class="metadata-sidebar">
    <!-- 搜索框 -->
    <div class="sidebar-search">
      <a-input-search
        v-model="searchKeyword"
        placeholder="搜索菜单"
        allow-clear
      />
    </div>

    <!-- 树形菜单 -->
    <div class="sidebar-tree">
      <a-tree
        :data="treeData"
        :selected-keys="selectedKeys"
        :expanded-keys="expandedKeys"
        :show-line="true"
        :block-node="true"
        @select="handleSelect"
      >
        <template #icon="{ node }">
          <icon-folder v-if="!node.isLeaf" />
          <icon-file v-else />
        </template>
      </a-tree>
    </div>

    <!-- 折叠按钮 -->
    <div class="sidebar-collapse">
      <a-button type="text" @click="toggleCollapse">
        <icon-menu-fold v-if="!collapsed" />
        <icon-menu-unfold v-else />
      </a-button>
    </div>
  </aside>
</template>

<style scoped>
.metadata-sidebar {
  width: 240px;
  height: 100%;
  background: #fff;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
}

.metadata-sidebar.collapsed {
  width: 60px;
}

.sidebar-search {
  padding: 12px;
  border-bottom: 1px solid var(--border-light);
}

.sidebar-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.sidebar-tree :deep(.arco-tree-node) {
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.sidebar-tree :deep(.arco-tree-node:hover) {
  background: var(--bg-gray-1);
}

.sidebar-tree :deep(.arco-tree-node-selected) {
  background: var(--primary-bg);
  color: var(--primary-color);
  font-weight: 500;
}

.sidebar-collapse {
  padding: 12px;
  border-top: 1px solid var(--border-light);
  text-align: center;
}
</style>
```

### 3.2 查询条件区

```vue
<template>
  <div class="filter-bar">
    <a-form
      layout="inline"
      :model="filterForm"
      class="filter-form"
    >
      <a-form-item label="显示名称">
        <a-input
          v-model="filterForm.displayName"
          placeholder="请输入显示名称"
          allow-clear
          style="width: 200px"
        />
      </a-form-item>

      <a-form-item label="类型">
        <a-select
          v-model="filterForm.type"
          placeholder="全部"
          allow-clear
          style="width: 150px"
        >
          <a-option value="table">表</a-option>
          <a-option value="view">视图</a-option>
        </a-select>
      </a-form-item>

      <a-form-item label="状态">
        <a-select
          v-model="filterForm.status"
          placeholder="全部"
          allow-clear
          style="width: 120px"
        >
          <a-option value="Y">启用</a-option>
          <a-option value="N">禁用</a-option>
        </a-select>
      </a-form-item>

      <a-form-item>
        <a-space>
          <a-button type="primary" @click="handleSearch">
            <template #icon><icon-search /></template>
            查询
          </a-button>
          <a-button @click="handleReset">
            <template #icon><icon-refresh /></template>
            重置
          </a-button>
          <a-button @click="showAdvancedFilter = !showAdvancedFilter">
            <template #icon>
              <icon-filter v-if="!showAdvancedFilter" />
              <icon-up v-else />
            </template>
            {{ showAdvancedFilter ? '收起' : '展开' }}
          </a-button>
        </a-space>
      </a-form-item>
    </a-form>

    <!-- 高级筛选（展开时显示） -->
    <div v-if="showAdvancedFilter" class="advanced-filter">
      <a-form layout="inline" :model="advancedForm">
        <!-- 更多筛选条件 -->
      </a-form>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  background: #fff;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.filter-form {
  margin-bottom: 0;
}

.filter-form :deep(.arco-form-item) {
  margin-bottom: 0;
  margin-right: 16px;
}

.advanced-filter {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}
</style>
```

### 3.3 数据表格

```vue
<template>
  <div class="data-table-container">
    <!-- 工具栏 -->
    <div class="table-toolbar">
      <div class="toolbar-left">
        <a-space>
          <a-button
            v-if="canCreate"
            type="primary"
            @click="handleCreate"
          >
            <template #icon><icon-plus /></template>
            新增
          </a-button>
          <a-button
            v-if="selectedRowKeys.length > 0"
            status="danger"
            @click="handleBatchDelete"
          >
            <template #icon><icon-delete /></template>
            批量删除 ({{ selectedRowKeys.length }})
          </a-button>
          <a-button @click="handleExport">
            <template #icon><icon-download /></template>
            导出
          </a-button>
        </a-space>
      </div>

      <div class="toolbar-right">
        <a-space>
          <a-tooltip content="列设置">
            <a-button
              type="text"
              @click="showColumnSettings = true"
            >
              <icon-settings />
            </a-button>
          </a-tooltip>
          <a-tooltip content="刷新">
            <a-button type="text" @click="handleRefresh">
              <icon-refresh />
            </a-button>
          </a-tooltip>
        </a-space>
      </div>
    </div>

    <!-- 表格 -->
    <a-table
      :columns="visibleColumns"
      :data="tableData"
      :loading="loading"
      :pagination="paginationConfig"
      :row-selection="rowSelection"
      :scroll="{ x: 'max-content' }"
      :bordered="{ cell: true }"
      :stripe="true"
      :hoverable="true"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <!-- 序号列 -->
      <template #index="{ rowIndex }">
        {{ (pagination.page - 1) * pagination.pageSize + rowIndex + 1 }}
      </template>

      <!-- 操作列 -->
      <template #actions="{ record }">
        <a-space>
          <a-button
            type="text"
            size="small"
            @click="handleEdit(record)"
          >
            编辑
          </a-button>
          <a-button
            type="text"
            size="small"
            @click="handleView(record)"
          >
            查看
          </a-button>
          <a-popconfirm
            content="确定要删除这条记录吗？"
            @ok="handleDelete(record)"
          >
            <a-button
              type="text"
              status="danger"
              size="small"
            >
              删除
            </a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>
  </div>
</template>

<style scoped>
.data-table-container {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-light);
}

.data-table-container :deep(.arco-table) {
  border-radius: 0 0 4px 4px;
}

.data-table-container :deep(.arco-table-th) {
  background: var(--table-header-bg);
  font-weight: 600;
  color: var(--text-primary);
}

.data-table-container :deep(.arco-table-tr:hover) {
  background: var(--table-row-hover);
}

.data-table-container :deep(.arco-table-tr.arco-table-tr-checked) {
  background: var(--table-row-selected);
}

.data-table-container :deep(.arco-table-td) {
  padding: 12px 16px;
}
</style>
```

### 3.4 表单设计器

```vue
<template>
  <div class="table-designer">
    <a-layout>
      <!-- 左侧：字段列表 -->
      <a-layout-sider
        :width="300"
        :resize-directions="['right']"
        class="designer-sider"
      >
        <div class="sider-header">
          <h3>字段列表</h3>
          <a-button type="primary" size="small" @click="handleAddField">
            <template #icon><icon-plus /></template>
            新增字段
          </a-button>
        </div>

        <div class="field-list">
          <a-collapse :default-active-key="['basic', 'advanced']">
            <a-collapse-item key="basic" header="基础字段">
              <draggable
                v-model="basicFields"
                :group="{ name: 'fields', pull: 'clone', put: false }"
                :sort="false"
                :clone="cloneField"
                item-key="id"
              >
                <template #item="{ element }">
                  <div class="field-item">
                    <component :is="getFieldIcon(element.type)" />
                    <span>{{ element.label }}</span>
                  </div>
                </template>
              </draggable>
            </a-collapse-item>

            <a-collapse-item key="advanced" header="高级字段">
              <draggable
                v-model="advancedFields"
                :group="{ name: 'fields', pull: 'clone', put: false }"
                :sort="false"
                :clone="cloneField"
                item-key="id"
              >
                <template #item="{ element }">
                  <div class="field-item">
                    <component :is="getFieldIcon(element.type)" />
                    <span>{{ element.label }}</span>
                  </div>
                </template>
              </draggable>
            </a-collapse-item>
          </a-collapse>
        </div>
      </a-layout-sider>

      <!-- 中间：设计画布 -->
      <a-layout-content class="designer-content">
        <div class="canvas-header">
          <a-breadcrumb>
            <a-breadcrumb-item>表单设计</a-breadcrumb-item>
            <a-breadcrumb-item>{{ tableName }}</a-breadcrumb-item>
          </a-breadcrumb>

          <a-space>
            <a-button @click="handlePreview">
              <template #icon><icon-eye /></template>
              预览
            </a-button>
            <a-button type="primary" @click="handleSave">
              <template #icon><icon-save /></template>
              保存
            </a-button>
          </a-space>
        </div>

        <div class="canvas-body">
          <!-- 空状态 -->
          <div v-if="formFields.length === 0" class="canvas-empty">
            <icon-inbox :size="64" />
            <p>从左侧拖拽字段到此处</p>
          </div>

          <!-- 表单字段 -->
          <draggable
            v-else
            v-model="formFields"
            group="fields"
            item-key="id"
            class="form-canvas"
            @change="handleFieldsChange"
          >
            <template #item="{ element, index }">
              <div
                class="canvas-field"
                :class="{ active: selectedFieldIndex === index }"
                @click="handleSelectField(index)"
              >
                <div class="field-label">
                  {{ element.label }}
                  <span v-if="element.required" class="required">*</span>
                </div>
                <div class="field-control">
                  <component
                    :is="getFieldComponent(element.type)"
                    :disabled="true"
                    :placeholder="`请输入${element.label}`"
                  />
                </div>
                <div class="field-actions">
                  <a-button
                    type="text"
                    size="small"
                    @click.stop="handleEditField(index)"
                  >
                    <icon-edit />
                  </a-button>
                  <a-button
                    type="text"
                    size="small"
                    status="danger"
                    @click.stop="handleDeleteField(index)"
                  >
                    <icon-delete />
                  </a-button>
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </a-layout-content>

      <!-- 右侧：属性配置 -->
      <a-layout-sider
        :width="320"
        :resize-directions="['left']"
        class="designer-sider"
      >
        <div class="sider-header">
          <h3>字段属性</h3>
        </div>

        <div v-if="selectedField" class="property-panel">
          <a-form
            :model="selectedField"
            layout="vertical"
            size="small"
          >
            <a-form-item label="字段名称" field="dbName">
              <a-input v-model="selectedField.dbName" />
            </a-form-item>

            <a-form-item label="显示名称" field="label">
              <a-input v-model="selectedField.label" />
            </a-form-item>

            <a-form-item label="字段类型" field="type">
              <a-select v-model="selectedField.type">
                <a-option value="text">文本框</a-option>
                <a-option value="textarea">文本域</a-option>
                <a-option value="number">数字</a-option>
                <a-option value="select">下拉选择</a-option>
                <a-option value="date">日期</a-option>
                <a-option value="datetime">日期时间</a-option>
              </a-select>
            </a-form-item>

            <a-form-item label="是否必填">
              <a-switch v-model="selectedField.required" />
            </a-form-item>

            <a-form-item label="默认值" field="defaultValue">
              <a-input v-model="selectedField.defaultValue" />
            </a-form-item>

            <a-form-item label="占位符" field="placeholder">
              <a-input v-model="selectedField.placeholder" />
            </a-form-item>

            <a-form-item label="校验规则" field="validation">
              <a-input v-model="selectedField.validation" />
            </a-form-item>

            <a-form-item label="提示信息" field="description">
              <a-textarea
                v-model="selectedField.description"
                :max-length="200"
                show-word-limit
              />
            </a-form-item>
          </a-form>
        </div>

        <div v-else class="property-empty">
          <icon-info-circle :size="48" />
          <p>请选择一个字段</p>
        </div>
      </a-layout-sider>
    </a-layout>
  </div>
</template>

<style scoped>
.table-designer {
  height: calc(100vh - 120px);
  background: #fff;
}

.designer-sider {
  background: #fafafa;
  border-right: 1px solid var(--border-color);
}

.sider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  background: #fff;
}

.sider-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.field-list {
  padding: 16px;
  height: calc(100% - 60px);
  overflow-y: auto;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: move;
  transition: all 0.2s;
}

.field-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(43, 158, 145, 0.15);
}

.designer-content {
  display: flex;
  flex-direction: column;
}

.canvas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  background: #fff;
}

.canvas-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #f5f5f5;
}

.canvas-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
}

.form-canvas {
  background: #fff;
  border-radius: 4px;
  padding: 24px;
  min-height: 400px;
}

.canvas-field {
  position: relative;
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
  padding: 12px;
  margin-bottom: 16px;
  border: 2px dashed transparent;
  border-radius: 4px;
  transition: all 0.2s;
}

.canvas-field:hover {
  border-color: var(--primary-color);
  background: var(--primary-bg);
}

.canvas-field.active {
  border-color: var(--primary-color);
  border-style: solid;
  background: var(--primary-bg);
}

.field-label {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.field-label .required {
  color: var(--danger-color);
  margin-left: 4px;
}

.field-control {
  flex: 1;
}

.field-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: none;
}

.canvas-field:hover .field-actions {
  display: flex;
  gap: 4px;
}

.property-panel {
  padding: 16px;
  height: calc(100% - 60px);
  overflow-y: auto;
}

.property-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100% - 60px);
  color: var(--text-tertiary);
}
</style>
```

---

## 4. 交互规范

### 4.1 表格交互

| 交互 | 行为 |
|------|------|
| 单击行 | 选中该行，高亮显示 |
| 双击行 | 打开详情页/编辑弹窗 |
| 悬停行 | 背景色变化，显示操作按钮 |
| 拖拽列 | 调整列顺序 |
| 调整列宽 | 拖拽列分隔线 |
| 排序 | 点击列标题，显示升序/降序图标 |

### 4.2 表单交互

| 交互 | 行为 |
|------|------|
| 必填字段 | 标签后显示红色星号 * |
| 输入错误 | 输入框边框变红，下方显示错误提示 |
| 实时校验 | 失去焦点时触发校验 |
| 提交校验 | 提交时全量校验，第一个错误字段获得焦点 |
| 级联字段 | 根据父字段值动态显示/隐藏 |
| 自动完成 | 支持搜索、历史记录 |

### 4.3 按钮状态

| 状态 | 样式 |
|------|------|
| 默认 | 默认背景色 |
| 悬停 | 背景色加深，显示阴影 |
| 激活 | 背景色最深 |
| 禁用 | 灰色，降低透明度 |
| 加载 | 显示loading图标，禁止点击 |

---

## 5. 响应式断点

```css
/* 超小屏幕 */
@media (max-width: 576px) {
  .metadata-sidebar { display: none; }
  .filter-bar .arco-form { display: block; }
  .filter-bar .arco-form-item { width: 100%; margin-bottom: 12px; }
}

/* 小屏幕 */
@media (min-width: 576px) and (max-width: 768px) {
  .metadata-sidebar { width: 60px; }
}

/* 中等屏幕 */
@media (min-width: 768px) and (max-width: 992px) {
  .metadata-sidebar { width: 200px; }
}

/* 大屏幕 */
@media (min-width: 992px) and (max-width: 1200px) {
  .metadata-sidebar { width: 240px; }
}

/* 超大屏幕 */
@media (min-width: 1200px) {
  .metadata-sidebar { width: 280px; }
}
```

---

这个UI设计规范完全参考了您提供的界面风格，包含：

1. ✅ **经典三栏布局** - 左侧树形导航 + 顶部筛选 + 中间表格
2. ✅ **企业级视觉风格** - 青绿色主题 + 扁平化设计
3. ✅ **完整的组件库** - 导航树、筛选栏、数据表格、表单设计器
4. ✅ **交互规范** - 表格、表单、按钮的交互细节
5. ✅ **响应式设计** - 适配各种屏幕尺寸

接下来我可以：
1. **开始实现这些组件**
2. **创建完整的视图页面**
3. **集成到现有的云盘系统中**

您希望我继续做什么？
