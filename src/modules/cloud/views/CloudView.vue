<template>
  <div class="cloud-view" :class="{ 'has-transfer': showTransferPanel }">
    <!-- 左侧：上传 + 分类 + 我的分享 + 存储空间 -->
    <CloudSidebar
      class="cloud-view__sidebar"
      :active="category"
      :counts="categoryCounts"
      :quota="store.quota"
      @change="category = $event"
      @upload="handleUpload"
      @open-shares="handleOpenShareManager"
    />

    <!-- 中间：路径 + 工具 + 传输条 + 文件 -->
    <main ref="dropZoneRef" class="cloud-view__main" :class="{ 'drag-over': dragUpload.isDragging.value }">
      <CloudDragOverlay :visible="dragUpload.isDragging.value" />

      <div class="cloud-view__header">
        <CloudBreadcrumb
          class="cloud-view__breadcrumb"
          :items="store.breadcrumbs"
          :current-id="store.currentFolderId"
          @navigate="handleBreadcrumbNavigate($event.id)"
        />
        <div class="cloud-view__tools">
          <CloudSearchBar
            v-model="searchQuery"
            :searching="search.searching.value"
            :result-count="search.resultCount.value"
            @search="handleSearch"
            @clear="handleClearSearch"
          />
          <button
            type="button"
            class="tool-btn"
            :title="t('cloud.createFolder')"
            :aria-label="t('cloud.createFolder')"
            @click="handleShowCreateFolderDialog"
          >
            <icon-folder-add />
          </button>
          <button
            type="button"
            class="tool-btn"
            :title="t('cloud.refresh')"
            :aria-label="t('cloud.refresh')"
            :disabled="refreshing"
            @click="handleRefresh"
          >
            <icon-refresh :spin="refreshing" />
          </button>
          <CloudSortDropdown
            :sort-by="store.sortBy"
            :sort-order="store.sortOrder"
            @sort-by-change="handleSortByChange"
            @sort-order-toggle="handleSortOrderToggle"
          />
          <div class="view-toggle" role="group">
            <button
              type="button"
              class="view-toggle__btn"
              :class="{ 'is-active': store.viewMode === 'list' }"
              :aria-label="t('cloud.listView')"
              :aria-pressed="store.viewMode === 'list'"
              @click="handleViewModeChange('list')"
            >
              <icon-list />
            </button>
            <button
              type="button"
              class="view-toggle__btn"
              :class="{ 'is-active': store.viewMode === 'grid' }"
              :aria-label="t('cloud.gridView')"
              :aria-pressed="store.viewMode === 'grid'"
              @click="handleViewModeChange('grid')"
            >
              <icon-apps />
            </button>
          </div>
        </div>
      </div>

      <!-- 内联传输条：一行看总体进度，点开看明细 -->
      <CloudTransferBar
        v-if="store.uploadQueue.length > 0"
        class="cloud-view__transfer-bar"
        :upload-queue="store.uploadQueue"
        :details-open="showTransferPanel"
        @toggle="transferOpen = !transferOpen"
      />

      <div class="cloud-view__files-wrapper">
        <div v-if="category !== 'all' && displayItems.length === 0 && !store.loading.files" class="cloud-view__category-empty">
          {{ t('cloud.categoryEmpty') }}
        </div>
        <CloudFileDisplay
          v-else
          :view-mode="store.viewMode"
          :items="displayItems"
          :loading="store.loading.files"
          :selected-ids="allSelectedIds"
          :selectable="true"
          @item-click="handleItemClick"
          @item-double-click="handleItemDoubleClick"
          @item-select="handleItemSelect"
          @list-select="handleListSelect"
          @item-action="handleItemAction"
        />
      </div>

      <!-- 悬浮批量操作工具栏 - 选中文件时显示 -->
      <CloudBatchActionsBar
        :selected-count="selection.selectedCount.value"
        :selected-total-size="selection.selectedTotalSize.value"
        :can-download="selection.getSelectedFiles().length > 0"
        @select-all="handleSelectAll"
        @clear-selection="handleClearSelection"
        @download="handleBatchDownload"
        @move="handleShowMoveDialog"
        @delete="handleShowBatchDeleteDialog"
      />
    </main>

    <!-- 右侧：传输明细 -->
    <CloudUploadProgress
      v-if="showTransferPanel"
      class="cloud-view__transfer"
      :upload-queue="store.uploadQueue"
      @retry="handleRetryUpload"
      @pause="upload.pauseResumableUpload"
      @resume="upload.resumeResumableUpload"
      @remove="handleRemoveUpload"
      @clear-completed="handleClearCompletedUploads"
      @close="transferOpen = false"
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
      :siblings="previewableFiles"
      :location="previewLocation"
      @previous="handlePreviewPrevious"
      @next="handlePreviewNext"
      @select="handlePreviewSelect"
      @action="handlePreviewAction"
      @download="handlePreviewDownload"
    />

    <!-- 权限设置对话框 -->
    <PermissionDialog
      v-model:visible="dialogs.permission"
      :item-id="currentPermissionId"
      :item-name="currentPermissionName"
      :item-type="currentPermissionType"
      @changed="handleRefresh"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { IconFolderAdd, IconRefresh, IconApps, IconList } from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import { useNavigationStore } from '@/stores/navigation'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 导入组件 - 核心组件立即加载
