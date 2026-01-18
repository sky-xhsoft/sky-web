# 分享管理功能文档

## 📋 功能概述

分享管理功能提供完整的文件和文件夹分享管理能力，包括：
- ✅ 查看所有分享列表
- ✅ 按状态筛选（全部/有效/已过期）
- ✅ 统计数据展示（总数/有效/过期）
- ✅ 复制分享链接和提取码
- ✅ 编辑分享（修改密码和有效期）
- ✅ 查看访问统计（访问次数、下载次数、独立访客）
- ✅ 撤销分享（删除分享链接）

## 🚀 使用方法

### 在主视图中打开分享管理

```vue
<template>
  <CloudView />
</template>
```

点击主视图头部的"我的分享"按钮，会打开分享管理抽屉。

### 单独使用 CloudShareManager 组件

```vue
<template>
  <a-drawer v-model:visible="visible" title="分享管理" width="600px">
    <CloudShareManager
      :shares="shares"
      :loading="loading"
      @refresh="handleRefresh"
      @copy="handleCopy"
      @edit="handleEdit"
      @view-stats="handleViewStats"
      @delete="handleDelete"
    />
  </a-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CloudShareManager } from '@/modules/cloud/components'
import type { ShareListItem } from '@/modules/cloud/types'

const visible = ref(false)
const shares = ref<ShareListItem[]>([])
const loading = ref(false)

async function handleRefresh() {
  // 刷新分享列表
}

async function handleCopy(share: ShareListItem) {
  // 复制分享链接
}

async function handleEdit(share: ShareListItem) {
  // 打开编辑对话框
}

async function handleViewStats(share: ShareListItem) {
  // 打开访问统计对话框
}

async function handleDelete(share: ShareListItem) {
  // 删除分享
}
</script>
```

### 使用 useCloudShare Composable

```typescript
import { useCloudShare } from '@/modules/cloud/composables'

const share = useCloudShare()

// 创建分享
const shareInfo = await share.createShare(file, {
  expirationDays: 7,
  password: 'abc123',
})

// 编辑分享
const updated = await share.modifyShare(shareId, {
  expirationDays: 30,
  password: 'newpass',
})

// 复制分享链接
await share.copyShareLink(shareItem)

// 查看访问统计
const activeCount = share.activeShareCount.value
const expiredCount = share.expiredShareCount.value

// 删除分享（带确认）
const success = await share.removeShareWithConfirm(shareItem)

// 刷新分享列表
await share.refreshShares()
```

## 🔧 技术实现

### 组件结构

```
分享管理功能
├── CloudShareManager.vue         # 分享列表管理组件
├── dialogs/
│   ├── CreateShareDialog.vue     # 创建分享对话框
│   ├── EditShareDialog.vue       # 编辑分享对话框（新增）
│   └── ShareStatsDialog.vue      # 访问统计对话框（新增）
└── composables/
    └── useCloudShare.ts          # 分享管理逻辑
```

### CloudShareManager 组件

**Props:**
```typescript
interface Props {
  shares?: ShareListItem[]    // 分享列表
  loading?: boolean           // 加载状态
}
```

**Events:**
```typescript
interface Emits {
  (e: 'refresh'): void                          // 刷新列表
  (e: 'copy', share: ShareListItem): void       // 复制链接
  (e: 'edit', share: ShareListItem): void       // 编辑分享
  (e: 'viewStats', share: ShareListItem): void  // 查看统计
  (e: 'delete', share: ShareListItem): void     // 删除分享
}
```

**核心功能:**
1. **状态筛选**: 支持按全部/有效/已过期筛选
2. **统计展示**: 实时显示总分享数、有效分享数、已过期分享数
3. **分享卡片**: 显示文件名、分享码、密码、创建时间、剩余天数
4. **操作按钮**: 复制链接、编辑、查看统计、删除（已过期分享的部分操作禁用）

### EditShareDialog 组件

**功能:**
- 显示当前分享的基本信息（链接、提取码、创建时间、过期时间）
- 允许修改有效期（1天/7天/30天/永久）
- 允许修改或生成新密码
- 支持随机密码生成

**Props:**
```typescript
interface Props {
  visible?: boolean             // 对话框可见性
  loading?: boolean             // 提交加载状态
  share?: ShareListItem | null  // 当前编辑的分享
}
```

**Events:**
```typescript
interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', params: { expirationDays: number; password?: string }): void
}
```

### ShareStatsDialog 组件

**功能:**
- 显示分享的基本信息（文件名、分享码、密码）
- 显示统计数据：
  - 访问次数（总访问数）
  - 下载次数（下载操作数）
  - 独立访客（去重后的IP数）
- 显示详细访问记录表格：
  - 访问时间
  - 访问IP
  - 操作类型（查看/下载）
  - 用户代理（浏览器/系统）
- 支持分页显示

