# 外键（FK）功能设计方案

## 一、概述

本文档描述基于现有 `sys_table` 和 `sys_column` 表结构的外键功能完整设计方案。

### 1.1 设计目标

- 支持字段关联到其他表，实现数据引用关系
- 提供友好的下拉选择界面，显示关联表的可读信息
- 支持级联查询、级联显示等高级特性
- 保证数据一致性和引用完整性

### 1.2 适用场景

- **主从关系**：订单详情关联订单主表
- **分类字典**：商品关联商品分类
- **组织架构**：员工关联部门
- **多对一关系**：文章关联作者

---

## 二、数据库设计

### 2.1 sys_column 表中的外键相关字段

#### 2.1.1 现有字段（已实现）

| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `SET_VALUE_TYPE` | varchar(255) | 赋值方式，包含 `fk`（外键关联） | `'fk'` |
| `REF_TABLE_ID` | int | 关联表ID | `4`（指向 sys_company） |
| `REF_COLUMN_ID` | int | 关联字段ID（显示字段） | `100`（NAME 字段ID） |
| `REF_ON_DELETE` | varchar(255) | 外键删除动作 | `'noAction'`、`'cascade'`、`'setNull'` |
| `DISPLAY_TYPE` | varchar(255) | 显示控件类型 | `'select'` |

#### 2.1.2 字段说明

**SET_VALUE_TYPE = 'fk'**
- 标识该字段为外键类型
- 前端根据此值渲染外键选择器

**REF_TABLE_ID**
- 指向关联表的 `sys_table.ID`
- 用于查询关联表的元数据配置

**REF_COLUMN_ID**
- 指向关联表中用于显示的字段 `sys_column.ID`
- 例如：关联公司表时，显示 `NAME` 字段而不是 `ID`

**REF_ON_DELETE**
- `noAction`：不允许删除（如果有引用记录）
- `cascade`：级联删除（删除主记录时一并删除关联记录）
- `setNull`：置空（删除主记录时将外键字段设为 NULL）

**DISPLAY_TYPE**
- `select`：下拉选择框（适合少量数据）
- `text`：带搜索的文本框（适合大量数据）

### 2.2 示例配置

#### 场景：WF_TRANSITION 表的 SYS_COMPANY_ID 字段关联到 SYS_COMPANY 表

```sql
-- WF_TRANSITION.SYS_COMPANY_ID 字段配置
UPDATE sys_column SET
  SET_VALUE_TYPE = 'fk',                    -- 外键类型
  REF_TABLE_ID = 4,                         -- 关联到 sys_company 表
  REF_COLUMN_ID = 100,                      -- 显示 sys_company.NAME 字段
  REF_ON_DELETE = 'noAction',               -- 不允许删除有引用的公司
  DISPLAY_TYPE = 'select',                  -- 使用下拉选择
  NULL_ABLE = 'N'                           -- 必填
WHERE DB_NAME = 'SYS_COMPANY_ID'
  AND SYS_TABLE_ID = (SELECT ID FROM sys_table WHERE NAME = 'WF_TRANSITION');
```

---

## 三、前端实现设计

### 3.1 类型定义扩展

#### 3.1.1 SysColumn 接口（已有，无需修改）

```typescript
// src/modules/metadata/types/index.ts

export interface SysColumn {
  // ... 现有字段 ...

  // 外键关联（映射数据库字段）
  SET_VALUE_TYPE?: string          // 'fk' 表示外键
  REF_TABLE_ID?: number            // 关联表ID
  REF_COLUMN_ID?: number           // 关联显示字段ID
  REF_ON_DELETE?: 'noAction' | 'cascade' | 'setNull'  // 删除动作

  DISPLAY_TYPE?: string            // 'select' | 'text'
}
```

#### 3.1.2 新增外键数据类型

