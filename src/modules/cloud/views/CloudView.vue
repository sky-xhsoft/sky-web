<template>
  <div class="cloud-view">
    <!-- 主内容区 -->
    <div class="cloud-view__content">

      <!-- 主区域 -->
      <main ref="dropZoneRef" class="cloud-view__main" :class="{ 'drag-over': dragUpload.isDragging.value }">
        <!-- 拖拽上传提示覆盖层 -->
        <div v-if="dragUpload.isDragging.value" class="drag-overlay">
          <div class="drag-overlay-content">
            <icon-cloud-download :size="64" />
            <div class="drag-overlay-text">释放文件以上传</div>
            <div class="drag-overlay-hint">支持多个文件同时上传</div>
          </div>
        </div>

        <!-- 顶部栏：面包屑 + 我的分享 + 配额 -->
        <CloudTopBar
          :items="store.breadcrumbs"
          :current-id="store.currentFolderId"
          @navigate="handleBreadcrumbNavigate"
          @open-share-manager="handleOpenShareManager"
        />


        <!-- 工具栏 -->
        <CloudToolbar
          :view-mode="store.viewMode"
          :refreshing="refreshing"
          @upload="handleUpload"
          @create-folder="handleShowCreateFolderDialog"
          @refresh="handleRefresh"
          @view-mode-change="handleViewModeChange"
        >
          <template #search>
            <CloudSearchBar
              v-model="searchQuery"
              :searching="search.searching.value"
              :result-count="search.resultCount.value"
              @search="handleSearch"
              @clear="handleClearSearch"
            />
          </template>
          <template #sort>
            <CloudSortDropdown
              :sort-by="store.sortBy"
              :sort-order="store.sortOrder"
              @sort-by-change="handleSortByChange"
              @sort-order-toggle="handleSortOrderToggle"
            />
          </template>
        </CloudToolbar>

        <!-- 文件展示区 -->
        <CloudFileDisplay
          :view-mode="store.viewMode"
          :items="store.gridItems"
          :loading="store.loading.files"
          :selected-ids="allSelectedIds"
          :selectable="true"
          @item-click="handleItemClick"
          @item-double-click="handleItemDoubleClick"
          @item-select="handleItemSelect"
          @list-select="handleListSelect"
          @item-action="handleItemAction"
        />

      </main>

      <!-- 右侧栏：配额信息 + 批量操作 -->
      <aside class="cloud-view__sidebar">
        <CloudQuotaBar :quota="store.quota" />

        <!-- 批量操作卡片 -->
        <CloudBatchActions
          v-if="selection.selectedCount.value > 0"
          :visible="selection.selectedCount.value > 0"
          :selected-count="selection.selectedCount.value"
          :selected-size="selection.selectedTotalSize.value"
          :total-count="store.files.length + store.currentFolderChildren.length"
          :has-selected-files="selection.getSelectedFiles().length > 0"
          @select-all="handleSelectAll"
          @clear="handleClearSelection"
          @download="handleBatchDownload"
          @move="handleShowMoveDialog"
          @delete="handleShowBatchDeleteDialog"
        />
      </aside>
    </div>

    <!-- 上传进度 -->
    <CloudUploadProgress
      :upload-queue="store.uploadQueue"
      :has-uploading-tasks="store.hasUploadingTasks"
      :overall-progress="store.uploadProgress"
      @retry="handleRetryUpload"
      @remove="handleRemoveUpload"
      @clear-completed="handleClearCompletedUploads"
    />

    <!-- 对话框们 -->
    <CreateFolderDialog
      v-model:visible="dialogs.createFolder"
      :loading="folder.creatingFolder.value"
      @confirm="handleCreateFolder"
    />

    <RenameDialog
      v-model:visible="dialogs.rename"
      :loading="currentRenameType === 'file' ? file.renamingFile.value : folder.renamingFolder.value"
      :old-name="currentRenameName"
      :item-type="currentRenameType"
      @confirm="handleRename"
    />

    <MoveFileDialog
      v-model:visible="dialogs.move"
      :loading="file.movingFile.value"
      :selected-count="selection.selectedCount.value"
      :current-folder-id="store.currentFolderId"
      @confirm="handleMove"
    />

    <CreateShareDialog
      v-model:visible="dialogs.share"
      :loading="share.creatingShare.value"
      :item-name="currentShareName"
      :item-type="currentShareType"
      @confirm="handleCreateShare"
    />

    <EditShareDialog
      v-model:visible="dialogs.editShare"
      :loading="share.updatingShare.value"
      :share="currentShare"
      @confirm="handleEditShare"
    />

    <ShareStatsDialog
      v-model:visible="dialogs.shareStats"
      :share="currentShare"
    />

    <ConfirmDeleteDialog
      v-model:visible="dialogs.delete"
      :loading="currentDeleteType === 'file' ? file.deletingFile.value : folder.deletingFolder.value"
      :item-name="currentDeleteName"
      :count="currentDeleteCount"
      :details="currentDeleteDetails"
      @confirm="handleDelete"
    />

    <!-- 批量操作进度对话框 -->
    <CloudBatchProgressDialog
      v-model:visible="selection.batchProgress.value.visible"
      :title="selection.batchProgress.value.title"
      :total="selection.batchProgress.value.total"
      :completed="selection.batchProgress.value.completed"
      :success-count="selection.batchProgress.value.successCount"
      :failed="selection.batchProgress.value.failed"
      :failed-items="selection.batchProgress.value.failedItems"
      :in-progress="selection.batchProgress.value.inProgress"
      @close="selection.closeBatchProgress()"
      @retry="selection.retryBatchOperation()"
    />

    <!-- 文件预览对话框 -->
    <FilePreviewDialog
      v-model:visible="dialogs.preview"
      :file="currentItem?.file || null"
      :category="currentItem?.file ? preview.getFileCategory(currentItem.file) : 'unknown'"
      :can-navigate="true"
      :has-previous="hasPreviewPrevious"
      :has-next="hasPreviewNext"
      @previous="handlePreviewPrevious"
      @next="handlePreviewNext"
      @download="handlePreviewDownload"
    />

    <!-- 分享管理抽屉 -->
    <a-drawer
      v-model:visible="shareManagerVisible"
      title="分享管理"
      width="600px"
      :footer="false"
    >
      <CloudShareManager
        :shares="store.myShares"
        :loading="store.loading.shares"
        @refresh="handleRefreshShares"
        @copy="handleCopyShareLink"
        @edit="handleOpenEditShare"
        @view-stats="handleOpenShareStats"
        @delete="handleDeleteShare"
      />
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconShareAlt, IconCloudDownload } from '@arco-design/web-vue/es/icon'
import type { TreeNodeData } from '@arco-design/web-vue'

