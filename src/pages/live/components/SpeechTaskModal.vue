<template>
  <a-modal
    :visible="visible"
    :title="title || '新建字幕同传任务'"
    width="1180px"
    :body-style="{ maxHeight: 'calc(92vh - 120px)', overflow: 'auto', padding: '16px 24px' }"
    :mask-closable="false"
    unmount-on-close
    @cancel="handleCancel"
  >
    <div class="stm">
      <!-- ==================== 基本配置 ==================== -->
      <div class="stm-section-title">基本配置</div>
      <div class="stm-grid2">
        <div class="stm-field">
          <label class="stm-label stm-req" for="stm-name">标题</label>
          <a-input id="stm-name" v-model="form.name" placeholder="请输入标题" :max-length="20" show-word-limit allow-clear />
          <div class="stm-tip">支持中文、大小写字母、数字、-、_组合，不超过20个字符</div>
        </div>
        <div class="stm-field">
          <span class="stm-label stm-req">转推时间</span>
          <a-range-picker v-model="form.timeRange" show-time format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" :disabled-date="isPastDate" style="width: 100%" />
        </div>
      </div>

      <div class="stm-field">
        <span class="stm-label stm-req">直播地址</span>
        <a-input v-model="form.sourceUrl" placeholder="请输入拉流地址" allow-clear>
          <template #prepend>源流地址</template>
        </a-input>
        <div class="stm-tip">需要拉取的原始流地址，支持 RTMP、FLV 地址{{ record?.roomName ? `，默认为直播间「${record.roomName}」的播放地址` : '' }}</div>
        <a-input v-model="form.targetUrl" placeholder="请输入转推的推流地址" allow-clear class="stm-mt8">
          <template #prepend>转推地址</template>
          <template #append>
            <a-select v-model="targetRoomId" placeholder="从直播间选择" allow-clear :style="{ width: '170px' }" :bordered="false" @change="onTargetRoomChange">
              <a-option v-for="r in targetRooms" :key="r.id" :value="String(r.id)">{{ r.roomName || `直播间${r.id}` }}</a-option>
            </a-select>
          </template>
        </a-input>
        <div class="stm-tip">同传后转推的地址，支持 RTMP 地址；也可以从直播间选择，自动生成其推流地址</div>
      </div>

      <div class="stm-field">
        <span class="stm-label stm-req">选择模式</span>
        <div class="stm-modes" role="radiogroup" aria-label="选择模式">
          <button
            v-for="m in MODES"
            :key="m.value"
            type="button"
            role="radio"
            :aria-checked="form.mode === m.value"
            class="stm-mode"
            :class="{ 'is-active': form.mode === m.value }"
            @click="setMode(m.value)"
          >
            <span class="stm-mode-title">{{ m.title }}</span>
            <span class="stm-mode-desc">{{ m.desc }}</span>
          </button>
        </div>
      </div>

      <div class="stm-field">
        <label class="stm-label stm-req" for="stm-delay">播出延迟</label>
        <a-input-number id="stm-delay" v-model="form.delay" :min="delayRange.min" :max="delayRange.max" :disabled="delayRange.fixed" :precision="0" @change="form.delayTouched = true">
          <template #suffix>s</template>
        </a-input-number>
        <div v-if="form.mode === 'si'" class="stm-tip">
          声影同传下处理延迟时长，支持输入 1-60s；
          <ul class="stm-tip-list">
            <li>口型、声音、字幕建议输入 20s；</li>
            <li>声音、字幕建议输入 12s；</li>
            <li>仅字幕建议输入 8s；</li>
          </ul>
        </div>
        <div v-else-if="delayRange.fixed" class="stm-tip">{{ form.mode === 'realtime' ? '实时同传' : '实时流式出字' }}无需播出延迟</div>
        <div v-else class="stm-tip">原文 ASR 字幕处理延迟时长，支持输入 0-20s</div>
      </div>

      <div class="stm-field">
        <span class="stm-label stm-req">{{ form.mode === 'asr' ? '原文语言' : '翻译语言' }}</span>
        <div class="stm-langs">
          <a-select v-model="form.inputLang" class="stm-lang" @change="onInputLangChange">
            <template #prefix>输入 |</template>
            <a-option v-for="o in INPUT_LANGS" :key="o.value" :value="o.value">{{ o.label }}</a-option>
          </a-select>
          <template v-if="form.mode !== 'asr'">
            <a-tooltip content="交换输入、输出语言">
              <a-button shape="circle" :disabled="!canSwap" aria-label="交换输入、输出语言" @click="swapLangs"><icon-swap /></a-button>
            </a-tooltip>
            <a-select v-model="form.outputLang" class="stm-lang">
              <template #prefix>输出 |</template>
              <a-option v-for="o in outputLangOptions" :key="o.value" :value="o.value">{{ o.label }}</a-option>
            </a-select>
          </template>
        </div>
        <div class="stm-tip">{{ form.mode === 'asr' ? '选择直播输入语言' : '选择直播输入语言和输出语言' }}</div>
      </div>

      <!-- 数字人口型：声影同传 -->
      <div v-if="form.mode === 'si'" class="stm-card">
        <div class="stm-card-head">
          <span class="stm-label stm-req">数字人口型</span>
          <a-switch v-model="form.lipSync" aria-label="数字人口型" @change="applySuggestedDelay" />
        </div>
      </div>

      <!-- 同传声音：声影同传、实时同传 -->
      <div v-if="form.mode !== 'asr'" class="stm-card">
        <div class="stm-card-head">
          <span class="stm-label stm-req">同传声音</span>
          <a-switch v-model="form.voiceOn" aria-label="同传声音" @change="applySuggestedDelay" />
        </div>
        <div v-if="form.voiceOn" class="stm-card-body">
          <div class="stm-row">
            <span class="stm-row-label">音色配置</span>
            <div class="stm-row-ctl">
              <a-radio-group v-model="form.voiceMode">
                <a-radio value="auto">自动复制</a-radio>
                <a-radio v-if="form.mode === 'si'" value="fixed">固定音色</a-radio>
              </a-radio-group>
              <a-input v-if="form.mode === 'si' && form.voiceMode === 'fixed'" v-model="form.fixedVoice" placeholder="请输入固定音色" class="stm-voice" />
            </div>
          </div>
          <template v-if="form.mode === 'realtime'">
            <div class="stm-row">
              <span class="stm-row-label">原声配置</span>
              <a-radio-group v-model="form.originalMode">
                <a-radio value="mix">原声自动叠加翻译</a-radio>
                <a-radio value="translationOnly">仅保留翻译音频</a-radio>
              </a-radio-group>
            </div>
            <div class="stm-row">
              <span class="stm-row-label">{{ form.originalMode === 'mix' ? '原声音量' : '背景音' }}</span>
              <div class="stm-slider">
                <a-slider v-model="form.bgVolume" :min="0" :max="100" />
                <a-input-number v-model="form.bgVolume" :min="0" :max="100" :precision="0" class="stm-num"><template #suffix>%</template></a-input-number>
              </div>
            </div>
          </template>
          <div v-if="form.mode === 'si' || form.originalMode === 'translationOnly'" class="stm-row">
            <span class="stm-row-label">降噪开关</span>
            <a-switch v-model="form.denoise" aria-label="降噪开关" />
          </div>
          <div class="stm-row">
            <span class="stm-row-label">音量均衡</span>
            <a-switch v-model="form.audioEnhance" aria-label="音量均衡" />
          </div>
        </div>
      </div>

      <!-- ==================== 字幕配置 ==================== -->
      <div class="stm-section-title">字幕配置</div>
      <div class="stm-card">
        <div class="stm-card-head">
          <span class="stm-label stm-req">添加字幕配置</span>
          <a-switch v-model="form.subtitleOn" aria-label="添加字幕配置" />
        </div>
        <div v-if="form.subtitleOn" class="stm-sub">
          <!-- 左：字幕参数 -->
          <div class="stm-sub-cfg">
            <div v-if="form.mode === 'asr'" class="stm-row">
              <span class="stm-row-label">出字方式</span>
              <a-radio-group v-model="form.outWordMode" @change="applySuggestedDelay">
                <a-radio value="sentence">整句</a-radio>
                <a-radio value="stream">实时流式</a-radio>
              </a-radio-group>
            </div>
            <div class="stm-row">
              <span class="stm-row-label">字幕格式</span>
              <a-radio-group v-if="form.mode !== 'asr'" v-model="form.subtitleFormat">
                <a-radio value="both">原文+译文</a-radio>
                <a-radio value="translation">译文</a-radio>
              </a-radio-group>
              <a-radio-group v-else :model-value="'original'"><a-radio value="original">原文</a-radio></a-radio-group>
            </div>
            <div class="stm-row">
              <span class="stm-row-label">字幕行数</span>
              <a-radio-group v-model="form.rows">
                <a-radio :value="1">1行</a-radio>
                <a-radio :value="2">2行</a-radio>
                <a-radio :value="0">自适应</a-radio>
              </a-radio-group>
            </div>
            <div v-if="showBoth" class="stm-row">
              <span class="stm-row-label">字幕排序</span>
              <a-select v-model="form.order" class="stm-order">
                <a-option value="originalTop">原文在上</a-option>
                <a-option value="originalBottom">原文在下</a-option>
              </a-select>
            </div>
            <div class="stm-row">
              <span class="stm-row-label">左右边距</span>
              <div class="stm-slider">
                <a-slider v-model="form.marginLr" :min="1" :max="30" />
                <a-input-number v-model="form.marginLr" :min="1" :max="30" :precision="0" class="stm-num"><template #suffix>%</template></a-input-number>
              </div>
            </div>
            <div class="stm-row">
              <span class="stm-row-label">底部边距</span>
              <div class="stm-slider">
                <a-slider v-model="form.marginTb" :min="1" :max="50" />
                <a-input-number v-model="form.marginTb" :min="1" :max="50" :precision="0" class="stm-num"><template #suffix>%</template></a-input-number>
              </div>
            </div>
            <div v-if="showBoth" class="stm-row">
              <span class="stm-row-label stm-row-label-wide">原文字幕与译文字幕样式共享</span>
              <a-checkbox v-model="form.shareStyle" aria-label="原文字幕与译文字幕样式共享" />
            </div>

            <div v-for="g in styleGroups" :key="g.key" class="stm-style">
              <div class="stm-style-title">{{ g.title }}</div>
              <div class="stm-row">
                <span class="stm-row-label">每行字数</span>
                <div class="stm-slider">
                  <a-slider v-model="g.style.maxChar" :min="1" :max="200" />
                  <a-input-number v-model="g.style.maxChar" :min="1" :max="200" :precision="0" class="stm-num" />
                </div>
              </div>
              <div class="stm-row">
                <span class="stm-row-label">字号</span>
                <div class="stm-slider">
                  <a-slider v-model="g.style.fontSize" :min="1" :max="100" />
                  <a-input-number v-model="g.style.fontSize" :min="1" :max="100" :precision="0" class="stm-num" />
                </div>
              </div>
              <div class="stm-row">
                <span class="stm-row-label">字体</span>
                <div class="stm-font">
                  <a-select v-model="g.style.font" class="stm-font-select">
                    <a-option value="arial">Arial</a-option>
                  </a-select>
                  <a-popover trigger="click" position="right">
                    <a-button :aria-label="`${g.title}：文字样式`"><icon-font-colors /></a-button>
                    <template #content>
                      <div class="stm-pop">
                        <div class="stm-pop-title">预设样式</div>
                        <div class="stm-presets">
                          <button
                            v-for="(p, i) in PRESETS"
                            :key="i"
                            type="button"
                            class="stm-preset"
                            :class="{ 'is-active': g.style.preset === i }"
                            :aria-label="p.label"
                            :title="p.label"
                            :style="{ color: p.font, textShadow: textStroke(p.border, 1) }"
                            @click="applyPreset(g.style, i)"
                          >T</button>
                        </div>
                        <div class="stm-pop-title">其他样式</div>
                        <div class="stm-pop-row">
                          <label class="stm-pop-field">底色
                            <input v-model="g.style.boxColor" type="color" class="stm-color" aria-label="底色" />
                            <span class="stm-mono">{{ g.style.boxColor.toUpperCase() }}</span>
                          </label>
                          <label class="stm-pop-field">边距
                            <a-input-number v-model="g.style.boxW" :min="0" :max="20" :precision="0" size="small" class="stm-pop-num" />
                          </label>
                        </div>
                        <div class="stm-pop-title">透明度</div>
                        <div class="stm-slider">
                          <a-slider v-model="g.style.opacity" :min="0" :max="100" />
                          <a-input-number v-model="g.style.opacity" :min="0" :max="100" :precision="0" size="small" class="stm-num"><template #suffix>%</template></a-input-number>
                        </div>
                        <div class="stm-pop-title">更多颜色</div>
                        <label class="stm-pop-field">文字颜色
                          <input v-model="g.style.fontColor" type="color" class="stm-color" aria-label="文字颜色" @input="g.style.preset = -1" />
                          <span class="stm-mono">{{ g.style.fontColor.toUpperCase() }}</span>
                        </label>
                      </div>
                    </template>
                  </a-popover>
                </div>
              </div>
            </div>

            <div v-if="form.mode !== 'asr'" class="stm-field">
              <label class="stm-label" for="stm-glossary">关键词库</label>
              <a-textarea id="stm-glossary" v-model="form.glossary" :max-length="30000" show-word-limit :auto-size="{ minRows: 3, maxRows: 6 }" placeholder="按 原文:译文 方式排列，用逗号隔开，例如“火山引擎:Volcengine,视频直播:Live”" />
            </div>
            <div v-else class="stm-field">
              <label class="stm-label" for="stm-hotwords">热词库</label>
              <a-textarea id="stm-hotwords" v-model="form.hotWords" :auto-size="{ minRows: 3, maxRows: 6 }" placeholder="请输入热词，按换行分隔" />
            </div>

            <div class="stm-field">
              <span class="stm-label">易错词</span>
              <div class="stm-tip">根据{{ form.mode === 'asr' ? '原文' : '译文' }}关键词进行强制纠错，单词不超50个字，最多添加{{ MAX_REPLACE }}个纠错词，建议根据实际效果调整。</div>
              <div v-for="(p, i) in form.replacePairs" :key="i" class="stm-pair">
                <a-input v-model="p.from" :max-length="50" :placeholder="form.mode === 'asr' ? '原文' : '译文'" />
                <a-input v-model="p.to" :max-length="50" placeholder="纠正" />
                <a-button type="text" :aria-label="`删除第 ${i + 1} 个易错词`" @click="removePair(i)"><icon-delete /></a-button>
              </div>
              <div class="stm-add">
                <a-button type="text" size="small" :disabled="form.replacePairs.length >= MAX_REPLACE" @click="addPair"><template #icon><icon-plus-circle /></template>添加易错词</a-button>
                <span class="stm-tip">还可以添加{{ MAX_REPLACE - form.replacePairs.length }}个标签</span>
              </div>
            </div>
          </div>

          <!-- 右：预览效果 -->
          <div class="stm-preview">
            <div class="stm-label">预览效果</div>
            <div class="stm-tip">请选择源流尺寸，转码字幕会按源流尺寸等比缩放</div>
            <div class="stm-preview-bar">
              <a-select v-model="form.previewSize" class="stm-size">
                <template #prefix><icon-desktop /></template>
                <a-option v-for="s in SIZES" :key="s.value" :value="s.value">{{ s.label }}</a-option>
              </a-select>
              <a-button @click="triggerBgUpload"><template #icon><icon-upload /></template>上传背景图</a-button>
              <a-button v-if="form.bgImage" type="text" @click="form.bgImage = ''">移除</a-button>
              <input ref="bgInput" type="file" accept="image/*" class="stm-hidden" aria-label="上传背景图" @change="onBgUpload" />
            </div>
            <div ref="stageRef" class="stm-stage" :style="stageStyle">
              <div v-if="form.subtitleOn" class="stm-subs" :style="subsStyle">
                <div v-for="line in previewLines" :key="line.key" class="stm-sub-line" :style="line.style">{{ line.text }}</div>
              </div>
            </div>
            <div class="stm-test">
              <a-input v-model="form.testMain" :max-length="200" :placeholder="mainTestLabel">
                <template #suffix><span class="stm-count">{{ (form.testMain || '').length }}/{{ form.rows || '自适应' }}</span></template>
              </a-input>
              <a-input v-if="showBoth" v-model="form.testOriginal" :max-length="200" placeholder="请输入原文字幕测试内容" class="stm-mt8" />
              <div class="stm-tip">超出显示范围时，内容将会被截断</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <a-button @click="handleCancel">取消</a-button>
      <a-button type="primary" :loading="submitting" @click="handleSubmit">{{ okText || '创建' }}</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconSwap, IconFontColors, IconDelete, IconPlusCircle, IconDesktop, IconUpload } from '@arco-design/web-vue/es/icon'
