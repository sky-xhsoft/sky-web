<template>
  <a-modal
    :visible="visible"
    width="1240px"
    :footer="false"
    :closable="false"
    :mask-closable="false"
    :body-style="{ padding: 0 }"
    modal-class="stm-modal"
    unmount-on-close
    @cancel="handleCancel"
  >
    <template #title>
      <div class="stm-head">
        <div>
          <div class="stm-title">{{ title || '新建字幕同传任务' }}</div>
          <div class="stm-subtitle">{{ copyFrom ? `复制自「${copyFrom.name}」· ` : '' }}{{ room?.roomName ? `直播间「${room.roomName}」· ` : '' }}火山引擎声影同传</div>
        </div>
        <a-button type="text" aria-label="关闭" @click="handleCancel"><icon-close /></a-button>
      </div>
    </template>

    <div class="stm-body" :class="`is-step-${step}`">
      <!-- 左：步骤导航 -->
      <nav class="stm-nav" aria-label="配置步骤">
        <button
          v-for="s in STEPS"
          :key="s.key"
          type="button"
          class="stm-nav-item"
          :class="{ 'is-active': step === s.key }"
          :aria-current="step === s.key ? 'step' : undefined"
          @click="goStep(s.key)"
        >
          <span class="stm-nav-num" :class="{ 'is-done': stepDone(s.key) && step !== s.key }">
            <icon-check v-if="stepDone(s.key) && step !== s.key" />
            <template v-else>{{ s.key }}</template>
          </span>
          {{ s.title }}
          <span v-if="s.key >= 3" class="stm-nav-opt">可选</span>
        </button>
        <div class="stm-nav-note">推流到转推地址成功后开始计费，关闭任务后停止；每个账号同时最多运行 2 条任务。</div>
      </nav>

      <!-- 中：步骤内容（v-show 保留各步骤的输入） -->
      <div class="stm-main">
        <section v-show="step === 1" class="ss-card" aria-label="基本信息">
          <div class="ss-card-title">基本信息</div>
          <div class="ss-grid">
            <div class="ss-field">
              <label class="ss-label ss-req" for="stm-name">标题</label>
              <a-input id="stm-name" v-model="form.name" placeholder="请输入标题" :max-length="20" show-word-limit allow-clear />
              <div class="ss-tip">支持中文、大小写字母、数字、-、_ 组合，不超过 20 个字符</div>
            </div>
            <div class="ss-field">
              <span class="ss-label ss-req">转推时间</span>
              <a-range-picker v-model="form.timeRange" show-time format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" :disabled-date="isPastDate" style="width: 100%" />
            </div>
            <div v-if="!record" class="ss-field ss-field-full">
              <span class="ss-label">源直播间</span>
              <a-select v-model="sourceRoomId" placeholder="选择直播间，自动填写源流地址（也可直接填写下方地址）" allow-clear allow-search aria-label="源直播间" @change="onSourceRoomChange">
                <a-option v-for="r in rooms" :key="r.id" :value="String(r.id)">{{ r.roomName || `直播间${r.id}` }}</a-option>
              </a-select>
            </div>
            <div class="ss-field ss-field-full">
              <label class="ss-label ss-req" for="stm-src">源流地址</label>
              <a-input id="stm-src" v-model="form.sourceUrl" placeholder="请输入拉流地址" allow-clear />
              <div class="ss-tip">需要拉取的原始流地址，支持 RTMP、FLV{{ room?.roomName ? `，默认为直播间「${room.roomName}」的播放地址` : '' }}</div>
            </div>
            <div class="ss-field ss-field-full">
              <label class="ss-label ss-req" for="stm-dst">转推地址</label>
              <a-input id="stm-dst" v-model="form.targetUrl" placeholder="请输入转推的推流地址" allow-clear>
                <template #append>
                  <a-select v-model="targetRoomId" placeholder="从直播间选择" allow-clear :style="{ width: '170px' }" :bordered="false" aria-label="从直播间选择转推地址" @change="onTargetRoomChange">
                    <a-option v-for="r in targetRooms" :key="r.id" :value="String(r.id)">{{ r.roomName || `直播间${r.id}` }}</a-option>
                  </a-select>
                </template>
              </a-input>
              <div class="ss-tip">同传后转推的地址，支持 RTMP；也可以从直播间选择，自动生成其推流地址</div>
            </div>
          </div>
        </section>
        <SpeechStepMode v-show="step === 2" />
        <SpeechStepStyle v-show="step === 3" />
        <SpeechStepGlossary v-show="step === 4" />
      </div>

      <!-- 右：预览 / 摘要 / 当前词库 -->
      <aside class="stm-aside" aria-label="预览与摘要">
        <template v-if="step === 3">
          <div class="stm-aside-title">实时预览</div>
          <SpeechPreview :width="380" controls />
        </template>
        <template v-else-if="step === 4">
          <SpeechGlossaryLibrary />
        </template>
        <template v-else>
          <div class="stm-aside-title">实时预览</div>
          <SpeechPreview :width="280" />
          <dl class="stm-summary">
            <template v-for="row in summary" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </template>
          </dl>
        </template>
      </aside>
    </div>

    <div class="stm-foot">
      <span class="stm-foot-tip">第 {{ step }} 步，共 4 步{{ step >= 2 ? ' · 字幕样式、词库为可选项，可直接创建' : '' }}</span>
      <div class="stm-foot-btns">
        <a-button @click="handleCancel">取消</a-button>
        <a-button v-if="step > 1" @click="goStep(step - 1)">上一步</a-button>
        <a-button v-if="step < 4" :type="step === 1 ? 'primary' : 'secondary'" @click="goStep(step + 1)">下一步：{{ STEPS[step].title }}</a-button>
        <a-button v-if="step >= 2" type="primary" :loading="submitting" @click="handleSubmit">{{ okText || '创建任务' }}</a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, reactive, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconCheck, IconClose } from '@arco-design/web-vue/es/icon'
