/**
 * 字幕同传（火山引擎声影同传）新建任务：表单、校验与提交参数。
 * 参数与火山控制台「新建任务」提交的 CreateSpeechTask Rule 一致。
 */
import dayjs from 'dayjs'

export type SpeechMode = 'si' | 'realtime' | 'asr'

export interface SpeechStyle {
  preset: number // 预设样式序号，-1 为自定义文字颜色
  fontColor: string
  borderColor: string
  boxColor: string // 底色
  boxW: number // 底色边距
  opacity: number // 底色透明度 0-100
  maxChar: number // 每行字数 1-200
  fontSize: number // 字号 1-100
  font: string
}

export interface SpeechForm {
  name: string
  timeRange: string[]
  sourceUrl: string
  targetUrl: string
  mode: SpeechMode
  delay: number
  delayTouched: boolean
  inputLang: string
  outputLang: string
  lipSync: boolean
  voiceOn: boolean
  voiceMode: 'auto' | 'fixed'
  fixedVoice: string
  originalMode: 'mix' | 'translationOnly'
  bgVolume: number
  denoise: boolean
  audioEnhance: boolean
  subtitleOn: boolean
  outWordMode: 'sentence' | 'stream'
  subtitleFormat: 'both' | 'translation'
  rows: number // 0 为自适应
  order: 'originalTop' | 'originalBottom'
  marginLr: number // 1-30 %
  marginTb: number // 1-50 %
  shareStyle: boolean
  transStyle: SpeechStyle
  origStyle: SpeechStyle
  glossary: string
  hotWords: string
  replacePairs: { from: string; to: string }[]
  previewSize: string
  bgImage: string
  testMain: string
  testOriginal: string
}

export const MODES: { value: SpeechMode; title: string; desc: string }[] = [
  { value: 'si', title: '声影同传', desc: '字幕、同传音频与画面对齐，需要一定延迟' },
  { value: 'realtime', title: '实时同传', desc: '同传音频与画面不同步，实时翻译同传' },
  { value: 'asr', title: '原文 ASR 字幕', desc: '只需原文字幕' },
]

export const INPUT_LANGS = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: '英语' },
]

export const OUTPUT_LANGS = [
  { value: 'de', label: '德语' },
  { value: 'en', label: '英语' },
  { value: 'es', label: '西班牙语' },
  { value: 'fr', label: '法语' },
  { value: 'id', label: '印尼语' },
  { value: 'ja', label: '日语' },
  { value: 'pt', label: '葡萄牙语' },
  { value: 'zh', label: '中文' },
]

export const SIZES = [
  { value: '1280x720', label: '1280 * 720 (16:9)' },
  { value: '1440x900', label: '1440 * 900 (16:10)' },
  { value: '1534x864', label: '1534 * 864 (16:9)' },
  { value: '1920x1080', label: '1920 * 1080 (16:9)' },
]

/** 预设样式：白字黑边、黑字白边、白字蓝边 */
export const PRESETS = [
  { label: '白字黑色描边', font: '#ffffff', border: '#000000' },
  { label: '黑字白色描边', font: '#0C0D0E', border: '#ffffff' },
  { label: '白字蓝色描边', font: '#ffffff', border: '#4EA6FF' },
]

export const MAX_REPLACE = 500
export const MAX_GLOSSARY = 30000

export const defaultStyle = (): SpeechStyle => ({
  preset: 0, fontColor: '#ffffff', borderColor: '#000000', boxColor: '#000000', boxW: 1, opacity: 70, maxChar: 60, fontSize: 40, font: 'arial',
})

export const defaultSpeechForm = (): SpeechForm => {
  const now = dayjs()
  return {
    name: '',
    timeRange: [now.format('YYYY-MM-DD HH:mm:ss'), now.add(3, 'day').format('YYYY-MM-DD HH:mm:ss')],
    sourceUrl: '',
    targetUrl: '',
    mode: 'si',
    delay: 12,
    delayTouched: false,
    inputLang: 'zh',
    outputLang: 'en',
    lipSync: false,
    voiceOn: true,
    voiceMode: 'auto',
    fixedVoice: '',
    originalMode: 'mix',
    bgVolume: 20,
    denoise: false,
    audioEnhance: true,
    subtitleOn: true,
    outWordMode: 'sentence',
    subtitleFormat: 'translation',
    rows: 1,
    order: 'originalTop',
    marginLr: 20,
    marginTb: 5,
    shareStyle: false,
    transStyle: defaultStyle(),
    origStyle: defaultStyle(),
    glossary: '',
    hotWords: '',
    replacePairs: [{ from: '', to: '' }],
    previewSize: '1920x1080',
    bgImage: '',
    testMain: '',
    testOriginal: '',
  }
}