```typescript
// src/modules/metadata/types/index.ts

/**
 * 外键选项
 */
export interface ForeignKeyOption {
  value: number | string      // 主键值
  label: string              // 显示文本
  record?: Record<string, any>  // 完整记录（可选）
}

/**
 * 外键配置
 */
export interface ForeignKeyConfig {
  tableId: number            // 关联表ID
  tableName: string          // 关联表名称
  displayColumnId: number    // 显示字段ID
  displayColumnName: string  // 显示字段名称
  valueColumnName: string    // 值字段名称（通常是 ID）
  onDelete: 'noAction' | 'cascade' | 'setNull'
}
```

### 3.2 API 接口设计

#### 3.2.1 获取外键选项列表

**接口路径**：`GET /api/metadata/foreign-key-options`

**请求参数**：
```typescript
{
  tableId: number          // 关联表ID
  columnId?: number        // 显示字段ID（可选，默认使用表的 DK 字段）
  search?: string          // 搜索关键字
  page?: number            // 分页页码
  pageSize?: number        // 每页条数
  filters?: Record<string, any>  // 额外筛选条件
}
```

**响应数据**：
```typescript
{
  code: 0,
  data: {
    list: [
      {
        value: 1,
        label: "北京公司",
        record: { ID: 1, NAME: "北京公司", ... }
      },
      ...
    ],
    total: 100,
    page: 1,
    pageSize: 20
  }
}
```

#### 3.2.2 获取外键配置

**接口路径**：`GET /api/metadata/foreign-key-config/:columnId`

**响应数据**：
```typescript
{
  code: 0,
  data: {
    tableId: 4,
    tableName: "SYS_COMPANY",
    displayColumnId: 100,
    displayColumnName: "NAME",
    valueColumnName: "ID",
    onDelete: "noAction"
  }
}
```

### 3.3 组件设计

#### 3.3.1 ForeignKeyField 组件

**文件路径**：`src/modules/metadata/components/FieldRenderers/ForeignKeyField.vue`

**功能**：
- 根据 `DISPLAY_TYPE` 渲染不同控件（select 或带搜索的 input）
- 支持远程搜索和分页加载
- 支持清空选项
- 显示关联记录的友好名称

**Props**：
```typescript
interface Props {
  column: SysColumn        // 字段配置
  modelValue: number | string | null  // 当前值（外键ID）
  mode: FormMode          // 表单模式
  disabled?: boolean      // 是否禁用
}
```

**组件结构**：
```vue
<template>
  <div class="foreign-key-field">
    <!-- 下拉选择模式 -->
    <a-select
      v-if="displayType === 'select'"
      v-model="currentValue"
      :options="options"
      :loading="loading"
      :allow-search="true"
      :allow-clear="true"
      :disabled="isDisabled"
      :placeholder="placeholder"
      @search="handleSearch"
      @change="handleChange"
    >
      <template #empty>
        <a-empty description="暂无数据" />
      </template>
    </a-select>

    <!-- 搜索选择模式（适合大数据量） -->
    <a-auto-complete
      v-else
      v-model="currentValue"
      :data="options"
      :loading="loading"
      :disabled="isDisabled"
      :placeholder="placeholder"
      @search="handleSearch"
      @select="handleSelect"
    >
      <template #option="{ data }">
        <div class="fk-option">
          <span class="fk-option-label">{{ data.label }}</span>
          <span class="fk-option-value">(ID: {{ data.value }})</span>
        </div>
      </template>
    </a-auto-complete>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useForeignKey } from '../../composables/useForeignKey'
import type { SysColumn, FormMode, ForeignKeyOption } from '../../types'

const props = defineProps<{
  column: SysColumn
  modelValue: number | string | null
  mode: FormMode
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | string | null]
  'change': [value: number | string | null, option: ForeignKeyOption | null]
}>()

// 使用外键 composable
const {
  options,
  loading,
  config,
  loadOptions,
  searchOptions,
  getDisplayValue
} = useForeignKey(props.column)

const currentValue = ref(props.modelValue)
const displayType = computed(() => props.column.DISPLAY_TYPE || 'select')
const isDisabled = computed(() => props.disabled || props.mode === 'view')
const placeholder = computed(() => props.column.PLACEHOLDER || '请选择')

// 初始化
onMounted(async () => {
  await loadOptions()

  // 如果有初始值，加载显示文本
  if (props.modelValue) {
    await getDisplayValue(props.modelValue)
  }
})

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  currentValue.value = newVal
})

// 搜索处理
async function handleSearch(keyword: string) {
  await searchOptions(keyword)
}

// 值变化处理
function handleChange(value: number | string | null) {
  const option = options.value.find(opt => opt.value === value)
  emit('update:modelValue', value)
  emit('change', value, option || null)
}

// 选择处理
function handleSelect(value: number | string) {
  handleChange(value)
}
</script>

<style scoped>
.foreign-key-field {
  width: 100%;
}

.fk-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fk-option-label {
  flex: 1;
  font-weight: 500;
}

.fk-option-value {
  color: var(--color-text-3);
  font-size: 12px;
  margin-left: 8px;
}
</style>
```

