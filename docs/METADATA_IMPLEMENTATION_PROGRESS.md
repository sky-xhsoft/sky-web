# 元数据驱动动态表单系统 - 实施进度

## 📦 已完成（Phase 1: Foundation Setup）

### 1. 目录结构创建 ✅

```
src/modules/metadata/
├── api/                    # API 接口层
├── stores/                 # Pinia 状态管理
├── views/                  # 页面视图
├── components/             # 组件
│   ├── DynamicForm/       # 动态表单组件
│   ├── DynamicTable/      # 动态表格组件
│   └── FieldRenderers/    # 字段渲染器
├── composables/            # 组合式函数
├── types/                  # TypeScript 类型定义
└── utils/                  # 工具函数
```

### 2. TypeScript 类型定义 ✅

**文件**: `src/modules/metadata/types/index.ts`

定义了完整的类型系统：
- `Subsystem` - 子系统
- `TableCategory` - 表类别
- `SysTable` - 表单配置
- `SysColumn` - 字段配置
- `SysDict` - 数据字典
- `TableConfig` - 表单配置（包含字段列表）
- `FormMode` - 表单模式（create/edit/view）
- `FormData` - 表单数据
- `ValidationRule` - 验证规则
- `PageRequest/PageResponse` - 分页请求/响应
- `ApiResponse` - API 响应
- `TreeNode` - 树节点
- 组件 Props 类型

### 3. API 接口层 ✅

**文件**: `src/modules/metadata/api/metadata.ts`

实现了完整的 RESTful API 接口：

**子系统管理**:
- `fetchSubsystems()` - 获取子系统列表
- `fetchSubsystem(id)` - 获取子系统详情
- `createSubsystem(params)` - 创建子系统
- `updateSubsystem(id, params)` - 更新子系统
- `deleteSubsystem(id)` - 删除子系统

**表类别管理**:
- `fetchTableCategories(subsystemId?)` - 获取表类别列表
- `fetchTableCategory(id)` - 获取表类别详情
- `createTableCategory(params)` - 创建表类别
- `updateTableCategory(id, params)` - 更新表类别
- `deleteTableCategory(id)` - 删除表类别

**表单配置管理**:
- `fetchTables(params?)` - 获取表单列表
- `fetchTable(id)` - 获取表单详情
- `fetchTableConfig(id)` - 获取表单完整配置（包含字段）
- `createTable(params)` - 创建表单
- `updateTable(id, params)` - 更新表单
- `deleteTable(id)` - 删除表单

**字段配置管理**:
- `fetchColumns(tableId)` - 获取字段列表
- `fetchColumn(id)` - 获取字段详情
- `createColumn(params)` - 创建字段
- `updateColumn(id, params)` - 更新字段
- `deleteColumn(id)` - 删除字段
- `updateColumnsOrder(tableId, columnIds)` - 批量更新字段排序

**数据字典管理**:
- `fetchDictItems(dictTableId)` - 获取字典列表
- `fetchDictTree(dictTableId)` - 获取字典树
- `createDictItem(params)` - 创建字典项
- `updateDictItem(id, params)` - 更新字典项
- `deleteDictItem(id)` - 删除字典项

**数据 CRUD**:
- `fetchRecords(tableName, params?)` - 查询数据列表
- `fetchRecord(tableName, id)` - 获取单条记录
- `createRecord(tableName, record)` - 创建记录
- `updateRecord(tableName, id, record)` - 更新记录
- `deleteRecord(tableName, id)` - 删除记录
- `batchDeleteRecords(tableName, ids)` - 批量删除记录

**业务流程**:
- `submitRecord(tableName, id)` - 提交记录
- `unsubmitRecord(tableName, id)` - 反提交记录
- `voidRecord(tableName, id)` - 作废记录

### 4. Pinia 状态管理 ✅

#### 4.1 MetadataStore

**文件**: `src/modules/metadata/stores/useMetadataStore.ts`

**职责**: 管理元数据（子系统、表类别、表单、字段）的加载和缓存

