# 字典项 CSS 样式功能文档

## 功能概述

本功能允许通过在 `sys_dict_item` 表中配置 `CSS_CLASS` 字段，为列表页的数据行和单元格应用自定义样式，并在表格底部显示图例说明。

## 功能特性

### 1. 整行样式应用

根据记录中 select 类型字段的字典项 CSS_CLASS 值，自动为整行应用对应的样式效果。

**支持的样式类型：**

#### Arco Design 标签颜色（彩色背景）
- `success` - 淡绿色背景（适用于：启用、成功、通过等）
- `danger` - 淡红色背景（适用于：禁用、失败、拒绝等）
- `warning` - 淡橙色背景（适用于：警告、待处理等）
- `primary` - 淡蓝色背景（适用于：主要、重要等）
- `info` - 淡灰色背景（适用于：信息、提示等）

#### 自定义样式类（文字样式 + 背景）
- `disabled` - 灰色斜体 + 淡灰背景（禁用/停用状态）
- `inactive` - 灰色斜体删除线 + 淡灰背景（非活动状态）
- `draft` - 浅灰色文字 + 淡灰背景（草稿状态）
- `pending` - 橙色文字 + 淡橙背景（待审核状态）
- `completed` - 绿色加粗 + 淡绿背景（已完成状态）
- `rejected` - 红色文字 + 淡红背景（已拒绝状态）
- `expired` - 灰色删除线 + 淡灰背景（已过期状态）

### 2. 图例显示

在表格左下角自动显示图例，格式为：

```
图例  字段名1: 值1 | 值2 | 值3  字段名2: 值A | 值B | 值C
```

**图例特性：**
- 按字段分组显示
- 显示字段的所有字典值（包括没有 CSS 样式的默认值）
- 有 CSS 样式的值显示为彩色标签或带样式文本
- 没有 CSS 样式的值显示为普通文本
- 自动换行，适应不同屏幕宽度

### 3. 单元格样式

除了整行样式外，单元格内的字典值也会显示对应的样式：
- Arco tag 颜色显示为彩色标签
- 自定义样式类显示为带样式的文本

## 使用方法

### 1. 数据库配置

在 `sys_dict_item` 表中设置 `CSS_CLASS` 字段：

```sql
-- 示例1：IS_ACTIVE 字典项
UPDATE sys_dict_item
SET CSS_CLASS = 'success'
WHERE SYS_DICT_ID = 1 AND VALUE = 'Y';  -- "是" 显示为绿色标签

UPDATE sys_dict_item
SET CSS_CLASS = 'disabled'
WHERE SYS_DICT_ID = 1 AND VALUE = 'N';  -- "否" 显示为灰色斜体

-- 示例2：审批状态字典项
UPDATE sys_dict_item
SET CSS_CLASS = 'draft'
WHERE SYS_DICT_ID = 10 AND VALUE = 'DRAFT';  -- 草稿

UPDATE sys_dict_item
SET CSS_CLASS = 'pending'
WHERE SYS_DICT_ID = 10 AND VALUE = 'PENDING';  -- 待审核

UPDATE sys_dict_item
SET CSS_CLASS = 'success'
WHERE SYS_DICT_ID = 10 AND VALUE = 'APPROVED';  -- 已批准

UPDATE sys_dict_item
SET CSS_CLASS = 'rejected'
WHERE SYS_DICT_ID = 10 AND VALUE = 'REJECTED';  -- 已拒绝

-- 示例3：订单状态字典项
UPDATE sys_dict_item
SET CSS_CLASS = 'draft'
WHERE SYS_DICT_ID = 20 AND VALUE = 'NEW';  -- 新订单

UPDATE sys_dict_item
SET CSS_CLASS = 'pending'
WHERE SYS_DICT_ID = 20 AND VALUE = 'PROCESSING';  -- 处理中

UPDATE sys_dict_item
SET CSS_CLASS = 'completed'
WHERE SYS_DICT_ID = 20 AND VALUE = 'COMPLETED';  -- 已完成

UPDATE sys_dict_item
SET CSS_CLASS = 'danger'
WHERE SYS_DICT_ID = 20 AND VALUE = 'CANCELLED';  -- 已取消
```

### 2. 前端自动应用

配置完成后，前端会自动：
1. 读取字典项的 `CSS_CLASS` 字段
2. 为列表页的数据行应用对应样式
3. 在表格底部显示图例

