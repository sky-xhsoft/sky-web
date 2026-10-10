import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/modules/cloud/api', () => ({
  getPlayUrl: vi.fn().mockResolvedValue(''),
  fetchPreviewPdf: vi.fn(),
  fetchFileBlobPreferDirect: vi.fn(),
}))
vi.mock('@/modules/cloud/composables', () => ({ useCloudFile: () => ({ download: vi.fn() }) }))

import FilePreviewDialog from './FilePreviewDialog.vue'
import { fetchFileBlobPreferDirect, fetchPreviewPdf } from '@/modules/cloud/api'

const MB = 1024 * 1024
const TOO_LARGE = '文件过大，无法直接查看，建议下载后查看'

function mountDialog(name: string, ext: string, size: number, category = 'document') {
  return mount(FilePreviewDialog, {
    props: {
      visible: true,
      category: category as any,
      file: { ID: 1, FileName: name, FileExt: ext, FileSize: size, FileType: '', CreateTime: '' } as any,
    },
    global: {
      stubs: {
        'a-modal': { template: '<div><slot /></div>' },
        CloudFileIcon: true,
        CloudFileThumb: true,
        DocumentViewer: true,
      },
    },
  })
}

describe('FilePreviewDialog 文件过大', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('文档超过 100MB：提示文件过大，不下载', async () => {
    const wrapper = mountDialog('年报.pdf', '.pdf', 150 * MB)
    await flushPromises()
    expect(wrapper.text()).toContain(TOO_LARGE)
    expect(fetchFileBlobPreferDirect).not.toHaveBeenCalled()
  })

  it('旧版 Word 超过 50MB（服务器不转换）：提示文件过大，不转换也不下载', async () => {
    const wrapper = mountDialog('合同.doc', '.doc', 60 * MB)
    await flushPromises()
    expect(wrapper.text()).toContain(TOO_LARGE)
    expect(fetchPreviewPdf).not.toHaveBeenCalled()
    expect(fetchFileBlobPreferDirect).not.toHaveBeenCalled()
  })

  it('本地存储（无直链）的视频超过 200MB：提示文件过大', async () => {
    const wrapper = mountDialog('录制.mp4', '.mp4', 300 * MB, 'video')
    await flushPromises()
    expect(wrapper.text()).toContain(TOO_LARGE)
    expect(fetchFileBlobPreferDirect).not.toHaveBeenCalled()
  })

  it('不支持预览的类型：窗口内提示下载并提供下载按钮，不读取文件', async () => {
    const wrapper = mountDialog('安装包.exe', '.exe', 2 * MB, 'unknown')
    await flushPromises()
    expect(wrapper.text()).toContain('暂不支持预览此类型文件，请下载后查看')
    expect(wrapper.text()).toContain('下载文件')
    expect(fetchFileBlobPreferDirect).not.toHaveBeenCalled()
  })
})
