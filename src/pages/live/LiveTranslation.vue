<template>
  <div class="live-translation-page">
    <V2PageHeader
      :title="t('liveTranslation.title')"
      :description="t('liveTranslation.desc')"
    >
      <template #actions>
        <V2Button type="secondary" @click="handleBack">
          <template #icon>
            <icon-arrow-left />
          </template>
          {{ t('liveTranslation.return') }}
        </V2Button>
        <V2Button type="primary" @click="saveConfig">
          <template #icon>
            <icon-check />
          </template>
          {{ t('liveTranslation.save') }}
        </V2Button>
      </template>
    </V2PageHeader>

    <V2Card class="translation-card" :padding="false">
      <div class="translation-layout">
        <!-- 左侧配置表单 -->
        <div class="translation-form">
          <a-form :model="translationForm" layout="vertical" size="small">
            <div class="basic-col">
              <div class="section-title">
                <div class="section-bar" />
                <span>{{ t('liveRoomDetail.translation.basicTitle') }}</span>
              </div>

              <a-form-item :label="t('liveRoomDetail.translation.taskTitle')" required>
                <a-input
                  v-model="translationForm.title"
                  :placeholder="t('liveRoomDetail.translation.taskTitlePlaceholder')"
                  :max-length="20"
                  allow-clear
                />
                <div class="form-tip">{{ t('liveRoomDetail.translation.taskTitleTip') }}</div>
              </a-form-item>

              <a-form-item :label="t('liveRoomDetail.translation.relayTime')" required>
                <a-range-picker
                  v-model="translationForm.relayTimeRange"
                  show-time
                  format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%"
                />
              </a-form-item>

              <a-form-item :label="t('liveRoomDetail.translation.liveAddress')" required>
                <div class="sub-field">
                  <div class="sub-label">{{ t('liveRoomDetail.translation.sourceUrl') }}</div>
                  <a-input
                    v-model="translationForm.sourceUrl"
                    :placeholder="t('liveRoomDetail.translation.sourceUrlPlaceholder')"
                    allow-clear
                  />
                  <div class="form-tip">
                    {{ t('liveRoomDetail.translation.sourceUrlTip') }}
                    <a-link>{{ t('liveRoomDetail.translation.urlGenerator') }}</a-link>
                  </div>
                </div>
                <div class="sub-field">
                  <div class="sub-label">{{ t('liveRoomDetail.translation.targetUrl') }}</div>
                  <a-input
                    v-model="translationForm.targetUrl"
                    :placeholder="t('liveRoomDetail.translation.targetUrlPlaceholder')"
                    allow-clear
                  />
                  <div class="form-tip">
                    {{ t('liveRoomDetail.translation.targetUrlTip') }}
                    <a-link>{{ t('liveRoomDetail.translation.urlGenerator') }}</a-link>
                  </div>
                </div>
              </a-form-item>

              <a-form-item :label="t('liveRoomDetail.translation.mode')" required>
                <div class="mode-cards">
                  <div
                    v-for="m in translationModes"
                    :key="m.value"
                    :class="['mode-card', { active: translationForm.mode === m.value }]"
                    @click="translationForm.mode = m.value"
                  >
                    <div class="mode-name">{{ m.label }}</div>
                    <div class="mode-desc">{{ m.desc }}</div>
                  </div>
                </div>
              </a-form-item>

              <a-form-item :label="t('liveRoomDetail.translation.delay')" required>
                <a-input-number v-model="translationForm.delay" :min="1" :max="60" style="width: 120px">
                  <template #suffix>s</template>
                </a-input-number>
                <div class="form-tip delay-tip">
                  <div>{{ t('liveRoomDetail.translation.delayTip1') }}</div>
                  <div>{{ t('liveRoomDetail.translation.delayTip2') }}</div>
                  <div>{{ t('liveRoomDetail.translation.delayTip3') }}</div>
                  <div>{{ t('liveRoomDetail.translation.delayTip4') }}</div>
                </div>
              </a-form-item>

              <a-form-item :label="t('liveRoomDetail.translation.language')" required>
                <div class="lang-row">
                  <a-select v-model="translationForm.inputLang" style="flex: 1">
                    <a-option value="zh">中文</a-option>
                    <a-option value="en">English</a-option>
                    <a-option value="ja">日本語</a-option>
                    <a-option value="ko">한국어</a-option>
                    <a-option value="es">Español</a-option>
                  </a-select>
                  <icon-swap class="lang-swap" @click="swapLang" />
                  <a-select v-model="translationForm.outputLang" style="flex: 1">
                    <a-option value="zh">中文</a-option>
                    <a-option value="en">English</a-option>
                    <a-option value="ja">日本語</a-option>
                    <a-option value="ko">한국어</a-option>
                    <a-option value="es">Español</a-option>
                  </a-select>
                </div>
                <div class="form-tip">{{ t('liveRoomDetail.translation.languageTip') }}</div>
              </a-form-item>

              <a-form-item :label="t('liveRoomDetail.translation.digitalLips')" required>
                <a-switch v-model="translationForm.digitalLips" type="round" />
              </a-form-item>

              <a-form-item :label="t('liveRoomDetail.translation.translationVoice')" required>
                <a-switch v-model="translationForm.translationVoice" type="round" />
              </a-form-item>
              <div v-if="translationForm.translationVoice" class="voice-options">
                <a-form-item :label="t('liveRoomDetail.translation.voiceConfig')">
                  <a-radio-group v-model="translationForm.voiceType" type="button">
                    <a-radio value="auto">{{ t('liveRoomDetail.translation.voiceAuto') }}</a-radio>
                    <a-radio value="fixed">{{ t('liveRoomDetail.translation.voiceFixed') }}</a-radio>
                  </a-radio-group>
                </a-form-item>
                <a-form-item :label="t('liveRoomDetail.translation.noiseReduction')">
                  <a-switch v-model="translationForm.noiseReduction" type="round" />
                </a-form-item>
                <a-form-item :label="t('liveRoomDetail.translation.volumeBalance')">
                  <a-switch v-model="translationForm.volumeBalance" type="round" />
                </a-form-item>
              </div>
            </div>

            <div class="subtitle-col">
              <div class="section-title">
                <div class="section-bar" />
                <span>{{ t('liveRoomDetail.translation.subtitleTitle') }}</span>
              </div>

              <a-form-item :label="t('liveRoomDetail.translation.subtitleEnabled')" required>
                <a-switch v-model="translationForm.subtitleEnabled" type="round" />
              </a-form-item>

              <template v-if="translationForm.subtitleEnabled">
                <a-form-item :label="t('liveRoomDetail.translation.subtitleFormat')">
                  <a-radio-group v-model="translationForm.subtitleFormat" type="button">
                    <a-radio value="both">{{ t('liveRoomDetail.translation.formatBoth') }}</a-radio>
                    <a-radio value="target">{{ t('liveRoomDetail.translation.formatTarget') }}</a-radio>
                  </a-radio-group>
                </a-form-item>

                <a-form-item :label="t('liveRoomDetail.translation.subtitleLines')">
                  <a-radio-group v-model="translationForm.subtitleLines" type="button">
                    <a-radio value="1">{{ t('liveRoomDetail.translation.lines1') }}</a-radio>
                    <a-radio value="2">{{ t('liveRoomDetail.translation.lines2') }}</a-radio>
                    <a-radio value="auto">{{ t('liveRoomDetail.translation.linesAuto') }}</a-radio>
                  </a-radio-group>
                </a-form-item>

                <a-form-item :label="t('liveRoomDetail.translation.subtitleOrder')">
                  <a-select v-model="translationForm.subtitleOrder" style="width: 100%">
                    <a-option value="sourceTop">{{ t('liveRoomDetail.translation.orderSourceTop') }}</a-option>
                    <a-option value="targetTop">{{ t('liveRoomDetail.translation.orderTargetTop') }}</a-option>
                  </a-select>
                </a-form-item>

                <a-form-item :label="t('liveRoomDetail.translation.sideMargin')">
                  <a-slider v-model="translationForm.sideMargin" :min="0" :max="50" show-input style="width: 100%" />
                </a-form-item>

                <a-form-item :label="t('liveRoomDetail.translation.bottomMargin')">
                  <a-slider v-model="translationForm.bottomMargin" :min="0" :max="30" show-input style="width: 100%" />
                </a-form-item>

                <div class="style-card">
                  <div class="style-card-title">{{ t('liveRoomDetail.translation.targetStyleTitle') }}</div>
                  <a-form-item :label="t('liveRoomDetail.translation.charsPerLine')">
                    <a-slider v-model="translationForm.charsPerLine" :min="10" :max="120" show-input style="width: 100%" />
                  </a-form-item>
                  <a-form-item :label="t('liveRoomDetail.translation.fontSize')">
                    <a-slider v-model="translationForm.fontSize" :min="12" :max="96" show-input style="width: 100%" />
                  </a-form-item>
                  <a-form-item :label="t('liveRoomDetail.translation.fontFamily')">
                    <div class="font-row">
                      <a-select v-model="translationForm.fontFamily" style="flex: 1">
                        <a-option value="Arial">Arial</a-option>
                        <a-option value="Microsoft YaHei">微软雅黑</a-option>
                        <a-option value="PingFang SC">苹方</a-option>
                        <a-option value="SimSun">宋体</a-option>
                      </a-select>
                      <V2Button type="secondary" size="sm">
                        <icon-palette />
                      </V2Button>
                    </div>
                  </a-form-item>
                </div>

                <a-form-item :label="t('liveRoomDetail.translation.keywordLibrary')">
                  <a-textarea
                    v-model="translationForm.keywordLibrary"
                    :placeholder="t('liveRoomDetail.translation.keywordLibraryPlaceholder')"
                    :max-length="30000"
                    allow-clear
                    :auto-size="{ minRows: 3, maxRows: 5 }"
                  />
                </a-form-item>

                <a-form-item :label="t('liveRoomDetail.translation.errorWords')">
                  <div class="form-tip">{{ t('liveRoomDetail.translation.errorWordsTip') }}</div>
                  <div v-for="(word, idx) in translationForm.errorWords" :key="idx" class="error-word-row">
                    <a-input v-model="word.source" :placeholder="t('liveRoomDetail.translation.errorWordSource')" />
                    <a-input v-model="word.target" :placeholder="t('liveRoomDetail.translation.errorWordTarget')" />
                    <a-button type="text" status="danger" @click="removeErrorWord(idx)">
                      <icon-delete />
                    </a-button>
                  </div>
                  <a-button type="text" long @click="addErrorWord">
                    <icon-plus /> {{ t('liveRoomDetail.translation.addErrorWord') }}（{{ t('liveRoomDetail.translation.errorWordRemaining', { count: 500 - translationForm.errorWords.length }) }}）
                  </a-button>
                </a-form-item>
              </template>
            </div>
          </a-form>
        </div>

        <!-- 右侧预览 -->
        <div class="translation-preview">
          <div class="preview-header">{{ t('liveRoomDetail.translation.previewTitle') }}</div>
          <div class="preview-tip">{{ t('liveRoomDetail.translation.previewTip') }}</div>
          <div class="preview-resize-row">
            <icon-desktop />
            <a-select v-model="translationForm.previewResolution" style="width: 160px" size="small">
              <a-option value="1920x1080">1920 * 1080 (16:9)</a-option>
              <a-option value="1080x1920">1080 * 1920 (9:16)</a-option>
              <a-option value="1280x720">1280 * 720 (16:9)</a-option>
              <a-option value="720x1280">720 * 1280 (9:16)</a-option>
            </a-select>
            <V2Button type="secondary" size="sm" @click="triggerBackgroundUpload">
              <template #icon><icon-upload /></template>
              {{ t('liveRoomDetail.translation.uploadBackground') }}
            </V2Button>
            <a-button type="text" size="small" @click="togglePreviewFullscreen">
              <icon-fullscreen />
            </a-button>
            <input ref="bgInputRef" type="file" accept="image/*" style="display: none" @change="onBackgroundChange">
          </div>

          <div
            class="preview-stage"
            :style="previewStageStyle"
          >
            <img v-if="translationForm.previewBackground" :src="translationForm.previewBackground" class="preview-bg">
            <div v-else class="preview-bg preview-bg-placeholder">
              <icon-image :size="32" />
              <span>{{ t('liveRoomDetail.translation.previewPlaceholder') }}</span>
            </div>
            <div
              class="preview-subtitle"
              :style="previewSubtitleStyle"
            >
              {{ translationForm.previewText }}
            </div>
          </div>

          <div class="preview-text-row">
            <a-textarea
              v-model="translationForm.previewText"
              :max-length="translationForm.charsPerLine"
              show-word-limit
              :auto-size="{ minRows: 2, maxRows: 4 }"
            />
            <div class="form-tip">{{ t('liveRoomDetail.translation.previewOverflowTip') }}</div>
          </div>
        </div>
      </div>
    </V2Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onBeforeMount } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconArrowLeft, IconCheck, IconDelete, IconSwap, IconUpload, IconFullscreen, IconDesktop,
  IconImage, IconPlus, IconPalette
} from '@arco-design/web-vue/es/icon'
import { V2PageHeader, V2Card, V2Button } from '@/components/ui'
import api from '../../api/http'
import { useI18n } from 'vue-i18n'
import { useNavigationStore } from '../../stores/navigation'