// 导入组件
import {
  CloudBreadcrumb,
  CloudTopBar,
  CloudFileDisplay,
  CloudQuotaBar,
  CloudToolbar,
  CloudSearchBar,
  CloudSortDropdown,
  CloudFileGrid,
  CloudFileList,
  CloudBatchActions,
  CloudUploadProgress,
  CloudShareManager,
  CloudDialogManager,
  CreateFolderDialog,
  RenameDialog,
  MoveFileDialog,
  CreateShareDialog,
  EditShareDialog,
  ShareStatsDialog,
  ConfirmDeleteDialog,
  CloudBatchProgressDialog,
  FilePreviewDialog,
} from '@/modules/cloud/components'

// 导入composables
import {
  useCloudNavigation,
  useCloudFolder,
  useCloudFile,
  useCloudUpload,
  useCloudPreview,
  useCloudShare,
  useCloudSearch,
  useCloudSort,
  useCloudSelection,
  useDragUpload,
} from '@/modules/cloud/composables'

// 导入store
import { useCloudStore } from '@/modules/cloud/stores/cloudStore'
import type { GridItem, Folder as FolderType, ShareCreateParams, ShareListItem } from '@/modules/cloud/types'

// ==================== 初始化 ====================
const store = useCloudStore()
const navigation = useCloudNavigation()
const folder = useCloudFolder()
const file = useCloudFile()
const upload = useCloudUpload()
const preview = useCloudPreview()
const share = useCloudShare()
const search = useCloudSearch()
const sort = useCloudSort()
const selection = useCloudSelection()

// 拖拽上传区域引用
const dropZoneRef = ref<HTMLElement>()

// 拖拽上传功能
const dragUpload = useDragUpload(dropZoneRef, {
  multiple: true,
  maxFiles: 100,
  maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
  onUpload: async (files: File[]) => {
    await upload.batchUpload(files, store.currentFolderId)
  },
})

