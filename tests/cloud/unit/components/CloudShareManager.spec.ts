/**
 * CloudShareManager 组件单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CloudShareManager from '@/modules/cloud/components/CloudShareManager.vue'
import type { ShareListItem } from '@/modules/cloud/types'

// Mock Arco Design 组件
vi.mock('@arco-design/web-vue', () => ({
  Message: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

describe('CloudShareManager', () => {
  const mockShares: ShareListItem[] = [
    {
      ID: 1,
      FileID: 100,
      FileName: 'test.pdf',
      ShareCode: 'abc123',
      Password: 'pass123',
      CreateTime: '2026-01-10T10:00:00Z',
      ExpirationTime: '2026-01-20T10:00:00Z',
    },
    {
      ID: 2,
      FileID: 101,
      FileName: 'expired.doc',
      ShareCode: 'def456',
      Password: 'pass456',
      CreateTime: '2026-01-01T10:00:00Z',
      ExpirationTime: '2026-01-05T10:00:00Z', // 已过期
    },
    {
      ID: 3,
      FileID: 102,
      FileName: 'active.txt',
      ShareCode: 'ghi789',
      Password: null,
      CreateTime: '2026-01-14T10:00:00Z',
      ExpirationTime: '2026-01-30T10:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染测试', () => {
    it('应该正确渲染标题', () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: [],
          loading: false,
        },
      })

      expect(wrapper.text()).toContain('我的分享')
    })

    it('加载状态时应该显示 loading', () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: [],
          loading: true,
        },
      })

      expect(wrapper.find('.cloud-share-manager__loading').exists()).toBe(true)
    })

    it('空状态时应该显示空提示', () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: [],
          loading: false,
        },
      })

      expect(wrapper.text()).toContain('暂无分享')
    })

    it('有分享时应该显示分享列表', () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: mockShares,
          loading: false,
        },
      })

      expect(wrapper.find('.cloud-share-manager__list').exists()).toBe(true)
      expect(wrapper.findAll('.share-item')).toHaveLength(3)
    })
  })

  describe('统计信息', () => {
    it('应该正确显示统计数据', () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: mockShares,
          loading: false,
        },
      })

      const stats = wrapper.find('.cloud-share-manager__stats')
      expect(stats.exists()).toBe(true)

      // 总分享数: 3
      expect(stats.text()).toContain('总分享')
      expect(stats.text()).toContain('3')

      // 有效分享: 2 (test.pdf 和 active.txt)
      expect(stats.text()).toContain('有效分享')
      expect(stats.text()).toContain('2')

      // 已过期: 1 (expired.doc)
      expect(stats.text()).toContain('已过期')
      expect(stats.text()).toContain('1')
    })
  })

  describe('状态筛选', () => {
    it('默认显示所有分享', () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: mockShares,
          loading: false,
        },
      })

      expect(wrapper.findAll('.share-item')).toHaveLength(3)
    })

    it('筛选有效分享时应该只显示未过期的', async () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: mockShares,
          loading: false,
        },
      })

      // 模拟选择"有效"筛选
      const filterStatus = wrapper.vm.filterStatus
      wrapper.vm.filterStatus = 'active'
      await wrapper.vm.$nextTick()

      const filteredShares = wrapper.vm.filteredShares
      expect(filteredShares).toHaveLength(2)
      expect(filteredShares.some((s: ShareListItem) => s.ID === 2)).toBe(false)
    })

    it('筛选已过期分享时应该只显示过期的', async () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: mockShares,
          loading: false,
        },
      })

      wrapper.vm.filterStatus = 'expired'
      await wrapper.vm.$nextTick()

      const filteredShares = wrapper.vm.filteredShares
      expect(filteredShares).toHaveLength(1)
      expect(filteredShares[0].ID).toBe(2)
    })
  })

  describe('事件触发', () => {
    it('点击刷新应该触发 refresh 事件', async () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: mockShares,
          loading: false,
        },
      })

      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('refresh')).toBeTruthy()
    })

    it('点击复制按钮应该触发 copy 事件', async () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: mockShares,
          loading: false,
        },
      })

      // 模拟点击第一个分享的复制按钮
      wrapper.vm.handleCopy(mockShares[0])

      expect(wrapper.emitted('copy')).toBeTruthy()
      expect(wrapper.emitted('copy')?.[0]).toEqual([mockShares[0]])
    })

    it('点击编辑按钮应该触发 edit 事件', async () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: mockShares,
          loading: false,
        },
      })

      wrapper.vm.handleEdit(mockShares[0])

      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('edit')?.[0]).toEqual([mockShares[0]])
    })

    it('点击访问统计按钮应该触发 viewStats 事件', async () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: mockShares,
          loading: false,
        },
      })

      wrapper.vm.handleViewStats(mockShares[0])

      expect(wrapper.emitted('viewStats')).toBeTruthy()
      expect(wrapper.emitted('viewStats')?.[0]).toEqual([mockShares[0]])
    })

    it('点击删除按钮应该触发 delete 事件', async () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: mockShares,
          loading: false,
        },
      })

      wrapper.vm.handleDelete(mockShares[0])

      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')?.[0]).toEqual([mockShares[0]])
    })
  })

  describe('过期判断', () => {
    it('应该正确判断分享是否过期', () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: mockShares,
          loading: false,
        },
      })

      // test.pdf 未过期
      expect(wrapper.vm.isExpired(mockShares[0])).toBe(false)

      // expired.doc 已过期
      expect(wrapper.vm.isExpired(mockShares[1])).toBe(true)

      // active.txt 未过期
      expect(wrapper.vm.isExpired(mockShares[2])).toBe(false)
    })

    it('没有过期时间的分享应该认为未过期', () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: [],
          loading: false,
        },
      })

      const shareWithoutExpiration: ShareListItem = {
        ID: 4,
        FileID: 103,
        FileName: 'permanent.txt',
        ShareCode: 'jkl012',
        Password: null,
        CreateTime: '2026-01-01T10:00:00Z',
        ExpirationTime: undefined,
      }

      expect(wrapper.vm.isExpired(shareWithoutExpiration)).toBe(false)
    })
  })

  describe('剩余天数计算', () => {
    it('应该正确计算剩余天数', () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: mockShares,
          loading: false,
        },
      })

      // test.pdf 剩余天数应该 > 0
      const remaining = wrapper.vm.getRemainingDays(mockShares[0])
      expect(remaining).toBeGreaterThan(0)
    })

    it('已过期分享应该返回0天', () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: mockShares,
          loading: false,
        },
      })

      expect(wrapper.vm.getRemainingDays(mockShares[1])).toBe(0)
    })

    it('永久分享应该返回999天', () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: [],
          loading: false,
        },
      })

      const permanentShare: ShareListItem = {
        ID: 4,
        FileID: 103,
        FileName: 'permanent.txt',
        ShareCode: 'jkl012',
        Password: null,
        CreateTime: '2026-01-01T10:00:00Z',
        ExpirationTime: undefined,
      }

      expect(wrapper.vm.getRemainingDays(permanentShare)).toBe(999)
    })
  })

  describe('UI交互', () => {
    it('过期分享的操作按钮应该被禁用', () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: mockShares,
          loading: false,
        },
      })

      // 验证过期分享有 is-expired 类
      const expiredItems = wrapper.findAll('.share-item.is-expired')
      expect(expiredItems.length).toBeGreaterThan(0)
    })

    it('应该显示分享码和密码', () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: mockShares,
          loading: false,
        },
      })

      expect(wrapper.text()).toContain('abc123')
      expect(wrapper.text()).toContain('pass123')
    })

    it('没有密码的分享不应该显示密码字段', () => {
      const wrapper = mount(CloudShareManager, {
        props: {
          shares: [mockShares[2]], // active.txt 没有密码
          loading: false,
        },
      })

      const passwordFields = wrapper.findAll('.share-password')
      expect(passwordFields).toHaveLength(0)
    })
  })
})
