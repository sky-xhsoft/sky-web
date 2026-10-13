<template>
  <div class="dtp">
    <a-spin :loading="loading" class="dtp-spin">
      <V2Card v-if="loadError" :padding="true" class="dtp-error">
        <div>{{ loadError }}</div>
        <V2Button type="secondary" size="sm" @click="load">重试</V2Button>
      </V2Card>

      <template v-else-if="ov">
        <!-- 配置体检 -->
        <V2Card :padding="true" class="dtp-health" :class="`dtp-health--${healthLevel}`">
          <div class="dtp-health-main">
            <div class="dtp-health-icon" aria-hidden="true">
              <icon-check-circle v-if="healthLevel === 'ok'" />
              <icon-exclamation-circle v-else />
            </div>
            <div class="dtp-min0">
              <div class="dtp-health-title">{{ healthTitle }}</div>
              <ul v-if="ov.issues.length" class="dtp-issues">
                <li v-for="(is, i) in ov.issues" :key="i" :class="`dtp-issue--${is.level}`">{{ is.message }}</li>
              </ul>
            </div>
          </div>
          <div class="dtp-actions">
            <V2Button type="secondary" :loading="importing" @click="doImport">从云端导入</V2Button>
            <V2Button :disabled="!ov.callbackBase" @click="standardVisible = true">应用标准配置</V2Button>
          </div>
        </V2Card>

        <div class="dtp-grid">
          <!-- 回调配置 -->
          <V2Card :padding="true">
            <div class="dtp-card-head">
              <div class="dtp-card-title">
                回调配置
                <V2Tag v-if="cbRule" :type="statusOf(cbRule).type">{{ statusOf(cbRule).label }}</V2Tag>
              </div>
              <div class="dtp-card-actions">
                <V2Button v-if="cbRule?.managed && cbRule.callback" type="text" size="sm" @click="editCallback(cbRule.callback)">编辑模板</V2Button>
                <V2Button type="text" size="sm" @click="openBind('callback')">{{ cbRule ? '更换' : '绑定模板' }}</V2Button>
                <a-popconfirm v-if="cbRule" content="解绑后需重新推流才生效，确定解绑？" @ok="unbind('callback', cbRule)">
                  <V2Button type="text" size="sm" class="dtp-danger">解绑</V2Button>
                </a-popconfirm>
              </div>
            </div>
            <template v-if="cbRule?.callback">
              <dl class="dtp-kv">
                <dt>模板</dt>
                <dd>{{ cbRule.callback.name }} <span class="dtp-muted dtp-mono">（云端 ID {{ cbRule.cloudTemplateId }}）</span>
                  <V2Tag v-if="!cbRule.managed" type="neutral">未纳入本系统管理</V2Tag></dd>
                <dt>绑定路径</dt>
                <dd class="dtp-mono">AppName = {{ cbRule.appName || '（空）' }}</dd>
              </dl>
              <div v-for="row in callbackRows(cbRule.callback)" :key="row.label" class="dtp-cb-row">
                <span class="dtp-muted">{{ row.label }}</span>
                <span :class="row.url ? 'dtp-mono dtp-break' : 'dtp-muted'">{{ row.url || '未配置' }}</span>
                <V2Tag v-if="row.required && !row.url" type="warning">缺失</V2Tag>
                <V2Tag v-else-if="row.url && pointsHere(row.url)" type="success">指向本系统</V2Tag>
                <V2Tag v-else-if="row.url && ov.callbackBase" type="warning">非本系统</V2Tag>
                <span v-else />
              </div>
              <div v-if="cbRule.syncError" class="dtp-sync-error">{{ cbRule.syncError }}</div>
            </template>
            <div v-else class="dtp-empty">未绑定回调模板</div>
            <div v-if="otherRules(ov.callbackRules).length" class="dtp-muted dtp-foot">
              其他 AppName 的规则：{{ otherRules(ov.callbackRules).map((r) => `${r.appName || '（空）'} → ${r.callback?.name || r.cloudTemplateId}`).join('；') }}
            </div>
          </V2Card>

          <!-- 录制配置 -->
          <V2Card :padding="true">
            <div class="dtp-card-head">
              <div class="dtp-card-title">
                录制配置
                <V2Tag v-if="recRule" :type="statusOf(recRule).type">{{ statusOf(recRule).label }}</V2Tag>
              </div>
              <div class="dtp-card-actions">
                <V2Button v-if="recRule?.managed && recRule.record?.cosStore === 'Y'" type="text" size="sm" @click="editRecord(recRule.record)">编辑模板</V2Button>
                <V2Button type="text" size="sm" @click="openBind('record')">{{ recRule ? '更换' : '绑定模板' }}</V2Button>
                <a-popconfirm v-if="recRule" content="解绑后需重新推流才生效，确定解绑？" @ok="unbind('record', recRule)">
                  <V2Button type="text" size="sm" class="dtp-danger">解绑</V2Button>
                </a-popconfirm>
              </div>
            </div>
            <template v-if="recRule?.record">
              <dl class="dtp-kv">
                <dt>模板</dt>
                <dd>{{ recRule.record.name }} <span class="dtp-muted dtp-mono">（云端 ID {{ recRule.cloudTemplateId }}）</span>
                  <V2Tag v-if="!recRule.managed" type="neutral">未纳入本系统管理</V2Tag></dd>
                <dt>绑定路径</dt>
                <dd class="dtp-mono">AppName = {{ recRule.appName || '（空）' }} · {{ recRule.streamName || '全部流' }}</dd>
                <dt>存储位置</dt>
                <dd>
                  <template v-if="recRule.record.cosStore === 'Y'">存储桶 · <span class="dtp-mono">{{ recRule.record.cosBucket }} · {{ recRule.record.cosRegion }}</span></template>
                  <template v-else>云点播 VOD</template>
                </dd>
                <dt>存储路径</dt>
                <dd class="dtp-mono dtp-break">{{ recRule.record.cosPath || '—' }}</dd>
                <dt>录制格式</dt>
                <dd>{{ (recRule.record.formats || 'mp4').toUpperCase() }} · {{ recRule.record.removeWatermark === 'Y' ? '录制原始流' : '带水印 / 转码流' }}</dd>
                <dt>分段时长</dt>
                <dd>{{ Math.round(recRule.record.recordInterval / 60) }} 分钟（{{ recRule.record.recordInterval }} 秒）</dd>
              </dl>
              <div v-if="recRule.syncError" class="dtp-sync-error">{{ recRule.syncError }}</div>
            </template>
            <div v-else class="dtp-empty">未绑定录制模板，推流不会自动录制</div>
            <div class="dtp-note">录制为云平台付费增值功能，推流即产生录制费用。录制文件回调到达后，系统自动把文件转存到直播间的云盘目录。</div>
          </V2Card>
        </div>

        <!-- 高光切片 -->
        <V2Card :padding="true" class="dtp-highlight">
          <div class="dtp-card-head">
            <div class="dtp-card-title">
              高光切片配置
              <V2Tag :type="ov.highlight.count7d ? 'success' : 'neutral'">{{ ov.highlight.count7d ? `近 7 天收到 ${ov.highlight.count7d} 条` : '近 7 天未收到高光切片' }}</V2Tag>
              <V2Tag type="info">仅支持在云平台控制台配置</V2Tag>
            </div>
            <div class="dtp-card-actions">
              <V2Button type="secondary" size="sm" :disabled="!ov.highlight.callbackUrl" @click="copy(ov.highlight.callbackUrl)">复制回调地址</V2Button>
              <a class="dtp-link" :href="`https://console.cloud.tencent.com/live/domainmanage/detail/${domain}?tab=tempConfig`" target="_blank" rel="noopener">打开云平台控制台</a>
            </div>
          </div>
          <div class="dtp-hl-grid">
            <div>
              <dl class="dtp-kv">
                <dt>近 7 天切片数</dt><dd>{{ ov.highlight.count7d }} 条</dd>
                <dt>最近一次</dt><dd>{{ ov.highlight.lastTime ? formatDateTime(ov.highlight.lastTime) : '—' }}</dd>
                <dt>回调地址</dt><dd class="dtp-mono dtp-break">{{ ov.highlight.callbackUrl || '未配置系统回调地址' }}</dd>
                <dt>切片存放</dt><dd>直播间云盘目录 / 高光切片</dd>
              </dl>
              <div class="dtp-muted dtp-foot">云平台未开放高光切片的配置接口，本系统无法读取或修改其模板，只能根据实际收到的回调判断是否生效。</div>
            </div>
            <div class="dtp-steps">
              <div class="dtp-steps-title">开启步骤</div>
              <ol>
                <li>云平台控制台 → AI 智能 → 高光切片：创建高光切片模板，绑定推流域名 <b>{{ domain }}</b></li>
                <li>功能配置 → 直播回调：在该域名绑定的回调模板中，填写「高光切片回调」为左侧地址</li>
                <li>推流并产生精彩片段后，这里显示收到的切片数，切片自动存入直播间云盘</li>
              </ol>
              <div class="dtp-fee">高光切片为云平台付费增值功能，按直播时长计费</div>
            </div>
          </div>
        </V2Card>

        <p class="dtp-muted dtp-effect">
          生效说明：绑定后约 10 分钟生效；解绑或更换在<b>重新推流</b>后生效，不影响正在直播的流。配置以本系统为准，保存后自动同步到本公司的云账号。
        </p>
      </template>
    </a-spin>

    <CallbackTemplateModal v-model:visible="callbackVisible" :template="editingCallback" :defaults="defaults" @saved="load" />
    <RecordTemplateModal v-model:visible="recordVisible" :template="editingRecord" :defaults="defaults" @saved="load" />
    <BindTemplateModal v-model:visible="bindVisible" :kind="bindKind" :domain="domain" :app-name="bindAppName" @bound="load" />
    <StandardConfigModal v-model:visible="standardVisible" :domain="domain" @applied="load" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconCheckCircle, IconExclamationCircle } from '@arco-design/web-vue/es/icon'