// ==================== 状态 ====================
const refreshing = ref(false)
const shareManagerVisible = ref(false)

// 搜索关键词（双向绑定）
const searchQuery = computed({
  get: () => search.searchQuery.value,
  set: (value) => {
    search.searchQuery.value = value
  },
})

// 对话框状态
const dialogs = reactive({
  createFolder: false,
  rename: false,
  move: false,
  share: false,
  editShare: false,
  shareStats: false,
  delete: false,
  preview: false,
})

// 当前操作的项
const currentItem = ref<GridItem | null>(null)
const currentRenameType = ref<'file' | 'folder'>('file')
const currentRenameName = ref('')
const currentShareType = ref<'file' | 'folder'>('file')
const currentShareName = ref('')
const currentShare = ref<ShareListItem | null>(null)
const currentDeleteType = ref<'file' | 'folder'>('file')
const currentDeleteName = ref('')
const currentDeleteCount = ref(1)
const currentDeleteDetails = ref<{ fileCount?: number; folderCount?: number; totalSize?: number }>({})

// ==================== 计算属性 ====================

// 文件夹树数据（转换为Arco Tree格式）
const folderTreeData = computed<TreeNodeData[]>(() => {
  const convertToTreeData = (folders: FolderType[]): TreeNodeData[] => {
    return folders.map((f) => {
      // 后端返回 json:"id"（小写），需要兼容 ID 和 id
      const folderId = f.ID || f.id || 0
      console.log("[DEBUG] Converting folder to tree node:", { name: f.name, ID: f.ID, id: f.id, folderId })
      return {
        key: folderId,
        title: f.name,
        children: f.Children ? convertToTreeData(f.Children) : [],
      }
    })
  }

  return [
    {
      key: 0,
      title: '根目录',
      children: convertToTreeData(store.folderTree),
    },
  ]
})
// 所有选中的ID（文件+文件夹）
// Fix: Use composite keys (type-id) to prevent ID collision between files and folders
const allSelectedIds = computed(() => {
  const ids = new Set<string>()
  store.selectedFileIds.forEach((id) => ids.add(`file-${id}`))
  store.selectedFolderIds.forEach((id) => ids.add(`folder-${id}`))
  return ids
})
// ==================== 生命周期 ====================
onMounted(async () => {
  await handleRefresh()
})

// ==================== 导航相关 ====================
function handleBreadcrumbNavigate(item: { id: number; name: string }) {
  navigation.navigateTo(item.id)
}

function handleTreeSelect(selectedKeys: (string | number)[]) {
  console.log("[DEBUG] handleTreeSelect called with:", selectedKeys)
  if (selectedKeys.length > 0) {
    // Parse the selected key to a number
    // Arco tree may return string keys, so we need to properly convert
    const selectedKey = selectedKeys[0]
    const folderId = typeof selectedKey === 'number' ? selectedKey : parseInt(String(selectedKey), 10)
    console.log("[DEBUG] Parsed folderId:", folderId, "from:", selectedKey)

    // Validate that we got a valid number
    if (isNaN(folderId)) {
      console.error("Invalid folder ID selected:", selectedKey)
      return
    }

    console.log("[DEBUG] Calling navigation.navigateTo(", folderId, ")")
    navigation.navigateTo(folderId)
  }
}

// ==================== 刷新 ====================
async function handleRefresh() {
  refreshing.value = true
  try {
    await store.refreshAll()
    Message.success('刷新成功')
  } catch (e) {
    // 错误已在store中处理
  } finally {
    refreshing.value = false
  }
}

// ==================== 工具栏操作 ====================
async function handleUpload(files: File[]) {
  if (files.length === 0) return

  // 20GB = 20 * 1024 * 1024 * 1024 字节
  const MAX_FILE_SIZE = 20 * 1024 * 1024 * 1024

  for (const fileItem of files) {
    // 检查文件大小
    if (fileItem.size > MAX_FILE_SIZE) {
      Message.error(`文件 ${fileItem.name} 超过 20GB 限制，无法上传`)
      continue
    }

    // 大文件自动使用断点续传，小文件使用普通上传
    await upload.uploadWithResumable(fileItem, store.currentFolderId)
  }
}

function handleShowCreateFolderDialog() {
  dialogs.createFolder = true
}

