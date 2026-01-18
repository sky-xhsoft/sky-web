/**
 * 云盘导航 Composable
 *
 * 封装文件夹切换、返回上级、根目录导航等逻辑
 */

import { useCloudStore } from '@/modules/cloud/stores/cloudStore'
import type { Folder } from '@/modules/cloud/types'

/**
 * 云盘导航功能
 */
export function useCloudNavigation() {
  const store = useCloudStore()

  /**
   * 切换到指定文件夹
   * @param folderId 文件夹ID（0表示根目录）
   * @param folderName 文件夹名称（用于面包屑）
   */
  async function navigateTo(folderId: number, folderName?: string) {
    console.log("[DEBUG] useCloudNavigation.navigateTo called with folderId:", folderId, "folderName:", folderName)
    await store.switchFolder(folderId, folderName)
  }

  /**
   * 返回上一级
   */
  async function navigateBack() {
    await store.goBack()
  }

  /**
   * 返回根目录
   */
  async function navigateToRoot() {
    await store.goRoot()
  }

  /**
   * 通过面包屑导航
   * @param breadcrumbItem 面包屑项
   */
  async function navigateToBreadcrumb(breadcrumbItem: { id: number; name: string }) {
    await navigateTo(breadcrumbItem.id, breadcrumbItem.name)
  }

  /**
   * 打开文件夹（用于网格/列表视图中的双击事件）
   * @param folder 文件夹对象
   */
  async function openFolder(folder: Folder) {
    await navigateTo(folder.ID || folder.id, folder.name)
  }

  /**
   * 检查是否在根目录
   */
  function isAtRoot(): boolean {
    return store.currentFolderId === 0
  }

  /**
   * 检查是否可以返回上一级
   */
  function canGoBack(): boolean {
    return store.currentFolderId !== 0 || store.pathStack.length > 0
  }

  /**
   * 获取当前路径深度
   */
  function getCurrentDepth(): number {
    return store.breadcrumbs.length - 1 // 减去根目录
  }

  /**
   * 获取父文件夹ID
   */
  function getParentFolderId(): number | null {
    const { currentFolder } = store
    if (!currentFolder) return null
    return currentFolder.ParentID
  }

  return {
    // 导航操作
    navigateTo,
    navigateBack,
    navigateToRoot,
    navigateToBreadcrumb,
    openFolder,

    // 状态查询
    isAtRoot,
    canGoBack,
    getCurrentDepth,
    getParentFolderId,

    // Store状态（响应式）
    currentFolderId: () => store.currentFolderId,
    currentFolder: () => store.currentFolder,
    breadcrumbs: () => store.breadcrumbs,
    pathStack: () => store.pathStack,
  }
}

export default useCloudNavigation