import { V2Card, V2Button, V2Tag } from '@/components/ui'
import { formatDateTime } from '@/utils/date'
import { copyText } from '@/utils/clipboard'
import {
  getDomainTemplates, getTemplateDefaults, importTemplates, unbindTemplate, SYNC_STATUS,
  type CallbackTemplate, type DomainRuleView, type DomainTemplateOverview, type RecordTemplate, type TemplateDefaults, type TemplateKind,
} from '@/api/liveTemplate'
import CallbackTemplateModal from './CallbackTemplateModal.vue'
import RecordTemplateModal from './RecordTemplateModal.vue'
import BindTemplateModal from './BindTemplateModal.vue'
import StandardConfigModal from './StandardConfigModal.vue'

const props = defineProps<{ domain: string }>()

const loading = ref(false)
const importing = ref(false)
const loadError = ref('')
const ov = ref<DomainTemplateOverview | null>(null)
const defaults = ref<TemplateDefaults | null>(null)

const callbackVisible = ref(false)
const recordVisible = ref(false)
const bindVisible = ref(false)
const standardVisible = ref(false)
const bindKind = ref<TemplateKind>('callback')
const bindAppName = ref<string | undefined>()
const editingCallback = ref<CallbackTemplate | null>(null)
const editingRecord = ref<RecordTemplate | null>(null)

