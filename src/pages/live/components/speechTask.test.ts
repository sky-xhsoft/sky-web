import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { buildSpeechTaskRule, defaultSpeechForm, delayRangeOf, parseGlossary, pipeOf, suggestedDelay, validateSpeechForm, applyPreset, type SpeechForm } from './speechTask'

const base = (): SpeechForm => ({
  ...defaultSpeechForm(),
  name: 'zgbtest',
  sourceUrl: 'rtmp://example.invalid/live/src',
  targetUrl: 'rtmp://example.invalid/live/dst',
  timeRange: ['2026-10-11 15:16:07', dayjs().add(3, 'day').format('YYYY-MM-DD HH:mm:ss')],
})

// 以下期望值均来自火山控制台「新建任务」实际提交的参数
describe('buildSpeechTaskRule', () => {
  it('默认（声影同传、译文字幕）与控制台一致', () => {
    const r = buildSpeechTaskRule(base())
    expect(r.Pipe).toBe('si')
    expect(r.Delay).toBe(12)
    expect(r.Extra).toEqual({ Separator: { HandleType: 0 }, AMix: { AudioEnhance: true } })
    expect(r.SI).toEqual({ LipSync: false })
    expect(r.RealTime).toEqual({ VoiceShow: true })
    expect(r.Factory).toEqual({ TTS: '', SID: '' })
    expect(r.Subtitle.Position).toEqual({ MarginLr: 0.2, MarginTb: 0.05 })
    expect(r.Subtitle.Original).toMatchObject({ FontColor: '#ffffff', Border: { Color: '#000000@0.7', W: 1 }, Box: { Color: '#000000@0.7', W: 1, Filter: 0.7 }, MaxCharNumber: 60, FontSize: 40, Font: 'arial', Language: 'zh', MaxRowNumber: 1, Hidden: true, ShowPriority: 100 })
    expect(r.Subtitle.Translation[0]).toMatchObject({ Border: { Color: '#000000@0.5', W: 1 }, Language: 'en', Hidden: false, ShowPriority: 0 })
    expect(r.StartTime).toBe('2026-10-11T15:16:07+08:00')
  })

  it('声影同传：降噪、固定音色、口型、原文+译文、2 行、原文在下、词库', () => {
    const f = base()
    Object.assign(f, { denoise: true, voiceMode: 'fixed', fixedVoice: 'tts_model:voice_id_123', lipSync: true, subtitleFormat: 'both', rows: 2, order: 'originalBottom', glossary: '火山引擎:Volcengine,视频直播:Live', replacePairs: [{ from: 'Volcano', to: 'Volcengine' }] })
    f.delay = suggestedDelay(f)
    const r = buildSpeechTaskRule(f)
    expect(r.Delay).toBe(20)
    expect(r.Extra.Separator).toEqual({ HandleType: 1 })
    expect(r.SI).toEqual({ LipSync: true })
    expect(r.Factory).toEqual({ TTS: 'tts_model', SID: 'voice_id_123' })
    expect(r.Subtitle.Original).toMatchObject({ MaxRowNumber: 2, Hidden: false, ShowPriority: 0 })
    expect(r.Subtitle.Translation[0]).toMatchObject({ MaxRowNumber: 2, ShowPriority: 100 })
    expect(r.Subtitle.GlossaryMap).toEqual({ 火山引擎: 'Volcengine', 视频直播: 'Live' })
    expect(r.Subtitle.ReplaceMap).toEqual({ Volcano: 'Volcengine' })
  })

  it('实时同传：原声叠加 / 仅保留翻译音频', () => {
    const f = { ...base(), mode: 'realtime' as const }
    let r = buildSpeechTaskRule(f)
    expect(r.Pipe).toBe('realtime')
    expect(r.Delay).toBe(0)
    expect(r.Extra).toEqual({ AMix: { AudioEnhance: true, BGVolume: 0.2 } })
    expect(r.RealTime).toEqual({ VoiceShow: true, Separator: false })
    expect(r.SI).toBeUndefined()
    r = buildSpeechTaskRule({ ...f, originalMode: 'translationOnly', denoise: true })
    expect(r.Extra).toEqual({ AMix: { AudioEnhance: true, BGVolume: 0.2 }, Separator: { HandleType: 1 } })
    expect(r.RealTime).toEqual({ VoiceShow: true, Separator: true })
  })

  it('原文 ASR：整句为 mix、实时流式为 realtime，无译文，热词与易错词放在字幕下', () => {
    const f = { ...base(), mode: 'asr' as const, rows: 2, hotWords: '火山引擎\n声影同传\n', replacePairs: [{ from: 'Volcano', to: 'Volcengine' }] }
    f.delay = suggestedDelay(f)
    let r = buildSpeechTaskRule(f)
    expect(r.Pipe).toBe('mix')
    expect(r.Delay).toBe(10)
    expect(r.Extra).toEqual({})
    expect(r.Subtitle.Translation).toEqual([])
    expect(r.Subtitle.HotWords).toEqual(['火山引擎', '声影同传'])
    expect(r.Subtitle.ReplaceMap).toEqual({ Volcano: 'Volcengine' })
    expect(r.Subtitle.Original).toMatchObject({ MaxRowNumber: 2, Hidden: false, ShowPriority: 0 })
    r = buildSpeechTaskRule({ ...f, outWordMode: 'stream' })
    expect(r.Pipe).toBe('realtime')
    expect(r.Delay).toBe(0)
  })

  it('自适应行数为 0；关闭字幕时原文、译文均隐藏', () => {
    const r = buildSpeechTaskRule({ ...base(), rows: 0, subtitleOn: false })
    expect(r.Subtitle.Original).toMatchObject({ MaxRowNumber: 0, Hidden: true })
    expect(r.Subtitle.Translation[0]).toMatchObject({ MaxRowNumber: 0, Hidden: true })
  })

  it('预设样式', () => {
    const f = base()
    applyPreset(f.transStyle, 1)
    expect(buildSpeechTaskRule(f).Subtitle.Translation[0]).toMatchObject({ FontColor: '#0C0D0E', Border: { Color: '#ffffff@0.5', W: 1 } })
    applyPreset(f.transStyle, 2)
    expect(buildSpeechTaskRule(f).Subtitle.Translation[0]).toMatchObject({ FontColor: '#ffffff', Border: { Color: '#4EA6FF@0.5', W: 1 } })
  })
})