async function handleCreateFolder(folderName: string) {
  const success = await folder.createFolder(folderName, store.currentFolderId)
  if (success) {
    dialogs.createFolder = false
  }
}

function handleViewModeChange(mode: 'grid' | 'list') {
  store.setViewMode(mode)
}

// ==================== 搜索和排序 ====================
function handleSearch(query: string) {
  search.search(query)
}

function handleClearSearch() {
  search.clearSearch()
}

function handleSortByChange(sortBy: string) {
  sort.setSortBy(sortBy as any)
}

function handleSortOrderToggle() {
  sort.toggleSortOrder()
}

// ==================== 文件/文件夹操作 ====================
async function handleItemClick(item: GridItem) {
  // 单击文件夹：直接进入
  if (item.type === 'folder') {
    await navigation.navigateTo(item.id, item.name)
  }
  // 单击文件：不做任何操作（只有点击复选框才会选中）
}

async function handleItemDoubleClick(item: GridItem) {
  if (item.type === 'folder') {
    // 双击文件夹：进入文件夹（与单击行为一致）
    await navigation.navigateTo(item.id, item.name)
  } else if (item.type === 'file') {
    // 双击文件：预览
    if (item.file && preview.canPreview(item.file)) {
      currentItem.value = item
      dialogs.preview = true
    } else {
      Message.warning('暂不支持预览此类型文件')
    }
  }
}

function handleItemSelect(payload: { item: GridItem; selected: boolean }) {
  console.log('[DEBUG] handleItemSelect called:', payload)
  const { item, selected } = payload
  if (item.type === 'file') {
    console.log('[DEBUG] Toggling file selection:', item.id)
    selection.toggleFileSelection(item.id)
  } else {
    console.log('[DEBUG] Toggling folder selection:', item.id)
    selection.toggleFolderSelection(item.id)
  }
  console.log('[DEBUG] After toggle - selectedFileIds:', Array.from(store.selectedFileIds))
  console.log('[DEBUG] After toggle - selectedFolderIds:', Array.from(store.selectedFolderIds))
}

function handleListSelect(selectedKeys: (string | number)[]) {
  // 列表视图的选择（全量更新）
  store.selectedFileIds.clear()
  store.selectedFolderIds.clear()

  selectedKeys.forEach((key) => {
    if (typeof key === 'string') {
      const [type, id] = key.split('-')
      const numId = parseInt(id)
      if (type === 'file') {
        store.selectedFileIds.add(numId)
      } else {
        store.selectedFolderIds.add(numId)
      }
    }
  })
}

async function handleItemAction(payload: { action: string; item: GridItem }) {
  const { action, item } = payload
  console.log('[DEBUG] handleItemAction called:', { action, item })
  currentItem.value = item

  switch (action) {
    case 'preview':
      console.log('[DEBUG] Preview action:', {
        itemType: item.type,
        hasFile: !!item.file,
        canPreview: item.file ? preview.canPreview(item.file) : false,
        fileExt: item.file?.FileExt
      })
      if (item.type === 'file' && item.file && preview.canPreview(item.file)) {
        console.log('[DEBUG] Opening preview dialog')
        dialogs.preview = true
      } else {
        Message.warning('暂不支持预览此类型文件')
      }
      break

    case 'download':
      if (item.type === 'file' && item.file) {
        await file.download(item.file)
      }
      break

    case 'rename':
      currentRenameType.value = item.type as 'file' | 'folder'
      currentRenameName.value = item.name
      dialogs.rename = true
      break

    case 'move':
      if (item.type === 'file') {
        // 选中当前文件
        store.selectedFileIds.clear()
        store.selectedFileIds.add(item.id)
        dialogs.move = true
      } else if (item.type === 'folder') {
        // 选中当前文件夹
        store.selectedFolderIds.clear()
        store.selectedFolderIds.add(item.id)
        dialogs.move = true
      }
      break

    case 'share':
      currentShareType.value = item.type as 'file' | 'folder'
      currentShareName.value = item.name
      dialogs.share = true
      break

    case 'delete':
      console.log('[DEBUG] handleItemAction - delete action', { item, type: item.type, id: item.id })
      currentDeleteType.value = item.type as 'file' | 'folder'
      currentDeleteName.value = item.name
      currentDeleteCount.value = 1
      currentDeleteDetails.value = {}
      if (item.type === 'file' && item.file) {
        currentDeleteDetails.value.fileCount = 1
        currentDeleteDetails.value.totalSize = item.file.FileSize
      } else {
        currentDeleteDetails.value.folderCount = 1
      }
      dialogs.delete = true
      break
  }
}