#### 3.3.2 useForeignKey Composable

**文件路径**：`src/modules/metadata/composables/useForeignKey.ts`

**功能**：
- 加载外键选项列表
- 实现搜索和分页
- 缓存已加载的选项
- 获取单个值的显示文本

```typescript
/**
 * 外键字段 - Composable
 */

import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import * as api from '../api/metadata'
import type { SysColumn, ForeignKeyOption, ForeignKeyConfig } from '../types'

export function useForeignKey(column: SysColumn) {
  const options = ref<ForeignKeyOption[]>([])
  const loading = ref(false)
  const config = ref<ForeignKeyConfig | null>(null)
  const page = ref(1)
  const pageSize = ref(100)
  const total = ref(0)
  const searchKeyword = ref('')

  // 选项缓存（避免重复加载）
  const optionsCache = new Map<string, ForeignKeyOption[]>()

  /**
   * 是否为外键字段
   */
  const isForeignKey = computed(() => {
    return column.SET_VALUE_TYPE === 'fk' && column.REF_TABLE_ID
  })

  /**
   * 加载外键配置
   */
  async function loadConfig() {
    if (!isForeignKey.value || config.value) return

    try {
      const result = await api.getForeignKeyConfig(column.ID!)
      config.value = result
    } catch (error: any) {
      Message.error(error.message || '加载外键配置失败')
      throw error
    }
  }

  /**
   * 加载选项列表
   */
  async function loadOptions(params?: {
    search?: string
    page?: number
    pageSize?: number
  }) {
    if (!isForeignKey.value) return

    await loadConfig()

    const cacheKey = `${params?.search || ''}_${params?.page || 1}`
    if (optionsCache.has(cacheKey)) {
      options.value = optionsCache.get(cacheKey)!
      return
    }

    loading.value = true
    try {
      const result = await api.getForeignKeyOptions({
        tableId: column.REF_TABLE_ID!,
        columnId: column.REF_COLUMN_ID,
        search: params?.search || searchKeyword.value,
        page: params?.page || page.value,
        pageSize: params?.pageSize || pageSize.value
      })

      options.value = result.list
      total.value = result.total

      // 缓存结果
      optionsCache.set(cacheKey, result.list)
    } catch (error: any) {
      Message.error(error.message || '加载选项失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 搜索选项
   */
  async function searchOptions(keyword: string) {
    searchKeyword.value = keyword
    page.value = 1
    await loadOptions({ search: keyword })
  }

  /**
   * 加载更多选项（分页）
   */
  async function loadMore() {
    if (options.value.length >= total.value) return
    page.value++
    const newOptions = await loadOptions({ page: page.value })
    if (newOptions) {
      options.value = [...options.value, ...newOptions]
    }
  }

  /**
   * 根据值获取显示文本
   */
  async function getDisplayValue(value: number | string): Promise<string> {
    if (!value) return ''

    // 先从已加载的选项中查找
    const option = options.value.find(opt => opt.value === value)
    if (option) return option.label

    // 如果没找到，单独请求
    try {
      const result = await api.getForeignKeyDisplayValue(
        column.REF_TABLE_ID!,
        value,
        column.REF_COLUMN_ID
      )
      return result
    } catch (error) {
      console.error('获取外键显示值失败:', error)
      return String(value)
    }
  }

  /**
   * 清空缓存
   */
  function clearCache() {
    optionsCache.clear()
  }

  return {
    // 状态
    options,
    loading,
    config,
    page,
    total,
    isForeignKey,

    // 方法
    loadConfig,
    loadOptions,
    searchOptions,
    loadMore,
    getDisplayValue,
    clearCache
  }
}
```