**Props:**
```typescript
interface Props {
  visible?: boolean             // 对话框可见性
  share?: ShareListItem | null  // 当前查看统计的分享
}
```

**访问记录格式:**
```typescript
interface AccessRecord {
  ID: number
  ShareID: number
  AccessTime: string        // ISO 8601格式
  IPAddress: string         // 访问者IP
  Action: 'view' | 'download'
  UserAgent: string         // 浏览器User-Agent
}
```

### API接口

#### 1. 获取我的分享列表

```typescript
GET /api/v1/cloud/shares

Response:
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "ID": 1,
      "FileID": 123,
      "FileName": "example.pdf",
      "ShareCode": "abc123",
      "Password": "xyz789",
      "CreateTime": "2026-01-15T10:00:00Z",
      "ExpirationTime": "2026-01-22T10:00:00Z"
    }
  ]
}
```

#### 2. 创建分享

```typescript
POST /api/v1/cloud/files/:id/share

Request:
{
  "expirationDays": 7,
  "password": "abc123"
}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "ID": 1,
    "ShareCode": "xyz789",
    "ShareURL": "https://example.com/share/xyz789",
    // ... other fields
  }
}
```

#### 3. 更新分享

```typescript
PUT /api/v1/cloud/shares/:id

Request:
{
  "expirationDays": 30,
  "password": "newpass"
}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "ID": 1,
    "ExpirationTime": "2026-02-14T10:00:00Z",
    // ... updated fields
  }
}
```

#### 4. 删除分享

```typescript
DELETE /api/v1/cloud/shares/:id

Response:
{
  "code": 200,
  "message": "success"
}
```

#### 5. 获取分享访问记录

```typescript
GET /api/v1/cloud/shares/:id/access-records

Response:
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "ID": 1,
      "ShareID": 123,
      "AccessTime": "2026-01-15T14:30:00Z",
      "IPAddress": "192.168.1.100",
      "Action": "view",
      "UserAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ..."
    }
  ]
}
```

## 📊 使用场景

### 场景1: 查看所有分享

```typescript
// 在 CloudView 中点击"我的分享"按钮
function handleOpenShareManager() {
  shareManagerVisible.value = true
  handleRefreshShares()
}

async function handleRefreshShares() {
  await share.refreshShares()
}
```

### 场景2: 筛选有效/过期分享

在 CloudShareManager 组件中，用户可以通过下拉菜单选择：
- **全部**: 显示所有分享
- **有效**: 仅显示未过期的分享
- **已过期**: 仅显示已过期的分享

筛选逻辑自动根据 `ExpirationTime` 字段判断。

### 场景3: 编辑分享

```typescript
// 用户点击"编辑"按钮
function handleOpenEditShare(shareItem: ShareListItem) {
  currentShare.value = shareItem
  dialogs.editShare = true
}

// 提交编辑
async function handleEditShare(params: { expirationDays: number; password?: string }) {
  if (!currentShare.value) return

  const success = await share.modifyShare(currentShare.value.ID, params)
  if (success) {
    dialogs.editShare = false
    currentShare.value = null
    await handleRefreshShares()
  }
}
```

### 场景4: 查看访问统计

```typescript
// 用户点击"访问统计"按钮
function handleOpenShareStats(shareItem: ShareListItem) {
  currentShare.value = shareItem
  dialogs.shareStats = true
}
```

统计对话框会自动加载：
- 访问总次数
- 下载次数
- 独立访客数
- 详细访问记录（时间、IP、操作、设备）

### 场景5: 复制分享链接

```typescript
async function handleCopyShareLink(shareItem: ShareListItem) {
  await share.copyShareLink(shareItem)
}

// 复制内容格式:
// 分享链接：https://example.com/share/abc123
// 提取码：xyz789
```

### 场景6: 删除分享

```typescript
async function handleDeleteShare(shareItem: ShareListItem) {
  const success = await share.removeShareWithConfirm(shareItem)
  if (success) {
    await handleRefreshShares()
  }
}
```

系统会弹出确认对话框，防止误删除。

## 🎨 UI设计

### 分享列表卡片

```
┌────────────────────────────────────────────────────┐
│ 📄 example.pdf                          [有效 剩余7天] │
│                                                    │
│ 🔗 abc123  🔒 xyz789  🕐 2026-01-15 10:00        │
│                                                    │
│ [复制链接] [编辑] [访问统计] [删除]                     │
└────────────────────────────────────────────────────┘
```

### 统计信息栏

```
┌──────────────────────────────────────────┐
│  总分享: 25    有效分享: 18    已过期: 7  │
└──────────────────────────────────────────┘
```

### 编辑分享对话框