import dayjs from 'dayjs'
import api from '../../../api/http'
import { listDomains, generatePushURLByRoom } from '../../../api/live'
import {
  INPUT_LANGS, OUTPUT_LANGS, MODES, PRESETS, SIZES, MAX_REPLACE,
  buildSpeechTaskRule, defaultSpeechForm, suggestedDelay, delayRangeOf, validateSpeechForm, applyPreset, textStroke,
  type SpeechForm, type SpeechStyle, type SpeechMode,
} from './speechTask'

const props = defineProps<{ visible: boolean; record: any; title?: string; okText?: string }>()
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void; (e: 'success'): void; (e: 'cancel'): void }>()

const form = reactive<SpeechForm>(defaultSpeechForm())
const submitting = ref(false)

// ---------- 直播间与地址 ----------
const rooms = ref<{ id: number; roomName: string; status: string }[]>([])
const playDomain = ref('')
const targetRoomId = ref<string>()
const loadRooms = async () => {
  try {
    const [roomRes, domRes] = await Promise.all([
      api.post('/data/LIVE_ROOM/query', { page: 1, pageSize: 200, filters: { IS_ACTIVE: 'Y' } }),
      listDomains(undefined),
    ])
    const list = roomRes.data?.data?.data || []
    rooms.value = (Array.isArray(list) ? list : []).map((it: any) => ({ id: it.ID, roomName: it.ROOM_NAME || '', status: it.STATUS || '' }))
    const ds = domRes.data?.data?.domains || []
    playDomain.value = (Array.isArray(ds) ? ds : []).find((d: any) => d.Type === 1)?.Name || ''
    if (props.visible && !form.sourceUrl) form.sourceUrl = defaultSource()
  } catch (e) {
    console.error('加载直播间失败:', e)
  }
}
onMounted(loadRooms)
const targetRooms = computed(() => rooms.value.filter((r) => r.status !== 'ended' && Number(r.id) !== Number(props.record?.id)))
const defaultSource = () => (props.record?.id && playDomain.value ? `rtmp://${playDomain.value}/live/${props.record.id}` : props.record?.sourceUrlHint || '')