/** 本系统推流地址使用 AppName = live：优先显示该规则 */
const primary = (rules: DomainRuleView[] | null) =>
  (rules || []).find((r) => r.appName === 'live' && !r.streamName) || (rules || []).find((r) => r.appName === '' && !r.streamName) || (rules || [])[0] || null
const otherRules = (rules: DomainRuleView[] | null) => (rules || []).filter((r) => r !== primary(rules))
const cbRule = computed(() => primary(ov.value?.callbackRules ?? null))
const recRule = computed(() => primary(ov.value?.recordRules ?? null))

const healthLevel = computed(() => {
  const issues = ov.value?.issues || []
  if (issues.some((i) => i.level === 'error')) return 'error'
  if (issues.some((i) => i.level === 'warning')) return 'warning'
  return 'ok'
})
const healthTitle = computed(() => {
  const n = (ov.value?.issues || []).filter((i) => i.level !== 'info').length
  return n ? `配置体检：发现 ${n} 个问题` : '配置体检：回调与录制配置正常'
})

const statusOf = (r: DomainRuleView) => SYNC_STATUS[r.syncStatus] || SYNC_STATUS.synced
const pointsHere = (url: string) => !!ov.value?.callbackBase && url.startsWith(`${ov.value.callbackBase}/`)

const callbackRows = (t: CallbackTemplate) => [
  { label: '开播', url: t.streamBeginUrl, required: true },
  { label: '断流', url: t.streamEndUrl, required: true },
  { label: '录制文件', url: t.recordUrl, required: true },
  { label: '录制状态', url: t.recordStatusUrl, required: false },
  { label: '录制异常', url: t.recordExceptionUrl, required: false },
  { label: '推流异常', url: t.pushExceptionUrl, required: false },
]

const load = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const [o, d] = await Promise.all([getDomainTemplates(props.domain), getTemplateDefaults()])
    ov.value = o
    defaults.value = d
  } catch (e: any) {
    loadError.value = e?.message || '加载模板配置失败'
  } finally {
    loading.value = false
  }
}

const doImport = async () => {
  importing.value = true
  try {
    const r = await importTemplates()
    Message.success(`已导入回调模板 ${r.callbackTemplates} 个、录制模板 ${r.recordTemplates} 个、规则 ${r.rules} 条`)
    await load()
  } catch (e: any) {
    Message.error(e?.message || '导入失败')
  } finally {
    importing.value = false
  }
}

