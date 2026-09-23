<template>
  <a-modal
    :visible="visible"
    :title="title"
    width="1280px"
    :body-style="{ maxHeight: 'calc(92vh - 120px)', overflow: 'auto', padding: '18px 22px' }"
    :ok-text="okText"
    :cancel-text="t('common.cancel')"
    :confirm-loading="submitting"
    :on-before-ok="handleSubmit"
    :wrap-class-name="'speech-modal-page'"
    @cancel="handleCancel"
  >
    <a-form :model="form" layout="vertical" size="small" class="speech-form">
      <div class="modal-cfg-layout">
        <!-- 左栏: 基础任务字段 -->
        <div class="modal-left">
          <a-form-item :label="t('speechTask.name')" required>
            <a-input v-model="form.name" :max-length="20" allow-clear :placeholder="t('speechTask.namePlaceholder')" />
          </a-form-item>

          <a-form-item :label="t('speechTask.mode')" required>
            <a-radio-group v-model="form.mode" type="button">
              <a-radio value="mix">
                <a-tooltip :content="t('speechTask.modeMixDesc')"><span>{{ t('speechTask.modeMix') }}</span></a-tooltip>
              </a-radio>
              <a-radio value="si">
                <a-tooltip :content="t('speechTask.modeSiDesc')"><span>{{ t('speechTask.modeSi') }}</span></a-tooltip>
              </a-radio>
              <a-radio value="realtime">
                <a-tooltip :content="t('speechTask.modeRealtimeDesc')"><span>{{ t('speechTask.modeRealtime') }}</span></a-tooltip>
              </a-radio>
            </a-radio-group>
          </a-form-item>

          <a-form-item :label="t('speechTask.relayTime')" required>
            <a-range-picker v-model="form.timeRange" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
          </a-form-item>

          <a-form-item :label="t('speechTask.sourceUrl')" required>
            <a-input :model-value="String(form.sourceUrl || '')" disabled :placeholder="t('speechTask.sourceUrlPlaceholder')" />
            <div class="form-tip">{{ t('speechTask.srcSelectTip', { name: record && record.roomName ? record.roomName : '' }) }}</div>
          </a-form-item>

          <a-form-item :label="t('speechTask.targetUrl')" required>
            <a-select v-model="form.targetUrl" allow-clear :placeholder="t('speechTask.targetUrlPlaceholder')" @change="onTargetChange">
                          <a-option v-for="r in notEndedRooms" :key="'t'+r.id" :value="String(r.id)">{{ r.roomName || ('直播间'+r.id) }}</a-option>
                        </a-select>
            <div class="form-tip">{{ t('speechTask.tgtSelectTip') }}</div>
          </a-form-item>

          <a-form-item v-if="form.mode === 'si'" :label="t('speechTask.delay')">
            <a-input-number v-model="form.delay" :min="1" :max="300" style="width: 120px"><template #suffix>s</template></a-input-number>
            <div class="form-tip">{{ t('speechTask.delayTip') }}</div>
          </a-form-item>

          <a-form-item :label="t('speechTask.inputLang')" required>
                      <a-select v-model="form.inputLang">
                        <a-option v-for="o in LANG_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</a-option>
                      </a-select>
                    </a-form-item>

                    <a-form-item v-if="form.mode !== 'mix'" :label="t('speechTask.outputLangs')">
            <a-select v-model="form.outputLangs" multiple :max-tag-count="3" allow-clear>
              <a-option v-for="o in otherLangs" :key="o.value" :value="o.value">{{ o.label }}</a-option>
            </a-select>
            <div class="form-tip">{{ t('speechTask.outputLangsTip') }}</div>
          </a-form-item>

          <a-form-item :label="t('speechTask.subtitleEnabled')">
            <a-switch v-model="form.subtitleEnabled" type="round" />
          </a-form-item>
        </div>

        <!-- 右栏: 字幕配置 + 预览 -->
        <div class="modal-right" v-if="form.subtitleEnabled">
          <div class="right-title">{{ t('speechTask.subtitleConfig') }}</div>
          <div class="subtitle-cfg-layout">
            <!-- 左: 配置字段 -->
            <div class="subtitle-cfg-fields">
              <div class="subtitle-cfg-grid">

                <!-- 出字方式(仅字幕模式显示) -->
                <div class="cfg-item cfg-full" v-if="form.mode === 'mix'">
                  <span class="cfg-label">{{ t('speechTask.outWordMode') }}</span>
                  <a-radio-group v-model="form.outWordMode" type="button" size="small">
                    <a-radio value="sentence">{{ t('speechTask.outWordSentence') }}</a-radio>
                    <a-radio value="realtime">{{ t('speechTask.outWordRealtime') }}</a-radio>
                  </a-radio-group>
                </div>

                <div class="cfg-item" v-if="form.mode !== 'mix'">
                  <span class="cfg-label">{{ t('speechTask.subFormat') }}</span>
                  <a-radio-group v-model="form.subtitleFormat" type="button" size="small">
                    <a-radio value="both">{{ t('speechTask.subFormatBoth') }}</a-radio>
                    <a-radio value="translation" :disabled="form.mode === 'mix'">{{ t('speechTask.subFormatTranslation') }}</a-radio>
                  </a-radio-group>
                </div>

                <div class="cfg-item">
                  <span class="cfg-label">{{ t('speechTask.subRows') }}</span>
                  <a-radio-group v-model="form.subtitleRows" type="button" size="small">
                    <a-radio :value="1">1</a-radio>
                    <a-radio :value="2">2</a-radio>
                    <a-radio :value="0">{{ t('speechTask.subRowsAuto') }}</a-radio>
                  </a-radio-group>
                </div>

                <div class="cfg-item">
                  <span class="cfg-label">{{ t('speechTask.marginLr') }}</span>
                  <a-input-number v-model="form.marginLr" :min="0" :max="40" size="small" style="width: 110px"><template #suffix>%</template></a-input-number>
                </div>

                <div class="cfg-item">
                  <span class="cfg-label">{{ t('speechTask.marginTb') }}</span>
                  <a-input-number v-model="form.marginTb" :min="0" :max="90" size="small" style="width: 110px"><template #suffix>%</template></a-input-number>
                </div>

                <div class="cfg-group-title cfg-full">{{ t('speechTask.subStyleGroup') }}</div>

                <div class="cfg-item">
                  <span class="cfg-label">{{ t('speechTask.bgColor') }}</span>
                  <div class="color-row">
                    <input type="color" v-model="form.fontBGColor" class="color-input" />
                    <a-input v-model="form.fontBGColor" size="small" style="width: 92px" />
                  </div>
                </div>

                <div class="cfg-item">
                  <span class="cfg-label">{{ t('speechTask.fontColor') }}</span>
                  <div class="color-row">
                    <input type="color" v-model="form.fontColor" class="color-input" />
                    <a-input v-model="form.fontColor" size="small" style="width: 92px" />
                  </div>
                </div>

                <div class="cfg-item">
                  <span class="cfg-label">{{ t('speechTask.textEffect') }}</span>
                  <div class="effect-row">
                    <a-checkbox v-model="form.fontBold">{{ t('speechTask.bold') }}</a-checkbox>
                    <a-checkbox v-model="form.fontShadow">{{ t('speechTask.shadow') }}</a-checkbox>
                  </div>
                </div>

                <div class="cfg-item">
                  <span class="cfg-label">{{ t('speechTask.fontSize') }}</span>
                  <a-input-number v-model="form.fontSize" :min="8" :max="72" size="small" style="width: 100px" />
                </div>

                <div class="cfg-item">
                                  <span class="cfg-label">{{ t('speechTask.fontFamily') }}</span>
                                  <a-select v-model="form.fontFamily" size="small" allow-search style="width: 150px">
                                    <a-option value="arial">Arial</a-option>
                                  </a-select>
                                </div>

                <div class="cfg-item">
                  <span class="cfg-label">{{ t('speechTask.maxChar') }}</span>
                  <a-input-number v-model="form.maxCharNumber" :min="10" :max="200" size="small" style="width: 100px" />
                  <div class="cfg-tip">{{ t('speechTask.maxCharTip') }}</div>
                </div>

                <div class="cfg-item cfg-full" v-if="form.mode === 'mix' && form.outWordMode === 'realtime'">
                  <span class="cfg-tip">{{ t('speechTask.realtimeTip') }}</span>
                </div>

                <div class="cfg-item cfg-full">
                  <span class="cfg-label">{{ t('speechTask.glossaryMap') }}</span>
                  <a-textarea v-model="form.glossaryMap" :placeholder="t('speechTask.glossaryMapPlaceholder')" :max-length="30000" :auto-size="{ minRows: 2, maxRows: 3 }" />
                </div>

                <div class="cfg-item cfg-full">
                  <span class="cfg-label">{{ t('speechTask.replaceMap') }}</span>
                  <a-textarea v-model="form.replaceMap" :placeholder="t('speechTask.replaceMapPlaceholder')" :max-length="500" :auto-size="{ minRows: 2, maxRows: 3 }" />
                </div>
              </div>
            </div>

            <!-- 右: 实时预览 -->
            <div class="subtitle-cfg-preview">
              <div class="preview-head">
                <div class="preview-label">{{ t('speechTask.preview') }}</div>
                <a-button size="mini" @click="triggerBgUpload">{{ form.bgImage ? t('speechTask.changeBg') : t('speechTask.uploadBg') }}</a-button>
                <input ref="bgFileInput" type="file" accept="image/*" style="display:none" @change="onBgUpload" />
              </div>
              <div class="preview-res-select">
                <span class="preview-label">{{ t('speechTask.previewTip') }}</span>
                <a-select v-model="form.sourceResolution" size="small" style="width: 190px">
                  <a-option value="1920x1080">1920 × 1080 (16:9)</a-option>
                  <a-option value="1280x720">1280 × 720 (16:9)</a-option>
                  <a-option value="720x1280">720 × 1280 (9:16)</a-option>
                  <a-option value="1080x1920">1080 × 1920 (9:16)</a-option>
                </a-select>
              </div>
              <div class="preview-stage">
                <div class="canvasWrap" :style="stageStyle">
                  <canvas ref="previewCanvas" :width="srcW" :height="srcH" class="canvas-core"></canvas>
                  <div class="preview-watermark">{{ previewClock }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, nextTick, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import api from '../../../api/http'
import { listDomains, generatePushURLByRoom } from '../../../api/live'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'

const { t } = useI18n()

const LANG_OPTIONS = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'es', label: 'Español' }
]