describe('延迟与校验', () => {
  it('延迟范围与建议值', () => {
    expect(delayRangeOf({ mode: 'si', outWordMode: 'sentence' })).toEqual({ min: 1, max: 60, fixed: false })
    expect(delayRangeOf({ mode: 'asr', outWordMode: 'sentence' })).toEqual({ min: 0, max: 20, fixed: false })
    expect(delayRangeOf({ mode: 'realtime', outWordMode: 'sentence' }).fixed).toBe(true)
    expect(suggestedDelay({ mode: 'si', outWordMode: 'sentence', lipSync: false, voiceOn: false })).toBe(8)
    expect(pipeOf({ mode: 'asr', outWordMode: 'stream' })).toBe('realtime')
  })

  it('校验规则', () => {
    expect(validateSpeechForm(base())).toBeNull()
    expect(validateSpeechForm({ ...base(), name: 'bad name!' })).toContain('标题')
    expect(validateSpeechForm({ ...base(), sourceUrl: 'http://x/a.m3u8' })).toContain('RTMP、FLV')
    expect(validateSpeechForm({ ...base(), sourceUrl: 'https://x/live/a.flv' })).toBeNull()
    expect(validateSpeechForm({ ...base(), targetUrl: 'http://x/a' })).toContain('RTMP')
    expect(validateSpeechForm({ ...base(), voiceMode: 'fixed', fixedVoice: 'abc' })).toContain('xxx:yyy')
    expect(validateSpeechForm({ ...base(), delay: 61 })).toContain('1-60')
    expect(validateSpeechForm({ ...base(), outputLang: 'zh' })).toContain('输出语言')
    expect(validateSpeechForm({ ...base(), replacePairs: [{ from: 'a', to: '' }] })).toContain('易错词')
    expect(validateSpeechForm({ ...base(), timeRange: ['2020-01-01 00:00:00', '2020-01-02 00:00:00'] })).toContain('当前时间')
  })

  it('关键词库解析兼容中文标点', () => {
    expect(parseGlossary('火山引擎：Volcengine，视频直播:Live\n坏数据')).toEqual({ 火山引擎: 'Volcengine', 视频直播: 'Live' })
  })
})