const onTargetRoomChange = async (id: unknown) => {
  if (!id) return
  try {
    const resp: any = await generatePushURLByRoom(String(id))
    const pushUrl = (resp?.data?.data || resp?.data)?.pushUrl || ''
    if (pushUrl) form.targetUrl = pushUrl
    else Message.warning('未获取到推流地址，请检查推流域名配置')
  } catch {
    Message.error('获取推流地址失败')
  }
}

watch(
  () => props.visible,
  (open) => {
    if (!open) return
    Object.assign(form, defaultSpeechForm())
    targetRoomId.value = undefined
    if (props.record?.roomName) form.name = `${props.record.roomName}-同传`.slice(0, 20)
    form.sourceUrl = defaultSource()
    if (props.record?.targetUrlHint) form.targetUrl = props.record.targetUrlHint
  },
  { immediate: true },
)

const isPastDate = (current?: Date) => !!current && dayjs(current).isBefore(dayjs(), 'day')

// ---------- 模式、延迟、语言 ----------
const setMode = (m: SpeechMode) => {
  if (form.mode === m) return
  form.mode = m
  form.delayTouched = false
  if (m !== 'si' && form.voiceMode === 'fixed') form.voiceMode = 'auto'
  applySuggestedDelay()
}
const delayRange = computed(() => delayRangeOf(form))
const applySuggestedDelay = () => {
  if (delayRange.value.fixed || !form.delayTouched) form.delay = suggestedDelay(form)
}
const outputLangOptions = computed(() => OUTPUT_LANGS.filter((o) => o.value !== form.inputLang))
const onInputLangChange = () => {
  if (form.outputLang === form.inputLang) form.outputLang = outputLangOptions.value[0]?.value || ''
}
const canSwap = computed(() => INPUT_LANGS.some((o) => o.value === form.outputLang))
const swapLangs = () => {
  const i = form.inputLang
  form.inputLang = form.outputLang
  form.outputLang = i
}

