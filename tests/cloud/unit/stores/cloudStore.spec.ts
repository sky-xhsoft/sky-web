/**
 * cloudStore.ts Pinia Store 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCloudStore } from '@/modules/cloud/stores/cloudStore'
import type { Folder, FileItem, QuotaInfo } from '@/modules/cloud/types'

// Mock API模块
vi.mock('@/modules/cloud/api', () => ({
  // 新的统一接口
  fetchItems: vi.fn(() => Promise.resolve({
    folders: mockFolderTree,
    files: mockFiles
  })),
  // 旧接口（保留以兼容现有测试）
  fetchFolderTree: vi.fn(() => Promise.resolve(mockFolderTree)),
  loadFolderTree: vi.fn(() => Promise.resolve(mockFolderTree)),
  fetchFiles: vi.fn(() => Promise.resolve(mockFiles)),
  getQuota: vi.fn(() => Promise.resolve(mockQuota)),
  createFolder: vi.fn(() => Promise.resolve(mockFolder)),
  deleteFolder: vi.fn(() => Promise.resolve()),
  renameFolder: vi.fn(() => Promise.resolve()),
  deleteFile: vi.fn(() => Promise.resolve()),
  moveFile: vi.fn(() => Promise.resolve()),
  renameFile: vi.fn(() => Promise.resolve()),
  getMyShares: vi.fn(() => Promise.resolve([])),
}))

// Mock Arco Design Message
vi.mock('@arco-design/web-vue', () => ({
  Message: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

// Mock composable
vi.mock('@/modules/cloud/composables/useFileIcon', () => ({
  getFileIconConfig: vi.fn(() => ({
    icon: '📄',
    color: '#6b7280',
    bg: '#f9fafb',
  })),
}))

// Mock数据
const mockFolderTree: Folder[] = [
  {
    ID: 1,
    FolderName: '文档',
    ParentID: 0,
    UserID: 100,
    CreateTime: '2026-01-13T10:00:00Z',
    Children: [
      {
        ID: 3,
        FolderName: '工作文档',
        ParentID: 1,
        UserID: 100,
        CreateTime: '2026-01-13T10:05:00Z',
        Children: [],
      },
    ],
  },
  {
    ID: 2,
    FolderName: '照片',
    ParentID: 0,
    UserID: 100,
    CreateTime: '2026-01-13T10:10:00Z',
    Children: [],
  },
]

const mockFiles: FileItem[] = [
  {
    ID: 100,
    FileName: 'report.pdf',
    FileSize: 1024000,
    FileType: 'application/pdf',
    FileExt: '.pdf',
    FolderID: 0,
    UserID: 100,
    CreateTime: '2026-01-13T10:00:00Z',
  },
  {
    ID: 101,
    FileName: 'photo.jpg',
    FileSize: 2048000,
    FileType: 'image/jpeg',
    FileExt: '.jpg',
    FolderID: 0,
    UserID: 100,
    CreateTime: '2026-01-13T10:05:00Z',
  },
]

const mockQuota: QuotaInfo = {
  UserID: 100,
  TotalQuota: 10737418240, // 10GB
  UsedQuota: 3221225472, // 3GB
  AvailableQuota: 7516192768, // 7GB
  UsagePercentage: 30,
  FileCount: 2,
  FolderCount: 2,
}

const mockFolder: Folder = {
  ID: 4,
  FolderName: '新文件夹',
  ParentID: 0,
  UserID: 100,
  CreateTime: '2026-01-15T10:00:00Z',
}

describe('cloudStore', () => {
  beforeEach(() => {
    // 每个测试前创建新的Pinia实例
    setActivePinia(createPinia())
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const store = useCloudStore()

      expect(store.folderTree).toEqual([])
      expect(store.currentFolderId).toBe(0)
      expect(store.files).toEqual([])
      expect(store.quota).toBeNull()
      expect(store.searchQuery).toBe('')
      expect(store.sortBy).toBe('name')
      expect(store.sortOrder).toBe('asc')
      expect(store.viewMode).toBe('grid')
    })

    it('应该有正确的加载状态', () => {
      const store = useCloudStore()

      expect(store.loading.tree).toBe(false)
      expect(store.loading.files).toBe(false)
      expect(store.loading.upload).toBe(false)
      expect(store.loading.quota).toBe(false)
    })

    it('选择集合应该为空', () => {
      const store = useCloudStore()

      expect(store.selectedFileIds.size).toBe(0)
      expect(store.selectedFolderIds.size).toBe(0)
      expect(store.selectedCount).toBe(0)
    })
  })

  describe('Getters', () => {
    it('currentFolder应该在根目录时返回null', () => {
      const store = useCloudStore()
      expect(store.currentFolder).toBeNull()
    })

    it('breadcrumbs应该在根目录时只包含根目录', () => {
      const store = useCloudStore()
      expect(store.breadcrumbs).toEqual([{ id: 0, name: '我的云盘' }])
    })

    it('gridItems应该合并文件夹和文件', async () => {
      const store = useCloudStore()
      store.folderTree = mockFolderTree
      store.files = mockFiles

      const items = store.gridItems

      // 2个文件夹 + 2个文件 = 4项
      expect(items).toHaveLength(4)

      // 前2项应该是文件夹
      expect(items[0].type).toBe('folder')
      expect(items[1].type).toBe('folder')

      // 后2项应该是文件
      expect(items[2].type).toBe('file')
      expect(items[3].type).toBe('file')
    })

    it('selectedCount应该正确计算选中数量', () => {
      const store = useCloudStore()

      store.selectFile(100)
      store.selectFile(101)
      store.selectFolder(1)

      expect(store.selectedCount).toBe(3)
    })
  })

  describe('Actions - 加载数据', () => {
    it('loadFolderTree应该加载文件夹树', async () => {
      const store = useCloudStore()

      await store.loadFolderTree()

      expect(store.folderTree).toEqual(mockFolderTree)
      expect(store.loading.tree).toBe(false)
    })

    it('loadFiles应该加载文件列表', async () => {
      const store = useCloudStore()

      await store.loadFiles()

      expect(store.files).toEqual(mockFiles)
      expect(store.loading.files).toBe(false)
    })

    it('loadQuota应该加载配额信息', async () => {
      const store = useCloudStore()

      await store.loadQuota()

      expect(store.quota).toEqual(mockQuota)
      expect(store.loading.quota).toBe(false)
    })

    it('refreshAll应该刷新所有数据', async () => {
      const store = useCloudStore()

      await store.refreshAll()

      expect(store.folderTree).toEqual(mockFolderTree)
      expect(store.files).toEqual(mockFiles)
      expect(store.quota).toEqual(mockQuota)
    })
  })

  describe('Actions - 文件夹导航', () => {
    it('switchFolder应该切换文件夹', async () => {
      const store = useCloudStore()

      await store.switchFolder(1)

      expect(store.currentFolderId).toBe(1)
    })

    it('goRoot应该返回根目录', async () => {
      const store = useCloudStore()

      store.currentFolderId = 1
      store.pathStack = [0]

      await store.goRoot()

      expect(store.currentFolderId).toBe(0)
      expect(store.pathStack).toEqual([])
    })

    it('goBack应该返回上一级', async () => {
      const store = useCloudStore()

      store.currentFolderId = 3
      store.pathStack = [0, 1]

      await store.goBack()

      expect(store.currentFolderId).toBe(1)
      expect(store.pathStack).toEqual([0])
    })
  })

  describe('Actions - 选择操作', () => {
    it('selectFile应该选择/取消选择文件', () => {
      const store = useCloudStore()

      store.selectFile(100)
      expect(store.selectedFileIds.has(100)).toBe(true)

      store.selectFile(100)
      expect(store.selectedFileIds.has(100)).toBe(false)
    })

    it('selectFolder应该选择/取消选择文件夹', () => {
      const store = useCloudStore()

      store.selectFolder(1)
      expect(store.selectedFolderIds.has(1)).toBe(true)

      store.selectFolder(1)
      expect(store.selectedFolderIds.has(1)).toBe(false)
    })

    it('selectAllFiles应该选择所有文件', () => {
      const store = useCloudStore()
      store.files = mockFiles

      store.selectAllFiles()

      expect(store.selectedFileIds.size).toBe(2)
      expect(store.selectedFileIds.has(100)).toBe(true)
      expect(store.selectedFileIds.has(101)).toBe(true)
    })

    it('selectAll应该选择所有项', () => {
      const store = useCloudStore()
      store.folderTree = mockFolderTree
      store.files = mockFiles

      store.selectAll()

      expect(store.selectedFolderIds.size).toBe(2)
      expect(store.selectedFileIds.size).toBe(2)
    })

    it('clearSelection应该清空选择', () => {
      const store = useCloudStore()

      store.selectFile(100)
      store.selectFolder(1)

      store.clearSelection()

      expect(store.selectedFileIds.size).toBe(0)
      expect(store.selectedFolderIds.size).toBe(0)
    })
  })

  describe('Actions - 搜索和排序', () => {
    it('setSearchQuery应该设置搜索关键词', () => {
      const store = useCloudStore()

      store.setSearchQuery('report')

      expect(store.searchQuery).toBe('report')
    })

    it('搜索应该过滤文件列表', () => {
      const store = useCloudStore()
      store.files = mockFiles

      store.setSearchQuery('report')

      const filtered = store.filteredAndSortedFiles
      expect(filtered).toHaveLength(1)
      expect(filtered[0].FileName).toBe('report.pdf')
    })

    it('setSortBy应该设置排序字段', () => {
      const store = useCloudStore()

      store.setSortBy('size')

      expect(store.sortBy).toBe('size')
    })

    it('toggleSortOrder应该切换排序方向', () => {
      const store = useCloudStore()

      expect(store.sortOrder).toBe('asc')

      store.toggleSortOrder()
      expect(store.sortOrder).toBe('desc')

      store.toggleSortOrder()
      expect(store.sortOrder).toBe('asc')
    })

    it('按名称排序应该正确工作', () => {
      const store = useCloudStore()
      store.files = mockFiles

      store.setSortBy('name')
      store.sortOrder = 'asc'

      const sorted = store.filteredAndSortedFiles
      expect(sorted[0].FileName).toBe('photo.jpg')
      expect(sorted[1].FileName).toBe('report.pdf')
    })

    it('按大小排序应该正确工作', () => {
      const store = useCloudStore()
      store.files = mockFiles

      store.setSortBy('size')
      store.sortOrder = 'asc'

      const sorted = store.filteredAndSortedFiles
      expect(sorted[0].FileSize).toBe(1024000)
      expect(sorted[1].FileSize).toBe(2048000)
    })
  })

  describe('Actions - 视图模式', () => {
    it('setViewMode应该设置视图模式', () => {
      const store = useCloudStore()

      expect(store.viewMode).toBe('grid')

      store.setViewMode('list')
      expect(store.viewMode).toBe('list')

      store.setViewMode('grid')
      expect(store.viewMode).toBe('grid')
    })
  })

  describe('上传进度', () => {
    it('hasUploadingTasks应该检测是否有上传任务', () => {
      const store = useCloudStore()

      expect(store.hasUploadingTasks).toBe(false)

      store.uploadQueue = [
        {
          id: '1',
          file: new File([''], 'test.txt'),
          folderId: 0,
          status: 'uploading',
          progress: 50,
          uploadedSize: 512000,
          totalSize: 1024000,
          speed: 1024,
          remainingTime: 500,
        },
      ]

      expect(store.hasUploadingTasks).toBe(true)
    })

    it('uploadProgress应该正确计算总进度', () => {
      const store = useCloudStore()

      store.uploadQueue = [
        {
          id: '1',
          file: new File([''], 'test1.txt'),
          folderId: 0,
          status: 'uploading',
          progress: 50,
          uploadedSize: 512000,
          totalSize: 1024000,
          speed: 1024,
          remainingTime: 500,
        },
        {
          id: '2',
          file: new File([''], 'test2.txt'),
          folderId: 0,
          status: 'uploading',
          progress: 75,
          uploadedSize: 768000,
          totalSize: 1024000,
          speed: 1024,
          remainingTime: 250,
        },
      ]

      const progress = store.uploadProgress

      // 总大小 = 2048000, 已上传 = 1280000
      expect(progress.total).toBe(2048000)
      expect(progress.loaded).toBe(1280000)
      expect(progress.percent).toBeCloseTo(62.5, 1)
    })
  })
})