import dayjs from 'dayjs'
import api from '../../../api/http'
import { listDomains, generatePushURLByRoom } from '../../../api/live'
import SpeechStepMode from './SpeechStepMode.vue'
import SpeechStepStyle from './SpeechStepStyle.vue'
import SpeechStepGlossary from './SpeechStepGlossary.vue'
import SpeechGlossaryLibrary from './SpeechGlossaryLibrary.vue'
import SpeechPreview from './SpeechPreview.vue'
import {
  MODES, STEPS, SPEECH_FORM_KEY, buildSpeechTaskRule, defaultSpeechForm, isStep1Valid, langLabel, ruleToSpeechForm, validateSpeechFormDetail,
  type SpeechForm,
} from './speechTask'

// record：从直播间进入时的直播间；copyFrom：复制新建时的原任务名称与创建参数
const props = defineProps<{ visible: boolean; record?: any; title?: string; okText?: string; copyFrom?: { name: string; rule: any } | null }>()
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void; (e: 'success'): void; (e: 'cancel'): void }>()

const form = reactive<SpeechForm>(defaultSpeechForm())
provide(SPEECH_FORM_KEY, form)
const submitting = ref(false)

// ---------- 步骤 ----------
const step = ref(1)
const visited = ref(new Set<number>([1]))
const goStep = (n: number) => {
  if (n < 1 || n > 4) return
  step.value = n
  visited.value.add(n)
}
const stepDone = (n: number) => {
  if (n === 1) return isStep1Valid(form)
  return visited.value.has(n) && validateSpeechFormDetail(form)?.step !== n
}

// ---------- 直播间与地址 ----------
const rooms = ref<{ id: number; roomName: string; status: string }[]>([])
const playDomain = ref('')
const targetRoomId = ref<string>()
const sourceRoomId = ref<string>()
// 任务所属直播间：从直播间进入时为该直播间，从菜单进入时为所选源直播间
const room = computed(() => props.record || rooms.value.find((r) => String(r.id) === sourceRoomId.value) || null)
const roomSource = (id: unknown) => (id && playDomain.value ? `rtmp://${playDomain.value}/live/${id}` : '')
const defaultSource = () => roomSource(props.record?.id) || props.record?.sourceUrlHint || ''
const onSourceRoomChange = (id: unknown) => {
  if (id) form.sourceUrl = roomSource(id) || form.sourceUrl
}
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
const targetRooms = computed(() => rooms.value.filter((r) => r.status !== 'ended' && Number(r.id) !== Number(room.value?.id)))
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
    step.value = 1
    targetRoomId.value = undefined
    sourceRoomId.value = undefined
    if (props.copyFrom) {
      // 复制新建：沿用原任务的全部参数，转推时间重置
      Object.assign(form, ruleToSpeechForm(props.copyFrom.rule, props.copyFrom.name))
      visited.value = new Set([1, 2, 3, 4])
      const m = form.sourceUrl.match(/\/live\/(\d+)(\?|$)/)
      if (!props.record && m && rooms.value.some((r) => String(r.id) === m[1])) sourceRoomId.value = m[1]
      return
    }
    Object.assign(form, defaultSpeechForm())
    visited.value = new Set([1])
    if (props.record?.roomName) form.name = `${props.record.roomName}-同传`.slice(0, 20)
    form.sourceUrl = defaultSource()
    if (props.record?.targetUrlHint) form.targetUrl = props.record.targetUrlHint
  },
  { immediate: true },
)

const isPastDate = (current?: Date) => !!current && dayjs(current).isBefore(dayjs(), 'day')

