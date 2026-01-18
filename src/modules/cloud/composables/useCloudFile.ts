/**
 * 云盘文件操作 Composable
 *
 * 封装文件的下载、删除、重命名、移动等操作
 */

import { ref } from 'vue'
import { Modal, Message } from '@arco-design/web-vue'
import { useCloudStore } from '@/modules/cloud/stores/cloudStore'
import { downloadFile } from '@/modules/cloud/api'
import type { FileItem } from '@/modules/cloud/types'

/**
 * 云盘文件操作功能
 */
export function useCloudFile() {
  const store = useCloudStore()

  // 操作状态
  const deletingFile = ref(false)
  const renamingFile = ref(false)
  const movingFile = ref(false)
  const downloadingFiles = ref<Set<number>>(new Set())

  /**
   * 下载文件
   * @param file 文件对象
   */
  async function download(file: FileItem) {
    if (downloadingFiles.value.has(file.ID)) {
      Message.warning('文件正在下载中...')
      return false
    }

    downloadingFiles.value.add(file.ID)
    try {
      await downloadFile(file.ID, file.FileName)
      Message.success(`开始下载：${file.FileName}`)
      return true
    } catch (e: any) {
      console.error('下载文件失败:', e)
      Message.error(e?.message || '下载文件失败')
      return false
    } finally {
      downloadingFiles.value.delete(file.ID)
    }
  }

  /**
   * 批量下载文件
   * @param files 文件列表
   */
  async function batchDownload(files: FileItem[]) {
    if (files.length === 0) {
      Message.warning('请先选择要下载的文件')
      return false
    }

    Message.info(`开始下载 ${files.length} 个文件...`)

    const results = await Promise.allSettled(files.map((file) => download(file)))

    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failCount = results.filter((r) => r.status === 'rejected').length

    if (failCount > 0) {
      Message.warning(`下载完成：成功 ${successCount}，失败 ${failCount}`)
    } else {
      Message.success(`成功下载 ${successCount} 个文件`)
    }

    return successCount > 0
  }

  /**
   * 删除文件
   * @param fileId 文件ID
   */
  async function deleteFile(fileId: number) {
    deletingFile.value = true
    try {
      await store.deleteFile(fileId)
      return true
    } catch (e) {
      console.error('删除文件失败:', e)
      return false
    } finally {
      deletingFile.value = false
    }
  }

  /**
   * 删除文件（带确认对话框）
   * @param file 文件对象
   */
  async function deleteFileWithConfirm(file: FileItem) {
    return new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除文件「${file.FileName}」吗？此操作不可恢复。`,
        okText: '删除',
        okButtonProps: {
          status: 'danger',
        },
        onOk: async () => {
          const success = await deleteFile(file.ID)
          resolve(success)
        },
        onCancel: () => {
          resolve(false)
        },
      })
    })
  }

  /**
   * 重命名文件
   * @param fileId 文件ID
   * @param newName 新名称
   */
  async function renameFile(fileId: number, newName: string) {
    renamingFile.value = true
    try {
      await store.renameFile(fileId, newName)
      return true
    } catch (e) {
      console.error('重命名文件失败:', e)
      return false
    } finally {
      renamingFile.value = false
    }
  }

  /**
   * 重命名文件（带输入对话框）
   * @param file 文件对象
   */
  async function renameFileWithDialog(file: FileItem) {
    return new Promise<boolean>((resolve) => {
      Modal.open({
        title: '重命名文件',
        content: `当前名称：${file.FileName}`,
        modalClass: 'rename-file-modal',
        onOk: async () => {
          // 这里需要实际的输入值，暂时使用原名称作为示例
          const newName = file.FileName
          const success = await renameFile(file.ID, newName)
          resolve(success)
        },
        onCancel: () => {
          resolve(false)
        },
      })
    })
  }

  /**
   * 移动文件
   * @param fileId 文件ID
   * @param targetFolderId 目标文件夹ID
   */
  async function moveFile(fileId: number, targetFolderId: number) {
    movingFile.value = true
    try {
      await store.moveFile(fileId, targetFolderId)
      return true
    } catch (e) {
      console.error('移动文件失败:', e)
      return false
    } finally {
      movingFile.value = false
    }
  }

  /**
   * 移动文件（带文件夹选择对话框）
   * @param file 文件对象
   */
  async function moveFileWithDialog(file: FileItem) {
    return new Promise<boolean>((resolve) => {
      Modal.open({
        title: '移动文件',
        content: `选择目标文件夹`,
        modalClass: 'move-file-modal',
        onOk: async () => {
          // 这里需要实际的目标文件夹ID，暂时使用当前文件夹作为示例
          const targetFolderId = store.currentFolderId
          const success = await moveFile(file.ID, targetFolderId)
          resolve(success)
        },
        onCancel: () => {
          resolve(false)
        },
      })
    })
  }

  /**
   * 获取文件信息
   * @param fileId 文件ID
   */
  function getFileById(fileId: number): FileItem | null {
    return store.files.find((f) => f.ID === fileId) || null
  }

  /**
   * 检查文件名是否已存在
   * @param name 文件名
   * @param folderId 文件夹ID（默认当前文件夹）
   */
  function isFileNameExists(name: string, folderId: number = store.currentFolderId): boolean {
    return store.files.some((file) => file.FileName === name && file.FolderID === folderId)
  }

  /**
   * 根据扩展名过滤文件
   * @param extensions 扩展名数组（如 ['.jpg', '.png']）
   */
  function filterFilesByExtension(extensions: string[]): FileItem[] {
    const lowerExts = extensions.map((ext) => ext.toLowerCase())
    return store.files.filter((file) => {
      const ext = file.FileExt?.toLowerCase() || ''
      return lowerExts.includes(ext)
    })
  }

  /**
   * 获取指定类型的文件
   * @param type 文件类型（如 'image', 'video', 'document'）
   */
  function getFilesByType(type: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other'): FileItem[] {
    const typeMap = {
      image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'],
      video: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'],
      audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'],
      document: ['.doc', '.docx', '.pdf', '.txt', '.xls', '.xlsx', '.ppt', '.pptx'],
      archive: ['.zip', '.rar', '.7z', '.tar', '.gz'],
      other: [],
    }

    if (type === 'other') {
      const allKnownExts = Object.values(typeMap).flat()
      return store.files.filter((file) => {
        const ext = file.FileExt?.toLowerCase() || ''
        return !allKnownExts.includes(ext)
      })
    }

    return filterFilesByExtension(typeMap[type])
  }

  /**
   * 检查文件是否正在下载
   * @param fileId 文件ID
   */
  function isDownloading(fileId: number): boolean {
    return downloadingFiles.value.has(fileId)
  }

  return {
    // 下载操作
    download,
    batchDownload,
    downloadingFiles,
    isDownloading,

    // 删除操作
    deleteFile,
    deleteFileWithConfirm,
    deletingFile,

    // 重命名操作
    renameFile,
    renameFileWithDialog,
    renamingFile,

    // 移动操作
    moveFile,
    moveFileWithDialog,
    movingFile,

    // 查询操作
    getFileById,
    isFileNameExists,
    filterFilesByExtension,
    getFilesByType,

    // Store状态（响应式）
    files: () => store.files,
    filteredAndSortedFiles: () => store.filteredAndSortedFiles,
  }
}

export default useCloudFile
