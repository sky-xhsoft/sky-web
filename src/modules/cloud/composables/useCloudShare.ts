/**
 * 云盘分享管理 Composable
 *
 * 封装文件/文件夹分享逻辑
 */

import { ref, computed } from 'vue'
import { Modal, Message } from '@arco-design/web-vue'
import { useCloudStore } from '@/modules/cloud/stores/cloudStore'
import { createFileShare, createFolderShare, deleteShare, updateShare } from '@/modules/cloud/api'
import type { FileItem, Folder, ShareInfo, ShareCreateParams, ShareListItem } from '@/modules/cloud/types'

/**
 * 云盘分享管理功能
 */
export function useCloudShare() {
  const store = useCloudStore()

  // 操作状态
  const creatingShare = ref(false)
  const deletingShare = ref(false)
  const updatingShare = ref(false)
  const loadingShares = ref(false)

  // 分享列表
  const myShares = computed(() => store.myShares)

  /**
   * 创建文件分享
   * @param file 文件对象
   * @param params 分享参数
   */
  async function createShare(file: FileItem, params: Omit<ShareCreateParams, 'fileId'>) {
    creatingShare.value = true
    try {
      const share = await createFileShare({
        ...params,
        fileId: file.ID,
      })
      Message.success('创建分享成功')
      await store.loadShares() // 刷新分享列表
      return share
    } catch (e: any) {
      console.error('创建分享失败:', e)
      Message.error(e?.message || '创建分享失败')
      return null
    } finally {
      creatingShare.value = false
    }
  }

  /**
   * 创建文件夹分享
   * @param folder 文件夹对象
   * @param params 分享参数
   */
  async function createFolderShareLink(folder: Folder, params: Omit<ShareCreateParams, 'resourceId'>) {
    creatingShare.value = true
    try {
      const share = await createFolderShare({
        ...params,
        resourceId: folder.ID || folder.id,
        resourceType: 'folder',
      })
      Message.success('创建文件夹分享成功')
      await store.loadShares()
      return share
    } catch (e: any) {
      console.error('创建文件夹分享失败:', e)
      Message.error(e?.message || '创建文件夹分享失败')
      return null
    } finally {
      creatingShare.value = false
    }
  }

  /**
   * 创建分享（带对话框）
   * @param item 文件或文件夹对象
   */
  async function createShareWithDialog(item: FileItem | Folder) {
    return new Promise<ShareInfo | null>((resolve) => {
      Modal.open({
        title: '创建分享',
        content: `分享「${'FileName' in item ? item.FileName : item.FolderName}」`,
        modalClass: 'create-share-modal',
        onOk: async () => {
          // 默认参数：密码分享，7天有效
          const params: Omit<ShareCreateParams, 'fileId' | 'resourceId'> = {
            shareType: 'password',  // 必填：分享类型
            expireDays: 7,
            password: Math.random().toString(36).substring(2, 8), // 生成随机6位密码
          }

          let share: ShareInfo | null = null
          if ('FileName' in item) {
            share = await createShare(item, params)
          } else {
            share = await createFolderShareLink(item, params)
          }

          resolve(share)
        },
        onCancel: () => {
          resolve(null)
        },
      })
    })
  }

  /**
   * 删除分享
   * @param shareId 分享ID
   */
  async function removeShare(shareId: number) {
    deletingShare.value = true
    try {
      await deleteShare(shareId)
      Message.success('删除分享成功')
      await store.loadShares()
      return true
    } catch (e: any) {
      console.error('删除分享失败:', e)
      Message.error(e?.message || '删除分享失败')
      return false
    } finally {
      deletingShare.value = false
    }
  }

  /**
   * 删除分享（带确认对话框）
   * @param share 分享对象
   */
  async function removeShareWithConfirm(share: ShareListItem) {
    return new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: '确认删除',
        content: '确定要删除此分享吗？删除后链接将失效。',
        okText: '删除',
        okButtonProps: {
          status: 'danger',
        },
        onOk: async () => {
          const success = await removeShare(share.ID)
          resolve(success)
        },
        onCancel: () => {
          resolve(false)
        },
      })
    })
  }

  /**
   * 更新分享
   * @param shareId 分享ID
   * @param params 更新参数
   */
  async function modifyShare(shareId: number, params: Partial<ShareCreateParams>) {
    updatingShare.value = true
    try {
      const share = await updateShare(shareId, params)
      Message.success('更新分享成功')
      await store.loadShares()
      return share
    } catch (e: any) {
      console.error('更新分享失败:', e)
      Message.error(e?.message || '更新分享失败')
      return null
    } finally {
      updatingShare.value = false
    }
  }

  /**
   * 复制分享链接到剪贴板
   * @param share 分享对象
   */
  async function copyShareLink(share: ShareListItem) {
    try {
      const baseUrl = window.location.origin
      const shareUrl = `${baseUrl}/share/${share.ShareCode}`
      const text = share.Password
        ? `分享链接：${shareUrl}\n提取码：${share.Password}`
        : `分享链接：${shareUrl}`

      await navigator.clipboard.writeText(text)
      Message.success('已复制分享链接到剪贴板')
      return true
    } catch (e) {
      console.error('复制失败:', e)
      Message.error('复制失败，请手动复制')
      return false
    }
  }

  /**
   * 获取分享链接（格式化）
   * @param share 分享对象
   */
  function getShareLink(share: ShareListItem): string {
    const baseUrl = window.location.origin
    return `${baseUrl}/share/${share.ShareCode}`
  }

  /**
   * 检查分享是否已过期
   * @param share 分享对象
   */
  function isShareExpired(share: ShareListItem): boolean {
    if (!share.ExpirationTime) return false
    return new Date(share.ExpirationTime) < new Date()
  }

  /**
   * 获取分享剩余天数
   * @param share 分享对象
   */
  function getShareRemainingDays(share: ShareListItem): number | null {
    if (!share.ExpirationTime) return null
    const expTime = new Date(share.ExpirationTime).getTime()
    const now = Date.now()
    const diff = expTime - now
    if (diff <= 0) return 0
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  /**
   * 刷新分享列表
   */
  async function refreshShares() {
    loadingShares.value = true
    try {
      await store.loadShares()
      return true
    } catch (e) {
      console.error('刷新分享列表失败:', e)
      return false
    } finally {
      loadingShares.value = false
    }
  }

  /**
   * 按状态过滤分享
   * @param status 'active' | 'expired'
   */
  function filterSharesByStatus(status: 'active' | 'expired'): ShareListItem[] {
    return myShares.value.filter((share) => {
      const expired = isShareExpired(share)
      return status === 'expired' ? expired : !expired
    })
  }

  /**
   * 获取活跃分享数量
   */
  const activeShareCount = computed(() => filterSharesByStatus('active').length)

  /**
   * 获取过期分享数量
   */
  const expiredShareCount = computed(() => filterSharesByStatus('expired').length)

  return {
    // 创建操作
    createShare,
    createFolderShareLink,
    createShareWithDialog,
    creatingShare,

    // 删除操作
    removeShare,
    removeShareWithConfirm,
    deletingShare,

    // 更新操作
    modifyShare,
    updatingShare,

    // 链接操作
    copyShareLink,
    getShareLink,

    // 查询操作
    isShareExpired,
    getShareRemainingDays,
    filterSharesByStatus,

    // 刷新操作
    refreshShares,
    loadingShares,

    // 状态（响应式）
    myShares,
    activeShareCount,
    expiredShareCount,
  }
}

export default useCloudShare