**状态**:
- `subsystems` - 子系统列表
- `tableCategories` - 表类别（按子系统ID分组）
- `tables` - 表单（按类别ID分组）
- `tableConfigs` - 表单配置缓存
- `columns` - 字段缓存（按表单ID分组）
- `loading` - 加载状态

**计算属性**:
- `activeSubsystems` - 激活的子系统列表
- `subsystemTree` - 子系统树（包含类别和表单）

**方法**:
- `loadSubsystems()` - 加载子系统列表
- `loadTableCategories(subsystemId)` - 加载表类别
- `loadTables(categoryId)` - 加载表单列表
- `loadTableConfig(tableId)` - 加载表单配置
- `getTableColumns(tableId)` - 获取字段列表
- `getVisibleColumns(tableId)` - 获取可见字段
- `getGridColumns(tableId)` - 获取表格列
- `clearCache()` - 清除所有缓存
- `reloadTree()` - 重新加载整个树结构

#### 4.2 DynamicFormStore

**文件**: `src/modules/metadata/stores/useDynamicFormStore.ts`

**职责**: 管理动态表单的数据状态

**状态**:
- `currentRecord` - 当前表单数据
- `mode` - 表单模式（create/edit/view）
- `loading` - 加载状态
- `submitting` - 提交状态
- `error` - 错误信息

**方法**:
- `loadRecord(tableName, id)` - 加载记录数据
- `createRecord(tableName, data)` - 创建记录
- `updateRecord(tableName, id, data)` - 更新记录
- `deleteRecord(tableName, id)` - 删除记录
- `submitRecord(tableName, id)` - 提交记录
- `unsubmitRecord(tableName, id)` - 反提交记录
- `voidRecord(tableName, id)` - 作废记录
- `reset()` - 重置表单
- `setFieldValue(field, value)` - 设置字段值
- `getFieldValue(field)` - 获取字段值

#### 4.3 DynamicTableStore

**文件**: `src/modules/metadata/stores/useDynamicTableStore.ts`

**职责**: 管理动态表格的列表数据和分页

**状态**:
- `records` - 数据列表
- `pagination` - 分页信息
- `filters` - 筛选条件
- `sorter` - 排序条件
- `selectedRowKeys` - 选中的行
- `loading` - 加载状态

**计算属性**:
- `hasSelection` - 是否有选中项
- `selectedCount` - 选中项数量

**方法**:
- `loadRecords(tableName, params?)` - 加载数据列表
- `refresh(tableName)` - 刷新列表
- `changePage(tableName, page)` - 切换页码
- `changePageSize(tableName, pageSize)` - 切换每页条数
- `updateFilters(tableName, filters)` - 更新筛选条件
- `resetFilters(tableName)` - 重置筛选
- `updateSorter(tableName, field, order)` - 更新排序
- `selectRows(keys)` - 选中行
- `toggleSelectAll(pkField)` - 全选/取消全选
- `clearSelection()` - 清除选中
- `getSelectedRecords(pkField)` - 获取选中的记录
- `batchDelete(tableName, ids)` - 批量删除
- `deleteRecord(tableName, id)` - 删除单条记录
- `reset()` - 重置状态

#### 4.4 DictStore

**文件**: `src/modules/metadata/stores/useDictStore.ts`

**职责**: 管理数据字典的加载和缓存

**状态**:
- `dictCache` - 字典数据缓存（按dictTableId分组）
- `dictTreeCache` - 字典树缓存
- `loading` - 加载状态

**方法**:
- `loadDictItems(dictTableId)` - 加载字典列表
- `loadDictTree(dictTableId)` - 加载字典树
- `getDictLabel(dictTableId, value)` - 获取显示文本
- `getDictLabels(dictTableId, values)` - 批量获取显示文本
- `toSelectOptions(dictTableId)` - 转换为 Select 选项
- `toTreeSelectOptions(dictTableId)` - 转换为 TreeSelect 选项
- `clearCache(dictTableId?)` - 清除缓存
- `preloadDicts(dictTableIds)` - 预加载多个字典

---

## ✅ 已完成（Phase 2: Composables）

