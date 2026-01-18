/**
 * 云盘文件夹操作 Composable
 *
 * 封装文件夹的创建、删除、重命名等操作
 */

import { ref } from 'vue'
import { Modal } from '@arco-design/web-vue'
import { useCloudStore } from '@/modules/cloud/stores/cloudStore'
import type { Folder } from '@/modules/cloud/types'

/**
 * 云盘文件夹操作功能
 */
export function useCloudFolder() {
  const store = useCloudStore()

  // 操作状态
  const creatingFolder = ref(false)
  const deletingFolder = ref(false)
  const renamingFolder = ref(false)

  /**
   * 创建文件夹
   * @param folderName 文件夹名称
   * @param parentId 父文件夹ID（可选，默认当前文件夹）
   */
  async function createFolder(folderName: string, parentId?: number) {
    creatingFolder.value = true
    try {
      await store.createFolder(folderName, parentId)
      return true
    } catch (e) {
      console.error('创建文件夹失败:', e)
      return false
    } finally {
      creatingFolder.value = false
    }
  }

  /**
   * 创建文件夹（带确认对话框）
   * @param initialName 初始名称
   * @param parentId 父文件夹ID
   */
  async function createFolderWithDialog(initialName = '新文件夹', parentId?: number) {
    return new Promise<boolean>((resolve) => {
      Modal.open({
        title: '创建文件夹',
        content: '请输入文件夹名称',
        modalClass: 'create-folder-modal',
        onOk: async () => {
          const success = await createFolder(initialName, parentId)
          resolve(success)
        },
        onCancel: () => {
          resolve(false)
        },
      })
    })
  }

  /**
   * 删除文件夹
   * @param folderId 文件夹ID
   */
  async function deleteFolder(folderId: number) {
    console.log('[DEBUG] useCloudFolder.deleteFolder called', { folderId })
    deletingFolder.value = true
    try {
      console.log('[DEBUG] useCloudFolder - calling store.deleteFolder', { folderId })
      await store.deleteFolder(folderId)
      return true
    } catch (e) {
      console.error('删除文件夹失败:', e)
      return false
    } finally {
      deletingFolder.value = false
    }
  }

  /**
   * 删除文件夹（带确认对话框）
   * @param folder 文件夹对象
   */
  async function deleteFolderWithConfirm(folder: Folder) {
    return new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除文件夹「${folder.name}」吗？此操作不可恢复。`,
        okText: '删除',
        okButtonProps: {
          status: 'danger',
        },
        onOk: async () => {
          const success = await deleteFolder(folder.ID || folder.id)
          resolve(success)
        },
        onCancel: () => {
          resolve(false)
        },
      })
    })
  }

  /**
   * 重命名文件夹
   * @param folderId 文件夹ID
   * @param newName 新名称
   */
  async function renameFolder(folderId: number, newName: string) {
    renamingFolder.value = true
    try {
      await store.renameFolder(folderId, newName)
      return true
    } catch (e) {
      console.error('重命名文件夹失败:', e)
      return false
    } finally {
      renamingFolder.value = false
    }
  }

  /**
   * 重命名文件夹（带输入对话框）
   * @param folder 文件夹对象
   */
  async function renameFolderWithDialog(folder: Folder) {
    return new Promise<boolean>((resolve) => {
      Modal.open({
        title: '重命名文件夹',
        content: `当前名称：${folder.name}`,
        modalClass: 'rename-folder-modal',
        onOk: async () => {
          // 这里需要实际的输入值，暂时使用原名称作为示例
          const newName = folder.name
          const success = await renameFolder(folder.ID || folder.id, newName)
          resolve(success)
        },
        onCancel: () => {
          resolve(false)
        },
      })
    })
  }

  /**
   * 获取文件夹信息
   * @param folderId 文件夹ID
   */
  function getFolderById(folderId: number): Folder | null {
    function findInTree(folders: Folder[], id: number): Folder | null {
      for (const folder of folders) {
        if ((folder.ID || folder.id) === id) return folder
        if (folder.Children && folder.Children.length > 0) {
          const found = findInTree(folder.Children, id)
          if (found) return found
        }
      }
      return null
    }
    return findInTree(store.folderTree, folderId)
  }

  /**
   * 检查文件夹名称是否已存在
   * @param name 文件夹名称
   * @param parentId 父文件夹ID
   */
  function isFolderNameExists(name: string, parentId: number = store.currentFolderId): boolean {
    const siblings = parentId === 0 ? store.folderTree : getFolderById(parentId)?.Children || []
    return siblings.some((folder) => folder.name === name)
  }

  /**
   * 获取文件夹子项数量（递归）
   * @param folder 文件夹对象
   */
  function getFolderItemCount(folder: Folder): { folders: number; files: number } {
    let folderCount = 0
    let fileCount = 0

    function countRecursive(f: Folder) {
      if (f.Children && f.Children.length > 0) {
        folderCount += f.Children.length
        f.Children.forEach(countRecursive)
      }
    }

    countRecursive(folder)

    // 注意：文件数量需要从store中查询该文件夹的文件
    // 这里暂时返回0，实际应该查询API或从store获取
    return { folders: folderCount, files: fileCount }
  }

  return {
    // 创建操作
    createFolder,
    createFolderWithDialog,
    creatingFolder,

    // 删除操作
    deleteFolder,
    deleteFolderWithConfirm,
    deletingFolder,

    // 重命名操作
    renameFolder,
    renameFolderWithDialog,
    renamingFolder,

    // 查询操作
    getFolderById,
    isFolderNameExists,
    getFolderItemCount,

    // Store状态（响应式）
    folderTree: () => store.folderTree,
    currentFolderId: () => store.currentFolderId,
    currentFolderChildren: () => store.currentFolderChildren,
  }
}

export default useCloudFolder