import {
  CloudFileDisplay,
  CloudSearchBar,
  CloudSortDropdown,
  CloudUploadProgress,
} from '@/modules/cloud/components'
import CloudBreadcrumb from '@/modules/cloud/components/CloudBreadcrumb.vue'
import CloudSidebar, { type CloudCategory } from '@/modules/cloud/components/CloudSidebar.vue'
import CloudTransferBar from '@/modules/cloud/components/CloudTransferBar.vue'
import CloudDragOverlay from '@/modules/cloud/components/CloudDragOverlay.vue'
import CloudBatchActionsBar from '@/modules/cloud/components/CloudBatchActionsBar.vue'

// 对话框组件使用懒加载 - defineAsyncComponent
import { defineAsyncComponent } from 'vue'
const CreateFolderDialog = defineAsyncComponent(() => import('@/modules/cloud/components/dialogs/CreateFolderDialog.vue'))
const RenameDialog = defineAsyncComponent(() => import('@/modules/cloud/components/dialogs/RenameDialog.vue'))
const MoveFileDialog = defineAsyncComponent(() => import('@/modules/cloud/components/dialogs/MoveFileDialog.vue'))
const CreateShareDialog = defineAsyncComponent(() => import('@/modules/cloud/components/dialogs/CreateShareDialog.vue'))
const EditShareDialog = defineAsyncComponent(() => import('@/modules/cloud/components/dialogs/EditShareDialog.vue'))
const ShareStatsDialog = defineAsyncComponent(() => import('@/modules/cloud/components/dialogs/ShareStatsDialog.vue'))
const ConfirmDeleteDialog = defineAsyncComponent(() => import('@/modules/cloud/components/dialogs/ConfirmDeleteDialog.vue'))
const CloudBatchProgressDialog = defineAsyncComponent(() => import('@/modules/cloud/components/dialogs/CloudBatchProgressDialog.vue'))
const FilePreviewDialog = defineAsyncComponent(() => import('@/modules/cloud/components/dialogs/FilePreviewDialog.vue'))
const PermissionDialog = defineAsyncComponent(() => import('@/modules/cloud/components/dialogs/PermissionDialog.vue'))

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
import type { FileItem, GridItem, ShareCreateParams, ShareListItem } from '@/modules/cloud/types'
import type { PreviewAction } from '@/modules/cloud/components/dialogs/FilePreviewDialog.vue'

// ==================== 初始化 ====================
const store = useCloudStore()
const navigationStore = useNavigationStore()
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
// 与上传按钮一致：大文件走分片上传，单文件上限 20GB
const dragUpload = useDragUpload(dropZoneRef, {
  multiple: true,
  maxFiles: 100,
  maxFileSize: 20 * 1024 * 1024 * 1024,
  onUpload: (files: File[]) => handleUpload(files),
})

// ==================== 状态 ====================
const refreshing = ref(false)

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
  permission: false,
})

// 当前操作的项
const currentItem = ref<GridItem | null>(null)
const currentRenameType = ref<'file' | 'folder'>('file')
const currentRenameName = ref('')
const currentShareType = ref<'file' | 'folder'>('file')
const currentShareName = ref('')
const currentShare = ref<ShareListItem | null>(null)
const currentPermissionType = ref<'file' | 'folder'>('file')
const currentPermissionName = ref('')
const currentPermissionId = ref<number | null>(null)
const currentDeleteType = ref<'file' | 'folder'>('file')
const currentDeleteName = ref('')
const currentDeleteCount = ref(1)
const currentDeleteDetails = ref<{ fileCount?: number; folderCount?: number; totalSize?: number }>({})

// ==================== 计算属性 ====================

