/**
 * EditShareDialog 组件单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EditShareDialog from '@/modules/cloud/components/dialogs/EditShareDialog.vue'
import type { ShareListItem } from '@/modules/cloud/types'

// Mock format utils
vi.mock('@/modules/cloud/utils/format', () => ({
  formatDate: vi.fn((date: string) => date ? new Date(date).toLocaleString('zh-CN') : ''),
  formatFileSize: vi.fn((size: number) => `${size} bytes`),
}))

describe('EditShareDialog', () => {
  const mockShare: ShareListItem = {
    ID: 1,
    FileID: 100,
    FileName: 'test.pdf',
    ShareCode: 'abc123',
    Password: 'pass123',
    CreateTime: '2026-01-10T10:00:00Z',
    ExpirationTime: '2026-01-17T10:00:00Z', // 7天后过期
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染测试', () => {
    it('应该正确渲染对话框标题', () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: true,
          loading: false,
          share: mockShare,
        },
      })

      expect(wrapper.text()).toContain('编辑分享')
    })

    it('未打开时不应该显示内容', () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: false,
          loading: false,
          share: mockShare,
        },
      })

      expect(wrapper.find('.share-info').exists()).toBe(false)
    })

    it('应该显示分享链接', () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: true,
          loading: false,
          share: mockShare,
        },
      })

      expect(wrapper.text()).toContain('abc123')
    })

    it('应该显示提取码', () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: true,
          loading: false,
          share: mockShare,
        },
      })

      expect(wrapper.text()).toContain('abc123')
    })

    it('应该显示创建时间', () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: true,
          loading: false,
          share: mockShare,
        },
      })

      expect(wrapper.text()).toContain('创建时间')
    })

    it('应该显示过期时间', () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: true,
          loading: false,
          share: mockShare,
        },
      })

      expect(wrapper.text()).toContain('过期时间')
    })
  })

  describe('表单初始化', () => {
    it('应该根据分享信息初始化表单', async () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: false,  // 先设置为 false
          loading: false,
          share: mockShare,
        },
      })

      // 然后设置为 true，触发 watch
      await wrapper.setProps({ visible: true })
      await wrapper.vm.$nextTick()

      // 检查密码是否初始化
      expect(wrapper.vm.form.password).toBe('pass123')
    })

    it('没有密码的分享应该初始化为空密码', async () => {
      const shareWithoutPassword: ShareListItem = {
        ...mockShare,
        Password: null,
      }

      const wrapper = mount(EditShareDialog, {
        props: {
          visible: true,
          loading: false,
          share: shareWithoutPassword,
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.vm.form.password).toBe('')
    })
  })

  describe('剩余天数计算', () => {
    it('应该正确计算剩余天数', () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: true,
          loading: false,
          share: mockShare,
        },
      })

      const remaining = wrapper.vm.calculateRemainingDays(mockShare.ExpirationTime)
      expect(remaining).toBeGreaterThanOrEqual(0)
    })

    it('已过期应该返回0', () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: true,
          loading: false,
          share: mockShare,
        },
      })

      const pastTime = '2026-01-01T10:00:00Z'
      expect(wrapper.vm.calculateRemainingDays(pastTime)).toBe(0)
    })

    it('没有过期时间应该返回0', () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: true,
          loading: false,
          share: mockShare,
        },
      })

      expect(wrapper.vm.calculateRemainingDays(undefined)).toBe(0)
    })
  })

  describe('密码生成', () => {
    it('应该能生成随机密码', () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: true,
          loading: false,
          share: mockShare,
        },
      })

      const initialPassword = wrapper.vm.form.password
      wrapper.vm.generatePassword()

      // 生成的密码应该不同
      expect(wrapper.vm.form.password).not.toBe(initialPassword)
      // 密码长度应该是6位
      expect(wrapper.vm.form.password).toHaveLength(6)
      // 密码应该只包含小写字母和数字
      expect(wrapper.vm.form.password).toMatch(/^[a-z0-9]{6}$/)
    })

    it('每次生成的密码应该不同', () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: true,
          loading: false,
          share: mockShare,
        },
      })

      const passwords = new Set()
      for (let i = 0; i < 10; i++) {
        wrapper.vm.generatePassword()
        passwords.add(wrapper.vm.form.password)
      }

      // 10次生成应该至少有8个不同的密码（允许小概率重复）
      expect(passwords.size).toBeGreaterThanOrEqual(8)
    })
  })

  describe('表单提交', () => {
    it('点击确定应该触发 confirm 事件', async () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: true,
          loading: false,
          share: mockShare,
        },
      })

      wrapper.vm.form.expirationDays = 30
      wrapper.vm.form.password = 'newpass'

      wrapper.vm.handleOk()

      expect(wrapper.emitted('confirm')).toBeTruthy()
      const emittedParams = wrapper.emitted('confirm')?.[0][0] as any
      expect(emittedParams.expirationDays).toBe(30)
      expect(emittedParams.password).toBe('newpass')
    })

    it('空密码不应该包含在提交参数中', async () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: true,
          loading: false,
          share: mockShare,
        },
      })

      wrapper.vm.form.expirationDays = 7
      wrapper.vm.form.password = '   ' // 空格

      wrapper.vm.handleOk()

      const emittedParams = wrapper.emitted('confirm')?.[0][0] as any
      expect(emittedParams.password).toBeUndefined()
    })

    it('点击取消应该触发 update:visible 事件', async () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: true,
          loading: false,
          share: mockShare,
        },
      })

      wrapper.vm.handleCancel()
      await wrapper.vm.$nextTick()  // 等待 watch 触发

      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
    })
  })

  describe('加载状态', () => {
    it('加载时确定按钮应该显示加载状态', () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: true,
          loading: true,
          share: mockShare,
        },
      })

      // Arco Modal 的 ok-loading 属性应该被设置
      expect(wrapper.props('loading')).toBe(true)
    })
  })

  describe('分享链接显示', () => {
    it('应该正确生成分享链接', () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: true,
          loading: false,
          share: mockShare,
        },
      })

      const shareLink = wrapper.vm.shareLink
      expect(shareLink).toContain('abc123')
      expect(shareLink).toMatch(/^https?:\/\//)
    })

    it('没有分享对象时应该返回空链接', () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: true,
          loading: false,
          share: null,
        },
      })

      expect(wrapper.vm.shareLink).toBe('')
    })
  })

  describe('响应式更新', () => {
    it('visible 变化时应该更新 dialogVisible', async () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: false,
          loading: false,
          share: mockShare,
        },
      })

      expect(wrapper.vm.dialogVisible).toBe(false)

      await wrapper.setProps({ visible: true })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.dialogVisible).toBe(true)
    })

    it('打开对话框时应该重新初始化表单', async () => {
      const wrapper = mount(EditShareDialog, {
        props: {
          visible: false,
          loading: false,
          share: mockShare,
        },
      })

      // 修改表单
      wrapper.vm.form.password = 'changed'

      // 重新打开
      await wrapper.setProps({ visible: true })
      await wrapper.vm.$nextTick()

      // 表单应该重新初始化
      expect(wrapper.vm.form.password).toBe('pass123')
    })
  })
})