**无需任何前端代码修改！**

## 技术实现

### 后端实现

**文件：** `internal/api/handler/metadata_handler.go`

在 `GetTableConfig` 接口中返回字典数据，包含 `CSS_CLASS` 字段：

```go
// 返回的数据结构
{
  "table": {...},
  "columns": [...],
  "dictData": {
    "1": [  // 字典ID
      {
        "ID": 1,
        "VALUE": "Y",
        "DISPLAY_NAME": "是",
        "CSS_CLASS": "success",  // CSS 样式类
        "IS_DEFAULT_VALUE": "Y"
      },
      {
        "ID": 2,
        "VALUE": "N",
        "DISPLAY_NAME": "否",
        "CSS_CLASS": "disabled",
        "IS_DEFAULT_VALUE": "N"
      }
    ]
  }
}
```

### 前端实现

**核心文件：** `src/modules/metadata/components/DynamicTable/DynamicTable.vue`

#### 1. 行样式函数

```typescript
function getRowClass(record: FormData, rowIndex: number): string | string[] {
  // 查找所有 select 类型的列
  const selectColumns = tableColumns.value.filter(col => {
    const originalColumn = tableConfig.value?.columns.find(c => {
      const dbName = c.DB_NAME || (c as any).dbName
      return dbName === col.dataIndex
    })
    const setValueType = originalColumn?.SET_VALUE_TYPE || (originalColumn as any)?.setValueType
    return setValueType === 'select'
  })

  // 遍历所有 select 列，找到第一个有 CSS_CLASS 的值
  for (const column of selectColumns) {
    const value = record[column.dataIndex]
    if (!value) continue

    // 查找字典项
    const item = findDictItem(column, value)
    if (item) {
      const cssClass = item.CSS_CLASS || (item as any).cssClass
      if (cssClass) {
        // 返回行样式类
        if (['success', 'danger', 'warning', 'primary', 'info'].includes(cssClass)) {
          return `row-${cssClass}`
        }
        return `row-dict-label-${cssClass}`
      }
    }
  }

  return ''
}
```

#### 2. 图例计算

```typescript
const legendItems = computed(() => {
  const legends: Array<{
    fieldName: string
    fieldLabel: string
    items: Array<{
      value: string
      label: string
      cssClass?: string
      isTag: boolean
    }>
  }> = []

  // 为每个 select 列生成图例
  selectColumns.forEach(column => {
    const dictItems = getDictItems(column)
    if (!dictItems || dictItems.length === 0) return

    const items = dictItems.map(item => ({
      value: item.VALUE,
      label: item.DISPLAY_NAME,
      cssClass: item.CSS_CLASS || undefined,
      isTag: item.CSS_CLASS && ['success', 'danger', 'warning', 'primary', 'info'].includes(item.CSS_CLASS)
    }))

    legends.push({
      fieldName: column.DB_NAME,
      fieldLabel: column.DISPLAY_NAME,
      items
    })
  })

  return legends
})
```

#### 3. CSS 样式

```css
/* 整行样式 - disabled 示例 */
.dynamic-table :deep(tr.row-dict-label-disabled),
.dynamic-table :deep(.arco-table-tr.row-dict-label-disabled) {
  color: #999 !important;
  font-style: italic !important;
  background-color: rgba(153, 153, 153, 0.05) !important;
}

.dynamic-table :deep(tr.row-dict-label-disabled td),
.dynamic-table :deep(.arco-table-tr.row-dict-label-disabled td) {
  color: #999 !important;
  font-style: italic !important;
}

/* 图例样式 */
.table-legend {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 12px 16px;
  background: #f7f8fa;
  border-top: 1px solid #e5e6eb;
  font-size: 13px;
}
```

## 效果展示

### 示例1：IS_ACTIVE 字段

| ID | 公司名称 | IS_ACTIVE | 创建时间 |
|----|---------|-----------|---------|
| 1  | 公司A   | 是 (绿色标签) | 2026-01-20 | ← 整行淡绿色背景
| 2  | 公司B   | 否 (灰色斜体) | 2026-01-21 | ← 整行灰色斜体 + 淡灰背景

**图例：** `IS_ACTIVE: [是] | 否`

### 示例2：审批状态