// 所有选中的ID（文件+文件夹）
// Fix: Use composite keys (type-id) to prevent ID collision between files and folders
const allSelectedIds = computed(() => {
  const ids = new Set<string>()
  store.selectedFileIds.forEach((id) => ids.add(`file-${id}`))
  store.selectedFolderIds.forEach((id) => ids.add(`folder-${id}`))
  return ids
})
// ==================== 分类筛选（当前文件夹内） ====================
const category = ref<CloudCategory>('all')

function categoryOf(item: GridItem): CloudCategory | 'folder' {
  if (item.type === 'folder' || !item.file) return 'folder'
  const c = preview.getFileCategory(item.file)
  if (c === 'video' || c === 'image') return c
  if (c === 'document' || c === 'text') return 'document'
  return 'other'
}

const categoryCounts = computed(() => {
  const counts: Record<CloudCategory, number> = { all: 0, video: 0, image: 0, document: 0, other: 0 }
  for (const item of store.gridItems) {
    counts.all += 1
    const c = categoryOf(item)
    if (c !== 'folder') counts[c] += 1
  }
  return counts
})

const displayItems = computed(() =>
  category.value === 'all' ? store.gridItems : store.gridItems.filter((item) => categoryOf(item) === category.value)
)

// ==================== 传输明细 ====================
const transferOpen = ref(true)
const showTransferPanel = computed(() => transferOpen.value && store.uploadQueue.length > 0)

// 有新的上传任务时自动展开明细
watch(
  () => store.uploadQueue.length,
  (length, previous) => {
    if (length > (previous ?? 0)) transferOpen.value = true
  }
)

// ==================== 生命周期 ====================
onMounted(async () => {
  await handleRefresh()
})

// ==================== 导航相关 ====================
function handleBreadcrumbNavigate(folderId: number | null) {
  navigation.navigateTo(folderId || 0)
}

// ==================== 刷新 ====================
async function handleRefresh() {
  refreshing.value = true
  try {
    await store.refreshAll()
    Message.success(t('cloud.refreshSuccess'))
  } catch {
    // 错误已在store中处理
  } finally {
    refreshing.value = false
  }
}

// ==================== Toolbar actions ====================
async function handleUpload(files: File[]) {
  if (files.length === 0) return

  // 20GB = 20 * 1024 * 1024 * 1024 bytes
  const MAX_FILE_SIZE = 20 * 1024 * 1024 * 1024

  for (const fileItem of files) {
    // Check file size
    if (fileItem.size > MAX_FILE_SIZE) {
      Message.error(t('cloud.fileTooLarge', { name: fileItem.name }))
      continue
    }

    // Use resumable upload for large files, normal upload for small files
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
      Message.warning(t('cloud.previewNotSupported'))
    }
  }
}

