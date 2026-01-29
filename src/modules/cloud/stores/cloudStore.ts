/**
 * 云盘模块 Pinia Store
 *
 * 集中式状态管理，管理文件夹树、文件列表、配额、上传队列等
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import type {
  Folder,
  FileItem,
  QuotaInfo,
  ShareListItem,
  UploadTask,
  GridItem,
  LoadingState,
  FileSortBy,
  SortOrder,
} from '@/modules/cloud/types'
import {
  fetchFolderTree,
  fetchFolders,
  fetchFolderContent,
  fetchFiles,
  fetchItems,  // 新增：统一获取 folders + files
  getQuota,
  createItem as createItemApi,  // 使用新的统一接口
  deleteItem as deleteItemApi,  // 使用新的统一接口
  renameItem as renameItemApi,  // 使用新的统一接口
  moveItem as moveItemApi,  // 使用新的统一接口
  deleteFile as deleteFileApi,  // 保留用于兼容
  moveFile as moveFileApi,  // 保留用于兼容
  renameFile as renameFileApi,  // 保留用于兼容
  getMyShares,
} from '@/modules/cloud/api'
import { getFileIconConfig } from '@/modules/cloud/composables/useFileIcon'
import { formatSize, formatDate } from '@/modules/cloud/utils/format'

export const useCloudStore = defineStore('cloud', () => {
  // ==================== 状态 ====================

  // 文件夹树
  const folderTree = ref<Folder[]>([])
  const currentFolderId = ref<number>(0)

  // 文件列表
  const files = ref<FileItem[]>([])

  // 当前文件夹的子文件夹列表（动态加载）
  const currentSubFolders = ref<Folder[]>([])

  // 配额信息
  const quota = ref<QuotaInfo | null>(null)

  // 加载状态
  const loading = ref<LoadingState>({
    tree: false,
    files: false,
    upload: false,
    quota: false,
    shares: false,
  })

  // 上传队列
  const uploadQueue = ref<UploadTask[]>([])

  // 选择状态
  const selectedFileIds = ref<Set<number>>(new Set())
  const selectedFolderIds = ref<Set<number>>(new Set())

  // 搜索和排序
  const searchQuery = ref('')
  const sortBy = ref<FileSortBy>('name')
  const sortOrder = ref<SortOrder>('asc')

  // 分享列表
  const myShares = ref<ShareListItem[]>([])

  // 视图模式
  const viewMode = ref<'grid' | 'list'>('grid')

  // 路径栈（用于返回上一级）
  const pathStack = ref<number[]>([])

  // 面包屑路径
  const breadcrumbPath = ref<{ id: number; name: string }[]>([{ id: 0, name: '我的云盘' }])

  // ==================== Getters ====================

  /**
   * 当前文件夹对象
   */
  const currentFolder = computed<Folder | null>(() => {
    if (currentFolderId.value === 0) {
      return null  // 根目录不需要文件夹对象
    }
    return findFolderById(folderTree.value, currentFolderId.value)
  })

  /**
   * 当前文件夹的子文件夹列表
   */
  const currentFolderChildren = computed<Folder[]>(() => {
    // 统一使用 currentSubFolders，不再依赖废弃的 folderTree
    console.log("[DEBUG] currentFolderChildren - currentFolderId:", currentFolderId.value, "currentSubFolders:", currentSubFolders.value.length)
    return currentSubFolders.value
  })

  /**
   * 面包屑导航路径
   */
  const breadcrumbs = computed(() => breadcrumbPath.value)

  /**
   * 网格项列表（文件夹 + 文件）
   */
  const gridItems = computed<GridItem[]>(() => {
    const items: GridItem[] = []

    console.log("[DEBUG] gridItems computed - currentFolderChildren:", currentFolderChildren.value.length, "filteredAndSortedFiles:", filteredAndSortedFiles.value.length)

    // 添加文件夹
    currentFolderChildren.value.forEach((folder) => {
      items.push({
        type: 'folder',
        id: folder.ID || folder.id || 0,
        name: folder.name,
        meta: formatDate(folder.CreateTime || folder.createTime || ''),
        icon: '📁',
        color: '#f59e0b',
        bg: '#fef3c7',
        folder,
      })
    })

    // 添加文件
    filteredAndSortedFiles.value.forEach((file) => {
      const iconConfig = getFileIconConfig(file.FileExt, file.FileType)
      items.push({
        type: 'file',
        id: file.ID,
        name: file.FileName,
        meta: `${formatSize(file.FileSize)} · ${formatDate(file.CreateTime)}`,
        icon: iconConfig.icon,
        color: iconConfig.color,
        bg: iconConfig.bg,
        file,
      })
    })

    return items
  })

  /**
   * 过滤和排序后的文件列表
   */
  const filteredAndSortedFiles = computed<FileItem[]>(() => {
    let result = [...files.value]

    // 应用搜索过滤
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter((file) => file.FileName.toLowerCase().includes(query))
    }

    // 应用排序
    result.sort((a, b) => {
      let compareResult = 0

      switch (sortBy.value) {
        case 'name':
          compareResult = a.FileName.localeCompare(b.FileName)
          break
        case 'size':
          compareResult = a.FileSize - b.FileSize
          break
        case 'date':
          const aTime = new Date(a.CreateTime || 0).getTime()
          const bTime = new Date(b.CreateTime || 0).getTime()
          compareResult = aTime - bTime
          break
      }

      return sortOrder.value === 'asc' ? compareResult : -compareResult
    })

    return result
  })

  /**
   * 选中数量
   */
  const selectedCount = computed(() => {
    return selectedFileIds.value.size + selectedFolderIds.value.size
  })

  /**
   * 是否有上传任务
   */
  const hasUploadingTasks = computed(() => {
    return uploadQueue.value.some((task) => task.status === 'uploading')
  })

  /**
   * 上传进度统计
   */
  const uploadProgress = computed(() => {
    if (uploadQueue.value.length === 0) {
      return { percent: 0, loaded: 0, total: 0 }
    }

    // 计算总大小和已上传大小
    const totalSize = uploadQueue.value.reduce((sum, task) => {
      // 确保 totalSize 是数字且为正数
      const taskTotalSize = Number(task.totalSize) || 0
      return sum + taskTotalSize
    }, 0)
    
    const uploadedSize = uploadQueue.value.reduce((sum, task) => {
      // 确保 uploadedSize 是数字且不超过 totalSize
      const taskTotalSize = Number(task.totalSize) || 0
      const taskUploadedSize = Math.min(Number(task.uploadedSize) || 0, taskTotalSize)
      return sum + taskUploadedSize
    }, 0)
    
    // 计算百分比
    const percent = totalSize > 0 ? (uploadedSize / totalSize) * 100 : 0

    return {
      percent: Math.min(100, Math.max(0, percent)),
      loaded: Math.min(uploadedSize, totalSize),
      total: totalSize,
    }
  })

  // ==================== Actions ====================

  /**
   * 加载文件夹树
   * @deprecated 此功能已废弃，不再使用旧的树形 API
   * 新版本应使用 loadFiles/loadFolderContent 获取层级结构
   */
  async function loadFolderTree() {
    // 已废弃 - 不再调用旧 API，直接返回空数组
    console.warn('[DEPRECATED] loadFolderTree 已废弃，请使用 loadFiles/loadFolderContent')
    folderTree.value = []
    loading.value.tree = false
  }

  /**
   * 加载文件列表

  /**
   * 加载文件列表
   */
  async function loadFiles(folderId = currentFolderId.value) {
    console.log("[DEBUG] cloudStore.loadFiles called with folderId:", folderId)
    loading.value.files = true
    loading.value.tree = true  // 同时加载文件夹
    try {
      // 使用新的统一接口 fetchItems，一次性获取文件和文件夹
      const result = await fetchItems(folderId === 0 ? undefined : folderId)
      console.log("[DEBUG] cloudStore.loadFiles result:", result)
      files.value = result.files
      currentSubFolders.value = result.folders  // 同时更新子文件夹
      console.log("[DEBUG] cloudStore.loadFiles - files.value:", files.value.length, "currentSubFolders.value:", currentSubFolders.value.length)
    } catch (e: any) {
      console.error("加载文件列表失败:", e)
      Message.error(e?.message || "加载文件列表失败")
      throw e
    } finally {
      loading.value.files = false
      loading.value.tree = false
    }
  }

  /**
   * 加载子文件夹列表
   */
  async function loadSubFolders(parentId: number) {
    console.log("[DEBUG] cloudStore.loadSubFolders called with parentId:", parentId)
    loading.value.tree = true
    try {
      const data = await fetchFolders(parentId)
      currentSubFolders.value = data
      console.log("[DEBUG] loadSubFolders result:", data)
    } catch (e: any) {
      console.error("加载子文件夹失败:", e)
      Message.error(e?.message || "加载子文件夹失败")
      throw e
    } finally {
      loading.value.tree = false
    }
  }

  /**
   * 加载文件夹内容（子文件夹+文件）
   * 一次性获取子文件夹和文件，性能更优
   */
  async function loadFolderContent(folderId: number) {
    console.log("[DEBUG] cloudStore.loadFolderContent called with folderId:", folderId)
    loading.value.files = true
    loading.value.tree = true
    try {
      // 使用新的统一接口 fetchItems
      const result = await fetchItems(folderId === 0 ? undefined : folderId)
      currentSubFolders.value = result.folders
      files.value = result.files
      console.log("[DEBUG] loadFolderContent result:", result)
    } catch (e: any) {
      console.error("加载文件夹内容失败:", e)
      Message.error(e?.message || "加载文件夹内容失败")
      throw e
    } finally {
      loading.value.files = false
      loading.value.tree = false
    }
  }

  /**
   * 刷新当前文件夹内容
   * 根据当前所在目录选择合适的刷新方法
   */
  async function refreshCurrentFolder() {
    console.log("[DEBUG] cloudStore.refreshCurrentFolder called, currentFolderId:", currentFolderId.value)
    if (currentFolderId.value === 0) {
      // 根目录只需要刷新文件列表
      await loadFiles(0)
    } else {
      // 非根目录刷新子文件夹和文件
      await loadFolderContent(currentFolderId.value)
    }
  }

  /**
   * 加载配额信息
   */
  async function loadQuota() {
    loading.value.quota = true
    try {
      const data = await getQuota()
      quota.value = data
    } catch (e: any) {
      console.error('加载配额信息失败:', e)
      // 配额加载失败不阻塞主流程，静默处理
    } finally {
      loading.value.quota = false
    }
  }

  /**
   * 加载分享列表
   */
  async function loadShares() {
    loading.value.shares = true
    try {
      const data = await getMyShares()
      myShares.value = data
    } catch (e: any) {
      console.error('加载分享列表失败:', e)
      // 分享列表可能后端未实现，静默处理
    } finally {
      loading.value.shares = false
    }
  }

  /**
   * 刷新所有数据
   * 注意：已移除 loadFolderTree()，旧的树形 API 已废弃
   */
  async function refreshAll() {
    await Promise.all([loadFiles(), loadQuota()])
  }

  /**
   * 切换文件夹
   */
  async function switchFolder(folderId: number, folderName?: string) {
    console.log("[DEBUG] cloudStore.switchFolder called with folderId:", folderId, "folderName:", folderName)
    
    // 如果要回到根目录
    if (folderId === 0) {
      breadcrumbPath.value = [{ id: 0, name: '我的云盘' }]
      currentFolderId.value = 0
      await loadFiles(0)
      return
    }

    // 更新面包屑路径
    if (folderName) {
      // 从当前面包屑中查找是否已经存在该文件夹
      const existingIndex = breadcrumbPath.value.findIndex(item => item.id === folderId)
      
      if (existingIndex !== -1) {
        // 如果存在，说明是往回导航，截断到该位置
        breadcrumbPath.value = breadcrumbPath.value.slice(0, existingIndex + 1)
      } else {
        // 如果不存在，说明是往深处导航，添加到末尾
        breadcrumbPath.value.push({ id: folderId, name: folderName })
      }
    }

    currentFolderId.value = folderId

    // 使用新的合并接口，一次性加载子文件夹和文件
    await loadFolderContent(folderId)
  }

  /**
   * 返回上一级
   */
  async function goBack() {
    const parentId = pathStack.value.pop()
    if (parentId !== undefined) {
      currentFolderId.value = parentId
      await loadFiles(parentId)
    } else if (currentFolder.value && currentFolder.value.ParentID !== undefined) {
      currentFolderId.value = currentFolder.value.ParentID
      await loadFiles(currentFolder.value.ParentID)
    } else {
      // 已经在根目录
      await goRoot()
    }
  }

  /**
   * 返回根目录
   */
  async function goRoot() {
    breadcrumbPath.value = [{ id: 0, name: '我的云盘' }]
    pathStack.value = []
    currentFolderId.value = 0
    await loadFiles(0)
  }
  /**
   * 创建文件夹
   */
  async function createFolder(folderName: string, parentId?: number) {
    try {
      // 使用新的统一接口
      await createItemApi({
        itemType: 'folder',
        name: folderName,
        parentId: parentId ?? (currentFolderId.value === 0 ? null : currentFolderId.value),
      })
      Message.success('创建文件夹成功')
      await Promise.all([currentFolderId.value === 0 ? loadFiles() : loadFolderContent(currentFolderId.value)])
    } catch (e: any) {
      console.error('创建文件夹失败:', e)
      Message.error(e?.message || '创建文件夹失败')
      throw e
    }
  }

  /**
   * 删除文件夹
   */
  async function deleteFolder(folderId: number) {
    console.log('[DEBUG] cloudStore.deleteFolder called', { folderId })
    try {
      console.log('[DEBUG] cloudStore - calling deleteItemApi', { folderId })
      // 使用新的统一接口
      await deleteItemApi(folderId)
      Message.success('删除文件夹成功')
      await Promise.all([currentFolderId.value === 0 ? loadFiles() : loadFolderContent(currentFolderId.value), loadQuota()])
    } catch (e: any) {
      console.error('删除文件夹失败:', e)
      Message.error(e?.message || '删除文件夹失败')
      throw e
    }
  }

  /**
   * 重命名文件夹
   */
  async function renameFolder(folderId: number, newName: string) {
    try {
      // 使用新的统一接口
      await renameItemApi(folderId, { newName })
      Message.success('重命名文件夹成功')
      await Promise.all([currentFolderId.value === 0 ? loadFiles() : loadFolderContent(currentFolderId.value)])
    } catch (e: any) {
      console.error('重命名文件夹失败:', e)
      Message.error(e?.message || '重命名文件夹失败')
      throw e
    }
  }

  /**
   * 删除文件
   */
  async function deleteFile(fileId: number) {
    try {
      // 使用新的统一接口
      await deleteItemApi(fileId)
      Message.success('删除文件成功')
      await Promise.all([currentFolderId.value === 0 ? loadFiles() : loadFolderContent(currentFolderId.value), loadQuota()])
    } catch (e: any) {
      console.error('删除文件失败:', e)
      Message.error(e?.message || '删除文件失败')
      throw e
    }
  }

  /**
   * 移动文件
   */
  async function moveFile(fileId: number, targetFolderId: number) {
    try {
      // 使用新的统一接口
      await moveItemApi(fileId, { targetParentId: targetFolderId === 0 ? null : targetFolderId })
      Message.success('移动文件成功')
      await (currentFolderId.value === 0 ? loadFiles() : loadFolderContent(currentFolderId.value))
    } catch (e: any) {
      console.error('移动文件失败:', e)
      Message.error(e?.message || '移动文件失败')
      throw e
    }
  }

  /**
   * 重命名文件
   */
  async function renameFile(fileId: number, newName: string) {
    try {
      // 使用新的统一接口
      await renameItemApi(fileId, { newName })
      Message.success('重命名文件成功')
      await (currentFolderId.value === 0 ? loadFiles() : loadFolderContent(currentFolderId.value))
    } catch (e: any) {
      console.error('重命名文件失败:', e)
      Message.error(e?.message || '重命名文件失败')
      throw e
    }
  }

  /**
   * 选择文件
   */
  function selectFile(fileId: number) {
    if (selectedFileIds.value.has(fileId)) {
      selectedFileIds.value.delete(fileId)
    } else {
      selectedFileIds.value.add(fileId)
    }
  }

  /**
   * 选择文件夹
   */
  function selectFolder(folderId: number) {
    console.log("[DEBUG] selectFolder called with folderId:", folderId, "current selectedFolderIds:", Array.from(selectedFolderIds.value))
    if (selectedFolderIds.value.has(folderId)) {
      selectedFolderIds.value.delete(folderId)
    } else {
      selectedFolderIds.value.add(folderId)
    }
  }

  /**
   * 全选文件
   */
  function selectAllFiles() {
    files.value.forEach((file) => selectedFileIds.value.add(file.ID))
  }

  /**
   * 全选所有项（文件夹+文件）
   */
  function selectAll() {
    currentFolderChildren.value.forEach((folder) => selectedFolderIds.value.add(folder.ID || folder.id))
    files.value.forEach((file) => selectedFileIds.value.add(file.ID))
  }

  /**
   * 清空选择
   */
  function clearSelection() {
    selectedFileIds.value.clear()
    selectedFolderIds.value.clear()
  }

  /**
   * 批量删除选中项
   */
  async function batchDelete() {
    const fileIds = Array.from(selectedFileIds.value)
    const folderIds = Array.from(selectedFolderIds.value)

    if (fileIds.length === 0 && folderIds.length === 0) {
      Message.warning('请先选择要删除的项')
      return
    }

    try {
      await Promise.all([
        ...fileIds.map((id) => deleteItemApi(id)),  // 使用新的统一接口
        ...folderIds.map((id) => deleteItemApi(id)),  // 使用新的统一接口
      ])
      Message.success(`成功删除 ${fileIds.length + folderIds.length} 项`)
      clearSelection()
      // 移除 loadFolderTree() - 旧 API 已废弃
      await Promise.all([loadFiles(), loadQuota()])
    } catch (e: any) {
      console.error('批量删除失败:', e)
      Message.error('部分删除失败，请重试')
      throw e
    }
  }

  /**
   * 设置搜索关键词
   */
  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  /**
   * 设置排序方式
   */
  function setSortBy(sort: FileSortBy) {
    sortBy.value = sort
  }

  /**
   * 切换排序方向
   */
  function toggleSortOrder() {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  }

  /**
   * 设置视图模式
   */
  function setViewMode(mode: 'grid' | 'list') {
    viewMode.value = mode
  }

  // ==================== 辅助函数 ====================

  /**
   * 根据ID查找文件夹
   */
  function findFolderById(folders: Folder[], id: number): Folder | null {
    for (const folder of folders) {
      if ((folder.ID || folder.id) === id) {
        return folder
      }
      if (folder.Children && folder.Children.length > 0) {
        const found = findFolderById(folder.Children, id)
        if (found) return found
      }
    }
    return null
  }

  // ==================== 返回 ====================

  return {
    // 状态
    folderTree,
    currentFolderId,
    files,
    currentSubFolders,
    quota,
    loading,
    uploadQueue,
    selectedFileIds,
    selectedFolderIds,
    searchQuery,
    sortBy,
    sortOrder,
    myShares,
    viewMode,
    pathStack,
    breadcrumbPath,

    // Getters
    currentFolder,
    currentFolderChildren,
    breadcrumbs,
    gridItems,
    filteredAndSortedFiles,
    selectedCount,
    hasUploadingTasks,
    uploadProgress,

    // Actions
    loadFolderTree,
    loadFiles,
    loadSubFolders,
    loadFolderContent,
    loadQuota,
    loadShares,
    refreshAll,
    switchFolder,
    goBack,
    goRoot,
    createFolder,
    deleteFolder,
    renameFolder,
    deleteFile,
    moveFile,
    renameFile,
    selectFile,
    selectFolder,
    selectAllFiles,
    selectAll,
    clearSelection,
    batchDelete,
    setSearchQuery,
    setSortBy,
    toggleSortOrder,
    setViewMode,
  }
})