| ID | 申请单号 | 状态 | 申请人 |
|----|---------|------|--------|
| 1  | AP001   | 草稿 (浅灰) | 张三 | ← 整行浅灰色
| 2  | AP002   | 待审核 (橙色) | 李四 | ← 整行橙色 + 淡橙背景
| 3  | AP003   | 已批准 (绿色加粗) | 王五 | ← 整行绿色加粗 + 淡绿背景
| 4  | AP004   | 已拒绝 (红色) | 赵六 | ← 整行红色 + 淡红背景

**图例：** `状态: 草稿 | 待审核 | [已批准] | 已拒绝`

## 注意事项

### 1. 优先级规则

如果一行记录有多个 select 字段都配置了 CSS_CLASS，则使用**第一个找到的**样式。

建议：
- 为每个表只配置一个主要的状态字段（如 IS_ACTIVE、STATUS 等）
- 如果需要多个字段都显示样式，可以在单元格级别显示（已支持）

### 2. 性能考虑

- 图例数据在组件加载时计算一次，后续使用缓存
- 行样式函数会为每一行调用，但逻辑简单，性能影响可忽略
- 建议每个字典的选项数量控制在 20 个以内

### 3. 样式冲突

如果遇到样式不生效的问题：
1. 检查浏览器开发者工具，确认 `<tr>` 元素上是否有对应的 class
2. 检查 CSS 优先级，确保没有被其他样式覆盖
3. 所有样式都使用了 `!important`，优先级已经很高

### 4. 扩展自定义样式

如果需要添加新的自定义样式类，需要：

1. 在 `DynamicTable.vue` 的 `<style>` 部分添加 CSS 规则：

```css
.dynamic-table :deep(tr.row-dict-label-custom),
.dynamic-table :deep(.arco-table-tr.row-dict-label-custom) {
  /* 整行样式 */
  background-color: rgba(255, 0, 0, 0.05) !important;
}

.dynamic-table :deep(tr.row-dict-label-custom td),
.dynamic-table :deep(.arco-table-tr.row-dict-label-custom td) {
  /* 单元格样式 */
  color: red !important;
}

/* 单元格内的样式 */
.dict-label-custom {
  color: red;
  font-weight: bold;
}
```

2. 在数据库中使用：

```sql
UPDATE sys_dict_item
SET CSS_CLASS = 'custom'
WHERE SYS_DICT_ID = X AND VALUE = 'Y';
```

## 相关文件

### 前端文件
- `src/modules/metadata/components/DynamicTable/DynamicTable.vue` - 主要实现文件
- `src/modules/metadata/stores/useMetadataStore.ts` - 元数据存储
- `src/modules/metadata/types/index.ts` - 类型定义

### 后端文件
- `internal/api/handler/metadata_handler.go` - 元数据接口
- `internal/service/metadata/metadata_service.go` - 元数据服务
- `internal/model/entity/sys_dict.go` - 字典实体

### 数据库表
- `sys_dict` - 字典主表
- `sys_dict_item` - 字典项表（包含 CSS_CLASS 字段）

## 更新日志

### v1.0.0 (2026-01-23)
- ✅ 实现整行 CSS 样式功能
- ✅ 实现图例显示功能
- ✅ 支持 Arco Design 标签颜色
- ✅ 支持 7 种自定义样式类
- ✅ 修复 IS_ACTIVE 字段查询和更新问题

## 常见问题

### Q1: 为什么我配置了 CSS_CLASS 但没有效果？

**A:** 请检查：
1. 后端是否返回了 `dictData` 字段（查看网络请求）
2. 字段的 `SET_VALUE_TYPE` 是否为 `select`
3. 字段是否配置了 `SYS_DICT_ID`
4. 浏览器控制台是否有错误日志

### Q2: 可以为同一个字典的不同值配置不同样式吗？

**A:** 可以！每个字典项都可以配置独立的 `CSS_CLASS`。

### Q3: 图例显示太长怎么办？

**A:** 图例会自动换行。如果还是太长，建议：
1. 简化字典项的显示名称
2. 减少字典项数量
3. 将多个相关字典合并

### Q4: 可以隐藏图例吗？

**A:** 目前图例是自动显示的。如果需要隐藏，可以修改 `DynamicTable.vue` 的模板，添加一个 prop 控制显示/隐藏。

## 技术支持

如有问题，请联系开发团队或提交 Issue。