### 3.4 DynamicFormItem 集成

修改 `DynamicFormItem.vue` 以支持外键字段：

```typescript
// src/modules/metadata/components/DynamicForm/DynamicFormItem.vue

const fieldComponent = computed(() => {
  // 优先判断 SET_VALUE_TYPE
  if (props.column.SET_VALUE_TYPE === 'fk') {
    return 'ForeignKeyField'
  }

  // 其次判断 DISPLAY_TYPE
  switch (props.column.DISPLAY_TYPE) {
    case 'text':
      return 'TextField'
    case 'textarea':
      return 'TextareaField'
    case 'select':
      // 区分普通 select 和外键 select
      return props.column.REF_TABLE_ID ? 'ForeignKeyField' : 'SelectField'
    // ... 其他类型
    default:
      return 'TextField'
  }
})
```

### 3.5 表格显示优化

在 `DynamicTable.vue` 中，外键字段应显示关联记录的显示名称而不是 ID：

```typescript
// src/modules/metadata/components/DynamicTable/DynamicTable.vue

/**
 * 获取外键字段的显示值
 */
async function getForeignKeyDisplayValue(column: SysColumn, value: any): Promise<string> {
  if (!value || column.SET_VALUE_TYPE !== 'fk') return value

  try {
    const displayValue = await api.getForeignKeyDisplayValue(
      column.REF_TABLE_ID!,
      value,
      column.REF_COLUMN_ID
    )
    return displayValue
  } catch (error) {
    console.error('获取外键显示值失败:', error)
    return value
  }
}

// 在单元格渲染中使用
<template #cell="{ column, record }">
  <span v-if="column.SET_VALUE_TYPE === 'fk'">
    {{ getForeignKeyDisplayValue(column, record[column.DB_NAME]) }}
  </span>
  <span v-else>
    {{ record[column.DB_NAME] }}
  </span>
</template>
```

---

## 四、后端 API 实现要点

### 4.1 获取外键选项接口

```go
// GET /api/metadata/foreign-key-options
func GetForeignKeyOptions(c *gin.Context) {
    tableId := c.Query("tableId")
    columnId := c.Query("columnId")
    search := c.Query("search")
    page := c.DefaultQuery("page", "1")
    pageSize := c.DefaultQuery("pageSize", "100")

    // 1. 获取目标表的元数据配置
    tableConfig := getTableConfig(tableId)

    // 2. 确定显示字段（优先使用 columnId，其次使用表的 DK 字段）
    displayColumn := getDisplayColumn(tableId, columnId)

    // 3. 构建查询 SQL
    sql := fmt.Sprintf(
        "SELECT ID as value, %s as label FROM %s WHERE IS_ACTIVE = 'Y'",
        displayColumn.DB_NAME,
        tableConfig.NAME,
    )

    // 4. 添加搜索条件
    if search != "" {
        sql += fmt.Sprintf(" AND %s LIKE '%%%s%%'", displayColumn.DB_NAME, search)
    }

    // 5. 添加排序和分页
    sql += fmt.Sprintf(" ORDER BY %s LIMIT %s OFFSET %s",
        displayColumn.DB_NAME,
        pageSize,
        (page-1)*pageSize,
    )

    // 6. 执行查询
    var options []ForeignKeyOption
    db.Raw(sql).Scan(&options)

    // 7. 返回结果
    c.JSON(200, gin.H{
        "code": 0,
        "data": gin.H{
            "list":     options,
            "total":    getTotal(tableConfig.NAME),
            "page":     page,
            "pageSize": pageSize,
        },
    })
}
```

### 4.2 获取单个值的显示文本