const { t } = useI18n()

const navigationStore = useNavigationStore()

const roomId = String(navigationStore.current.params?.id || '')
const bgInputRef = ref<HTMLInputElement | null>(null)

const translationModes = [
  { value: 'sync', label: '声影同传', desc: '字幕、同传音频与画面对齐，需要一定延迟' },
  { value: 'realtime', label: '实时同传', desc: '同传音频与画面不同步，实时翻译同传' },
  { value: 'asr', label: '原文 ASR 字幕', desc: '只需原文字幕' }
]

const defaultTranslationForm = () => ({
  title: '',
  relayTimeRange: [],
  sourceUrl: '',
  targetUrl: '',
  mode: 'sync',
  delay: 12,
  inputLang: 'zh',
  outputLang: 'en',
  digitalLips: false,
  translationVoice: true,
  voiceType: 'auto',
  noiseReduction: false,
  volumeBalance: true,
  subtitleEnabled: true,
  subtitleFormat: 'target',
  subtitleLines: '1',
  subtitleOrder: 'sourceTop',
  sideMargin: 20,
  bottomMargin: 5,
  charsPerLine: 60,
  fontSize: 40,
  fontFamily: 'Arial',
  keywordLibrary: '',
  errorWords: [] as { source: string; target: string }[],
  previewResolution: '1920x1080',
  previewBackground: '',
  previewText: '这是一条默认字幕'
})

