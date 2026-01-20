# MASK 字段权限配置说明

## 概述

MASK 是一个 10 位字符串，用于控制字段在不同场景下的可见性和可编辑性。每一位代表不同的权限：

```
位置:  1  2  3  4  5  6  7  8  9  10
索引:  0  1  2  3  4  5  6  7  8  9
示例:  1  1  1  1  1  1  0  0  0  0
```

## MASK 位定义

| 位置 | 索引 | 含义 | 说明 |
|------|------|------|------|
| 1 | 0 | 新增可见 | 字段在新增表单中是否显示 |
| 2 | 1 | 新增可编辑 | 字段在新增表单中是否可编辑 |
| 3 | 2 | 修改可见 | 字段在编辑表单中是否显示 |
| 4 | 3 | 修改可编辑 | 字段在编辑表单中是否可编辑 |
| 5 | 4 | 列表可见 | 字段在列表页面中是否显示 |
| 6 | 5 | 列表可编辑 | 字段在列表中是否可编辑（行内编辑）|
| 7 | 6 | 导入 | 字段是否支持导入 |
| 8 | 7 | 导出 | 字段是否支持导出 |
| 9 | 8 | 打印 | 字段是否在打印中显示 |
| 10 | 9 | 其他 | 预留位 |

## 常用配置示例

### 1. 所有权限开放
```
MASK: "1111111111"
```
- 新增：可见、可编辑
- 修改：可见、可编辑
- 列表：可见、可编辑
- 支持导入、导出、打印

**适用场景**：普通业务字段，如 NAME（公司名称）

---

### 2. 系统字段（完全隐藏）
```
MASK: "0000000000"
```
- 新增：不可见
- 修改：不可见
- 列表：不可见

**适用场景**：系统字段，如 ID, CREATE_BY, CREATE_TIME, UPDATE_BY, UPDATE_TIME

---

### 3. 新增不显示，修改可见
```
MASK: "0011110000"
```
- 新增：不可见
- 修改：可见、可编辑
- 列表：可见、可编辑

**适用场景**：如 UPDATE_TIME（更新时间），创建时不显示，修改时显示

---

### 4. 只读字段
```
MASK: "1010100000"
```
- 新增：可见、不可编辑（只读）
- 修改：可见、不可编辑（只读）
- 列表：可见

**适用场景**：自动生成的字段，如编号、状态等

---

### 5. 列表不显示，表单显示
```
MASK: "1111000000"
```
- 新增：可见、可编辑
- 修改：可见、可编辑
- 列表：不可见

**适用场景**：详细信息字段，如备注、描述等（列表中不需要显示）

---

## 代码实现位置

### 1. 列表页字段过滤（第 5 位）

**文件**: `src/modules/metadata/stores/useMetadataStore.ts`

**方法**: `getGridColumns()`

```typescript
function getGridColumns(tableId: number): SysColumn[] {
  return getVisibleColumns(tableId).filter(c => {
    // 检查字段 MASK 的第 5 位（索引 4）：列表可见
    const mask = c.MASK || (c as any).mask
    if (mask && mask.length >= 5) {
      const listVisible = mask[4] === '1'
      return listVisible
    }
    return true
  })
}
```

---

### 2. 新增/修改表单字段过滤（第 1、3 位）

**文件**: `src/modules/metadata/composables/useDynamicForm.ts`

**方法**: `formColumns` 计算属性

```typescript
const formColumns = computed(() => {
  if (!tableConfig.value) return []
  return tableConfig.value.columns
    .filter(c => {
      const mask = c.MASK || (c as any).mask
      if (mask && mask.length >= 4) {
        if (mode === 'create') {
          // 新增模式：检查第 1 位（索引 0）
          if (mask[0] !== '1') {
            return false
          }
        } else if (mode === 'edit') {
          // 修改模式：检查第 3 位（索引 2）
          if (mask[2] !== '1') {
            return false
          }
        }
      }
      return true
    })
    .sort((a, b) => (a.ORDERNO || 0) - (b.ORDERNO || 0))
})
```