```go
// GET /api/metadata/foreign-key-display-value
func GetForeignKeyDisplayValue(c *gin.Context) {
    tableId := c.Query("tableId")
    value := c.Query("value")
    columnId := c.Query("columnId")

    // 获取显示字段
    displayColumn := getDisplayColumn(tableId, columnId)

    // 查询显示值
    sql := fmt.Sprintf(
        "SELECT %s as label FROM %s WHERE ID = ? AND IS_ACTIVE = 'Y'",
        displayColumn.DB_NAME,
        getTableName(tableId),
    )

    var result struct {
        Label string `json:"label"`
    }
    db.Raw(sql, value).Scan(&result)

    c.JSON(200, gin.H{
        "code": 0,
        "data": result.Label,
    })
}
```

### 4.3 外键约束验证

在删除记录时检查外键约束：

```go
// DELETE /api/metadata/records/:tableName/:id
func DeleteRecord(c *gin.Context) {
    tableName := c.Param("tableName")
    id := c.Param("id")

    // 1. 查找所有引用该表的外键字段
    var refColumns []SysColumn
    db.Where("REF_TABLE_ID = ? AND SET_VALUE_TYPE = 'fk'", getTableId(tableName)).
        Find(&refColumns)

    // 2. 检查每个引用字段是否有记录
    for _, col := range refColumns {
        if col.REF_ON_DELETE == "noAction" {
            // 检查是否存在引用记录
            var count int64
            refTable := getTableName(col.SYS_TABLE_ID)
            db.Table(refTable).Where(fmt.Sprintf("%s = ?", col.DB_NAME), id).Count(&count)

            if count > 0 {
                c.JSON(400, gin.H{
                    "code": 1,
                    "message": fmt.Sprintf("无法删除，存在 %d 条关联记录", count),
                })
                return
            }
        }
    }

    // 3. 执行删除
    db.Table(tableName).Where("ID = ?", id).Update("IS_ACTIVE", "N")

    // 4. 处理级联删除
    for _, col := range refColumns {
        if col.REF_ON_DELETE == "cascade" {
            refTable := getTableName(col.SYS_TABLE_ID)
            db.Table(refTable).Where(fmt.Sprintf("%s = ?", col.DB_NAME), id).
                Update("IS_ACTIVE", "N")
        } else if col.REF_ON_DELETE == "setNull" {
            refTable := getTableName(col.SYS_TABLE_ID)
            db.Table(refTable).Where(fmt.Sprintf("%s = ?", col.DB_NAME), id).
                Update(col.DB_NAME, nil)
        }
    }

    c.JSON(200, gin.H{"code": 0, "message": "删除成功"})
}
```

---

## 五、高级特性

### 5.1 级联显示

**场景**：订单详情表显示订单的客户名称（跨两级关联）

**实现**：
- `ORDER_DETAIL.ORDER_ID` -> `ORDER` 表
- `ORDER.CUSTOMER_ID` -> `CUSTOMER` 表
- 显示：`CUSTOMER.NAME`

**方案**：
```typescript
// 在 sys_column 中配置级联关系
{
  DB_NAME: "ORDER_ID",
  SET_VALUE_TYPE: "fk",
  REF_TABLE_ID: 10,  // ORDER 表
  REF_COLUMN_ID: 100,  // ORDER.ORDER_NO
  PROPS: JSON.stringify({
    cascade: {
      displayFields: [
        {
          columnName: "CUSTOMER_ID",
          refTableId: 5,
          refColumnId: 50  // CUSTOMER.NAME
        }
      ]
    }
  })
}
```

### 5.2 条件过滤

**场景**：只显示当前公司的数据

**实现**：
```typescript
{
  DB_NAME: "DEPARTMENT_ID",
  SET_VALUE_TYPE: "fk",
  REF_TABLE_ID: 8,  // DEPARTMENT 表
  PROPS: JSON.stringify({
    filter: {
      SYS_COMPANY_ID: "$CURRENT_COMPANY_ID"  // 使用变量
    }
  })
}
```