const editCallback = (t: CallbackTemplate) => {
  editingCallback.value = t
  callbackVisible.value = true
}
const editRecord = (t: RecordTemplate) => {
  editingRecord.value = t
  recordVisible.value = true
}
const openBind = (kind: TemplateKind) => {
  bindKind.value = kind
  // 更换时沿用现有规则的 AppName
  bindAppName.value = (kind === 'callback' ? cbRule.value : recRule.value)?.appName
  bindVisible.value = true
}

const unbind = async (kind: TemplateKind, r: DomainRuleView) => {
  try {
    await unbindTemplate(props.domain, kind, r.appName, r.streamName)
    Message.success('已解绑，重新推流后生效')
    await load()
  } catch (e: any) {
    Message.error(e?.message || '解绑失败')
  }
}

const copy = async (text: string) => {
  if (await copyText(text)) Message.success('已复制')
  else Message.error('复制失败，请手动复制')
}

onMounted(load)
</script>

<style scoped>
.dtp { display: flex; flex-direction: column; gap: 16px; }
.dtp-spin { display: block; min-height: 160px; }
.dtp-spin :deep(.arco-spin-children) { display: flex; flex-direction: column; gap: 16px; }
.dtp-error { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: rgb(var(--red-6)); }
.dtp-min0 { min-width: 0; }
.dtp-health { display: flex !important; flex-wrap: wrap; gap: 16px; align-items: flex-start; justify-content: space-between; }
.dtp-health-main { display: flex; gap: 14px; flex: 1 1 480px; min-width: 0; }
.dtp-health-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 20px; }
.dtp-health--ok .dtp-health-icon { background: rgb(var(--green-1)); color: rgb(var(--green-6)); }
.dtp-health--warning .dtp-health-icon { background: rgb(var(--orange-1)); color: rgb(var(--orange-6)); }
.dtp-health--error .dtp-health-icon { background: rgb(var(--red-1)); color: rgb(var(--red-6)); }
.dtp-health-title { font-weight: 600; font-size: 15px; margin-bottom: 6px; }
.dtp-issues { margin: 0; padding-left: 18px; line-height: 1.9; color: var(--color-text-2); }
.dtp-issue--info { color: var(--color-text-3); }
.dtp-issue--error { color: rgb(var(--red-6)); }
.dtp-actions, .dtp-card-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.dtp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 16px; }
.dtp-card-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
.dtp-card-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 16px; font-weight: 600; }
.dtp-kv { display: grid; grid-template-columns: 110px minmax(0, 1fr); row-gap: 10px; column-gap: 16px; margin: 0 0 10px; }
.dtp-kv dt { color: var(--color-text-2); }
.dtp-kv dd { margin: 0; min-width: 0; }
.dtp-cb-row { display: grid; grid-template-columns: 90px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 9px 0; border-top: 1px solid var(--color-border-1); }
.dtp-mono { font-family: Consolas, 'Cascadia Mono', monospace; font-size: 13px; }
.dtp-break { overflow-wrap: anywhere; }
.dtp-muted { color: var(--color-text-2); }
.dtp-foot { font-size: 12px; margin-top: 10px; line-height: 1.6; }
.dtp-empty { color: var(--color-text-3); padding: 12px 0; }
.dtp-sync-error { margin-top: 10px; font-size: 12px; color: rgb(var(--orange-7)); }
.dtp-note { margin-top: 14px; padding: 10px 14px; background: var(--color-fill-1); border-radius: 6px; font-size: 13px; line-height: 1.7; color: var(--color-text-2); }
.dtp-danger { color: rgb(var(--red-6)) !important; }
.dtp-link { display: inline-flex; align-items: center; height: 28px; padding: 0 10px; border: 1px solid var(--color-border-2); border-radius: 4px; font-size: 13px; color: var(--color-text-1); }
.dtp-link:hover { color: rgb(var(--arcoblue-6)); border-color: rgb(var(--arcoblue-6)); }
.dtp-hl-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; }
.dtp-steps { background: var(--color-fill-1); border-radius: 6px; padding: 14px 16px; font-size: 13px; }
.dtp-steps-title { font-weight: 600; margin-bottom: 6px; }
.dtp-steps ol { margin: 0; padding-left: 20px; line-height: 2; }
.dtp-fee { font-size: 12px; color: rgb(var(--orange-7)); margin-top: 6px; }
.dtp-effect { font-size: 13px; margin: 0 2px; line-height: 1.7; }
@media (max-width: 640px) {
  .dtp-grid, .dtp-hl-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