function handleItemSelect(payload: { item: GridItem; selected: boolean }) {
  const { item } = payload
  if (item.type === 'file') {
    selection.toggleFileSelection(item.id)
  } else {
    selection.toggleFolderSelection(item.id)
  }
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
  currentItem.value = item

  switch (action) {
    case 'preview':
      if (item.type === 'file' && item.file && preview.canPreview(item.file)) {
        dialogs.preview = true
      } else {
        Message.warning(t('cloud.previewNotSupported'))
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

    case 'permission':
      currentPermissionType.value = item.type as 'file' | 'folder'
      currentPermissionName.value = item.name
      currentPermissionId.value = item.id
      dialogs.permission = true
      break

    case 'delete':
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
  const selectedFolders = selection.getSelectedFolders()
  if (selectedFiles.length === 0 && selectedFolders.length === 0) return

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

  let success = false

  // 如果有 currentItem，说明是从右键菜单或卡片按钮触发的单项删除
  if (currentItem.value) {
    if (currentDeleteType.value === 'file' && currentItem.value?.file) {
      success = await file.deleteFile(currentItem.value.id)
    } else if (currentDeleteType.value === 'folder') {
      success = await folder.deleteFolder(currentItem.value!.id)
    }
  } else {
    // 没有 currentItem，说明是从批量操作面板触发的
    // 使用 selection.batchDelete() 处理
    success = await selection.batchDelete()
  }

  if (success) {
    // 删除成功后清空选中状态
    if (currentItem.value) {
      if (currentDeleteType.value === 'file') {
        store.selectedFileIds.delete(currentItem.value.id)
      } else if (currentDeleteType.value === 'folder') {
        store.selectedFolderIds.delete(currentItem.value.id)
      }
    }

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
  navigationStore.navigateTo('CloudShareManager', t('cloud.myShares'), {}, false)
}

async function handleRefreshShares() {
  await share.refreshShares()
}

async function handleEditShare(params: { expirationDays: number; password?: string }) {
  if (!currentShare.value) return

  const success = await share.modifyShare(currentShare.value.ID || currentShare.value.id, params)
  if (success) {
    dialogs.editShare = false
    currentShare.value = null
    await handleRefreshShares()
  }
}

// ==================== 文件预览导航 ====================
// 可预览文件按页面显示顺序（排序、搜索后），预览窗口的上一个 / 下一个与同文件夹列表一致
const previewableFiles = computed(() => {
  return store.filteredAndSortedFiles.filter((f) => preview.canPreview(f))
})

const previewLocation = computed(() => store.breadcrumbs.map((b) => b.name).join(' / '))

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

function handlePreviewSelect(target: FileItem) {
  const item = store.gridItems.find((i) => i.type === 'file' && i.file?.ID === target.ID)
  if (item) currentItem.value = item
}

/** 预览窗口中的快捷操作：移动、删除会改变当前文件夹内容，先关闭预览 */
async function handlePreviewAction(action: PreviewAction) {
  if (!currentItem.value) return
  if (action === 'move' || action === 'delete') dialogs.preview = false
  await handleItemAction({ action, item: currentItem.value })
}

async function handlePreviewDownload() {
  if (currentItem.value?.file) {
    await file.download(currentItem.value.file)
  }
}

</script>

<style scoped>
.cloud-view {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 16px;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.cloud-view.has-transfer {
  grid-template-columns: 220px minmax(0, 1fr) 320px;
}

.cloud-view__sidebar,
.cloud-view__transfer {
  min-height: 0;
}

.cloud-view__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color var(--duration-fast) var(--ease-out);
}

.cloud-view__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 16px;
  padding: 14px 20px;
}

.cloud-view__breadcrumb {
  flex: 1 1 240px;
  min-width: 0;
  font-size: 15px;
}

.cloud-view__tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.tool-btn {
  display: grid;
  place-items: center;
  width: 34px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 15px;
  cursor: pointer;
}

.tool-btn:hover:not(:disabled) {
  color: var(--brand-blue);
  border-color: var(--brand-blue);
}

.tool-btn:disabled {
  cursor: default;
  opacity: 0.6;
}

.view-toggle {
  display: inline-flex;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.view-toggle__btn {
  display: grid;
  place-items: center;
  width: 34px;
  height: 30px;
  border: 0;
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 15px;
  cursor: pointer;
}

.view-toggle__btn.is-active {
  background: var(--info-bg);
  color: var(--brand-blue);
}

.cloud-view__transfer-bar {
  margin: 0 20px 12px;
}

.cloud-view__files-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 20px 80px; /* 给悬浮工具栏留出空间 */
}

.cloud-view__category-empty {
  padding: 80px 0;
  text-align: center;
  font-size: 13px;
  color: var(--text-tertiary);
}

@media (max-width: 1200px) {
  .cloud-view.has-transfer {
    grid-template-columns: 200px minmax(0, 1fr);
  }

  .cloud-view.has-transfer .cloud-view__transfer {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 1000;
    width: 340px;
    max-height: 60vh;
    box-shadow: var(--shadow-lg);
  }
}

@media (max-width: 768px) {
  .cloud-view,
  .cloud-view.has-transfer {
    grid-template-columns: minmax(0, 1fr);
    height: auto;
    min-height: calc(100vh - 64px);
    overflow: visible;
    padding: 8px;
  }

  .cloud-view.has-transfer .cloud-view__transfer {
    left: 8px;
    right: 8px;
    width: auto;
  }
}

/* 悬浮批量操作栏 */
.cloud-view__batch-actions {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  width: 90%;
  max-width: 800px;
}

.batch-actions__inner {
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  backdrop-filter: blur(8px);
  border: 1px solid var(--border);
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--text-primary);
}

.batch-count {
  color: var(--brand-blue);
  font-weight: 600;
  font-size: 16px;
}

.batch-size {
  color: var(--text-secondary);
  font-size: 13px;
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

/* 悬浮工具栏动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* 顶部栏：面包屑 + 操作按钮 */
.cloud-view__top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 24px;
  background: linear-gradient(to right, var(--bg-card) 0%, var(--bg-hover) 100%);
  border-bottom: 1px solid var(--border);
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

</style>