async function handleRename(newName: string) {
  if (!currentItem.value) return

  let success = false
  if (currentRenameType.value === 'file' && currentItem.value.file) {
    success = await file.renameFile(currentItem.value.id, newName)
  } else if (currentRenameType.value === 'folder') {
    success = await folder.renameFolder(currentItem.value.id, newName)
  }

  if (success) {
    dialogs.rename = false
    currentItem.value = null
  }
}

async function handleMove(targetFolderId: number) {
  const selectedFiles = selection.getSelectedFiles()
  if (selectedFiles.length === 0) return

  // 批量移动
  await selection.batchMove(targetFolderId)
  dialogs.move = false
}

async function handleCreateShare(params: Omit<ShareCreateParams, 'fileId' | 'resourceId'>) {
  if (!currentItem.value) return

  let success = false
  if (currentShareType.value === 'file' && currentItem.value.file) {
    const result = await share.createShare(currentItem.value.file, params)
    success = !!result
  } else if (currentShareType.value === 'folder' && currentItem.value.folder) {
    const result = await share.createFolderShareLink(currentItem.value.folder, params)
    success = !!result
  }

  if (success) {
    dialogs.share = false
    currentItem.value = null
  }
}

async function handleDelete() {
  console.log('[DEBUG] handleDelete called', { currentItem: currentItem.value, currentDeleteType: currentDeleteType.value, currentDeleteCount: currentDeleteCount.value })

  let success = false

  // 如果有 currentItem，说明是从右键菜单或卡片按钮触发的单项删除
  if (currentItem.value) {
    if (currentDeleteType.value === 'file' && currentItem.value?.file) {
      success = await file.deleteFile(currentItem.value.id)
    } else if (currentDeleteType.value === 'folder') {
      console.log('[DEBUG] handleDelete - calling folder.deleteFolder', { id: currentItem.value?.id })
      success = await folder.deleteFolder(currentItem.value!.id)
    }
  } else {
    // 没有 currentItem，说明是从批量操作面板触发的
    // 使用 selection.batchDelete() 处理
    success = await selection.batchDelete()
  }

  if (success) {
    dialogs.delete = false
    currentItem.value = null
  }
}

// ==================== 批量操作 ====================
function handleSelectAll() {
  selection.toggleSelectAll()
}

function handleClearSelection() {
  selection.clearSelection()
}

async function handleBatchDownload() {
  const selectedFiles = selection.getSelectedFiles()
  await file.batchDownload(selectedFiles)
}

function handleShowMoveDialog() {
  dialogs.move = true
}

function handleShowBatchDeleteDialog() {
  const selectedFiles = selection.getSelectedFiles()
  const selectedFolders = selection.getSelectedFolders()

  currentDeleteType.value = 'file' // 默认
  currentDeleteName.value = ''
  currentDeleteCount.value = selection.selectedCount.value
  currentDeleteDetails.value = {
    fileCount: selectedFiles.length,
    folderCount: selectedFolders.length,
    totalSize: selection.selectedTotalSize.value,
  }

  dialogs.delete = true
}

// ==================== 上传管理 ====================
async function handleRetryUpload(taskId: string) {
  await upload.retryUpload(taskId)
}

function handleRemoveUpload(taskId: string) {
  upload.removeFromQueue(taskId)
}

function handleClearCompletedUploads() {
  upload.clearCompletedTasks()
}

// ==================== 分享管理 ====================
function handleOpenShareManager() {
  shareManagerVisible.value = true
  handleRefreshShares()
}

async function handleRefreshShares() {
  await share.refreshShares()
}

async function handleCopyShareLink(shareItem: ShareListItem) {
  await share.copyShareLink(shareItem)
}

function handleOpenEditShare(shareItem: ShareListItem) {
  currentShare.value = shareItem
  dialogs.editShare = true
}

async function handleEditShare(params: { expirationDays: number; password?: string }) {
  if (!currentShare.value) return

  const success = await share.modifyShare(currentShare.value.ID, params)
  if (success) {
    dialogs.editShare = false
    currentShare.value = null
    await handleRefreshShares()
  }
}