前端在请求选项时自动添加过滤条件：
```typescript
await api.getForeignKeyOptions({
  tableId: 8,
  filters: {
    SYS_COMPANY_ID: currentUser.companyId
  }
})
```

### 5.3 依赖联动

**场景**：选择省份后，城市下拉框只显示该省的城市

**实现**：
```typescript
// 城市字段配置
{
  DB_NAME: "CITY_ID",
  SET_VALUE_TYPE: "fk",
  REF_TABLE_ID: 20,  // CITY 表
  PROPS: JSON.stringify({
    dependsOn: "PROVINCE_ID",  // 依赖省份字段
    dependsFilter: {
      PROVINCE_ID: "$PROVINCE_ID"  // 用省份ID过滤
    }
  })
}

// 前端实现
watch(() => formData.PROVINCE_ID, async (provinceId) => {
  // 省份变化时，清空城市
  formData.CITY_ID = null

  // 重新加载城市选项（带过滤条件）
  await loadOptions({
    filters: {
      PROVINCE_ID: provinceId
    }
  })
})
```

### 5.4 虚拟字段显示

**场景**：在列表中直接显示关联表的字段，无需存储

**实现**：
```typescript
// 在 sys_column 中添加虚拟字段
{
  DB_NAME: "COMPANY_NAME",  // 虚拟字段名
  SET_VALUE_TYPE: "virtual_fk",
  REF_TABLE_ID: 4,
  REF_COLUMN_ID: 100,  // sys_company.NAME
  SOURCE_COLUMN: "SYS_COMPANY_ID",  // 来源外键字段
  PROPS: JSON.stringify({
    virtual: true,
    sourceColumn: "SYS_COMPANY_ID"
  })
}

// 后端在查询时自动 JOIN
SELECT
  t.*,
  c.NAME as COMPANY_NAME
FROM wf_transition t
LEFT JOIN sys_company c ON t.SYS_COMPANY_ID = c.ID
```

---

## 六、性能优化

### 6.1 前端优化

1. **选项缓存**
   - 缓存已加载的选项，避免重复请求
   - 设置缓存过期时间（如 5 分钟）

2. **懒加载**
   - 下拉框使用虚拟滚动
   - 分页加载选项

3. **搜索防抖**
   - 搜索输入使用 debounce，减少请求频率

4. **预加载**
   - 表单初始化时预加载常用的外键选项

### 6.2 后端优化

1. **索引优化**
   ```sql
   -- 在外键字段上创建索引
   CREATE INDEX idx_company_id ON wf_transition(SYS_COMPANY_ID);

   -- 在显示字段上创建索引（用于搜索）
   CREATE INDEX idx_company_name ON sys_company(NAME);
   ```

2. **查询优化**
   - 只查询必要的字段（ID + 显示字段）
   - 使用 LIMIT 限制返回数量
   - 添加 `IS_ACTIVE = 'Y'` 条件过滤无效数据

3. **缓存策略**
   - Redis 缓存热门外键选项
   - 设置合理的缓存过期时间

---

## 七、使用示例

### 7.1 配置外键字段

```sql
-- 示例：配置 WF_TRANSITION 表的 FROM_NODE_ID 字段为外键

-- 1. 确保关联表存在
SELECT ID FROM sys_table WHERE NAME = 'WF_NODE';  -- 假设返回 25

-- 2. 确保显示字段存在
SELECT ID FROM sys_column
WHERE SYS_TABLE_ID = 25 AND DB_NAME = 'NAME';  -- 假设返回 250

-- 3. 更新字段配置
UPDATE sys_column SET
  SET_VALUE_TYPE = 'fk',
  REF_TABLE_ID = 25,
  REF_COLUMN_ID = 250,
  REF_ON_DELETE = 'noAction',
  DISPLAY_TYPE = 'select',
  NULL_ABLE = 'N'
WHERE SYS_TABLE_ID = (SELECT ID FROM sys_table WHERE NAME = 'WF_TRANSITION')
  AND DB_NAME = 'FROM_NODE_ID';
```

### 7.2 前端使用

表单中会自动渲染为下拉选择框：

