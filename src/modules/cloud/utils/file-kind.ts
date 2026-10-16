/**
 * 文件类型识别：按扩展名（其次 MIME）归类，用于显示类型图标
 */

export type FileKind =
  | 'video'
  | 'image'
  | 'audio'
  | 'pdf'
  | 'word'
  | 'excel'
  | 'ppt'
  | 'archive'
  | 'code'
  | 'text'
  | 'exe'
  | 'other'

const EXT_KIND: Record<string, FileKind> = {}
const register = (kind: FileKind, exts: string) => exts.split(' ').forEach((ext) => (EXT_KIND[ext] = kind))

register('video', 'mp4 mov avi wmv flv mkv webm m4v mpg mpeg ts m3u8 3gp')
register('image', 'jpg jpeg png gif bmp svg webp ico heic tif tiff psd')
register('audio', 'mp3 wav flac aac ogg m4a wma amr')
register('pdf', 'pdf')
register('word', 'doc docx wps rtf odt pages')
register('excel', 'xls xlsx csv et ods numbers')
register('ppt', 'ppt pptx dps odp key')
register('archive', 'zip rar 7z tar gz tgz bz2 xz iso')
register('code', 'js ts jsx tsx vue html css scss less py java go php c cpp h cs rb rs swift kt sql json xml yaml yml sh bat')
register('text', 'txt md log ini conf cfg srt vtt ass')
register('exe', 'exe msi app dmg apk ipa deb rpm')

/** 每种类型的主色（图标底色）与浅色（图块背景） */
export const FILE_KIND_COLORS: Record<FileKind, { color: string; bg: string }> = {
  video: { color: '#7c4dde', bg: '#f1ebfe' },
  image: { color: '#1f8f5f', bg: '#e6f6ee' },
  audio: { color: '#d9480f', bg: '#fff0e6' },
  pdf: { color: '#d63a2f', bg: '#fdecea' },
  word: { color: '#2b62d9', bg: '#e8effd' },
  excel: { color: '#178046', bg: '#e5f5ec' },
  ppt: { color: '#d4561c', bg: '#fdeee6' },
  archive: { color: '#8a6100', bg: '#fbf1d9' },
  code: { color: '#0f7c9c', bg: '#e3f4f9' },
  text: { color: '#5b6573', bg: '#eef1f5' },
  exe: { color: '#4b5565', bg: '#eceef2' },
  other: { color: '#7a8494', bg: '#f0f2f5' },
}

/** 取扩展名（小写、不带点）；name 可以是文件名或扩展名 */
export function extOf(nameOrExt?: string | null): string {
  const value = String(nameOrExt || '').trim().toLowerCase()
  if (!value) return ''
  const dot = value.lastIndexOf('.')
  return dot >= 0 ? value.slice(dot + 1) : value
}

/**
 * 识别文件类型
 * @param ext 扩展名（可带点）或文件名
 * @param mime MIME 类型（扩展名无法识别时使用）
 */
export function fileKindOf(ext?: string | null, mime?: string | null): FileKind {
  const kind = EXT_KIND[extOf(ext)]
  if (kind) return kind
  const type = String(mime || '').toLowerCase()
  if (type.startsWith('video/')) return 'video'
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('audio/')) return 'audio'
  if (type === 'application/pdf') return 'pdf'
  if (type.startsWith('text/')) return 'text'
  if (type.includes('zip') || type.includes('compressed')) return 'archive'
  return 'other'
}

const KIND_LABELS: Record<FileKind, string> = {
  video: '视频',
  image: '图片',
  audio: '音频',
  pdf: 'PDF 文档',
  word: 'Word 文档',
  excel: '表格',
  ppt: '演示文稿',
  archive: '压缩包',
  code: '代码',
  text: '文本',
  exe: '安装包',
  other: '文件',
}

/** 文件类型中文名称 */
export function fileKindLabel(ext?: string | null, mime?: string | null): string {
  return KIND_LABELS[fileKindOf(ext, mime)]
}

/**
 * 视频文件的对象存储直链（http/https）；不是视频或没有直链时返回空字符串。
 * 云盘视频存在公开读的存储桶里，直链长期有效，可直接复制给外部使用。
 */
export function videoAccessUrl(file?: { FileExt?: string; FileType?: string; FileName?: string; AccessURL?: string; accessUrl?: string; accessURL?: string } | null): string {
  if (!file) return ''
  if (fileKindOf(file.FileExt || file.FileName || '', file.FileType) !== 'video') return ''
  const url = file.accessUrl || file.accessURL || file.AccessURL || ''
  return /^https?:\/\//i.test(url) ? url : ''
}
