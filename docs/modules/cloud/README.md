# ☁️ 云盘模块 (Cloud Module)

完整的云盘功能模块，包含文件管理、上传下载、分享、搜索排序等功能。

## 📦 模块结构

```
src/modules/cloud/
├── api/                    # API层（432行）
│   ├── cloud.ts           # 主API文件
│   ├── index.ts           # 统一导出
│   └── README.md          # API文档
├── components/            # UI组件（17个，2,155行）
│   ├── CloudHeader.vue
│   ├── CloudBreadcrumb.vue
│   ├── CloudQuotaBar.vue
│   ├── CloudUploadProgress.vue
│   ├── CloudFileCard.vue
│   ├── CloudFileGrid.vue
│   ├── CloudFileList.vue
│   ├── CloudToolbar.vue
│   ├── CloudSearchBar.vue
│   ├── CloudSortDropdown.vue
│   ├── CloudBatchActions.vue
│   ├── CloudShareManager.vue
│   ├── dialogs/           # 对话框组件
│   │   ├── CreateFolderDialog.vue
│   │   ├── RenameDialog.vue
│   │   ├── MoveFileDialog.vue
│   │   ├── CreateShareDialog.vue
│   │   ├── EditShareDialog.vue      # 编辑分享（新）
│   │   ├── ShareStatsDialog.vue     # 访问统计（新）
│   │   └── ConfirmDeleteDialog.vue
│   ├── index.ts           # 组件统一导出
│   └── README.md          # 组件文档
├── composables/           # 组合式函数（10个，2,146行）
│   ├── useCloudNavigation.ts
│   ├── useCloudFolder.ts
│   ├── useCloudFile.ts
│   ├── useCloudUpload.ts
│   ├── useCloudPreview.ts
│   ├── useCloudShare.ts
│   ├── useCloudSearch.ts
│   ├── useCloudSort.ts
│   ├── useCloudSelection.ts
│   ├── useFileIcon.ts
│   ├── useCloud.ts        # 综合入口
│   └── index.ts           # 统一导出
├── constants/             # 常量（2个文件）
│   ├── fileIcons.ts       # 文件图标映射（300+行）
│   └── config.ts          # 模块配置
├── stores/                # Pinia Store
│   └── cloudStore.ts      # 主Store（639行）
├── types/                 # 类型定义（6个文件）
│   ├── file.ts
│   ├── folder.ts
│   ├── quota.ts
│   ├── share.ts
│   ├── upload.ts
│   └── index.ts
├── utils/                 # 工具函数（2个文件）
│   ├── format.ts          # 格式化函数
│   ├── validation.ts      # 验证函数
│   └── resumable-upload.ts # 断点续传核心（340行）
├── views/                 # 视图组件
│   └── CloudView.vue      # 主视图（722行）
├── docs/                  # 文档
│   ├── RESUMABLE_UPLOAD.md # 断点续传文档
│   ├── SHARE_MANAGEMENT.md # 分享管理文档
│   ├── PROJECT_STATUS.md   # 项目状态
│   └── STAGE8_SUMMARY.md   # 阶段8总结
├── index.ts               # 模块统一导出
└── README.md              # 本文件

tests/cloud/               # 测试文件
├── unit/
│   ├── utils/             # 工具函数测试（61个测试）
│   ├── stores/            # Store测试（28个测试）
│   └── composables/       # Composables测试（15个测试）
└── integration/           # 集成测试（待添加）
```

## 🎯 功能特性

### 核心功能
- ✅ 文件/文件夹管理（创建、删除、重命名、移动）
- ✅ 文件上传/下载
- ✅ 文件夹树导航
- ✅ 面包屑导航
- ✅ 配额管理和显示

### 高级功能
- ✅ 搜索功能（按文件名）
- ✅ 排序功能（按名称、大小、日期）
- ✅ 批量操作（多选、批量删除、批量下载、批量移动）
- ✅ 分享管理（创建分享、查看分享列表、编辑分享、访问统计、删除分享）
- ✅ 上传进度显示（支持多文件、暂停/恢复、重试）
- ✅ 视图切换（网格视图/列表视图）
- ✅ 断点续传（文件分片、断点恢复、秒传、自动重试）
- ✅ 文件预览（文本、图片、PDF、Markdown、代码高亮）

### 待实现功能
- ⏳ 性能优化（虚拟滚动、懒加载）
- ⏳ 文件夹上传
- ⏳ 拖拽上传

## 🚀 快速开始

### 1. 在页面中使用

```vue
<template>
  <CloudView />
</template>

<script setup lang="ts">
import { CloudView } from '@/modules/cloud'
</script>
```

### 2. 使用单个组件

```vue
<template>
  <div>
    <CloudHeader title="文件管理" />
    <CloudFileGrid :items="items" />
  </div>
</template>

<script setup lang="ts">
import { CloudHeader, CloudFileGrid } from '@/modules/cloud/components'
</script>
```

### 3. 使用Composables

```vue
<script setup lang="ts">
import { useCloudFile, useCloudNavigation } from '@/modules/cloud/composables'

const file = useCloudFile()
const navigation = useCloudNavigation()

async function handleDownload(fileId: number) {
  await file.download(fileId)
}

async function goToFolder(folderId: number) {
  await navigation.navigateTo(folderId)
}
</script>
```

### 4. 使用Store

```vue
<script setup lang="ts">
import { useCloudStore } from '@/modules/cloud'

const store = useCloudStore()

// 加载数据
await store.loadFolderTree()
await store.loadFiles()

// 访问状态
console.log(store.files)
console.log(store.quota)
</script>
```

## 📚 API文档

### Store API

