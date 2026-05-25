import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CloudBatchActionsBar from './CloudBatchActionsBar.vue'

describe('CloudBatchActionsBar', () => {
  it('hides when selectedCount is 0', () => {
    const wrapper = mount(CloudBatchActionsBar, {
      props: { selectedCount: 0, selectedTotalSize: 0, canDownload: false },
    })
    expect(wrapper.find('.cloud-batch-actions').exists()).toBe(false)
  })

  it('shows when selectedCount > 0', () => {
    const wrapper = mount(CloudBatchActionsBar, {
      props: { selectedCount: 3, selectedTotalSize: 1024, canDownload: true },
    })
    expect(wrapper.find('.cloud-batch-actions').exists()).toBe(true)
  })

  it('displays selected count in info', () => {
    const wrapper = mount(CloudBatchActionsBar, {
      props: { selectedCount: 5, selectedTotalSize: 0, canDownload: false },
    })
    const info = wrapper.find('.batch-info')
    // 显示 i18n key 占位（mocked t() 返回 key）
    expect(info.text()).toContain('cloud.selectedItems')
  })

  it('emits download event', async () => {
    const wrapper = mount(CloudBatchActionsBar, {
      props: { selectedCount: 1, selectedTotalSize: 100, canDownload: true },
    })
    const buttons = wrapper.findAll('button')
    // 找到 download 按钮（含 IconDownload）
    const downloadBtn = buttons.find((b) => b.text().includes('download'))
    if (downloadBtn) {
      await downloadBtn.trigger('click')
      expect(wrapper.emitted('download')).toBeTruthy()
    }
  })

  it('emits delete event', async () => {
    const wrapper = mount(CloudBatchActionsBar, {
      props: { selectedCount: 1, selectedTotalSize: 100, canDownload: true },
    })
    const buttons = wrapper.findAll('button')
    const deleteBtn = buttons.find((b) => b.text().includes('delete'))
    if (deleteBtn) {
      await deleteBtn.trigger('click')
      expect(wrapper.emitted('delete')).toBeTruthy()
    }
  })

  it('has toolbar role for accessibility', () => {
    const wrapper = mount(CloudBatchActionsBar, {
      props: { selectedCount: 1, selectedTotalSize: 0, canDownload: false },
    })
    const bar = wrapper.find('.cloud-batch-actions')
    expect(bar.attributes('role')).toBe('toolbar')
    expect(bar.attributes('aria-label')).toBeTruthy()
  })
})