const translationForm = reactive(defaultTranslationForm())

const previewStageStyle = computed(() => {
  const [w, h] = translationForm.previewResolution.split('x').map(Number)
  const aspect = w / h
  const width = 360
  const height = width / aspect
  return { width: `${width}px`, height: `${height}px` }
})

const previewSubtitleStyle = computed(() => {
  return {
    fontSize: `${Math.max(12, translationForm.fontSize * 0.35)}px`,
    fontFamily: translationForm.fontFamily,
    left: `${translationForm.sideMargin}%`,
    right: `${translationForm.sideMargin}%`,
    bottom: `${translationForm.bottomMargin}%`
  }
})

const swapLang = () => {
  const tmp = translationForm.inputLang
  translationForm.inputLang = translationForm.outputLang
  translationForm.outputLang = tmp
}

const addErrorWord = () => {
  if (translationForm.errorWords.length >= 500) return
  translationForm.errorWords.push({ source: '', target: '' })
}

const removeErrorWord = (idx: number) => {
  translationForm.errorWords.splice(idx, 1)
}

const triggerBackgroundUpload = () => {
  bgInputRef.value?.click()
}

const onBackgroundChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    translationForm.previewBackground = reader.result as string
  }
  reader.readAsDataURL(file)
}

const togglePreviewFullscreen = () => {
  Message.info(t('liveRoomDetail.translation.fullscreenTip'))
}

