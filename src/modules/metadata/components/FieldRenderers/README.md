# 表单字段配置完整文档

> **版本**: v2.0
> **最后更新**: 2026-01-28
> **维护者**: Sky Team

---

## 目录

1. [快速开始](#快速开始)
2. [核心概念](#核心概念)
3. [字段类型详解](#字段类型详解)
4. [布局配置](#布局配置)
5. [配置示例](#配置示例)
6. [最佳实践](#最佳实践)
7. [常见问题](#常见问题)
8. [附录](#附录)

---

## 快速开始

### 1. 安装依赖

```bash
cd /f/work/golang/src/github.com/sky-xhsoft/sky-web

# 富文本编辑器（必需）
npm install @wangeditor/editor
```

### 2. 基本使用

在 `sys_column` 表中配置字段：

```sql
-- 示例：配置 JSON 编辑器字段
UPDATE sys_column
SET
  DISPLAY_TYPE = 'json',
  DISPLAY_COLS = 2,
  DISPLAY_ROWS = 10,
  CONTROL_CONFIG = '{"placeholder": "请输入 JSON 数据"}'
WHERE
  SYS_TABLE_ID = 1
  AND DB_NAME = 'CONFIG_DATA';
```

---

## 核心概念

### 1. 字段类型配置

系统支持两种字段类型配置方式，优先级如下：

```
DISPLAY_TYPE > CONTROL_TYPE > 默认值
```

| 字段名 | 说明 | 示例 | 优先级 |
|--------|------|------|--------|
| `DISPLAY_TYPE` | 显示类型（推荐） | `'json'`, `'richtext'`, `'textarea'` | 高 |
| `CONTROL_TYPE` | 控件类型（兼容） | `'text'`, `'number'`, `'select'` | 中 |

**兼容性说明**：
- 支持大写：`DISPLAY_TYPE`, `DISPLAY_COLS`, `DISPLAY_ROWS`
- 支持小写：`displayType`, `displayCols`, `displayRows`（JSON 格式）
- 同时存在时，`DISPLAY_TYPE` 优先

### 2. 布局配置

| 字段名 | 类型 | 说明 | 默认值 | 范围 |
|--------|------|------|--------|------|
| `DISPLAY_COLS` | int | 字段占用的列数（宽度） | 1 | 1-4 |
| `DISPLAY_ROWS` | int | 字段占用的行数（高度） | 1 | 1-20 |

**计算公式**：
- 高度 = `DISPLAY_ROWS * 32 + (DISPLAY_ROWS - 1) * 8` 像素
- 例如：5 行 = 5 * 32 + 4 * 8 = 192px

### 3. 控件配置

| 字段名 | 类型 | 说明 | 格式 |
|--------|------|------|------|
| `CONTROL_CONFIG` | text | 控件的 JSON 配置 | 标准 JSON 字符串 |

**示例**：
```sql
CONTROL_CONFIG = '{"height": 300, "theme": "dark", "placeholder": "请输入..."}'
```

---

## 字段类型详解

### 支持的字段类型总览

| DISPLAY_TYPE | 组件名称 | DISPLAY_COLS | DISPLAY_ROWS | 说明 |
|-------------|---------|-------------|-------------|------|
| `text` | TextField | ✅ | ❌ | 单行文本输入框 |
| `textarea` | TextareaField | ✅ | ✅ | 多行文本输入框 |
| `number` | NumberField | ✅ | ❌ | 数字输入框 |
| `select` | SelectField | ✅ | ❌ | 下拉选择框 |
| `radio` | RadioField | ✅ | ❌ | 单选框 |
| `checkbox` | CheckboxField | ✅ | ❌ | 复选框 |
| `switch` | SwitchField | ✅ | ❌ | 开关 |
| `date` | DateField | ✅ | ❌ | 日期选择器 |
| `datetime` | DatetimeField | ✅ | ❌ | 日期时间选择器 |
| `time` | TimeField | ✅ | ❌ | 时间选择器 |
| `foreign_key` | ForeignKeyField | ✅ | ❌ | 外键字段 |
| `json` | JsonField | ✅ | ✅ | JSON 编辑器 |
| `richtext` | RichTextField | ✅ | ✅ | 富文本编辑器 |
| `color` | ColorField | ✅ | ❌ | 颜色选择器 |
| `clob` | TextareaField | ✅ | ✅ | 大文本（映射到 textarea） |
| `xml` | TextareaField | ✅ | ✅ | XML（映射到 textarea） |

---

### 1. JsonField - JSON 编辑器

#### 功能特性
- ✅ 实时语法验证
- ✅ 格式化（美化）
- ✅ 压缩（去除空格）
- ✅ 语法高亮
- ✅ 错误提示

#### CONTROL_CONFIG 配置项

```typescript
interface JsonFieldConfig {
  placeholder?: string    // 占位符文本
  maxLength?: number      // 最大字符数
}
```

#### 配置示例

```sql
-- 基础配置
UPDATE sys_column SET
  DISPLAY_TYPE = 'json',
  DISPLAY_COLS = 2,
  DISPLAY_ROWS = 10,
  CONTROL_CONFIG = '{"placeholder": "请输入 JSON 数据"}'
WHERE DB_NAME = 'CONFIG_DATA';

-- 带字符限制
UPDATE sys_column SET
  DISPLAY_TYPE = 'json',
  DISPLAY_COLS = 2,
  DISPLAY_ROWS = 15,
  CONTROL_CONFIG = '{"maxLength": 10000, "placeholder": "请输入配置"}'
WHERE DB_NAME = 'ADVANCED_CONFIG';
```

#### 使用场景
- 系统配置数据
- API 请求/响应示例
- 复杂的结构化数据
- 元数据存储

---

### 2. RichTextField - 富文本编辑器

#### 功能特性
- ✅ 富文本编辑（加粗、斜体、下划线等）
- ✅ 图片上传
- ✅ 链接插入
- ✅ 列表（有序/无序）
- ✅ 对齐方式
- ✅ 引用和代码块
- ✅ 字符数限制

#### CONTROL_CONFIG 配置项

```typescript
interface RichTextFieldConfig {
  placeholder?: string               // 占位符
  maxLength?: number                 // 最大字符数
}
```

#### 配置示例

```sql
-- 基础配置
UPDATE sys_column SET
  DISPLAY_TYPE = 'richtext',
  DISPLAY_COLS = 2,
  DISPLAY_ROWS = 15,
  CONTROL_CONFIG = '{"placeholder": "请输入内容...", "maxLength": 50000}'
WHERE DB_NAME = 'ARTICLE_CONTENT';

-- 简短内容
UPDATE sys_column SET
  DISPLAY_TYPE = 'richtext',
  DISPLAY_COLS = 2,
  DISPLAY_ROWS = 8,
  CONTROL_CONFIG = '{"placeholder": "请输入描述..."}'
WHERE DB_NAME = 'DESCRIPTION';
```

#### 工具栏功能
- 标题、加粗、斜体、下划线
- 字体颜色、背景色、字号、字体
- 列表（有序/无序）、对齐方式
- 插入链接、图片
- 引用、代码块
- 撤销/重做

#### 使用场景
- 文章内容
- 产品描述
- 公告通知
- 帮助文档

---

### 3. SwitchField - 开关

#### 功能特性
- ✅ 开/关状态切换
- ✅ 自定义开/关值
- ✅ 自定义显示文本
- ✅ 多种尺寸

#### CONTROL_CONFIG 配置项

```typescript
interface SwitchFieldConfig {
  checkedValue?: any           // 选中时的值，默认 true
  uncheckedValue?: any         // 未选中时的值，默认 false
  checkedText?: string         // 选中时的文本
  uncheckedText?: string       // 未选中时的文本
  size?: 'small' | 'medium' | 'large'  // 尺寸，默认 'medium'
}
```

#### 配置示例

```sql
-- 布尔值（true/false）
UPDATE sys_column SET
  DISPLAY_TYPE = 'switch',
  DATA_TYPE = 'tinyint',
  CONTROL_CONFIG = '{
    "checkedValue": true,
    "uncheckedValue": false,
    "checkedText": "是",
    "uncheckedText": "否"
  }'
WHERE DB_NAME = 'IS_ACTIVE';

-- 数字值（1/0）
UPDATE sys_column SET
  DISPLAY_TYPE = 'switch',
  DATA_TYPE = 'int',
  CONTROL_CONFIG = '{
    "checkedValue": 1,
    "uncheckedValue": 0,
    "checkedText": "启用",
    "uncheckedText": "禁用",
    "size": "medium"
  }'
WHERE DB_NAME = 'STATUS';

-- 字符串值（Y/N）
UPDATE sys_column SET
  DISPLAY_TYPE = 'switch',
  DATA_TYPE = 'char',
  LENGTH = 1,
  CONTROL_CONFIG = '{
    "checkedValue": "Y",
    "uncheckedValue": "N",
    "checkedText": "开启",
    "uncheckedText": "关闭"
  }'
WHERE DB_NAME = 'IS_ENABLED';
```

#### 使用场景
- 状态开关（启用/禁用）
- 布尔标志（是/否）
- 功能开关
- 权限控制

---

### 4. ColorField - 颜色选择器

#### 功能特性
- ✅ 多种颜色格式（hex, rgb, hsl）
- ✅ 预设颜色
- ✅ 历史颜色记录
- ✅ 透明度支持
- ✅ 颜色预览

#### CONTROL_CONFIG 配置项

```typescript
interface ColorFieldConfig {
  format?: 'hex' | 'rgb' | 'hsl'     // 颜色格式，默认 'hex'
  showHistory?: boolean               // 显示历史颜色，默认 true
  disabledAlpha?: boolean             // 禁用透明度，默认 false
  presetColors?: string[]             // 预设颜色列表
}
```

#### 配置示例

```sql
-- 基础配置（HEX 格式）
UPDATE sys_column SET
  DISPLAY_TYPE = 'color',
  DATA_TYPE = 'varchar',
  LENGTH = 20,
  CONTROL_CONFIG = '{"format": "hex", "showHistory": true}'
WHERE DB_NAME = 'THEME_COLOR';

-- 带预设颜色
UPDATE sys_column SET
  DISPLAY_TYPE = 'color',
  CONTROL_CONFIG = '{
    "format": "hex",
    "presetColors": [
      "#FF0000", "#FF7F00", "#FFFF00", "#00FF00",
      "#0000FF", "#4B0082", "#9400D3", "#000000",
      "#FFFFFF", "#808080"
    ]
  }'
WHERE DB_NAME = 'BRAND_COLOR';

-- RGB 格式
UPDATE sys_column SET
  DISPLAY_TYPE = 'color',
  CONTROL_CONFIG = '{
    "format": "rgb",
    "disabledAlpha": true
  }'
WHERE DB_NAME = 'BACKGROUND_COLOR';
```

#### 使用场景
- 主题颜色配置
- 品牌色设置
- UI 样式定制
- 图表颜色配置

---

### 5. TimeField - 时间选择器

#### 功能特性
- ✅ 时间选择
- ✅ 12/24 小时制
- ✅ 时间步长配置
- ✅ 禁用特定时间
- ✅ 时间范围限制

#### CONTROL_CONFIG 配置项

```typescript
interface TimeFieldConfig {
  format?: string                     // 时间格式，默认 'HH:mm:ss'
  use12Hours?: boolean                // 使用 12 小时制，默认 false
  placeholder?: string                // 占位符
  step?: {
    hour?: number                     // 小时步长
    minute?: number                   // 分钟步长
    second?: number                   // 秒步长
  }
}
```

#### 配置示例

```sql
-- 基础配置（24 小时制）
UPDATE sys_column SET
  DISPLAY_TYPE = 'time',
  DATA_TYPE = 'varchar',
  LENGTH = 8,
  CONTROL_CONFIG = '{"format": "HH:mm:ss", "placeholder": "请选择时间"}'
WHERE DB_NAME = 'START_TIME';

-- 12 小时制
UPDATE sys_column SET
  DISPLAY_TYPE = 'time',
  CONTROL_CONFIG = '{"format": "hh:mm:ss A", "use12Hours": true}'
WHERE DB_NAME = 'MEETING_TIME';

-- 带步长（15 分钟间隔）
UPDATE sys_column SET
  DISPLAY_TYPE = 'time',
  CONTROL_CONFIG = '{
    "format": "HH:mm",
    "step": {"hour": 1, "minute": 15}
  }'
WHERE DB_NAME = 'APPOINTMENT_TIME';
```

#### 使用场景
- 工作时间设置
- 预约时间
- 定时任务配置
- 营业时间

---

### 6. TextareaField - 多行文本

#### 配置示例

```sql
-- 基础多行文本
UPDATE sys_column SET
  DISPLAY_TYPE = 'textarea',
  DISPLAY_COLS = 2,
  DISPLAY_ROWS = 5,
  LENGTH = 500,
  PLACEHOLDER = '请输入备注信息'
WHERE DB_NAME = 'REMARK';

-- 带字数限制
UPDATE sys_column SET
  DISPLAY_TYPE = 'textarea',
  DISPLAY_COLS = 2,
  DISPLAY_ROWS = 8,
  LENGTH = 1000
WHERE DB_NAME = 'DESCRIPTION';
```

---

### 7. TextField - 单行文本

#### 配置示例

```sql
-- 基础文本
UPDATE sys_column SET
  DISPLAY_TYPE = 'text',
  LENGTH = 100,
  PLACEHOLDER = '请输入用户名'
WHERE DB_NAME = 'USERNAME';

-- 带正则验证
UPDATE sys_column SET
  DISPLAY_TYPE = 'text',
  LENGTH = 50,
  REG_EXPRESSION = '^[a-zA-Z0-9_]+$',
  ERROR_MSG = '只能包含字母、数字和下划线'
WHERE DB_NAME = 'CODE';
```

---

### 8. NumberField - 数字输入

#### 配置示例

```sql
-- 整数
UPDATE sys_column SET
  DISPLAY_TYPE = 'number',
  DATA_TYPE = 'int',
  CONTROL_CONFIG = '{"min": 0, "max": 100, "step": 1}'
WHERE DB_NAME = 'AGE';

-- 小数（保留 2 位）
UPDATE sys_column SET
  DISPLAY_TYPE = 'number',
  DATA_TYPE = 'decimal',
  DECIMAL_PLACES = 2,
  CONTROL_CONFIG = '{"min": 0, "max": 999999.99, "step": 0.01, "precision": 2}'
WHERE DB_NAME = 'PRICE';
```

---

### 9. SelectField - 下拉选择

#### 配置示例

```sql
-- 字典选择
UPDATE sys_column SET
  DISPLAY_TYPE = 'select',
  SET_VALUE_TYPE = 'select',
  DICT_TABLE_ID = 1,
  DICT_VALUE_FIELD = 'VALUE',
  DICT_DISPLAY_FIELD = 'LABEL',
  PLACEHOLDER = '请选择状态'
WHERE DB_NAME = 'STATUS';

-- 多选
UPDATE sys_column SET
  DISPLAY_TYPE = 'select',
  CONTROL_CONFIG = '{"multiple": true, "maxTagCount": 3}'
WHERE DB_NAME = 'TAGS';
```

---

### 10. DateField / DatetimeField - 日期选择

#### 配置示例

```sql
-- 日期
UPDATE sys_column SET
  DISPLAY_TYPE = 'date',
  CONTROL_CONFIG = '{"format": "YYYY-MM-DD", "placeholder": "请选择日期"}'
WHERE DB_NAME = 'BIRTH_DATE';

-- 日期时间
UPDATE sys_column SET
  DISPLAY_TYPE = 'datetime',
  CONTROL_CONFIG = '{"format": "YYYY-MM-DD HH:mm:ss", "placeholder": "请选择日期时间"}'
WHERE DB_NAME = 'CREATE_TIME';
```

---

### 11. ForeignKeyField - 外键字段

#### 配置示例

```sql
-- 外键关联
UPDATE sys_column SET
  DISPLAY_TYPE = 'foreign_key',
  SET_VALUE_TYPE = 'fk',
  FK_TABLE_ID = 2,
  FK_VALUE_FIELD = 'ID',
  FK_DISPLAY_FIELD = 'NAME',
  PLACEHOLDER = '请选择关联对象'
WHERE DB_NAME = 'USER_ID';
```

---

## 布局配置

### DISPLAY_COLS - 列数配置

控制字段在表单中占用的列数（宽度）。

#### 布局示意图

```
默认布局（2 列）：
┌─────────────┬─────────────┐
│  字段 A     │  字段 B     │  DISPLAY_COLS = 1
├─────────────┴─────────────┤
│  字段 C (跨 2 列)         │  DISPLAY_COLS = 2
├─────────────┬─────────────┤
│  字段 D     │  字段 E     │  DISPLAY_COLS = 1
└─────────────┴─────────────┘
```

#### 推荐配置

| 字段类型 | 推荐 DISPLAY_COLS | 说明 |
|---------|------------------|------|
| 短文本（用户名、代码） | 1 | 占用半行 |
| 长文本（邮箱、URL） | 1-2 | 根据内容长度 |
| 多行文本 | 2 | 占满整行 |
| JSON/富文本 | 2 | 占满整行 |
| 数字、日期、选择 | 1 | 占用半行 |

### DISPLAY_ROWS - 行数配置

控制字段的高度（仅对多行控件有效）。

#### 高度计算

```
高度 = DISPLAY_ROWS * 32 + (DISPLAY_ROWS - 1) * 8 像素

示例：
- 1 行 = 32px
- 5 行 = 5 * 32 + 4 * 8 = 192px
- 10 行 = 10 * 32 + 9 * 8 = 352px
- 15 行 = 15 * 32 + 14 * 8 = 552px
```

#### 推荐配置

| 内容类型 | 推荐 DISPLAY_ROWS | 说明 |
|---------|------------------|------|
| 简短备注 | 3-5 | 适合简短说明 |
| 详细描述 | 5-10 | 适合段落文本 |
| JSON 配置 | 8-15 | 根据配置复杂度 |
| 文章内容 | 15-20 | 适合长文本编辑 |

#### 优先级规则

对于支持多行的控件，高度优先级如下：

1. **CONTROL_CONFIG.height**（最高优先级）
2. **DISPLAY_ROWS**（次优先级）
3. **默认值**（最低优先级）

```sql
-- 情况 1: 只设置 DISPLAY_ROWS
UPDATE sys_column SET
  DISPLAY_TYPE = 'json',
  DISPLAY_ROWS = 10
WHERE DB_NAME = 'CONFIG';
-- 结果：高度 = 352px

-- 情况 2: 同时设置（CONTROL_CONFIG 优先）
UPDATE sys_column SET
  DISPLAY_TYPE = 'json',
  DISPLAY_ROWS = 10,
  CONTROL_CONFIG = '{"height": 500}'
WHERE DB_NAME = 'CONFIG';
-- 结果：高度 = 500px
```

---

## 配置示例

### 完整表单配置示例

```sql
-- 用户信息表单配置
-- 1. 基础信息字段（1 列）
UPDATE sys_column SET
  DISPLAY_TYPE = 'text',
  DISPLAY_COLS = 1,
  LENGTH = 50
WHERE SYS_TABLE_ID = 1 AND DB_NAME = 'USERNAME';

UPDATE sys_column SET
  DISPLAY_TYPE = 'email',
  DISPLAY_COLS = 1,
  LENGTH = 100
WHERE SYS_TABLE_ID = 1 AND DB_NAME = 'EMAIL';

UPDATE sys_column SET
  DISPLAY_TYPE = 'number',
  DISPLAY_COLS = 1,
  DATA_TYPE = 'int'
WHERE SYS_TABLE_ID = 1 AND DB_NAME = 'AGE';

-- 2. 状态字段（开关）
UPDATE sys_column SET
  DISPLAY_TYPE = 'switch',
  DISPLAY_COLS = 1,
  CONTROL_CONFIG = '{
    "checkedValue": 1,
    "uncheckedValue": 0,
    "checkedText": "启用",
    "uncheckedText": "禁用"
  }'
WHERE SYS_TABLE_ID = 1 AND DB_NAME = 'IS_ACTIVE';

-- 3. 个人简介（多行文本，跨 2 列）
UPDATE sys_column SET
  DISPLAY_TYPE = 'textarea',
  DISPLAY_COLS = 2,
  DISPLAY_ROWS = 5,
  LENGTH = 500
WHERE SYS_TABLE_ID = 1 AND DB_NAME = 'BIO';

-- 4. 用户配置（JSON，跨 2 列）
UPDATE sys_column SET
  DISPLAY_TYPE = 'json',
  DISPLAY_COLS = 2,
  DISPLAY_ROWS = 10,
  CONTROL_CONFIG = '{"placeholder": "请输入用户配置"}'
WHERE SYS_TABLE_ID = 1 AND DB_NAME = 'PREFERENCES';

-- 5. 主题颜色（颜色选择器）
UPDATE sys_column SET
  DISPLAY_TYPE = 'color',
  DISPLAY_COLS = 1,
  CONTROL_CONFIG = '{
    "format": "hex",
    "presetColors": ["#FF0000", "#00FF00", "#0000FF"]
  }'
WHERE SYS_TABLE_ID = 1 AND DB_NAME = 'THEME_COLOR';

-- 6. 登录时间（时间选择器）
UPDATE sys_column SET
  DISPLAY_TYPE = 'time',
  DISPLAY_COLS = 1,
  CONTROL_CONFIG = '{"format": "HH:mm:ss"}'
WHERE SYS_TABLE_ID = 1 AND DB_NAME = 'LOGIN_TIME';
```

### 表单布局效果

```
┌─────────────┬─────────────┐
│ 用户名      │ 邮箱        │
│ [_________] │ [_________] │
├─────────────┼─────────────┤
│ 年龄        │ 状态        │
│ [_________] │ [启用/禁用] │
├─────────────┴─────────────┤
│ 个人简介                  │
│ ┌─────────────────────┐   │
│ │                     │   │
│ │  (5 行)             │   │
│ │                     │   │
│ └─────────────────────┘   │
├───────────────────────────┤
│ 用户配置 (JSON)           │
│ ┌─────────────────────┐   │
│ │                     │   │
│ │  (10 行)            │   │
│ │                     │   │
│ └─────────────────────┘   │
├─────────────┬─────────────┤
│ 主题颜色    │ 登录时间    │
│ [🎨_______] │ [⏰_______] │
└─────────────┴─────────────┘
```

---

## 最佳实践

### 1. 选择合适的控件类型

| 数据类型 | 推荐控件 | 说明 |
|---------|---------|------|
| 短文本（< 100 字符） | text | 单行输入 |
| 长文本（100-500 字符） | textarea | 多行输入 |
| 富文本内容 | richtext | 需要格式化的内容 |
| 结构化数据 | json | 配置、元数据 |
| 布尔值 | switch | 开关状态 |
| 枚举值（< 5 个选项） | radio | 单选 |
| 枚举值（≥ 5 个选项） | select | 下拉选择 |
| 颜色值 | color | 颜色配置 |
| 时间值 | time | 时间选择 |

### 2. CONTROL_CONFIG 编写规范

```sql
-- ✅ 正确：使用标准 JSON 格式
CONTROL_CONFIG = '{"height": 300, "theme": "dark"}'

-- ❌ 错误：单引号
CONTROL_CONFIG = "{'height': 300, 'theme': 'dark'}"

-- ❌ 错误：缺少引号
CONTROL_CONFIG = '{height: 300, theme: dark}'

-- ✅ 正确：多行格式（便于阅读）
CONTROL_CONFIG = '{
  "height": 300,
  "theme": "dark",
  "placeholder": "请输入..."
}'
```

### 3. 验证规则配置

```sql
-- 必填字段
UPDATE sys_column SET
  NULL_ABLE = 'N',
  ERROR_MSG = '用户名不能为空'
WHERE DB_NAME = 'USERNAME';

-- 正则验证
UPDATE sys_column SET
  REG_EXPRESSION = '^1[3-9]\d{9}$',
  ERROR_MSG = '请输入正确的手机号码'
WHERE DB_NAME = 'PHONE';

-- 长度限制
UPDATE sys_column SET
  LENGTH = 100,
  ERROR_MSG = '用户名长度不能超过 100 个字符'
WHERE DB_NAME = 'USERNAME';
```

### 4. 权限控制

```sql
-- 只读字段（所有模式）
UPDATE sys_column SET
  IS_READONLY = 'Y'
WHERE DB_NAME = 'CREATE_TIME';

-- 不可修改（仅创建时可编辑）
UPDATE sys_column SET
  MODIFI_ABLE = 'N',
  MASK = '0100'  -- 位 2 = 1（新增可编辑），位 4 = 0（修改不可编辑）
WHERE DB_NAME = 'CODE';

-- 完全可编辑
UPDATE sys_column SET
  MODIFI_ABLE = 'Y',
  MASK = '0101'  -- 位 2 = 1，位 4 = 1
WHERE DB_NAME = 'NAME';
```

### 5. 性能优化

```sql
-- 对于大量数据的选择框，使用远程搜索
UPDATE sys_column SET
  DISPLAY_TYPE = 'select',
  CONTROL_CONFIG = '{
    "filterable": true,
    "remote": true,
    "remoteMethod": "/api/v1/search/users"
  }'
WHERE DB_NAME = 'USER_ID';

-- 对于富文本，限制最大长度
UPDATE sys_column SET
  DISPLAY_TYPE = 'richtext',
  CONTROL_CONFIG = '{"maxLength": 50000}'
WHERE DB_NAME = 'CONTENT';
```

---

## 常见问题

### Q1: 如何验证 CONTROL_CONFIG 是否为有效 JSON？

```sql
-- MySQL 8.0+
SELECT
  DB_NAME,
  CONTROL_CONFIG,
  JSON_VALID(CONTROL_CONFIG) AS is_valid
FROM sys_column
WHERE CONTROL_CONFIG IS NOT NULL;

-- 查找无效的 JSON 配置
SELECT DB_NAME, CONTROL_CONFIG
FROM sys_column
WHERE CONTROL_CONFIG IS NOT NULL
  AND JSON_VALID(CONTROL_CONFIG) = 0;
```

### Q2: DISPLAY_TYPE 和 CONTROL_TYPE 有什么区别？

- `DISPLAY_TYPE`: 推荐使用，优先级更高
- `CONTROL_TYPE`: 兼容旧数据
- 优先级：`DISPLAY_TYPE` > `CONTROL_TYPE` > 默认值

### Q3: Switch 字段保存后值不正确？

检查 `checkedValue` 和 `uncheckedValue` 的类型是否与数据库字段类型匹配：

```sql
-- 数据库字段为 int 类型
UPDATE sys_column SET
  DATA_TYPE = 'int',
  CONTROL_CONFIG = '{"checkedValue": 1, "uncheckedValue": 0}'
WHERE DB_NAME = 'IS_ACTIVE';

-- 数据库字段为 char(1) 类型
UPDATE sys_column SET
  DATA_TYPE = 'char',
  LENGTH = 1,
  CONTROL_CONFIG = '{"checkedValue": "Y", "uncheckedValue": "N"}'
WHERE DB_NAME = 'IS_ENABLED';
```

### Q4: JSON 字段如何设置默认值？

```sql
UPDATE sys_column SET
  DISPLAY_TYPE = 'json',
  DEFAULT_VALUE = '{"theme": "light", "language": "zh-CN"}',
  CONTROL_CONFIG = '{"placeholder": "请输入配置"}'
WHERE DB_NAME = 'SETTINGS';
```

### Q5: 如何让字段占满整行？

设置 `DISPLAY_COLS = 2`（假设表单是 2 列布局）。

### Q6: DISPLAY_ROWS 对单行控件有效吗？

无效。DISPLAY_ROWS 只对支持多行的控件有效（textarea、json、richtext）。

### Q7: 如何批量更新字段配置？

```sql
-- 批量设置所有 text 类型字段的最大长度
UPDATE sys_column
SET LENGTH = 255
WHERE DISPLAY_TYPE = 'text'
  AND (LENGTH IS NULL OR LENGTH = 0);

-- 批量为所有必填字段添加错误提示
UPDATE sys_column
SET ERROR_MSG = CONCAT(DISPLAY_NAME, '不能为空')
WHERE NULL_ABLE = 'N'
  AND (ERROR_MSG IS NULL OR ERROR_MSG = '');

-- 批量为所有 switch 字段设置默认配置
UPDATE sys_column
SET CONTROL_CONFIG = '{"checkedValue": 1, "uncheckedValue": 0, "checkedText": "是", "uncheckedText": "否"}'
WHERE DISPLAY_TYPE = 'switch'
  AND (CONTROL_CONFIG IS NULL OR CONTROL_CONFIG = '');
```

### Q8: 如何调试字段渲染问题？

1. 打开浏览器开发者工具（F12）
2. 查看 Console 面板，搜索 `[DynamicFormItem]` 或 `[useFieldRenderer]`
3. 检查字段配置是否正确加载

### Q9: clob 和 xml 类型如何显示？

自动映射到 `TextareaField` 组件，显示为多行文本框。

---

## 附录

### A. 完整的字段类型对照表

| DISPLAY_TYPE | 数据库类型 | 推荐长度 | 示例值 |
|-------------|-----------|---------|--------|
| text | varchar | 50-255 | "张三" |
| textarea | text | - | "这是一段长文本..." |
| number | int/decimal | - | 123 或 123.45 |
| switch | int/char | 1 | 1/0 或 Y/N |
| json | text/json | - | {"key": "value"} |
| richtext | text | - | "<p>富文本</p>" |
| color | varchar | 20 | "#FF0000" |
| time | varchar/time | 8 | "14:30:00" |
| date | date | - | "2026-01-28" |
| datetime | datetime | - | "2026-01-28 14:30:00" |

### B. 批量配置脚本

```sql
-- 为所有 textarea 设置默认行数
UPDATE sys_column
SET DISPLAY_ROWS = 5
WHERE DISPLAY_TYPE = 'textarea'
  AND (DISPLAY_ROWS IS NULL OR DISPLAY_ROWS = 0 OR DISPLAY_ROWS = 1);

-- 为所有 JSON 字段设置跨列和行数
UPDATE sys_column
SET
  DISPLAY_COLS = 2,
  DISPLAY_ROWS = 10
WHERE DISPLAY_TYPE = 'json'
  AND (DISPLAY_COLS IS NULL OR DISPLAY_COLS = 0 OR DISPLAY_COLS = 1);

-- 为所有富文本设置跨列和行数
UPDATE sys_column
SET
  DISPLAY_COLS = 2,
  DISPLAY_ROWS = 15
WHERE DISPLAY_TYPE = 'richtext'
  AND (DISPLAY_COLS IS NULL OR DISPLAY_COLS = 0 OR DISPLAY_COLS = 1);

-- 为长文本字段设置跨列
UPDATE sys_column
SET DISPLAY_COLS = 2
WHERE DISPLAY_TYPE IN ('text', 'email', 'url')
  AND LENGTH > 100
  AND (DISPLAY_COLS IS NULL OR DISPLAY_COLS = 0 OR DISPLAY_COLS = 1);
```

### C. 查询和验证

```sql
-- 查看所有字段的配置
SELECT
  t.TABLE_NAME,
  c.DB_NAME,
  c.DISPLAY_NAME,
  c.DISPLAY_TYPE,
  COALESCE(c.DISPLAY_COLS, 1) AS DISPLAY_COLS,
  COALESCE(c.DISPLAY_ROWS, 1) AS DISPLAY_ROWS,
  c.CONTROL_CONFIG
FROM sys_column c
JOIN sys_table t ON c.SYS_TABLE_ID = t.ID
WHERE c.IS_ACTIVE = 'Y'
ORDER BY t.TABLE_NAME, c.ORDERNO;

-- 查找应该跨列但未配置的字段
SELECT
  t.TABLE_NAME,
  c.DB_NAME,
  c.DISPLAY_TYPE,
  c.DISPLAY_COLS
FROM sys_column c
JOIN sys_table t ON c.SYS_TABLE_ID = t.ID
WHERE c.DISPLAY_TYPE IN ('textarea', 'json', 'richtext')
  AND (c.DISPLAY_COLS IS NULL OR c.DISPLAY_COLS = 1)
  AND c.IS_ACTIVE = 'Y';
```

### D. 相关文件路径

```
sky-web/
├── src/modules/metadata/
│   ├── components/
│   │   ├── FieldRenderers/
│   │   │   ├── JsonField.vue
│   │   │   ├── RichTextField.vue
│   │   │   ├── SwitchField.vue
│   │   │   ├── ColorField.vue
│   │   │   ├── TimeField.vue
│   │   │   ├── TextareaField.vue
│   │   │   ├── TextField.vue
│   │   │   ├── NumberField.vue
│   │   │   ├── SelectField.vue
│   │   │   ├── DateField.vue
│   │   │   ├── DatetimeField.vue
│   │   │   ├── ForeignKeyField.vue
│   │   │   ├── index.ts
│   │   │   └── README.md (本文档)
│   │   └── DynamicForm/
│   │       ├── DynamicFormItem.vue
│   │       └── DynamicForm.vue
│   ├── composables/
│   │   └── useFieldRenderer.ts
│   └── types/
│       └── index.ts
```

---

## 更新日志

### 2026-01-28 v2.0
- ✅ 整合所有分散的文档到一个文件
- ✅ 添加完整的字段类型说明
- ✅ 添加布局配置详解
- ✅ 添加配置示例和最佳实践
- ✅ 添加常见问题解答
- ✅ 添加批量配置脚本

### 2026-01-28 v1.0
- ✅ 创建初始配置文档
- ✅ 添加 JSON、富文本、开关、颜色、时间字段支持

---

**文档版本**: v2.0
**最后更新**: 2026-01-28
**维护者**: Sky Team
**反馈**: 如有问题或建议，请联系开发团队