#### 状态
- `folderTree: Folder[]` - 文件夹树
- `currentFolderId: number` - 当前文件夹ID
- `files: FileItem[]` - 文件列表
- `quota: QuotaInfo | null` - 配额信息
- `uploadQueue: UploadTask[]` - 上传队列
- `selectedFileIds: Set<number>` - 选中的文件ID
- `selectedFolderIds: Set<number>` - 选中的文件夹ID
- `searchQuery: string` - 搜索关键词
- `sortBy: FileSortBy` - 排序字段
- `sortOrder: SortOrder` - 排序方向
- `viewMode: 'grid' | 'list'` - 视图模式

#### Getters
- `currentFolder: Folder | null` - 当前文件夹对象
- `breadcrumbs: { id: number; name: string }[]` - 面包屑路径
- `gridItems: GridItem[]` - 网格项列表（文件夹+文件）
- `filteredAndSortedFiles: FileItem[]` - 过滤和排序后的文件
- `selectedCount: number` - 选中数量
- `hasUploadingTasks: boolean` - 是否有上传任务
- `uploadProgress: { percent, loaded, total }` - 上传进度

#### Actions
- `loadFolderTree()` - 加载文件夹树
- `loadFiles(folderId?)` - 加载文件列表
- `loadQuota()` - 加载配额信息
- `refreshAll()` - 刷新所有数据
- `switchFolder(folderId)` - 切换文件夹
- `createFolder(name, parentId?)` - 创建文件夹
- `deleteFolder(folderId)` - 删除文件夹
- `renameFolder(folderId, newName)` - 重命名文件夹
- `deleteFile(fileId)` - 删除文件
- `moveFile(fileId, targetFolderId)` - 移动文件
- `renameFile(fileId, newName)` - 重命名文件
- `selectFile(fileId)` - 选择/取消选择文件
- `selectFolder(folderId)` - 选择/取消选择文件夹
- `selectAll()` - 全选
- `clearSelection()` - 清空选择
- `batchDelete()` - 批量删除
- `setSearchQuery(query)` - 设置搜索关键词
- `setSortBy(sortBy)` - 设置排序字段
- `toggleSortOrder()` - 切换排序方向
- `setViewMode(mode)` - 设置视图模式

### Composables API

详见各个composable文件的JSDoc注释。

### 组件Props和Events

详见 `components/README.md`。

## 🧪 测试

### 运行所有测试
```bash
npm test
```

### 运行特定测试
```bash
# 工具函数测试
npm test -- tests/cloud/unit/utils

# Store测试
npm test -- tests/cloud/unit/stores

# Composables测试
npm test -- tests/cloud/unit/composables
```

### 测试覆盖率
```bash
npm run test:coverage
```

**当前测试状态**:
- ✅ 工具函数: 61个测试通过
- ✅ Store: 28个测试通过
- ✅ Composables: 15个测试通过
- **总计**: 104个测试通过

## 📊 代码统计

| 类别 | 文件数 | 代码行数 |
|------|--------|---------|
| 类型定义 | 6 | ~450 |
| 工具函数 | 3 | ~518 |
| 常量 | 2 | ~180 |
| API | 1 | ~493 |
| Store | 1 | 639 |
| Composables | 10 | 2,176 |
| 组件 | 19 | 2,595 |
| 视图 | 1 | 722 |
| 测试 | 4 | ~600 |
| 文档 | 5 | 2,000+ |
| **总计** | **52** | **~10,373** |

## 🔧 配置

### 模块配置

编辑 `constants/config.ts`:

```typescript
export const CLOUD_CONFIG = {
  CHUNK_SIZE: 5 * 1024 * 1024,  // 上传分片大小（5MB）
  MAX_RETRIES: 3,                // 最大重试次数
  TIMEOUT: 120000,               // 请求超时（2分钟）
}
```

### 文件图标

编辑 `constants/fileIcons.ts` 添加自定义文件图标映射。

## 🐛 已知问题

1. ~~moveFile 导入问题~~ ✅ 已修复
2. ~~文件夹分享API不一致~~ ✅ 已修复
3. ~~断点续传功能未实现~~ ✅ 已完成（阶段7）
4. ~~分享管理功能不完善~~ ✅ 已完成（阶段8）
5. 需要后端实现断点续传相关接口（可选）
6. 需要后端实现分享访问记录接口（可选）

## 📝 更新日志

### v1.0.0 (2026-01-15)
- ✅ 完成基础架构（类型、工具、常量）
- ✅ 完成API层优化
- ✅ 完成Pinia Store
- ✅ 完成10个Composables
- ✅ 完成19个UI组件（含7个对话框）
- ✅ 完成主视图集成
- ✅ 修复moveFile bug
- ✅ 统一分享API
- ✅ 实现断点续传功能（阶段7）
  - 文件分片上传（5MB/片）
  - SparkMD5 hash计算
  - 秒传检测
  - 断点恢复
  - 自动重试机制
- ✅ 实现分享管理增强（阶段8）
  - 状态筛选（全部/有效/已过期）
  - 统计信息展示
  - 编辑分享（EditShareDialog）
  - 访问统计（ShareStatsDialog）
  - 复制分享链接
- ✅ 添加104个单元测试
- ✅ 完善文档（断点续传、分享管理、项目状态）

### 计划中
- ⏳ 测试补全和性能优化（阶段9，2天）
- ⏳ 文档编写和代码收尾（阶段10，1天）
- ⏳ 代码上线和监控（阶段11，1天）

**当前进度**: 82% (22/25天已完成)

## 🤝 贡献指南

1. 所有新功能需添加单元测试
2. 组件需添加JSDoc注释
3. 遵循现有代码风格
4. 提交前运行 `npm test` 和 `npm run type-check`

## 📄 许可

内部项目，版权所有。

---

**维护者**: Sky Team
**创建日期**: 2026-01-15
**最后更新**: 2026-01-15