// ---------- 字幕样式 ----------
const showBoth = computed(() => form.mode !== 'asr' && form.subtitleFormat === 'both')
const styleGroups = computed<{ key: string; title: string; style: SpeechStyle }[]>(() => {
  if (form.mode === 'asr') return [{ key: 'o', title: '原文字幕样式', style: form.transStyle }]
  if (!showBoth.value) return [{ key: 't', title: '译文字幕样式', style: form.transStyle }]
  if (form.shareStyle) return [{ key: 'b', title: '原文+译文字幕样式', style: form.transStyle }]
  return [
    { key: 'o', title: '原文字幕样式', style: form.origStyle },
    { key: 't', title: '译文字幕样式', style: form.transStyle },
  ]
})

const addPair = () => form.replacePairs.push({ from: '', to: '' })
const removePair = (i: number) => {
  form.replacePairs.splice(i, 1)
  if (!form.replacePairs.length) addPair()
}

// ---------- 预览 ----------
const bgInput = ref<HTMLInputElement | null>(null)
const triggerBgUpload = () => bgInput.value?.click()
const onBgUpload = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    form.bgImage = String(reader.result || '')
    input.value = ''
  }
  reader.readAsDataURL(file)
}

const stageRef = ref<HTMLElement | null>(null)
const stageWidth = 480
const srcSize = computed(() => {
  const [w, h] = form.previewSize.split('x').map(Number)
  return { w: w || 1920, h: h || 1080 }
})
const scale = computed(() => stageWidth / srcSize.value.w)
const stageStyle = computed(() => ({
  width: `${stageWidth}px`,
  height: `${Math.round((stageWidth * srcSize.value.h) / srcSize.value.w)}px`,
  backgroundImage: form.bgImage ? `url(${form.bgImage})` : 'linear-gradient(180deg, #1d2b44 0%, #0f1a2e 100%)',
}))
const subsStyle = computed(() => ({
  left: `${form.marginLr}%`,
  right: `${form.marginLr}%`,
  bottom: `${form.marginTb}%`,
}))
const hexToRgba = (hex: string, alpha: number) => {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}
const lineStyle = (st: SpeechStyle) => {
  const px = Math.max(8, st.fontSize * scale.value)
  return {
    color: st.fontColor,
    fontFamily: 'Arial, sans-serif',
    fontSize: `${px}px`,
    lineHeight: 1.3,
    textShadow: textStroke(st.borderColor, Math.max(1, scale.value * 2)),
    background: hexToRgba(st.boxColor, st.opacity / 100),
    padding: `${Math.round(st.boxW * scale.value * 4)}px ${Math.round(st.boxW * scale.value * 8)}px`,
    maxWidth: `${st.maxChar * px * 0.6}px`,
    WebkitLineClamp: form.rows || 'none',
  }
}
const mainTestLabel = computed(() => (form.mode === 'asr' ? '请输入原文字幕测试内容' : '请输入译文字幕测试内容'))
const previewLines = computed(() => {
  const main = { key: 'main', text: form.testMain || '这是一条默认字幕', style: lineStyle(styleGroups.value[styleGroups.value.length - 1].style) }
  if (!showBoth.value) return [main]
  const original = { key: 'orig', text: form.testOriginal || '原文字幕示例', style: lineStyle(form.shareStyle ? form.transStyle : form.origStyle) }
  return form.order === 'originalTop' ? [original, main] : [main, original]
})

