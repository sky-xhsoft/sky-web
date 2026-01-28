# 图片上传功能文档

> **版本**: v1.0
> **最后更新**: 2026-01-28
> **维护者**: Sky Team

---

## 目录

1. [功能概述](#功能概述)
2. [快速开始](#快速开始)
3. [字段配置](#字段配置)
4. [组件说明](#组件说明)
5. [数据存储格式](#数据存储格式)
6. [常见问题](#常见问题)
7. [技术实现](#技术实现)

---

## 功能概述

图片上传功能支持在元数据驱动的表单中上传和管理图片，包括：

- ✅ 单图/多图上传
- ✅ 图片预览和查看
- ✅ 拖拽上传
- ✅ 图片列表显示
- ✅ 列表页缩略图展示
- ✅ 自动认证（携带 token）
- ✅ 上传进度显示

---

## 快速开始

### 1. 配置图片字段

在 `sys_column` 表中配置图片字段：

```sql
-- 单图上传（头像）
UPDATE sys_column SET
  DISPLAY_TYPE = 'image',
  DATA_TYPE = 'varchar',
  LENGTH = 500,
  DISPLAY_COLS = 1,
  CONTROL_CONFIG = '{
    "uploadUrl": "/api/v1/files/upload",
    "accept": "image/*",
    "maxCount": 1,
    "placeholder": "上传头像"
  }'
WHERE DB_NAME = 'AVATAR';

-- 多图上传（相册）
UPDATE sys_column SET
  DISPLAY_TYPE = 'image',
  DATA_TYPE = 'text',
  DISPLAY_COLS = 2,
  CONTROL_CONFIG = '{
    "uploadUrl": "/api/v1/files/upload",
    "accept": "image/jpeg,image/png,image/gif",
    "maxCount": 9,
    "multiple": true,
    "placeholder": "上传图片"
  }'
WHERE DB_NAME = 'GALLERY';
```

### 2. 使用效果

- **表单编辑页**：显示图片上传组件，支持拖拽和点击上传
- **表单查看页**：显示图片缩略图，点击可预览大图
- **列表页**：显示 60x60 的缩略图，点击可预览

---

## 字段配置

### DISPLAY_TYPE

设置为 `'image'` 启用图片上传功能。

### DATA_TYPE 和 LENGTH

- **单图模式**：`varchar(500)` - 存储单个图片 URL
- **多图模式**：`text` - 存储图片数组的 JSON 字符串

### CONTROL_CONFIG

图片上传的配置项（JSON 格式）：

```typescript
interface ImageFieldConfig {
  uploadUrl?: string              // 上传接口地址，默认 '/api/v1/files/upload'
  accept?: string                 // 接受的图片类型，默认 'image/*'
  maxCount?: number               // 最大图片数量，默认 1
  multiple?: boolean              // 是否支持多选，默认 true
  listType?: string               // 列表类型，默认 'picture-card'
  placeholder?: string            // 占位符文本
  headers?: Record<string, string> // 自定义请求头（一般不需要，系统自动添加认证）
}
```

### 配置示例

```sql
-- 基础单图上传
CONTROL_CONFIG = '{
  "maxCount": 1,
  "placeholder": "上传头像"
}'

-- 多图上传（限制类型）
CONTROL_CONFIG = '{
  "accept": "image/jpeg,image/png",
  "maxCount": 5,
  "multiple": true,
  "placeholder": "最多上传5张图片"
}'

-- 自定义上传地址
CONTROL_CONFIG = '{
  "uploadUrl": "/api/v1/custom/upload",
  "maxCount": 1
}'
```

---

## 组件说明

### ImageField 组件

位置：`src/modules/metadata/components/FieldRenderers/ImageField.vue`

#### Props

| 属性 | 类型 | 说明 |
|------|------|------|
| column | SysColumn | 字段配置对象 |
| modelValue | any | 字段值（URL 或 JSON 字符串） |
| mode | FormMode | 表单模式：'view' \| 'edit' \| 'create' |
| disabled | boolean | 是否禁用 |
| readonly | boolean | 是否只读 |

#### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| update:modelValue | value: any | 值变化事件 |
| blur | - | 失焦事件 |

#### 功能特性

1. **查看模式**
   - 显示图片缩略图网格
   - 点击图片打开预览
   - 支持左右切换查看

2. **编辑模式**
   - 显示上传按钮
   - 支持拖拽上传
   - 显示上传进度
   - 自动携带认证 token

3. **数据处理**
   - 上传成功后自动保存服务器返回的 URL
   - 单图模式：保存字符串 URL
   - 多图模式：保存 JSON 数组字符串

---

## 数据存储格式

### 单图模式（maxCount = 1）

数据库存储：
```
/api/v1/files/access/a16dd4fc-4412-4367-a882-668f6583b04a.png
```

### 多图模式（maxCount > 1）

数据库存储（JSON 字符串）：
```json
[
  {
    "uid": "1",
    "name": "image1.jpg",
    "url": "/api/v1/files/access/uuid1.jpg",
    "size": 102400,
    "status": "done"
  },
  {
    "uid": "2",
    "name": "image2.png",
    "url": "/api/v1/files/access/uuid2.png",
    "size": 204800,
    "status": "done"
  }
]
```

### URL 格式说明

- **格式**：`/api/v1/files/access/{storageName}`
- **特点**：
  - 不需要认证即可访问（公开路由）
  - 支持浏览器缓存（Cache-Control: max-age=31536000）
  - 自动设置正确的 Content-Type

---

## 常见问题

### Q1: 上传后显示 blob URL，刷新后无法加载？

**原因**：前端保存了临时的 blob URL 而不是服务器返回的 URL。

**解决**：确保使用最新版本的 ImageField 组件，它会自动处理这个问题。

### Q2: 上传提示 401 未授权？

**原因**：上传请求没有携带认证 token。

**解决**：ImageField 组件会自动从 `localStorage` 获取 token 并添加到请求头。确保用户已登录。

### Q3: 列表页显示 URL 而不是图片？

**原因**：列表页没有配置图片列的渲染。

**解决**：已在 DynamicTable 组件中添加图片列的自动渲染，无需额外配置。

### Q4: 如何限制图片大小？

**答**：后端默认限制为 100MB。如需修改，在后端配置文件中调整 `MaxFileSize`。

### Q5: 支持哪些图片格式？

**答**：默认支持所有图片格式（`image/*`）。可通过 `accept` 配置限制：
```json
{
  "accept": "image/jpeg,image/png,image/gif"
}
```

### Q6: 如何删除已上传的图片？

**答**：在编辑模式下，点击图片上的删除按钮即可。保存表单后，数据库中的 URL 会被更新。

---

## 技术实现

### 前端实现

#### 1. 组件结构

```
ImageField.vue
├── 查看模式
│   ├── 图片网格展示
│   └── 点击预览
├── 编辑模式
│   ├── Arco Upload 组件
│   ├── 自动认证
│   └── 进度显示
└── 数据处理
    ├── 上传成功处理
    ├── URL 解析
    └── 格式转换
```

#### 2. 关键代码

**Token 获取**：
```typescript
import { getAccessToken } from '@/utils/token'

const uploadHeaders = computed(() => {
  const token = getAccessToken()
  return {
    Authorization: token ? `Bearer ${token}` : ''
  }
})
```

**URL 优先级处理**：
```typescript
function handleChange(fileList: FileItem[]) {
  const images = fileList.map(file => {
    // 优先使用服务器返回的 URL
    const serverUrl = file.response?.data?.accessUrl || file.response?.data?.url
    return {
      uid: file.uid,
      name: file.name,
      url: serverUrl || file.url || '',
      status: file.status
    }
  })

  // 只有上传成功后才保存
  const allSuccess = images.every(img =>
    img.status === 'done' && img.url && !img.url.startsWith('blob:')
  )

  if (allSuccess || images.length === 0) {
    emit('update:modelValue', /* ... */)
  }
}
```

#### 3. 列表页渲染

在 `DynamicTable.vue` 中自动识别 `DISPLAY_TYPE = 'image'` 的字段：

```vue
<template #image="{ record, column }">
  <div class="image-cell">
    <a-image
      v-if="record[column.dataIndex]"
      :src="record[column.dataIndex]"
      :width="60"
      :height="60"
      fit="cover"
      :preview="true"
    />
    <span v-else class="image-empty">-</span>
  </div>
</template>
```

### 后端实现

详见后端文档：`sky-server/docs/file-upload-api.md`

---

## 相关文档

- [字段渲染器完整文档](../src/modules/metadata/components/FieldRenderers/README.md)
- [后端文件上传 API](../../sky-server/docs/file-upload-api.md)
- [动态表单实现](./DYNAMIC_FORM_IMPLEMENTATION.md)
- [动态表格实现](./DYNAMIC_TABLE_IMPLEMENTATION.md)

---

## 更新日志

### 2026-01-28 v1.0

- ✅ 实现图片上传功能
- ✅ 支持单图/多图模式
- ✅ 自动认证和 token 管理
- ✅ 列表页缩略图显示
- ✅ 修复 blob URL 问题
- ✅ 优化上传成功判断逻辑

---

**文档版本**: v1.0
**最后更新**: 2026-01-28
**维护者**: Sky Team