const loadRoomProps = async () => {
  try {
    const response = await fetchRoomInfo()
    if (!response) return
    if (response.props) {
      const props = typeof response.props === 'string' ? JSON.parse(response.props) : response.props
      if (props.translation) {
        Object.assign(translationForm, defaultTranslationForm(), props.translation)
      } else if (props.subtitle) {
        translationForm.subtitleEnabled = props.subtitle.enabled !== false
        translationForm.outputLang = props.subtitle.targetLang || 'en'
      }
    }
  } catch (e) { /* 忽略 */ }
}

const fetchRoomInfo = async () => {
  try {
    const response = await api.get(`/live/rooms/${roomId}`)
    return response.data.data
  } catch (error: any) {
    Message.error(error.message || t('liveTranslation.fetchFailed'))
    return null
  }
}

const saveConfig = async () => {
  try {
    const roomInfo = await fetchRoomInfo()
    if (!roomInfo) return
    let props: any = {}
    if (roomInfo.props) {
      try {
        props = typeof roomInfo.props === 'string' ? JSON.parse(roomInfo.props) : roomInfo.props
      } catch (e) { /* 忽略 */ }
    }
    props.translation = {
      title: translationForm.title,
      relayTimeRange: translationForm.relayTimeRange,
      sourceUrl: translationForm.sourceUrl,
      targetUrl: translationForm.targetUrl,
      mode: translationForm.mode,
      delay: translationForm.delay,
      inputLang: translationForm.inputLang,
      outputLang: translationForm.outputLang,
      digitalLips: translationForm.digitalLips,
      translationVoice: translationForm.translationVoice,
      voiceType: translationForm.voiceType,
      noiseReduction: translationForm.noiseReduction,
      volumeBalance: translationForm.volumeBalance,
      subtitleEnabled: translationForm.subtitleEnabled,
      subtitleFormat: translationForm.subtitleFormat,
      subtitleLines: translationForm.subtitleLines,
      subtitleOrder: translationForm.subtitleOrder,
      sideMargin: translationForm.sideMargin,
      bottomMargin: translationForm.bottomMargin,
      charsPerLine: translationForm.charsPerLine,
      fontSize: translationForm.fontSize,
      fontFamily: translationForm.fontFamily,
      keywordLibrary: translationForm.keywordLibrary,
      errorWords: translationForm.errorWords,
      previewResolution: translationForm.previewResolution,
      previewBackground: translationForm.previewBackground,
      previewText: translationForm.previewText
    }
    props.subtitle = {
      enabled: translationForm.subtitleEnabled,
      targetLang: translationForm.outputLang
    }
    await api.put(`/data/LIVE_ROOM/${roomId}`, {
      PROPS: JSON.stringify(props)
    })
    Message.success(t('liveTranslation.saved'))
  } catch (error: any) {
    Message.error(error.message || t('liveTranslation.saveFailed'))
  }
}