---

### 3. 字段可编辑性检查（第 2、4 位）

**文件**: `src/modules/metadata/composables/useDynamicForm.ts`

**方法**: `isFieldReadonly()`

```typescript
function isFieldReadonly(column: SysColumn): boolean {
  // 查看模式下所有字段都只读
  if (isReadonly.value) return true

  // 字段本身配置为只读
  if (column.IS_READONLY === 'Y') return true

  // 根据 MASK 检查是否可编辑
  const mask = column.MASK || (column as any).mask
  if (mask && mask.length >= 4) {
    if (mode === 'create') {
      // 新增模式：检查第 2 位（索引 1）
      if (mask[1] !== '1') {
        return true  // 不可编辑 = 只读
      }
    } else if (mode === 'edit') {
      // 修改模式：检查第 4 位（索引 3）
      if (mask[3] !== '1') {
        return true  // 不可编辑 = 只读
      }
    }
  }

  return false
}
```

---

**文件**: `src/modules/metadata/composables/useFieldRenderer.ts`

**方法**: `isReadonly` 计算属性（与上面逻辑相同）

---

## 后端字段名兼容性

前端同时支持后端返回的两种字段格式：

| 前端期望（UPPERCASE） | 后端返回（camelCase） | 兼容方式 |
|----------------------|----------------------|----------|
| `MASK` | `mask` | `c.MASK \|\| (c as any).mask` |
| `DB_NAME` | `dbName` | `c.DB_NAME \|\| (c as any).dbName` |
| `DISPLAY_NAME` | `displayName` | `c.DISPLAY_NAME \|\| (c as any).displayName` |
| `GRID_WIDTH` | `displayCols` | `c.GRID_WIDTH \|\| (c as any).displayCols` |
| `IS_VISIBLE` | `isVisible` | `c.IS_VISIBLE \|\| (c as any).isVisible` |
| `IS_ACTIVE` | `isActive` | `c.IS_ACTIVE \|\| (c as any).isActive` |

字段映射在 `useMetadataStore.ts` 的 `loadTableConfig()` 方法中完成。

---

## 测试验证

通过浏览器自动化测试验证 MASK 配置是否生效：

**测试文件**: `test-company-form.js`

**测试结果**: 8/9 通过 (88.89%)

✅ 列表页只显示 MASK[4] = '1' 的字段
✅ 新增页只显示 MASK[0] = '1' 的字段
✅ 编辑页只显示 MASK[2] = '1' 的字段
✅ MASK[1] = '0' 的字段在新增页只读
✅ MASK[3] = '0' 的字段在编辑页只读

---

## 注意事项

1. **MASK 长度检查**: 代码中会检查 `mask.length >= 4` 或 `>= 5`，确保不会因 MASK 长度不足而报错

2. **默认行为**: 如果字段没有 MASK 配置或 MASK 为空字符串，默认为可见可编辑

3. **系统字段特殊处理**: ID、CREATE_BY、CREATE_TIME 等系统字段即使 MASK 为 "0000000000"，也会在系统信息组中以只读形式显示（取决于 `showSystemFields` prop）

4. **优先级**:
   - `mode = 'view'` > `IS_READONLY = 'Y'` > `MASK`
   - 即：查看模式强制只读 > 字段配置只读 > MASK 权限

5. **兼容性**: 代码同时兼容大写 `MASK` 和小写 `mask`，确保与不同后端版本兼容

---

## 相关文档

- 服务端逻辑文档: `F:\work\golang\src\github.com\sky-xhsoft\sky-server\服务端逻辑文档.md`
- 数据库设计: `sys_column` 表的 `MASK` 字段

---

**文档版本**: 1.0
**更新时间**: 2026-01-18
**维护者**: Claude Code