const props = defineProps<{
  visible: boolean
  record: any
  title: string
  okText?: string
}>()
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'success'): void
  (e: 'cancel'): void
}>()

const submitting = ref(false)
const liveRooms = ref<any[]>([])
const playDomain = ref('')
const pushDomain = ref('')
const loadLiveRooms = async () => {
  try {
    const [roomRes, domRes] = await Promise.all([
      api.post('/data/LIVE_ROOM/query', { page: 1, pageSize: 100, keyword: '', filters: { IS_ACTIVE: 'Y' } }),
      listDomains(undefined)
    ])
    const rooms = roomRes.data?.data?.data || []
    liveRooms.value = (Array.isArray(rooms) ? rooms : []).map((it: any) => ({
      id: it.ID,
      roomName: it.ROOM_NAME || '',
      streamName: it.STREAM_NAME || String(it.ID || ''),
      status: it.STATUS || 'draft',
      endTime: it.END_TIME || ''
    }))
    const ds = domRes.data?.data?.domains || []
        const play = (Array.isArray(ds) ? ds : []).find((d: any) => d.Type === 1)
        playDomain.value = play?.Name || ''
        const push = (Array.isArray(ds) ? ds : []).find((d: any) => d.Type === 0)
        pushDomain.value = push?.Name || ''
  } catch (error: any) {
    console.error('加载直播间失败:', error)
  }
}
const roomRtmp = (r: any) => {
  if (!r.streamName) return ''
  return `rtmp://${playDomain.value || 'play.local'}/live/${r.streamName}`
}
const onSourcePicked = (v: string) => {
  // 用户可从下游选源, 不留空
}
const notEndedRooms = computed(() => {
  const curId = props.record?.id
  return liveRooms.value.filter(r => r.status !== 'ended' && Number(r.id) !== Number(curId))
})
// 选择目标直播间后，调用后端接口获取该直播间的推流地址
const onTargetChange = async (roomId: string | number | undefined | null) => {
  if (roomId === undefined || roomId === null || roomId === '') {
    form.targetUrl = ''
    return
  }
  try {
    const resp: any = await generatePushURLByRoom(roomId)
    const data = resp?.data?.data || resp?.data
    const pushUrl = data?.pushUrl || ''
    form.targetUrl = pushUrl || String(roomId)
    if (!pushUrl) {
      Message.warning('未获取到推流地址，请检查推流域名配置')
    }
  } catch (e: any) {
    console.error('获取推流地址失败:', e)
    Message.error('获取推流地址失败')
  }
}
onMounted(loadLiveRooms)