const handleBack = () => {
  navigationStore.navigateTo('LiveRoomDetail', t('liveTranslation.return'), { id: roomId }, false)
}

onBeforeMount(() => {
  loadRoomProps()
})
</script>

<style scoped lang="scss">
.live-translation-page {
  padding: 24px;
  background: var(--bg-page);
  height: 100%;
  overflow-y: auto;
}

.translation-card {
  border: none;
  background: transparent;
  box-shadow: none;
}

.translation-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  min-height: 600px;
}

.translation-form {
  flex: 1;
  display: flex;
  gap: 20px;
  min-width: 0;

  :deep(.arco-form) {
    display: flex;
    flex-direction: row;
    gap: 20px;
    align-items: flex-start;
    width: 100%;
  }

  .basic-col,
  .subtitle-col {
    flex: 1;
    min-width: 0;
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg, 12px);
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    :deep(.arco-form-item) {
      margin-bottom: 14px;
    }

    :deep(.arco-form-label-item) {
      margin-bottom: 4px;
      font-size: 13px;
      color: var(--text-secondary);
    }
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-light);

  .section-bar {
    width: 4px;
    height: 18px;
    background: var(--brand-blue);
    border-radius: 2px;
  }
}

.form-tip {
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.5;
  margin-top: 4px;
}

.delay-tip {
  background: var(--info-bg);
  padding: 8px 10px;
  border-radius: var(--radius-md);
}

.sub-field {
  margin-bottom: 12px;

  .sub-label {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 6px;
  }
}

.mode-cards {
  display: flex;
  gap: 10px;
}

.mode-card {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-card);

  &.active {
    border-color: var(--brand-blue);
    background: var(--info-bg);
  }

  .mode-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .mode-desc {
    font-size: 12px;
    color: var(--text-tertiary);
    line-height: 1.4;
  }
}

.lang-row {
  display: flex;
  align-items: center;
  gap: 10px;

  .lang-swap {
    cursor: pointer;
    color: var(--brand-blue);
    font-size: 18px;
  }
}

.voice-options {
  background: var(--bg-page);
  border-radius: var(--radius-md);
  padding: 12px;
  margin-bottom: 12px;
}

.style-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px;
  margin-bottom: 12px;
  background: var(--bg-page);

  .style-card-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 12px;
  }
}

.font-row {
  display: flex;
  gap: 8px;
}

.error-word-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.translation-preview {
  width: 400px;
  flex-shrink: 0;
  padding: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg, 12px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: sticky;
  top: 24px;
}

.preview-header {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-light);
}

.preview-tip {
  font-size: 12px;
  color: var(--text-tertiary);
}

.preview-resize-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.preview-stage {
  position: relative;
  background: #000;
  border-radius: var(--radius-md);
  overflow: hidden;
  align-self: center;
  margin: 8px 0;
  border: 1px solid var(--border-light);

  .preview-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .preview-bg-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--text-tertiary);
    background: var(--bg-hover);
    font-size: 13px;
  }

  .preview-subtitle {
    position: absolute;
    color: #fff;
    text-align: center;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    line-height: 1.3;
    word-break: break-all;
  }
}

.preview-text-row {
  margin-top: auto;
}

/* 中等屏幕：基本配置与字幕配置改为上下堆叠，预览保持右列 */
@media (max-width: 1440px) {
  .translation-form :deep(.arco-form) {
    flex-direction: column;
  }

  .translation-form .basic-col,
  .translation-form .subtitle-col {
    width: 100%;
  }
}

/* 窄屏：预览也换行，三栏全部纵向堆叠 */
@media (max-width: 1280px) {
  .translation-layout {
    flex-direction: column;
  }

  .translation-form {
    width: 100%;
    flex: none;
  }

  .translation-preview {
    width: 100%;
    position: static;
  }
}
</style>