// ---------- 提交 ----------
const handleSubmit = async () => {
  const err = validateSpeechForm(form)
  if (err) {
    Message.warning(err)
    return
  }
  submitting.value = true
  try {
    const resp = await api.post('/live/speech-tasks', {
      Name: form.name.trim(),
      Rule: buildSpeechTaskRule(form),
      roomId: props.record?.id ? String(props.record.id) : '',
      roomName: props.record?.roomName || '',
    })
    if (resp.data && (resp.data.code === 0 || resp.data.code === 200 || resp.data.success)) {
      Message.success('字幕同传任务已创建')
      emit('success')
      emit('update:visible', false)
      return
    }
    Message.error(resp.data?.message || '创建失败')
  } catch (e: any) {
    Message.error(e?.response?.data?.message || e?.message || '创建失败')
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
.stm { display: flex; flex-direction: column; gap: 16px; }
.stm-section-title { font-size: 15px; font-weight: 600; padding-left: 8px; border-left: 3px solid rgb(var(--arcoblue-6)); line-height: 1.2; }
.stm-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.stm-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.stm-label { font-size: 14px; color: var(--color-text-1); }
.stm-req::before { content: '*'; color: rgb(var(--red-6)); margin-right: 4px; }
.stm-tip { font-size: 12px; color: var(--color-text-3); line-height: 1.7; }
.stm-tip-list { margin: 0; padding-left: 16px; }
.stm-mt8 { margin-top: 8px; }
.stm-modes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.stm-mode { display: flex; flex-direction: column; gap: 6px; text-align: left; padding: 14px 16px; border: 1px solid var(--color-border-2); border-radius: 6px; background: var(--color-bg-2); cursor: pointer; font: inherit; color: inherit; }
.stm-mode:hover { border-color: rgb(var(--arcoblue-4)); }
.stm-mode.is-active { border-color: rgb(var(--arcoblue-6)); background: rgb(var(--arcoblue-1)); }
.stm-mode-title { font-weight: 600; }
.stm-mode.is-active .stm-mode-title { color: rgb(var(--arcoblue-6)); }
.stm-mode-desc { font-size: 12px; color: var(--color-text-2); }
.stm-langs { display: flex; align-items: center; gap: 12px; }
.stm-lang { flex: 1; min-width: 0; }
.stm-card { border: 1px solid var(--color-border-2); border-radius: 6px; overflow: hidden; }
.stm-card-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--color-fill-1); }
.stm-card-body { padding: 8px 14px 12px; }
.stm-row { display: grid; grid-template-columns: 88px minmax(0, 1fr); gap: 12px; align-items: center; min-height: 36px; }
.stm-row-label { font-size: 13px; color: var(--color-text-2); }
.stm-row > .arco-switch, .stm-row > .arco-checkbox { justify-self: start; }
.stm-langs :deep(.arco-btn) { flex-shrink: 0; }
.stm-row-label-wide { grid-column: span 1; white-space: normal; }
.stm-row-ctl { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.stm-voice { width: 240px; }
.stm-slider { display: flex; align-items: center; gap: 12px; }
.stm-slider :deep(.arco-slider) { flex: 1; min-width: 80px; }
.stm-num { width: 96px; flex-shrink: 0; }
.stm-sub { display: grid; grid-template-columns: minmax(0, 420px) minmax(0, 1fr); gap: 20px; padding: 12px 14px 16px; }
.stm-sub-cfg { display: flex; flex-direction: column; gap: 8px; padding-right: 20px; border-right: 1px dashed var(--color-border-2); }
.stm-order { width: 100%; }
.stm-style { border: 1px solid var(--color-border-2); border-radius: 6px; overflow: hidden; }
.stm-style-title { padding: 8px 12px; background: var(--color-fill-1); font-size: 13px; font-weight: 600; }
.stm-style .stm-row { padding: 0 12px; }
.stm-font { display: flex; gap: 8px; }
.stm-font-select { flex: 1; min-width: 0; }
.stm-pop { width: 280px; display: flex; flex-direction: column; gap: 8px; }
.stm-pop-title { font-size: 12px; color: var(--color-text-2); }
.stm-presets { display: flex; gap: 8px; }
.stm-preset { width: 36px; height: 32px; border: 1px solid var(--color-border-2); border-radius: 4px; background: var(--color-fill-2); font: 700 18px Arial, sans-serif; cursor: pointer; }
.stm-preset.is-active { border-color: rgb(var(--arcoblue-6)); }
.stm-pop-row { display: flex; gap: 8px; flex-wrap: wrap; }
.stm-pop-field { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--color-text-2); }
.stm-pop-num { width: 80px; }
.stm-color { width: 28px; height: 24px; padding: 0; border: 1px solid var(--color-border-2); border-radius: 4px; background: none; cursor: pointer; }
.stm-mono { font-family: Consolas, monospace; font-size: 12px; }
.stm-pair { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; gap: 8px; align-items: center; }
.stm-add { display: flex; align-items: center; gap: 4px; }
.stm-preview { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.stm-preview-bar { display: flex; gap: 8px; flex-wrap: wrap; }
.stm-size { width: 210px; }
.stm-hidden { display: none; }
.stm-stage { position: relative; max-width: 100%; background-size: cover; background-position: center; border-radius: 4px; overflow: hidden; }
.stm-subs { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stm-sub-line { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; text-align: center; border-radius: 2px; word-break: break-all; }
.stm-test { max-width: 480px; }
.stm-count { font-size: 12px; color: var(--color-text-3); }
@media (max-width: 900px) {
  .stm-grid2, .stm-modes, .stm-sub { grid-template-columns: minmax(0, 1fr); }
  .stm-sub-cfg { padding-right: 0; border-right: 0; }
}
</style>