const bgFileInput = ref<HTMLInputElement | null>(null)
const triggerBgUpload = () => bgFileInput.value?.click()
const onBgUpload = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input?.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    form.bgImage = String(reader.result || '')
    input.value = ''
  }
  reader.readAsDataURL(file)
}

const defaultForm = () => ({
  name: '',
  mode: 'mix',
  timeRange: [] as any[],
  sourceUrl: '',
  targetUrl: '',
  delay: 12,
  inputLang: 'zh',
  outputLangs: ['en'] as string[],
  subtitleEnabled: true,
  // ---- 字幕配置 ----
  subtitleFormat: 'both',
  subtitleRows: 1,
  sourceResolution: '1920x1080',
  subtitleOrder: 'originalTop',
  bgImage: '',
  outWordMode: 'sentence',
  fontBGColor: '#000000',
  fontBold: false,
  fontShadow: false,
  marginLr: 2,
  marginTb: 5,
  fontSize: 24,
  fontFamily: 'arial',
  fontColor: '#FFFFFF',
  maxCharNumber: 50,
  glossaryMap: '',
  replaceMap: ''
})

const form = reactive(defaultForm())

// ---- 字幕实时预览 ----
const previewOriginal = '你好，欢迎来到直播间 Volcengine Live'
const previewTransPrefix: Record<string, string> = {
  en: 'Hello! Welcome to the live room.',
  ja: 'こんにちは、ライブルームへようこそ。',
  ko: '안녕하세요, 라이브 룸에 오신 것을 환영합니다.',
  es: '¡Hola! Bienvenidos a la sala en vivo.',
  zh: '你好，欢迎来到直播间'
}
const previewClock = computed(() => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
})
const previewTranslation = (lang: string) => previewTransPrefix[lang] || `[${lang}] live subtitle sample text`

