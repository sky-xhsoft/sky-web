<template>
  <div class="cloud-dialog-manager">
    <!-- 创建文件夹对话框 -->
    <CreateFolderDialog
      v-model:visible="props.dialogs.createFolder"
      :loading="props.loading.createFolder"
      @confirm="$emit('create-folder', $event)"
    />

    <!-- 重命名对话框 -->
    <RenameDialog
      v-model:visible="props.dialogs.rename"
      :loading="props.currentRenameType === 'file' ? props.loading.renameFile : props.loading.renameFolder"
      :old-name="props.currentRenameName"
      :item-type="props.currentRenameType"
      @confirm="$emit('rename', $event)"
    />

    <!-- 移动文件对话框 -->
    <MoveFileDialog
      v-model:visible="props.dialogs.move"
      :loading="props.loading.moveFile"
      :folder-tree="props.folderTree"
      :selected-count="props.selectedCount"
      :current-folder-id="props.currentFolderId"
      @confirm="$emit('move', $event)"
    />

    <!-- 创建分享对话框 -->
    <CreateShareDialog
      v-model:visible="props.dialogs.share"
      :loading="props.loading.createShare"
      :item-name="props.currentShareName"
      :item-type="props.currentShareType"
      @confirm="$emit('create-share', $event)"
    />

    <!-- 编辑分享对话框 -->
    <EditShareDialog
      v-model:visible="props.dialogs.editShare"
      :loading="props.loading.updateShare"
      :share="props.currentShare"
      @confirm="$emit('edit-share', $event)"
    />

    <!-- 分享统计对话框 -->
    <ShareStatsDialog
      v-model:visible="props.dialogs.shareStats"
      :share="props.currentShare"
    />

    <!-- 确认删除对话框 -->
    <ConfirmDeleteDialog
      v-model:visible="props.dialogs.delete"
      :loading="props.currentDeleteType === 'file' ? props.loading.deleteFile : props.loading.deleteFolder"
      :old-name="props.currentDeleteName"
      :item-type="props.currentDeleteType"
      :count="props.currentDeleteCount"
      :details="props.currentDeleteDetails"
      @confirm="$emit('delete', $event)"
    />

    <!-- 批量操作进度对话框 -->
    <CloudBatchProgressDialog
      v-model:visible="props.batchProgress.visible"
      :title="props.batchProgress.title"
      :total="props.batchProgress.total"
      :completed="props.batchProgress.completed"
      :success-count="props.batchProgress.successCount"
      :failed="props.batchProgress.failed"
      :failed-items="props.batchProgress.failedItems"
      :in-progress="props.batchProgress.inProgress"
      @close="$emit('close-batch-progress')"
      @retry="$emit('retry-batch-operation')"
    />

    <!-- 文件预览对话框 -->
    <FilePreviewDialog
      v-model:visible="props.dialogs.preview"
      :file="props.currentFile"
      :category="props.currentPreviewCategory"
      :can-navigate="props.canPreviewNavigate"
      :has-previous="props.hasPreviewPrevious"
      :has-next="props.hasPreviewNext"
      @previous="$emit('preview-previous')"
      @next="$emit('preview-next')"
      @download="$emit('preview-download')"
    />
  </div>
</template>

<script setup lang="ts">
import {
  CreateFolderDialog,
  RenameDialog,
  MoveFileDialog,
  CreateShareDialog,
  EditShareDialog,
  ShareStatsDialog,
  ConfirmDeleteDialog,
  CloudBatchProgressDialog,
  FilePreviewDialog,
} from './index'
import type { Folder, ShareListItem, CloudFile } from '@/modules/cloud/types'

interface Dialogs {
  createFolder: boolean
  rename: boolean
  move: boolean
  share: boolean
  editShare: boolean
  shareStats: boolean
  delete: boolean
  preview: boolean
}

interface Loading {
  createFolder: boolean
  renameFile: boolean
  renameFolder: boolean
  moveFile: boolean
  createShare: boolean
  updateShare: boolean
  deleteFile: boolean
  deleteFolder: boolean
}

interface BatchProgress {
  visible: boolean
  title: string
  total: number
  completed: number
  successCount: number
  failed: number
  failedItems: any[]
  inProgress: boolean
}

interface Props {
  dialogs: Dialogs
  loading: Loading
  batchProgress: BatchProgress
  currentRenameType: 'file' | 'folder'
  currentRenameName: string
  currentShareType: 'file' | 'folder'
  currentShareName: string
  currentShare: ShareListItem | null
  currentDeleteType: 'file' | 'folder'
  currentDeleteName: string
  currentDeleteCount: number
  currentDeleteDetails: { fileCount?: number; folderCount?: number; totalSize?: number }
  currentFile: CloudFile | null
  currentPreviewCategory: string
  canPreviewNavigate: boolean
  hasPreviewPrevious: boolean
  hasPreviewNext: boolean
  folderTree: Folder[]
  selectedCount: number
  currentFolderId: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'create-folder', folderName: string): void
  (e: 'rename', newName: string): void
  (e: 'move', targetFolderId: number): void
  (e: 'create-share', params: any): void
  (e: 'edit-share', params: any): void
  (e: 'delete'): void
  (e: 'close-batch-progress'): void
  (e: 'retry-batch-operation'): void
  (e: 'preview-previous'): void
  (e: 'preview-next'): void
  (e: 'preview-download'): void
}>()
</script>

<style scoped>
.cloud-dialog-manager {
  display: none;
}
</style>