function handleOpenShareStats(shareItem: ShareListItem) {
  currentShare.value = shareItem
  dialogs.shareStats = true
}

async function handleDeleteShare(shareItem: ShareListItem) {
  const success = await share.removeShareWithConfirm(shareItem)
  if (success) {
    await handleRefreshShares()
  }
}

// ==================== 文件预览导航 ====================
const previewableFiles = computed(() => {
  return store.files.filter((f) => preview.canPreview(f))
})

const currentPreviewIndex = computed(() => {
  if (!currentItem.value?.file) return -1
  return previewableFiles.value.findIndex((f) => f.ID === currentItem.value!.file!.ID)
})

const hasPreviewPrevious = computed(() => {
  return currentPreviewIndex.value > 0
})

const hasPreviewNext = computed(() => {
  return currentPreviewIndex.value >= 0 && currentPreviewIndex.value < previewableFiles.value.length - 1
})

function handlePreviewPrevious() {
  const prevIndex = currentPreviewIndex.value - 1
  if (prevIndex >= 0) {
    const prevFile = previewableFiles.value[prevIndex]
    const prevItem = store.gridItems.find((item) => item.type === 'file' && item.file?.ID === prevFile.ID)
    if (prevItem) {
      currentItem.value = prevItem
    }
  }
}

function handlePreviewNext() {
  const nextIndex = currentPreviewIndex.value + 1
  if (nextIndex < previewableFiles.value.length) {
    const nextFile = previewableFiles.value[nextIndex]
    const nextItem = store.gridItems.find((item) => item.type === 'file' && item.file?.ID === nextFile.ID)
    if (nextItem) {
      currentItem.value = nextItem
    }
  }
}

async function handlePreviewDownload() {
  if (currentItem.value?.file) {
    await file.download(currentItem.value.file)
  }
}

</script>

<style scoped>
.cloud-view {
  height: 100vh;
  overflow: hidden;
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f2f5 0%, #fafafa 100%);
  display: flex;
  flex-direction: column;
}

.cloud-view__content {
  display: flex;
  flex: 1;
  gap: 20px;
  padding: 20px;
  max-width: 1920px;
  margin: 0 auto;
  width: 100%;
  overflow: hidden;
}


.cloud-view__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

/* 右侧栏 */
.cloud-view__sidebar {
  width: 360px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 顶部栏：面包屑 + 操作按钮 */
.cloud-view__top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 24px;
  background: linear-gradient(to right, #ffffff 0%, #fafafa 100%);
  border-bottom: 1px solid #e8e8e8;
  flex-wrap: wrap;
  min-height: 64px;
}

.cloud-view__top-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 拖拽时的视觉效果 */
.cloud-view__main.drag-over {
  border: 3px dashed rgb(var(--primary-6));
  background-color: rgba(var(--primary-1), 0.3);
  box-shadow: 0 8px 24px rgba(var(--primary-6), 0.15);
  transform: scale(0.995);
}

/* 拖拽覆盖层 */
.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(var(--primary-1), 0.97) 0%, rgba(var(--primary-2), 0.95) 100%);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  border-radius: 12px;
  pointer-events: none;
  animation: fadeInScale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.drag-overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  color: rgb(var(--primary-6));
  text-align: center;
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.drag-overlay-text {
  font-size: 28px;
  font-weight: 600;
  color: rgb(var(--primary-6));
  text-shadow: 0 2px 8px rgba(var(--primary-6), 0.1);
}

.drag-overlay-hint {
  font-size: 15px;
  color: rgb(var(--primary-5));
  opacity: 0.9;
  font-weight: 500;
}

.cloud-view__files {
  flex: 1;
  background: transparent;
  overflow: auto;
  padding: 16px;
}

/* 响应式调整 */

@media (max-width: 1200px) {
  .cloud-view__sidebar {
    width: 300px;
  }
}

@media (max-width: 968px) {
  .cloud-view__content {
    flex-direction: column;
    padding: 12px;
  }

  .cloud-view__sidebar {
    width: 100%;
    order: -1; /* 移到上方 */
  }

  .cloud-view__top-bar {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
  }

  .cloud-view__top-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .cloud-view__files {
    min-height: 400px;
  }
}
</style>