### 1. 创建 Composables（组合式函数）✅

已创建：
- ✅ `useDynamicForm.ts` - 动态表单逻辑
  - 表单数据加载和管理
  - 字段验证（必填、正则、长度）
  - 表单提交（创建/更新）
  - 级联显示逻辑（shouldShowField）
  - 字段只读控制
  - 错误管理
- ✅ `useDynamicList.ts` - 动态列表逻辑
  - 数据列表加载
  - 分页管理
  - 筛选和排序
  - 行选择（单选/全选）
  - 批量删除
  - 权限控制（canCreate/canEdit/canDelete）
- ✅ `useFieldRenderer.ts` - 字段渲染逻辑
  - 组件名称映射
  - Props 自动生成
  - 验证规则生成
  - 值格式化和解析
  - 占位符和帮助文本

## 🚧 待实施（Phase 2: Components）

### 下一步计划

#### 2. 创建字段渲染器组件

需要创建 10+ 个字段渲染器：
- `TextField.vue` - 文本输入框
- `TextareaField.vue` - 多行文本
- `NumberField.vue` - 数字输入
- `SelectField.vue` - 下拉选择
- `RadioField.vue` - 单选框
- `CheckboxField.vue` - 复选框
- `DateField.vue` - 日期选择
- `DatetimeField.vue` - 日期时间选择
- `FileField.vue` - 文件上传
- `ImageField.vue` - 图片上传
- `ForeignKeyField.vue` - 外键关联
- `PasswordField.vue` - 密码输入
- `EmailField.vue` - 邮箱输入
- `UrlField.vue` - URL 输入

#### 3. 创建动态表单组件

- `DynamicForm.vue` - 主表单组件
- `DynamicFormItem.vue` - 表单项组件
- `FormFieldRenderer.vue` - 字段渲染器包装

#### 4. 创建动态表格组件

- `DynamicTable.vue` - 主表格组件
- `DynamicTableColumn.vue` - 表格列组件
- `TableToolbar.vue` - 工具栏组件
- `TableFilterBar.vue` - 筛选栏组件

#### 5. 创建视图页面

- `MetadataListView.vue` - 元数据列表页
- `MetadataFormView.vue` - 元数据表单页
- `DynamicListView.vue` - 动态列表页
- `DynamicFormView.vue` - 动态表单页

#### 6. 配置路由

在 `src/router/index.ts` 中添加元数据模块路由

#### 7. 创建模块入口

- `src/modules/metadata/index.ts` - 导出所有公共接口

---

## 📊 进度统计

- **总体进度**: 25%
- **Phase 1 (Foundation)**: ✅ 100% 完成
  - ✅ 目录结构
  - ✅ TypeScript 类型定义
  - ✅ API 接口层
  - ✅ Pinia 状态管理
- **Phase 2 (Components)**: 🚧 0% 待开始
- **Phase 3 (Views)**: ⏳ 未开始
- **Phase 4 (Integration)**: ⏳ 未开始

---

## 🎯 下一步行动

**立即开始**: Phase 2 - 创建组合式函数和组件

**预计工作量**:
- Composables: 4 小时
- 字段渲染器: 8 小时
- 动态表单组件: 6 小时
- 动态表格组件: 6 小时
- **合计**: 约 2-3 天

---

## 📝 技术亮点

1. **完整的类型系统**: 所有实体和接口都有 TypeScript 类型定义
2. **分层架构清晰**: API → Store → Composable → Component → View
3. **智能缓存机制**: MetadataStore 和 DictStore 都实现了缓存
4. **状态管理完善**: 4 个 Store 各司其职，职责清晰
5. **API 接口丰富**: 覆盖了所有 CRUD 操作和业务流程
6. **树形数据支持**: SubsystemTree 自动构建三层树结构
7. **字典系统**: 支持字典列表和树形字典
8. **分页和筛选**: DynamicTableStore 提供完整的列表管理功能
9. **批量操作**: 支持批量删除和选中管理

---

**创建时间**: 2026-01-19
**最后更新**: 2026-01-19
**文档版本**: 1.0
