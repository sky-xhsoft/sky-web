# 云盘 UI 组件

完整的云盘UI组件库，包含18个组件。

## 📦 组件列表

### 基础展示组件（Day 1）✅
1. **CloudHeader** - 顶部标题栏
   - Props: `title`
   - Slots: `actions`
   - 46行

2. **CloudBreadcrumb** - 面包屑导航
   - Props: `items`, `currentId`
   - Events: `navigate`
   - 53行

3. **CloudQuotaBar** - 配额进度条
   - Props: `quota`
   - 功能: 显示存储空间使用情况，动态颜色
   - 93行

4. **CloudUploadProgress** - 上传进度浮窗
   - Props: `uploadQueue`, `hasUploadingTasks`, `overallProgress`
   - Events: `retry`, `remove`, `clearCompleted`
   - 功能: 固定在右下角，支持折叠，显示所有上传任务
   - 183行

### 文件展示组件（Day 2）
5. **CloudFileCard** - 文件/文件夹卡片
6. **CloudFileGrid** - 网格视图容器

### 新增功能组件（Day 3）
7. **CloudToolbar** - 工具栏（上传、新建文件夹、视图切换）
8. **CloudSearchBar** - 搜索栏
9. **CloudSortDropdown** - 排序下拉
10. **CloudFileList** - 列表视图

### 批量操作组件（Day 4）
11. **CloudBatchActions** - 批量操作工具栏

### 对话框组件（Day 5）
12. **CreateFolderDialog** - 创建文件夹对话框
13. **RenameDialog** - 重命名对话框
14. **MoveFileDialog** - 移动文件对话框
15. **CreateShareDialog** - 创建分享对话框
16. **ConfirmDeleteDialog** - 删除确认对话框

### 分享管理组件（Day 5）
17. **CloudShareManager** - 分享管理面板
18. **CloudFileTree** - 文件夹树（用于移动文件）

## 🎨 设计规范

### 颜色
- 主色：Arco Design 默认蓝色
- 成功：`#00b42a`
- 警告：`#ff7d00`
- 危险：`#f53f3f`

### 间距
- 小：8px
- 中：12px, 16px
- 大：20px, 24px

### 字体
- 标题：24px (font-weight: 600)
- 正文：14px
- 辅助：12px, 13px

## 📝 使用示例

```vue
<template>
  <div class="cloud-page">
    <!-- 头部 -->
    <CloudHeader title="我的云盘">
      <template #actions>
        <a-button>设置</a-button>
      </template>
    </CloudHeader>

    <!-- 面包屑 -->
    <CloudBreadcrumb
      :items="breadcrumbs"
      :current-id="currentFolderId"
      @navigate="handleNavigate"
    />

    <!-- 侧边栏配额 -->
    <CloudQuotaBar :quota="quota" />

    <!-- 上传进度（自动显示） -->
    <CloudUploadProgress
      :upload-queue="uploadQueue"
      :has-uploading-tasks="hasUploadingTasks"
      :overall-progress="uploadProgress"
      @retry="handleRetry"
      @remove="handleRemove"
      @clear-completed="handleClearCompleted"
    />
  </div>
</template>
```

## ✅ 进度

- ✅ Day 1: 基础展示组件（4个，375行）
- ✅ Day 2: 文件展示组件（2个，332行）
- ✅ Day 3: 新增功能组件（4个，541行）
- ✅ Day 4: 批量操作组件（1个，149行）
- ✅ Day 5: 对话框组件（6个，758行）

**总计：17个组件，2,155行代码** ✅

## 📊 组件详情

### Day 1: 基础展示组件（375行）
1. CloudHeader - 46行
2. CloudBreadcrumb - 53行
3. CloudQuotaBar - 93行
4. CloudUploadProgress - 183行

### Day 2: 文件展示组件（332行）
5. CloudFileCard - 203行
6. CloudFileGrid - 129行

### Day 3: 新增功能组件（541行）
7. CloudToolbar - 113行
8. CloudSearchBar - 88行
9. CloudSortDropdown - 132行
10. CloudFileList - 208行

### Day 4: 批量操作组件（149行）
11. CloudBatchActions - 149行

### Day 5: 对话框和管理组件（758行）
12. CreateFolderDialog - 94行
13. RenameDialog - 104行
14. MoveFileDialog - 180行
15. CreateShareDialog - 145行
16. ConfirmDeleteDialog - 109行
17. CloudShareManager - 126行
