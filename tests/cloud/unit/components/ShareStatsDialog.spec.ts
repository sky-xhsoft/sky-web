/**
 * ShareStatsDialog 组件单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ShareStatsDialog from '@/modules/cloud/components/dialogs/ShareStatsDialog.vue'
import type { ShareListItem } from '@/modules/cloud/types'
import * as cloudApi from '@/modules/cloud/api'

// Mock API
vi.mock('@/modules/cloud/api', () => ({
  getShareAccessRecords: vi.fn(),
}))

// Mock format utils
vi.mock('@/modules/cloud/utils/format', () => ({
  formatDate: vi.fn((date: string) => date ? new Date(date).toLocaleString('zh-CN') : ''),
  formatFileSize: vi.fn((size: number) => `${size} bytes`),
}))

// Mock Arco Design
vi.mock('@arco-design/web-vue', () => ({
  Message: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

describe('ShareStatsDialog', () => {
  const mockShare: ShareListItem = {
    ID: 1,
    FileID: 100,
    FileName: 'test.pdf',
    ShareCode: 'abc123',
    Password: 'pass123',
    CreateTime: '2026-01-10T10:00:00Z',
    ExpirationTime: '2026-01-17T10:00:00Z',
  }

  const mockAccessRecords = [
    {
      ID: 1,
      ShareID: 1,
      AccessTime: '2026-01-15T14:30:00Z',
      IPAddress: '192.168.1.100',
      Action: 'view' as const,
      UserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    {
      ID: 2,
      ShareID: 1,
      AccessTime: '2026-01-15T13:45:00Z',
      IPAddress: '192.168.1.101',
      Action: 'download' as const,
      UserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
    {
      ID: 3,
      ShareID: 1,
      AccessTime: '2026-01-15T12:30:00Z',
      IPAddress: '192.168.1.100',
      Action: 'download' as const,
      UserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染测试', () => {
    it('应该正确渲染对话框标题', () => {
      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: mockShare,
        },
      })

      expect(wrapper.text()).toContain('访问统计')
    })

    it('未打开时不应该显示内容', () => {
      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: false,
          share: mockShare,
        },
      })

      expect(wrapper.find('.share-stats').exists()).toBe(false)
    })

    it('应该显示分享基本信息', () => {
      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: mockShare,
        },
      })

      expect(wrapper.text()).toContain('test.pdf')
      expect(wrapper.text()).toContain('abc123')
      expect(wrapper.text()).toContain('pass123')
    })

    it('没有密码时不应该显示密码', () => {
      const shareWithoutPassword: ShareListItem = {
        ...mockShare,
        Password: null,
      }

      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: shareWithoutPassword,
        },
      })

      // 不应该显示锁图标和密码
      expect(wrapper.findAll('.meta-item').length).toBeLessThan(3)
    })
  })

  describe('加载访问记录', () => {
    it('打开对话框时应该加载访问记录', async () => {
      vi.mocked(cloudApi.getShareAccessRecords).mockResolvedValue(mockAccessRecords)

      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: false,
          share: mockShare,
        },
      })

      await wrapper.setProps({ visible: true })
      await wrapper.vm.$nextTick()

      // 应该调用API
      expect(cloudApi.getShareAccessRecords).toHaveBeenCalledWith(mockShare.ID)
    })

    it('加载时应该显示 loading 状态', async () => {
      vi.mocked(cloudApi.getShareAccessRecords).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockAccessRecords), 100))
      )

      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: false,  // 先设置为 false
          share: mockShare,
        },
      })

      // 设置为 true 触发加载
      await wrapper.setProps({ visible: true })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.loading).toBe(true)
    })

    it('加载完成后应该显示访问记录', async () => {
      vi.mocked(cloudApi.getShareAccessRecords).mockResolvedValue(mockAccessRecords)

      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: false,  // 先设置为 false
          share: mockShare,
        },
      })

      // 设置为 true 触发加载
      await wrapper.setProps({ visible: true })
      await wrapper.vm.$nextTick()

      // 等待异步加载完成
      await new Promise(resolve => setTimeout(resolve, 10))
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.loading).toBe(false)
      expect(wrapper.vm.accessRecords.length).toBeGreaterThan(0)
    })

    it('没有访问记录时应该显示空状态', async () => {
      vi.mocked(cloudApi.getShareAccessRecords).mockResolvedValue([])

      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: mockShare,
        },
      })

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('暂无访问记录')
    })
  })

  describe('统计数据计算', () => {
    it('应该正确计算访问次数', async () => {
      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: mockShare,
        },
      })

      wrapper.vm.accessRecords = mockAccessRecords

      expect(wrapper.vm.accessCount).toBe(3)
    })

    it('应该正确计算下载次数', async () => {
      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: mockShare,
        },
      })

      wrapper.vm.accessRecords = mockAccessRecords

      // 2次下载
      expect(wrapper.vm.downloadCount).toBe(2)
    })

    it('应该正确计算独立访客数', async () => {
      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: mockShare,
        },
      })

      wrapper.vm.accessRecords = mockAccessRecords

      // 2个不同的IP
      expect(wrapper.vm.uniqueVisitors).toBe(2)
    })

    it('空记录时统计应该为0', () => {
      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: mockShare,
        },
      })

      expect(wrapper.vm.accessCount).toBe(0)
      expect(wrapper.vm.downloadCount).toBe(0)
      expect(wrapper.vm.uniqueVisitors).toBe(0)
    })
  })

  describe('User-Agent 解析', () => {
    it('应该正确解析 Windows User-Agent', () => {
      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: mockShare,
        },
      })

      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      expect(wrapper.vm.parseUserAgent(ua)).toBe('Windows')
    })

    it('应该正确解析 macOS User-Agent', () => {
      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: mockShare,
        },
      })

      const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      expect(wrapper.vm.parseUserAgent(ua)).toBe('macOS')
    })

    it('应该正确解析 Linux User-Agent', () => {
      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: mockShare,
        },
      })

      const ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
      expect(wrapper.vm.parseUserAgent(ua)).toBe('Linux')
    })

    it('应该正确解析 Android User-Agent', () => {
      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: mockShare,
        },
      })

      const ua = 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'
      expect(wrapper.vm.parseUserAgent(ua)).toBe('Android')
    })

    it('应该正确解析 iOS User-Agent', () => {
      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: mockShare,
        },
      })

      const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      expect(wrapper.vm.parseUserAgent(ua)).toBe('iOS')
    })

    it('未知 User-Agent 应该返回"未知设备"', () => {
      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: mockShare,
        },
      })

      expect(wrapper.vm.parseUserAgent('')).toBe('未知')
      expect(wrapper.vm.parseUserAgent('Unknown UA')).toBe('未知设备')
    })
  })

  describe('对话框关闭', () => {
    it('点击关闭应该触发 update:visible 事件', async () => {
      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: mockShare,
        },
      })

      wrapper.vm.handleCancel()
      await wrapper.vm.$nextTick()  // 等待 watch 触发

      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
    })

    it('dialogVisible 变化应该触发 update:visible', async () => {
      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: mockShare,
        },
      })

      wrapper.vm.dialogVisible = false
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:visible')).toBeTruthy()
    })
  })

  describe('错误处理', () => {
    it('API 失败时应该显示空记录', async () => {
      vi.mocked(cloudApi.getShareAccessRecords).mockRejectedValue(
        new Error('Network error')
      )

      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: mockShare,
        },
      })

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.accessRecords).toEqual([])
    })

    it('没有分享对象时不应该加载记录', async () => {
      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: null,
        },
      })

      await wrapper.vm.$nextTick()

      expect(cloudApi.getShareAccessRecords).not.toHaveBeenCalled()
    })
  })

  describe('分页', () => {
    it('应该配置分页参数', () => {
      const wrapper = mount(ShareStatsDialog, {
        props: {
          visible: true,
          share: mockShare,
        },
      })

      expect(wrapper.vm.pagination.pageSize).toBe(10)
      expect(wrapper.vm.pagination.showTotal).toBe(true)
    })
  })
})
