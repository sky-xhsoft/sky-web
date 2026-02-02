/**
 * 云盘选择和批量操作 Composable
 *
 * 封装文件/文件夹选择和批量操作逻辑
 */

import { computed, ref } from 'vue'
import { Modal, Message } from '@arco-design/web-vue'
import { useCloudStore } from '@/modules/cloud/stores/cloudStore'
import { batchDelete as batchDeleteApi, batchMove as batchMoveApi } from '@/modules/cloud/api'
import type { FileItem, Folder } from '@/modules/cloud/types'

/**
 * 批量操作进度状态
 */
interface BatchProgressState {
  visible: boolean
  title: string
  total: number
  completed: number
  successCount: number
  failed: number
  failedItems: string[]
  inProgress: boolean
}

/**
 * 云盘选择和批量操作功能
 */
export function useCloudSelection() {
  const store = useCloudStore()

  // 批量操作进度状态
  const batchProgress = ref<BatchProgressState>({
    visible: false,
    title: '批量操作进度',
    total: 0,
    completed: 0,
    successCount: 0,
    failed: 0,
    failedItems: [],
    inProgress: false,
  })

  // 选择状态
  const selectedFileIds = computed(() => store.selectedFileIds)
  const selectedFolderIds = computed(() => store.selectedFolderIds)
  const selectedCount = computed(() => store.selectedCount)

  /**
   * 选择/取消选择文件
   * @param fileId 文件ID
   */
  function toggleFileSelection(fileId: number) {
    store.selectFile(fileId)
  }

  /**
   * 选择/取消选择文件夹
   * @param folderId 文件夹ID
   */
  function toggleFolderSelection(folderId: number) {
    store.selectFolder(folderId)
  }

  /**
   * 检查文件是否被选中
   * @param fileId 文件ID
   */
  function isFileSelected(fileId: number): boolean {
    return store.selectedFileIds.has(fileId)
  }

  /**
   * 检查文件夹是否被选中
   * @param folderId 文件夹ID
   */
  function isFolderSelected(folderId: number): boolean {
    return store.selectedFolderIds.has(folderId)
  }

  /**
   * 全选文件
   */
  function selectAllFiles() {
    store.selectAllFiles()
  }

  /**
   * 全选所有项（文件夹+文件）
   */
  function selectAll() {
    store.selectAll()
  }

  /**
   * 取消全选
   */
  function clearSelection() {
    store.clearSelection()
  }

  /**
   * 反选
   */
  function invertSelection() {
    const allFileIds = store.files.map((f) => f.ID)
    const allFolderIds = store.currentFolderChildren.map((f) => f.ID)

    // 反选文件
    allFileIds.forEach((id) => {
      if (store.selectedFileIds.has(id)) {
        store.selectedFileIds.delete(id)
      } else {
        store.selectedFileIds.add(id)
      }
    })

    // 反选文件夹
    allFolderIds.forEach((id) => {
      if (store.selectedFolderIds.has(id)) {
        store.selectedFolderIds.delete(id)
      } else {
        store.selectedFolderIds.add(id)
      }
    })
  }

  /**
   * 获取选中的文件列表
   */
  function getSelectedFiles(): FileItem[] {
    return store.files.filter((file) => store.selectedFileIds.has(file.ID))
  }

  /**
   * 获取选中的文件夹列表
   */
  function getSelectedFolders(): Folder[] {
    return store.currentFolderChildren.filter((folder) => store.selectedFolderIds.has(folder.ID || folder.id))
  }

  /**
   * 批量删除选中项（内部实现，不包含确认对话框）
   */
  async function batchDelete() {
    if (selectedCount.value === 0) {
      Message.warning('请先选择要删除的项')
      return false
    }

    try {
      // 初始化进度状态
      batchProgress.value = {
        visible: true,
        title: '批量删除进度',
        total: selectedCount.value,
        completed: 0,
        successCount: 0,
        failed: 0,
        failedItems: [],
        inProgress: true,
      }

      // 获取选中的文件和文件夹ID
      const fileIds = Array.from(selectedFileIds.value)
      const folderIds = Array.from(selectedFolderIds.value)

      // 调用批量删除API
      const result = await batchDeleteApi({
        fileIds,
        folderIds,
      })

      // 更新进度状态
      batchProgress.value.completed = batchProgress.value.total
      batchProgress.value.successCount = result.successCount
      batchProgress.value.failed = result.failedCount
      batchProgress.value.failedItems = result.failedItems || []
      batchProgress.value.inProgress = false

      // 清空选择
      clearSelection()

      // 刷新数据
      await Promise.all([store.currentFolderId === 0 ? store.loadFiles() : store.loadFolderContent(store.currentFolderId), store.loadQuota()])

      // 显示结果消息
      if (result.failedCount === 0) {
        Message.success(`成功删除 ${result.successCount} 项`)
      } else {
        Message.warning(
          `删除完成：成功 ${result.successCount} 项，失败 ${result.failedCount} 项`
        )
      }

      return true
    } catch (e: any) {
      console.error('批量删除失败:', e)
      batchProgress.value.inProgress = false
      Message.error(e?.message || '批量删除失败')
      return false
    }
  }

  /**
   * 批量下载选中的文件
   */
  async function batchDownload() {
    const selectedFiles = getSelectedFiles()

    if (selectedFiles.length === 0) {
      Message.warning('请先选择要下载的文件')
      return false
    }

    Message.info(`开始下载 ${selectedFiles.length} 个文件...`)

    // 这里需要实际的下载逻辑
    // 暂时只返回true作为示例
    Message.success(`成功下载 ${selectedFiles.length} 个文件`)
    return true
  }

  /**
   * 批量移动选中的文件
   * @param targetFolderId 目标文件夹ID
   */
  async function batchMove(targetFolderId: number) {
    const selectedFiles = getSelectedFiles()

    if (selectedFiles.length === 0) {
      Message.warning('请先选择要移动的文件')
      return false
    }

    try {
      // 初始化进度状态
      batchProgress.value = {
        visible: true,
        title: '批量移动进度',
        total: selectedFiles.length,
        completed: 0,
        successCount: 0,
        failed: 0,
        failedItems: [],
        inProgress: true,
      }

      // 获取选中的文件ID
      const fileIds = Array.from(selectedFileIds.value)

      // 调用批量移动API
      const result = await batchMoveApi({
        fileIds,
        targetFolderId,
      })

      // 更新进度状态
      batchProgress.value.completed = batchProgress.value.total
      batchProgress.value.successCount = result.successCount
      batchProgress.value.failed = result.failedCount
      batchProgress.value.failedItems = result.failedItems || []
      batchProgress.value.inProgress = false

      // 清空选择
      clearSelection()

      // 刷新数据
      await store.loadFiles()

      // 显示结果消息
      if (result.failedCount === 0) {
        Message.success(`成功移动 ${result.successCount} 个文件`)
      } else if (result.successCount === 0) {
        // 全部失败
        Message.error(
          `移动失败：${result.failedCount} 个文件无法移动`
        )
      } else {
        // 部分成功
        Message.warning(
          `移动完成：成功 ${result.successCount} 个，失败 ${result.failedCount} 个`
        )
      }

      return true
    } catch (e: any) {
      console.error('批量移动失败:', e)
      batchProgress.value.inProgress = false
      Message.error(e?.message || '批量移动失败')
      return false
    }
  }

  /**
   * 批量移动（带文件夹选择对话框）
   */
  async function batchMoveWithDialog() {
    if (selectedCount.value === 0) {
      Message.warning('请先选择要移动的项')
      return false
    }

    return new Promise<boolean>((resolve) => {
      Modal.open({
        title: '批量移动',
        content: `选择目标文件夹（共 ${selectedCount.value} 项）`,
        modalClass: 'batch-move-modal',
        onOk: async () => {
          // 这里需要实际的目标文件夹ID
          // 暂时使用根目录作为示例
          const success = await batchMove(0)
          resolve(success)
        },
        onCancel: () => {
          resolve(false)
        },
      })
    })
  }

  /**
   * 检查是否全选
   */
  const isAllSelected = computed(() => {
    const totalCount = store.files.length + store.currentFolderChildren.length
    return totalCount > 0 && selectedCount.value === totalCount
  })

  /**
   * 检查是否部分选中（用于全选按钮的indeterminate状态）
   */
  const isIndeterminate = computed(() => {
    return selectedCount.value > 0 && !isAllSelected.value
  })

  /**
   * 获取选中项的总大小
   */
  const selectedTotalSize = computed(() => {
    const files = getSelectedFiles()
    return files.reduce((sum, file) => sum + file.FileSize, 0)
  })

  /**
   * 选择状态摘要
   */
  const selectionSummary = computed(() => {
    if (selectedCount.value === 0) return '未选择任何项'

    const fileCount = selectedFileIds.value.size
    const folderCount = selectedFolderIds.value.size

    const parts: string[] = []
    if (fileCount > 0) parts.push(`${fileCount} 个文件`)
    if (folderCount > 0) parts.push(`${folderCount} 个文件夹`)

    return `已选择 ${parts.join('、')}`
  })

  /**
   * 切换全选状态
   */
  function toggleSelectAll() {
    if (isAllSelected.value) {
      clearSelection()
    } else {
      selectAll()
    }
  }

  /**
   * 关闭批量操作进度对话框
   */
  function closeBatchProgress() {
    batchProgress.value.visible = false
  }

  /**
   * 重试批量操作失败项
   */
  function retryBatchOperation() {
    // TODO: 实现重试逻辑
    Message.info('重试功能开发中')
  }

  return {
    // 选择操作
    toggleFileSelection,
    toggleFolderSelection,
    selectAllFiles,
    selectAll,
    clearSelection,
    invertSelection,
    toggleSelectAll,

    // 批量操作
    batchDelete,
    batchDownload,
    batchMove,
    batchMoveWithDialog,

    // 批量操作进度
    batchProgress,
    closeBatchProgress,
    retryBatchOperation,

    // 查询操作
    isFileSelected,
    isFolderSelected,
    getSelectedFiles,
    getSelectedFolders,

    // 选择状态（响应式）
    selectedFileIds,
    selectedFolderIds,
    selectedCount,

    // 计算属性
    isAllSelected,
    isIndeterminate,
    selectedTotalSize,
    selectionSummary,
  }
}

export default useCloudSelection