export const applyPreset = (st: SpeechStyle, i: number) => {
  st.preset = i
  st.fontColor = PRESETS[i].font
  st.borderColor = PRESETS[i].border
}

/** 预览用的文字描边 */
export const textStroke = (color: string, w: number) =>
  [`${w}px 0`, `-${w}px 0`, `0 ${w}px`, `0 -${w}px`].map((o) => `${o} 0 ${color}`).join(', ')

/** 播出延迟范围：声影同传 1-60；原文 ASR 整句 0-20；实时同传与实时流式固定为 0 */
export const delayRangeOf = (f: Pick<SpeechForm, 'mode' | 'outWordMode'>) => {
  if (f.mode === 'si') return { min: 1, max: 60, fixed: false }
  if (f.mode === 'asr' && f.outWordMode === 'sentence') return { min: 0, max: 20, fixed: false }
  return { min: 0, max: 0, fixed: true }
}

/** 建议延迟：口型+声音+字幕 20s、声音+字幕 12s、仅字幕 8s；原文 ASR 整句 10s */
export const suggestedDelay = (f: Pick<SpeechForm, 'mode' | 'outWordMode' | 'lipSync' | 'voiceOn'>) => {
  if (f.mode === 'si') return f.lipSync ? 20 : f.voiceOn ? 12 : 8
  if (f.mode === 'asr' && f.outWordMode === 'sentence') return 10
  return 0
}

/** 火山 Pipe：声影同传 si；实时同传、原文 ASR 实时流式 realtime；原文 ASR 整句 mix */
export const pipeOf = (f: Pick<SpeechForm, 'mode' | 'outWordMode'>) =>
  f.mode === 'si' ? 'si' : f.mode === 'realtime' ? 'realtime' : f.outWordMode === 'stream' ? 'realtime' : 'mix'

const toISO = (v?: string) => (v ? dayjs(v).format('YYYY-MM-DDTHH:mm:ssZ') : '')

/** 关键词库：原文:译文，逗号分隔（兼容中文标点、换行） */
export const parseGlossary = (text: string): Record<string, string> => {
  const map: Record<string, string> = {}
  for (const seg of (text || '').split(/[,，\n]/)) {
    const i = seg.search(/[:：]/)
    if (i <= 0) continue
    const k = seg.slice(0, i).trim()
    const v = seg.slice(i + 1).trim()
    if (k && v) map[k] = v
  }
  return map
}

const styleOut = (st: SpeechStyle, lang: string, rows: number, hidden: boolean, priority: number, borderAlpha: number) => {
  const op = Math.round(st.opacity) / 100
  return {
    FontColor: st.fontColor,
    Border: { Color: `${st.borderColor}@${borderAlpha}`, W: 1 },
    Box: { Color: `${st.boxColor}@${op}`, W: st.boxW, Filter: op },
    MaxCharNumber: st.maxChar,
    FontSize: st.fontSize,
    Font: st.font || 'arial',
    Language: lang,
    MaxRowNumber: rows,
    Hidden: hidden,
    ShowPriority: priority,
  }
}

