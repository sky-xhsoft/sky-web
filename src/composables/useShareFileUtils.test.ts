import { describe, it, expect } from 'vitest'
import { getFileType, canPreview, hasAccessUrl, getAccessUrl, getFilePreviewUrl, getFileDownloadUrl } from './useShareFileUtils'

describe('useShareFileUtils', () => {
  describe('getFileType', () => {
    it('detects image types', () => {
      expect(getFileType('photo.jpg')).toBe('image')
      expect(getFileType('photo.png')).toBe('image')
      expect(getFileType('photo.webp')).toBe('image')
    })

    it('detects video types', () => {
      expect(getFileType('video.mp4')).toBe('video')
      expect(getFileType('video.mkv')).toBe('video')
    })

    it('detects audio types', () => {
      expect(getFileType('song.mp3')).toBe('audio')
      expect(getFileType('song.wav')).toBe('audio')
    })

    it('detects pdf', () => {
      expect(getFileType('doc.pdf')).toBe('pdf')
    })

    it('detects text types', () => {
      expect(getFileType('readme.txt')).toBe('text')
      expect(getFileType('data.json')).toBe('text')
    })

    it('returns unknown for unrecognized', () => {
      expect(getFileType('file.xyz')).toBe('unknown')
      expect(getFileType('noextension')).toBe('unknown')
    })

    it('is case insensitive', () => {
      expect(getFileType('PHOTO.JPG')).toBe('image')
      expect(getFileType('Video.MP4')).toBe('video')
    })
  })

  describe('canPreview', () => {
    it('returns true for previewable types', () => {
      expect(canPreview('photo.jpg')).toBe(true)
      expect(canPreview('video.mp4')).toBe(true)
      expect(canPreview('song.mp3')).toBe(true)
      expect(canPreview('doc.pdf')).toBe(true)
      expect(canPreview('readme.txt')).toBe(true)
    })

    it('returns false for unknown types', () => {
      expect(canPreview('file.xyz')).toBe(false)
    })
  })

  describe('hasAccessUrl', () => {
    it('detects valid HTTP URLs', () => {
      expect(hasAccessUrl({ accessUrl: 'https://cdn.example.com/file.jpg' })).toBe(true)
      expect(hasAccessUrl({ accessUrl: 'http://cdn.example.com/file.jpg' })).toBe(true)
    })

    it('rejects invalid URLs', () => {
      expect(hasAccessUrl({ accessUrl: '/local/path' })).toBe(false)
      expect(hasAccessUrl({ accessUrl: '' })).toBe(false)
      expect(hasAccessUrl({})).toBe(false)
    })

    it('checks multiple field names', () => {
      expect(hasAccessUrl({ accessURL: 'https://example.com' })).toBe(true)
      expect(hasAccessUrl({ AccessURL: 'https://example.com' })).toBe(true)
    })
  })

  describe('getAccessUrl', () => {
    it('returns first available URL field', () => {
      expect(getAccessUrl({ accessUrl: 'https://a.com' })).toBe('https://a.com')
      expect(getAccessUrl({ accessURL: 'https://b.com' })).toBe('https://b.com')
    })

    it('returns empty string when no URL', () => {
      expect(getAccessUrl({})).toBe('')
    })
  })

  describe('getFilePreviewUrl', () => {
    it('generates correct preview URL', () => {
      expect(getFilePreviewUrl('abc123', 42)).toBe('/api/v1/cloud/shares/abc123/files/42/preview')
    })

    it('appends encoded access token', () => {
      expect(getFilePreviewUrl('abc123', 42, 'a-b_c+/=')).toBe('/api/v1/cloud/shares/abc123/files/42/preview?token=a-b_c%2B%2F%3D')
    })
  })

  describe('getFileDownloadUrl', () => {
    it('generates correct download URL', () => {
      expect(getFileDownloadUrl('abc123', 42)).toBe('/api/v1/cloud/shares/abc123/files/42/download')
    })

    it('appends encoded access token', () => {
      expect(getFileDownloadUrl('abc123', 42, 'tok')).toBe('/api/v1/cloud/shares/abc123/files/42/download?token=tok')
    })
  })
})