```vue
<!-- DynamicFormItem 自动识别并渲染 ForeignKeyField -->
<DynamicFormItem
  :column="{
    DB_NAME: 'FROM_NODE_ID',
    DISPLAY_NAME: '起始节点',
    SET_VALUE_TYPE: 'fk',
    REF_TABLE_ID: 25,
    REF_COLUMN_ID: 250,
    ...
  }"
  v-model="formData.FROM_NODE_ID"
  :mode="'edit'"
/>

<!-- 渲染结果 -->
<a-select
  v-model="formData.FROM_NODE_ID"
  :options="[
    { value: 1, label: '开始节点' },
    { value: 2, label: '审批节点' },
    { value: 3, label: '结束节点' }
  ]"
  placeholder="请选择起始节点"
/>
```

### 7.3 表格中显示

```vue
<!-- DynamicTable 自动显示关联记录的名称 -->
<a-table-column
  title="起始节点"
  data-index="FROM_NODE_ID"
>
  <template #cell="{ record }">
    <!-- 显示 "开始节点" 而不是 "1" -->
    {{ getForeignKeyDisplayValue(column, record.FROM_NODE_ID) }}
  </template>
</a-table-column>
```

---

## 八、总结

### 8.1 核心特性

✅ **基于现有字段设计**，无需修改数据库结构
✅ **自动识别外键**，根据 `SET_VALUE_TYPE = 'fk'` 渲染
✅ **友好的选择界面**，支持搜索和分页
✅ **引用完整性保护**，支持 noAction/cascade/setNull
✅ **高级特性**，支持级联显示、条件过滤、依赖联动
✅ **性能优化**，缓存、懒加载、索引优化

### 8.2 实施步骤

1. **Phase 1：基础实现**
   - 实现 ForeignKeyField 组件
   - 实现 useForeignKey composable
   - 实现后端 API（获取选项、获取显示值）
   - 集成到 DynamicFormItem

2. **Phase 2：表格显示**
   - 在 DynamicTable 中显示关联名称
   - 优化加载性能

3. **Phase 3：高级特性**
   - 级联显示
   - 条件过滤
   - 依赖联动

4. **Phase 4：性能优化**
   - 添加缓存
   - 数据库索引优化
   - 虚拟滚动

### 8.3 注意事项

⚠️ **外键字段必须是数值类型**（与主键类型一致）
⚠️ **关联表必须有 IS_ACTIVE 字段**（过滤无效记录）
⚠️ **显示字段建议添加索引**（提升搜索性能）
⚠️ **谨慎使用级联删除**（可能导致数据丢失）
⚠️ **大数据量使用搜索模式**（避免加载全部选项）

---

## 九、附录

### 9.1 相关文件清单

**前端文件**：
- `src/modules/metadata/types/index.ts` - 类型定义
- `src/modules/metadata/components/FieldRenderers/ForeignKeyField.vue` - 外键字段组件
- `src/modules/metadata/composables/useForeignKey.ts` - 外键逻辑
- `src/modules/metadata/api/metadata.ts` - API 接口
- `src/modules/metadata/components/DynamicForm/DynamicFormItem.vue` - 集成点
- `src/modules/metadata/components/DynamicTable/DynamicTable.vue` - 表格显示

**后端文件**：
- `handlers/metadata.go` - API 处理器
- `models/sys_column.go` - 字段模型
- `services/foreign_key_service.go` - 外键服务

### 9.2 数据库字段映射

| 前端类型定义 | 数据库字段 | 说明 |
|-------------|-----------|------|
| SET_VALUE_TYPE | SET_VALUE_TYPE | 'fk' 表示外键 |
| REF_TABLE_ID | REF_TABLE_ID | 关联表ID |
| REF_COLUMN_ID | REF_COLUMN_ID | 显示字段ID |
| REF_ON_DELETE | REF_ON_DELETE | 删除动作 |
| DISPLAY_TYPE | DISPLAY_TYPE | 控件类型 |

---

**文档版本**：v1.0
**最后更新**：2025-01-21
**作者**：Claude Code
