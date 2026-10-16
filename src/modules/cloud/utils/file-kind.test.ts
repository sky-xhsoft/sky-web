import { describe, it, expect } from 'vitest'
import { fileKindOf, extOf, videoAccessUrl } from './file-kind'

describe('fileKindOf', () => {
  it('按扩展名识别（带点、不带点、文件名、大小写）', () => {
    expect(fileKindOf('.mp4')).toBe('video')
    expect(fileKindOf('MOV')).toBe('video')
    expect(fileKindOf('主视觉.JPG')).toBe('image')
    expect(fileKindOf('流程单_v3.pdf')).toBe('pdf')
    expect(fileKindOf('a.docx')).toBe('word')
    expect(fileKindOf('名单.xlsx')).toBe('excel')
    expect(fileKindOf('汇报.pptx')).toBe('ppt')
    expect(fileKindOf('素材.zip')).toBe('archive')
    expect(fileKindOf('main.go')).toBe('code')
    expect(fileKindOf('字幕.srt')).toBe('text')
    expect(fileKindOf('setup.exe')).toBe('exe')
    expect(fileKindOf('录音.m4a')).toBe('audio')
  })

  it('扩展名无法识别时按 MIME 识别，都不认识为 other', () => {
    expect(fileKindOf('blob', 'video/quicktime')).toBe('video')
    expect(fileKindOf('', 'application/pdf')).toBe('pdf')
    expect(fileKindOf('data.bin', 'application/octet-stream')).toBe('other')
    expect(fileKindOf('')).toBe('other')
  })

  it('extOf 取小写扩展名', () => {
    expect(extOf('A.B.MP4')).toBe('mp4')
    expect(extOf('.Pdf')).toBe('pdf')
    expect(extOf('')).toBe('')
  })
})

describe('videoAccessUrl', () => {
  it('视频有 http(s) 直链时返回直链', () => {
    expect(videoAccessUrl({ FileExt: '.mp4', AccessURL: 'https://video-1.cos.ap-nanjing.myqcloud.com/a.mp4' })).toBe('https://video-1.cos.ap-nanjing.myqcloud.com/a.mp4')
    expect(videoAccessUrl({ FileName: 'b.MOV', accessUrl: 'http://x.example.com/b.mov' })).toBe('http://x.example.com/b.mov')
  })
  it('非视频、没有直链或是相对地址时返回空', () => {
    expect(videoAccessUrl({ FileExt: '.jpg', AccessURL: 'https://x.example.com/a.jpg' })).toBe('')
    expect(videoAccessUrl({ FileExt: '.mp4' })).toBe('')
    expect(videoAccessUrl({ FileExt: '.mp4', AccessURL: '/api/v1/files/access/abc' })).toBe('')
    expect(videoAccessUrl(null)).toBe('')
  })
})