const videoBgStyle = computed(() => {
  if (form.bgImage) {
    return { backgroundImage: `url(${form.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  return { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }
})
// 预览画布按源流尺寸变化: 固定宽度, 高度按比例
const previewCanvasW = computed(() => {
  const [w, h] = (form.sourceResolution || '1920x1080').split('x')
  const ratio = Number(h) / Number(w)
  // 高度控制在 150~320px 之间, 宽度自适应
  const maxH = 320
  const wpx = ratio >= 1 ? 190 : 320  // 竖屏窄, 横屏宽
  return wpx + 'px'
})
const RES_OPTIONS = [
  { label: '1920×1080 (16:9)', value: '1920x1080' },
  { label: '1280×720 (16:9)', value: '1280x720' },
  { label: '720×1280 (9:16)', value: '720x1280' },
  { label: '1080×1920 (9:16)', value: '1080x1920' }
]
const srcDims = computed(() => {
  const [w, h] = (form.sourceResolution || '1920x1080').split('x')
  return { w: Number(w) || 1920, h: Number(h) || 1080 }
})
const srcW = computed(() => srcDims.value.w)
const srcH = computed(() => srcDims.value.h)
const previewCanvas = ref<HTMLCanvasElement | null>(null)
const drawPreview = () => {
  const cv = previewCanvas.value
  if (!cv) return
  const ctx = cv.getContext('2d')
  if (!ctx) return
  const W = srcW.value, H = srcH.value
  ctx.clearRect(0, 0, W, H)
  // 背景
  if (form.bgImage) {
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, W, H)
      drawSubs(ctx, W, H)
    }
    img.src = form.bgImage
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#1a1a2e')
    g.addColorStop(0.6, '#16213e')
    g.addColorStop(1, '#0f3460')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    drawSubs(ctx, W, H)
  }
}
const drawSubs = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  const px = W / 1920 // 按源流基准缩放
  const hasBg = form.fontBGColor && form.fontBGColor !== '#000000' && form.fontBGColor !== 'transparent'
  ctx.font = `${form.fontBold ? '700' : '400'} ${Math.round(form.fontSize * px)}px ${form.fontFamily || 'arial'}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const lineH = form.fontSize * px * 1.5
  const offX = (form.marginLr / 100) * W
  const bottomY = H - (form.marginTb / 100) * H - lineH / 2
  const drawLine = (text: string, yy: number, translate: boolean) => {
    if (hasBg) {
      const tw = ctx.measureText(text).width
      const pad = 12 * px
      ctx.fillStyle = form.fontBGColor
      ctx.beginPath()
      roundRect(ctx, W / 2 - tw / 2 - pad, yy - lineH / 2 + lineH * 0.15, tw + pad * 2, lineH * 0.8, 6 * px)
      ctx.fill()
    }
    ctx.fillStyle = form.fontColor || '#FFFFFF'
    ctx.shadowColor = form.fontShadow ? 'rgba(0,0,0,0.8)' : 'transparent'
    ctx.shadowBlur = form.fontShadow ? 8 * px : 0
    ctx.fillText(text, W / 2, yy)
    ctx.shadowBlur = 0
  }
  if (form.mode === 'mix') {
    // 仅字幕: 单条原文字幕居中大字号
    const yy = form.outWordMode === 'realtime' ? Math.max(H * 0.08, H * 0.92 - bottomY) : bottomY
    ctx.font = `${form.fontBold ? '700' : '400'} ${Math.round(form.fontSize * 1.2 * px)}px ${form.fontFamily || 'arial'}`
    const yyFinal = form.outWordMode === 'realtime' ? H * 0.15 : bottomY
    drawLine(previewOriginal, yyFinal, false)
  } else if (form.subtitleFormat === 'both') {
    const origY = form.subtitleOrder === 'originalTop' ? bottomY - lineH : bottomY
    const transY = form.subtitleOrder === 'originalTop' ? bottomY : bottomY - lineH
    drawLine(previewOriginal, origY, false)
    const langs = (form.outputLangs || ['en'])
    ctx.font = `${Math.round(form.fontSize * 0.9 * px)}px ${form.fontFamily || 'arial'}`
    drawLine(langs.map((l: string) => previewTranslation(l)).join('  '), transY, false)
  } else {
    // 仅译文
    const langs = (form.outputLangs || ['en'])
    ctx.font = `${Math.round(form.fontSize * px)}px ${form.fontFamily || 'arial'}`
    drawLine(langs.map((l: string) => previewTranslation(l)).join('  '), bottomY, false)
  }
}
const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
watch(
  () => [form.mode, form.subtitleFormat, form.subtitleOrder, form.sourceResolution, form.bgImage,
    form.outWordMode, form.fontBGColor, form.fontColor, form.fontBold, form.fontShadow,
    form.fontSize, form.fontFamily, form.marginLr, form.marginTb, JSON.stringify(form.outputLangs)],
  () => { nextTick(drawPreview) },
  { deep: false }
)
const stageStyle = computed(() => {
  const [w, h] = (form.sourceResolution || '1920x1080').split('x')
  const nw = Number(w), nh = Number(h)
  const ratio = nh / nw
  // 横屏/竖屏按分辨率分级宽度, 让不同分辨率切换有可见大小差; 高度严格按宽高比
  const longSide = Math.max(nw, nh)
  let bw
  if (ratio < 1) {
    bw = longSide >= 1920 ? 340 : longSide >= 1280 ? 300 : 250   // 横屏 (高<宽)
  } else {
    bw = longSide >= 1920 ? 210 : longSide >= 1280 ? 185 : 155   // 竖屏
  }
  const bh = Math.round(bw * ratio)
  return { width: bw + 'px', height: bh + 'px', margin: '0 auto' }
})
const subtitleBase = (fontK: number) => {
  const hasBg = form.fontBGColor && form.fontBGColor !== '#000000' && form.fontBGColor !== 'transparent'
  return {
    fontSize: fontK + 'px',
    color: form.fontColor || '#FFFFFF',
    fontFamily: form.fontFamily || 'arial',
    fontWeight: form.fontBold ? 700 : 400,
    textShadow: form.fontShadow ? '0 0 6px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)' : 'none',
    background: hasBg ? form.fontBGColor : 'transparent',
    padding: hasBg ? '1px 8px' : '0',
    borderRadius: '4px',
    lineHeight: '1.3'
  } as Record<string, any>
}
const subLineStyle = (kind: 'orig' | 'trans') => {
  const sizeBase = kind === 'orig' ? Math.max(10, Math.min(20, form.fontSize / 2.4)) : Math.max(9, Math.min(18, form.fontSize / 2.8))
  const fs = Math.round(sizeBase)
  const topPos = form.marginTb >= 50
  return {
    ...subtitleBase(fs),
    marginLeft: form.marginLr + '%',
    marginRight: form.marginLr + '%',
    [topPos ? 'top' : 'bottom']: (topPos ? 90 - form.marginTb : form.marginTb) + '%',
    maxHeight: '1.6em',
    overflow: 'hidden'
  } as Record<string, any>
}
const mixLineStyle = computed(() => {
  const fs = Math.round(Math.max(16, Math.min(34, form.fontSize * 0.95)))
  return { ...subtitleBase(fs) } as Record<string, any>
})
const mixLinePos = computed(() => {
  if (form.outWordMode === 'realtime') {
    return { top: `${Math.max(5, 90 - form.marginTb)}%`, transform: 'translateY(0)' }
  }
  return { bottom: `${Math.max(5, form.marginTb)}%`, transform: 'translateY(0)' }
})

const otherLangs = computed(() => LANG_OPTIONS.filter(o => o.value !== form.inputLang))

watch(
  () => props.visible,
  (v) => {
    if (v) {
      Object.assign(form, defaultForm())
      const rec = props.record
      if (rec) {
        form.name = rec.roomName ? `${rec.roomName}-同传` : ''
                // 源地址(拉流)默认用该直播间的播放流 RTMP 地址
                const streamName = String(rec.id || '')
                const sourceRtmp = playDomain.value ? `rtmp://${playDomain.value}/live/${streamName}` : (props.record.sourceUrlHint || '')
                form.sourceUrl = sourceRtmp
                if (props.record.targetUrlHint) form.targetUrl = props.record.targetUrlHint
        const now = dayjs()
        form.timeRange = [now.format('YYYY-MM-DD HH:mm:ss'), now.add(1, 'hour').format('YYYY-MM-DD HH:mm:ss')]
      }
    }
  }
)

const buildPayload = () => {
  const [start, end] = form.timeRange || []
  const hasSubBg = form.fontBGColor && form.fontBGColor !== '#000000' && form.fontBGColor !== 'transparent'
  return {
    name: form.name,
    roomId: props.record?.id,
    roomName: props.record?.roomName,
    rule: {
      pipe: form.mode === 'mix' && form.outWordMode === 'realtime' ? 'realtime' : form.mode,
      delay: form.delay,
      source: { url: form.sourceUrl },
      startTime: start ? dayjs(start).format('YYYY-MM-DDTHH:mm:ss+08:00') : '',
      endTime: end ? dayjs(end).format('YYYY-MM-DDTHH:mm:ss+08:00') : '',
      output: { url: Array.isArray(form.targetUrl) ? form.targetUrl.filter(Boolean) : form.targetUrl ? [form.targetUrl] : [] },
      si: form.mode === 'si' ? { lipSync: true } : undefined,
      realTime: form.mode === 'realtime' ? { voiceShow: true } : undefined,
      subtitle: form.subtitleEnabled
        ? {
            position: {
              relative: form.marginTb >= 50 ? 'top' : 'bottom',
              marginTb: form.marginTb / 100,
              marginLr: form.marginLr / 100
            },
            original: {
              language: form.inputLang,
              fontSize: form.fontSize,
              fontColor: form.fontColor,
              font: form.fontFamily,
              maxRowNumber: form.subtitleRows,
              maxCharNumber: form.maxCharNumber,
              hidden: form.subtitleFormat === 'translation',
              showPriority: form.subtitleOrder === 'originalTop' ? 1 : 2,
              box: hasSubBg ? { color: form.fontBGColor } : undefined
            },
            translation: form.mode !== 'mix' ? (form.outputLangs || []).map((lang: string, idx: number) => ({
                          language: lang,
                          fontSize: form.fontSize,
                          fontColor: form.fontColor,
                          font: form.fontFamily,
                          maxRowNumber: form.subtitleRows,
                          maxCharNumber: form.maxCharNumber,
                          showPriority: form.subtitleOrder === 'originalTop' ? idx + 2 : idx + 1
                        })) : undefined
          }
        : undefined,
      glossaryMap: parseGlossary(form.glossaryMap),
      replaceMap: parseGlossary(form.replaceMap)
    }
  }
}

const parseGlossary = (text: string): Record<string, string> => {
  const map: Record<string, string> = {}
  if (!text) return map
  text.split(/[,\n，]/).forEach(seg => {
    const parts = seg.split(/[:：]/)
    if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
      map[parts[0].trim()] = parts[1].trim()
    }
  })
  return map
}

const validate = (): string | null => {
  if (!form.name.trim()) return t('speechTask.nameRequired')
  if (!form.timeRange || form.timeRange.length < 2) return t('speechTask.relayTimeRequired')
  if (!form.sourceUrl.trim()) return t('speechTask.sourceUrlRequired')
  const tgtOk = Array.isArray(form.targetUrl) ? form.targetUrl.some(x => x && String(x).trim()) : Boolean(String(form.targetUrl || '').trim())
  if (!tgtOk) return t('speechTask.targetUrlRequired')
  return null
}

const handleSubmit = async (): Promise<boolean> => {
  const err = validate()
  if (err) {
    Message.warning(err)
    return false
  }
  submitting.value = true
  try {
    const payload = buildPayload()
    const resp = await api.post('/live/speech-tasks', payload)
    if (resp.data && (resp.data.code === 0 || resp.data.success)) {
      Message.success(t('speechTask.createSuccess'))
      emit('success')
      emit('update:visible', false)
      return true
    }
    Message.error(resp.data?.message || t('speechTask.createFailed'))
    return false
  } catch (e: any) {
    Message.error(e?.response?.data?.message || t('speechTask.createFailed'))
    return false
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  emit('update:visible', false)
  emit('cancel')
}
</script>

<style scoped>
.modal-cfg-layout {
  display: flex;
  gap: 20px;
  width: 100%;
  align-items: flex-start;
}
.modal-left {
  flex: 0 0 400px;
  max-width: 420px;
  min-width: 0;
}
.modal-right {
  flex: 1;
  max-width: 860px;
  min-width: 0;
  border-left: 1px solid var(--color-border-2, #e5e6eb);
  padding-left: 20px;
}
.right-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1d2129);
  margin-bottom: 12px;
}
.subtitle-cfg-layout {
  display: flex;
  gap: 16px;
  width: 100%;
}
.subtitle-cfg-fields {
  flex: 1.15;
  min-width: 0;
}
.subtitle-cfg-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
}
.cfg-item {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 4px;
}
.cfg-label {
  font-size: 12px;
  color: var(--text-secondary, #4e5969);
  white-space: nowrap;
}
.cfg-tip {
  font-size: 11px;
  color: var(--text-tertiary, #86909c);
}
.cfg-full {
  grid-column: 1 / -1;
}
.cfg-group-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, #1d2129);
  border-bottom: 1px solid var(--color-border-2, #e5e6eb);
  padding-bottom: 4px;
  margin-top: 4px;
}
.color-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.color-input {
  width: 32px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--color-border-2, #e5e6eb);
  border-radius: 4px;
  background: none;
  cursor: pointer;
}
.effect-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
.subtitle-cfg-preview {
  flex: 1.2;
  min-width: 0;
  border: 1px solid var(--color-border-2, #e5e6eb);
  border-radius: 8px;
  padding: 10px;
  background: var(--color-fill-1, #f7f8fa);
}
.preview-res-select {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}
.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.preview-label {
  font-size: 12px;
  color: var(--text-secondary, #4e5969);
}
.preview-stage {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.preview-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.preview-meta {
  color: #86909c;
  font-size: 12px;
  font-family: monospace;
}
.canvasWrap {
  position: relative;
  margin: 0 auto;
  background: #000;
  border-radius: 6px;
  overflow: hidden;
}
.canvas-core {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: fill;
}
.preview-watermark {
  position: absolute;
  top: 8px;
  right: 10px;
  color: rgba(255,255,255,0.5);
  font-size: 12px;
  font-family: monospace;
}
.subtitle-line {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  padding: 2px 0;
  z-index: 2;
}
.orig-line { margin-bottom: 2px; }
.trans-line { margin-top: 2px; opacity: 0.95; }
.mix-line {
  left: 10%;
  right: 10%;
  text-align: center;
  font-weight: 700;
  z-index: 2;
}
.mix-note {
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}
.form-tip {
  font-size: 12px;
  color: var(--text-tertiary, #86909c);
  margin-top: 2px;
}
</style>