// ---------- 摘要 ----------
const summary = computed(() => {
  const mode = MODES.find((m) => m.value === form.mode)?.title || ''
  const delay = form.delay ? ` · 延迟 ${form.delay}s` : ''
  const voice = form.mode === 'asr' ? '无' : form.voiceOn ? `同传声音 · ${form.voiceMode === 'fixed' ? '固定音色' : '自动复制'}` : '关闭'
  const sub = !form.subtitleOn ? '不显示' : form.mode === 'asr' ? `原文 · ${form.rows || '自适应'}${form.rows ? ' 行' : ''}` : `${form.subtitleFormat === 'both' ? '原文+译文' : '译文'} · ${form.rows || '自适应'}${form.rows ? ' 行' : ''}`
  const words = form.mode === 'asr' ? `热词 ${form.hotWords.length} · 易错词 ${form.replacePairs.length}` : `关键词 ${form.glossaryPairs.length} · 易错词 ${form.replacePairs.length}`
  return [
    { label: '模式', value: mode + delay },
    { label: '语言', value: form.mode === 'asr' ? langLabel(form.inputLang) : `${langLabel(form.inputLang)} → ${langLabel(form.outputLang)}` },
    { label: '声音', value: voice },
    { label: '字幕', value: sub },
    { label: '词库', value: words },
  ]
})

// ---------- 提交 ----------
const handleSubmit = async () => {
  const err = validateSpeechFormDetail(form)
  if (err) {
    goStep(err.step)
    Message.warning(err.message)
    return
  }
  submitting.value = true
  try {
    const resp = await api.post('/live/speech-tasks', {
      Name: form.name.trim(),
      Rule: buildSpeechTaskRule(form),
      roomId: room.value?.id ? String(room.value.id) : '',
      roomName: room.value?.roomName || '',
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

<style scoped src="./speechStep.css"></style>
<style scoped>
.stm-head { display: flex; align-items: center; justify-content: space-between; width: 100%; text-align: left; }
.stm-title { font-size: 16px; font-weight: 600; }
.stm-subtitle { font-size: 12px; font-weight: 400; color: var(--color-text-3); margin-top: 2px; }
.stm-body { display: grid; grid-template-columns: 188px minmax(0, 1fr) 340px; height: min(72vh, 680px); background: var(--color-fill-1); }
.stm-body.is-step-3 { grid-template-columns: 188px minmax(0, 1fr) 420px; }
.stm-nav { display: flex; flex-direction: column; gap: 4px; padding: 14px 10px; background: var(--color-bg-2); border-right: 1px solid var(--color-border-2); }
.stm-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 10px; border: 0; border-radius: 8px; background: none; font: inherit; color: var(--color-text-2); text-align: left; cursor: pointer; }
.stm-nav-item:hover { background: var(--color-fill-1); }
.stm-nav-item.is-active { background: rgb(var(--arcoblue-1)); color: rgb(var(--arcoblue-6)); font-weight: 600; }
.stm-nav-num { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; background: var(--color-fill-2); flex-shrink: 0; }
.stm-nav-item.is-active .stm-nav-num { background: rgb(var(--arcoblue-6)); color: #fff; }
.stm-nav-num.is-done { background: rgb(var(--green-1)); color: rgb(var(--green-6)); }
.stm-nav-opt { margin-left: auto; font-size: 11px; font-weight: 400; color: var(--color-text-3); }
.stm-nav-note { margin-top: auto; padding: 10px 12px; border-radius: 8px; background: rgb(var(--orange-1)); color: rgb(var(--orange-7)); font-size: 12px; line-height: 1.7; }
.stm-main { overflow-y: auto; padding: 16px 18px; min-width: 0; }
.stm-aside { overflow-y: auto; padding: 16px; background: var(--color-bg-2); border-left: 1px solid var(--color-border-2); display: flex; flex-direction: column; gap: 12px; }
.stm-aside-title { font-weight: 600; }
.stm-summary { display: grid; grid-template-columns: 48px minmax(0, 1fr); margin: 0; font-size: 13px; }
.stm-summary dt, .stm-summary dd { margin: 0; padding: 8px 0; border-top: 1px solid var(--color-border-1); }
.stm-summary dt { color: var(--color-text-3); }
.stm-summary dd { text-align: right; }
.stm-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 20px; border-top: 1px solid var(--color-border-2); background: var(--color-bg-2); flex-wrap: wrap; }
.stm-foot-tip { font-size: 12px; color: var(--color-text-3); }
.stm-foot-btns { display: flex; gap: 8px; }
@media (max-width: 1100px) {
  .stm-body, .stm-body.is-step-3 { grid-template-columns: minmax(0, 1fr); height: auto; max-height: 75vh; overflow-y: auto; }
  .stm-nav { flex-direction: row; flex-wrap: wrap; border-right: 0; border-bottom: 1px solid var(--color-border-2); }
  .stm-nav-note { display: none; }
  .stm-main, .stm-aside { overflow: visible; }
}
</style>
<style>
.stm-modal .arco-modal-header { height: auto; padding: 14px 20px; }
.stm-modal .arco-modal-title { width: 100%; }
</style>
