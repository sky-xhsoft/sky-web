import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

vi.mock('@/api/http', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        code: 200,
        data: [
          { id: 11, name: '项目', path: '/项目', children: [{ id: 12, name: '直播资料', path: '/项目/直播资料', children: [] }] },
        ],
      },
    }),
  },
}))

import CloudFolderSelect from './CloudFolderSelect.vue'
import api from '@/api/http'

// 用一个简单桩替代 a-tree-select：记录收到的树数据，并可模拟选择
let lastTree: any[] = []
const TreeSelectStub = defineComponent({
  props: ['data', 'modelValue'],
  emits: ['change'],
  setup(props, { emit }) {
    return () => {
      lastTree = props.data as any[]
      return h('div', { class: 'tree-select-stub', 'data-value': String(props.modelValue) }, [
        h('button', { class: 'pick-root', onClick: () => emit('change', 0) }),
        h('button', { class: 'pick-12', onClick: () => emit('change', 12) }),
      ])
    }
  },
})

function mountSelect(modelValue?: number) {
  return mount(CloudFolderSelect, {
    props: { modelValue, rootLabel: '云盘根目录' },
    global: { stubs: { 'a-tree-select': TreeSelectStub } },
  })
}

describe('CloudFolderSelect', () => {
  beforeEach(() => vi.clearAllMocks())

  it('加载当前用户的文件夹树，根目录在最上层', async () => {
    mountSelect()
    await flushPromises()
    expect(api.get).toHaveBeenCalledWith('/cloud/folders/tree')
    expect(lastTree[0]).toMatchObject({ key: 0, title: '云盘根目录' })
    expect(lastTree[0].children[0]).toMatchObject({ key: 11, title: '项目' })
    expect(lastTree[0].children[0].children[0]).toMatchObject({ key: 12, title: '直播资料' })
  })

  it('选择根目录输出 0，选择文件夹输出文件夹 ID', async () => {
    const wrapper = mountSelect()
    await flushPromises()
    await wrapper.find('.pick-root').trigger('click')
    await wrapper.find('.pick-12').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[0], [12]])
  })

  it('已选文件夹显示完整路径；未选择时不显示', async () => {
    const selected = mountSelect(12)
    await flushPromises()
    expect(selected.find('.folder-path').text()).toBe('/项目/直播资料')

    const root = mountSelect(0)
    await flushPromises()
    expect(root.find('.folder-path').exists()).toBe(false)
    expect(root.emitted('path-change')?.at(-1)).toEqual(['/'])

    const empty = mountSelect(undefined)
    await flushPromises()
    expect(empty.find('.folder-path').exists()).toBe(false)
    expect(empty.find('.tree-select-stub').attributes('data-value')).toBe('undefined')
  })
})