/** 组装 CreateSpeechTask 的 Rule（与火山控制台提交的参数一致） */
export const buildSpeechTaskRule = (f: SpeechForm) => {
  const [start, end] = f.timeRange || []
  const pipe = pipeOf(f)
  const replaceMap: Record<string, string> = {}
  for (const p of f.replacePairs) {
    if (p.from.trim() && p.to.trim()) replaceMap[p.from.trim()] = p.to.trim()
  }
  const rule: Record<string, any> = {
    Source: { Url: f.sourceUrl.trim() },
    Output: { Url: [f.targetUrl.trim()] },
    Delay: delayRangeOf(f).fixed ? 0 : f.delay,
    Pipe: pipe,
    StartTime: toISO(start),
    EndTime: toISO(end),
  }

  if (f.mode === 'si') {
    rule.Extra = { Separator: { HandleType: f.denoise ? 1 : 0 }, AMix: { AudioEnhance: f.audioEnhance } }
    rule.SI = { LipSync: f.lipSync }
    rule.RealTime = { VoiceShow: f.voiceOn }
    const [tts, sid] = f.voiceOn && f.voiceMode === 'fixed' ? f.fixedVoice.split(':') : ['', '']
    rule.Factory = { TTS: (tts || '').trim(), SID: (sid || '').trim() }
  } else if (f.mode === 'realtime') {
    const only = f.originalMode === 'translationOnly'
    rule.Extra = { AMix: { AudioEnhance: f.audioEnhance, BGVolume: f.bgVolume / 100 }, ...(only ? { Separator: { HandleType: f.denoise ? 1 : 0 } } : {}) }
    rule.RealTime = { VoiceShow: f.voiceOn, Separator: only }
    rule.Factory = { TTS: '', SID: '' }
  } else {
    rule.Extra = {}
    rule.Factory = { TTS: '', SID: '' }
  }

  const position = { MarginLr: f.marginLr / 100, MarginTb: f.marginTb / 100 }
  if (f.mode === 'asr') {
    const hot = (f.hotWords || '').split('\n').map((s) => s.trim()).filter(Boolean)
    rule.Subtitle = {
      Position: position,
      Original: styleOut(f.transStyle, f.inputLang, f.rows, !f.subtitleOn, 0, 0.7),
      ReplaceMap: replaceMap,
      ...(hot.length ? { HotWords: hot } : {}),
      Translation: [],
    }
  } else {
    const both = f.subtitleFormat === 'both'
    const top = f.order === 'originalTop'
    const origStyle = both && !f.shareStyle ? f.origStyle : f.transStyle
    rule.Subtitle = {
      Position: position,
      // 显示优先级只由字幕排序决定（与控制台一致）：原文在上时原文 100、译文 0
      Original: styleOut(origStyle, f.inputLang, f.rows, !f.subtitleOn || !both, top ? 100 : 0, 0.7),
      GlossaryMap: parseGlossary(f.glossary),
      ReplaceMap: replaceMap,
      Translation: [styleOut(f.transStyle, f.outputLang, f.rows, !f.subtitleOn, top ? 0 : 100, 0.5)],
    }
  }
  return rule
}

/** 表单校验，返回第一条错误（与火山控制台规则一致） */
export const validateSpeechForm = (f: SpeechForm): string | null => {
  if (!f.name.trim()) return '请输入标题'
  if (!/^[一-龥A-Za-z0-9_-]{1,20}$/.test(f.name.trim())) return '标题支持中文、大小写字母、数字、-、_组合，不超过20个字符'
  const [start, end] = f.timeRange || []
  if (!start || !end) return '请选择转推时间'
  if (!dayjs(end).isAfter(dayjs(start))) return '结束时间必须晚于开始时间'
  if (!dayjs(end).isAfter(dayjs())) return '结束时间必须晚于当前时间'
  const src = f.sourceUrl.trim()
  if (!src) return '请输入源流地址'
  if (!/^rtmps?:\/\//i.test(src) && !/^https?:\/\/.+\.flv(\?|$)/i.test(src)) return '源流地址仅支持 RTMP、FLV 地址'
  const dst = f.targetUrl.trim()
  if (!dst) return '请输入转推地址'
  if (!/^rtmps?:\/\//i.test(dst)) return '转推地址仅支持 RTMP 地址'
  if (src === dst) return '转推地址不能与源流地址相同'
  const range = delayRangeOf(f)
  if (!range.fixed && (!Number.isInteger(f.delay) || f.delay < range.min || f.delay > range.max)) return `播出延迟需在 ${range.min}-${range.max}s 之间`
  if (f.mode !== 'asr' && (!f.outputLang || f.outputLang === f.inputLang)) return '请选择与输入语言不同的输出语言'
  if (f.mode === 'si' && f.voiceOn && f.voiceMode === 'fixed' && !/^[^:]+:[^:]+$/.test(f.fixedVoice.trim())) return '固定音色需为"xxx:yyy"格式，请用英文冒号分隔两段'
  if ((f.glossary || '').length > MAX_GLOSSARY) return `关键词库不能超过 ${MAX_GLOSSARY} 个字符`
  const pairs = f.replacePairs.filter((p) => p.from.trim() || p.to.trim())
  if (pairs.length > MAX_REPLACE) return `易错词最多 ${MAX_REPLACE} 个`
  if (pairs.some((p) => !p.from.trim() || !p.to.trim())) return '易错词需同时填写原词与纠正词'
  if (pairs.some((p) => p.from.length > 50 || p.to.length > 50)) return '易错词单词不超过 50 个字'
  return null
}