```
┌─────────────── 编辑分享 ───────────────┐
│                                         │
│  链接: https://example.com/share/abc123 │
│  提取码: xyz789                          │
│                                         │
│  有效期: [7天 ▼]                        │
│  密码: [xyz789]  [生成]                 │
│                                         │
│  创建时间: 2026-01-15 10:00             │
│  过期时间: 2026-01-22 10:00             │
│                                         │
│              [取消]  [确定]              │
└─────────────────────────────────────────┘
```

### 访问统计对话框

```
┌──────────────── 访问统计 ────────────────┐
│                                          │
│  📄 example.pdf                          │
│  🔗 abc123  🔒 xyz789                    │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │  访问次数  下载次数  独立访客    │   │
│  │    156      89       42         │   │
│  └─────────────────────────────────┘   │
│                                          │
│  访问记录:                               │
│  ┌────────────────────────────────┐    │
│  │ 时间        IP       操作 设备   │    │
│  │ 14:30  192.168.1.100  下载 Win  │    │
│  │ 13:45  192.168.1.101  查看 macOS│    │
│  │ ...                             │    │
│  └────────────────────────────────┘    │
│                                          │
│                  [关闭]                  │
└──────────────────────────────────────────┘
```

## 🐛 错误处理

### 1. 后端接口未实现

如果后端尚未实现某些接口（如访问记录），前端会：
- 在控制台输出警告信息
- 显示模拟数据（仅用于演示）
- 不影响其他功能正常使用

```typescript
export async function getShareAccessRecords(shareId: number): Promise<any[]> {
  try {
    const { data } = await api.get<ApiResponse<any[]>>(`/cloud/shares/${shareId}/access-records`)
    return data?.data || []
  } catch (e) {
    console.warn('获取分享访问记录失败，可能后端未实现此接口:', e)
    return []  // 返回空数组，不抛出错误
  }
}
```

### 2. 网络错误

所有网络请求都有完善的错误处理：
```typescript
try {
  const result = await updateShare(shareId, params)
  Message.success('更新成功')
} catch (e: any) {
  console.error('更新失败:', e)
  Message.error(e?.message || '更新失败')
}
```

### 3. 用户操作错误

- 编辑已过期的分享：编辑按钮自动禁用
- 删除分享：显示确认对话框
- 无效的表单数据：表单验证拦截

## 📝 测试

### 单元测试

```bash
# 测试 useCloudShare composable
npm test -- tests/cloud/unit/composables/useCloudShare.spec.ts

# 测试分享组件
npm test -- tests/cloud/unit/components/CloudShareManager.spec.ts
```

### 手动测试清单

1. **查看分享列表**
   - [ ] 打开分享管理抽屉
   - [ ] 显示所有分享
   - [ ] 筛选功能正常（全部/有效/已过期）
   - [ ] 统计数据正确

2. **创建分享**
   - [ ] 从文件列表创建分享
   - [ ] 设置有效期
   - [ ] 设置密码
   - [ ] 生成随机密码

3. **编辑分享**
   - [ ] 打开编辑对话框
   - [ ] 修改有效期
   - [ ] 修改密码
   - [ ] 保存成功后刷新列表

4. **访问统计**
   - [ ] 打开统计对话框
   - [ ] 显示统计数据（访问/下载/独立访客）
   - [ ] 显示访问记录表格
   - [ ] 分页功能正常

5. **复制链接**
   - [ ] 点击复制按钮
   - [ ] 剪贴板包含链接和提取码
   - [ ] 显示成功提示

6. **删除分享**
   - [ ] 点击删除按钮
   - [ ] 显示确认对话框
   - [ ] 确认后删除成功
   - [ ] 列表自动刷新

7. **边界情况**
   - [ ] 空分享列表显示
   - [ ] 网络错误处理
   - [ ] 后端接口未实现的降级处理

## 🔒 安全考虑

### 1. 密码强度

虽然系统支持用户自定义密码，但建议：
- 使用随机生成的6位密码（字母+数字）
- 提示用户设置密码以保护分享内容
- 后端应该对密码进行哈希存储

### 2. 访问限制

- 过期的分享自动失效（前端禁用操作按钮）
- 后端应该验证分享有效期
- 支持访问次数限制（可选，需后端支持）

### 3. 隐私保护

- 访问记录中的IP地址应脱敏处理（可选）
- 用户代理信息仅显示简化后的设备类型
- 删除分享时同时清理访问记录（后端责任）

## 🎯 后续优化

- [ ] 支持批量删除过期分享
- [ ] 支持分享二维码生成
- [ ] 支持自定义分享链接（短链接）
- [ ] 支持分享访问次数限制
- [ ] 支持分享访问通知（邮件/站内信）
- [ ] 支持分享数据导出（CSV/Excel）
- [ ] 优化访问记录查询性能（后端分页）
- [ ] 增加访问地理位置显示（基于IP）
- [ ] 增加访问趋势图表（ECharts）

---

**版本**: 1.0.0
**最后更新**: 2026-01-15
**作者**: Claude Code Assistant
