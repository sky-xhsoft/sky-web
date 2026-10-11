<template>
  <V2Modal
    :visible="visible"
    :title="template?.id ? '编辑回调模板' : '新增回调模板'"
    :width="720"
    :ok-loading="saving"
    ok-text="保存并同步"
    unmount-on-close
    @ok="submit"
    @cancel="$emit('update:visible', false)"
    @update:visible="$emit('update:visible', $event)"
  >
    <a-form ref="formRef" :model="form" layout="vertical" class="ctm-form">
      <div class="ctm-grid">
        <a-form-item field="name" label="模板名称" :rules="nameRules" validate-trigger="blur">
          <a-input v-model="form.name" placeholder="仅支持中文、英文、数字、_ 和 -" :max-length="255" />
        </a-form-item>
        <a-form-item field="description" label="描述">
          <a-input v-model="form.description" :max-length="1024" />
        </a-form-item>
      </div>

      <div class="ctm-base">
        <div>
          <div class="ctm-label">系统回调地址（当前环境）</div>
          <div class="ctm-mono">{{ defaults?.callbackBase || '未配置（tencentCloud.live.callbackURL）' }}</div>
        </div>
        <V2Button type="secondary" size="sm" :disabled="!defaults?.callbackBase" @click="fillDefaults">按系统地址填充</V2Button>
      </div>

      <div class="ctm-section-title">
        <span>回调地址</span>
        <span class="ctm-tip">至少启用一项</span>
      </div>
      <div v-for="item in items" :key="item.key" class="ctm-row">
        <a-checkbox v-model="item.enabled">{{ item.label }}</a-checkbox>
        <div class="ctm-row-input">
          <a-input v-model="item.url" :disabled="!item.enabled" :placeholder="item.enabled ? 'http(s)://' : '未启用'" class="ctm-mono" />
          <a-checkbox-group v-if="item.key === 'recordExceptionUrl' && item.enabled" v-model="levels" class="ctm-levels">
            <span class="ctm-tip">通知级别</span>
            <a-checkbox value="error">错误</a-checkbox>
            <a-checkbox value="alarm">告警</a-checkbox>
          </a-checkbox-group>
        </div>
      </div>
      <div class="ctm-row">
        <span class="ctm-muted">高光切片回调</span>
        <div class="ctm-note">
          腾讯云未开放此项接口，请在控制台的回调模板中填写
          <span class="ctm-mono ctm-strong">{{ defaults?.highlightUrl || '[系统回调地址]/api/v1/live/callback/highlight' }}</span>。
          本系统同步时只更新上方各项，不会清除控制台已填写的高光切片回调。
        </div>
      </div>

      <a-form-item field="callbackKey" label="回调密钥" class="ctm-key">
        <a-input-password v-model="form.callbackKey" placeholder="留空：不校验签名" allow-clear />
      </a-form-item>

      <div class="ctm-info">
        保存后自动同步到本公司的腾讯云账号<template v-if="boundDomains">。此模板已绑定 <b>{{ boundDomains }}</b>，修改会同时影响这些域名</template>，约 5 分钟后生效。
      </div>
    </a-form>
  </V2Modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { V2Modal, V2Button } from '@/components/ui'
import { saveCallbackTemplate, SYNC_STATUS, type CallbackTemplate, type TemplateDefaults } from '@/api/liveTemplate'

const props = defineProps<{ visible: boolean; template?: CallbackTemplate | null; defaults?: TemplateDefaults | null }>()
const emit = defineEmits<{ 'update:visible': [boolean]; saved: [CallbackTemplate] }>()

type UrlKey = 'streamBeginUrl' | 'streamEndUrl' | 'recordUrl' | 'recordStatusUrl' | 'recordExceptionUrl' | 'pushExceptionUrl'
const ITEMS: { key: UrlKey; label: string }[] = [
  { key: 'streamBeginUrl', label: '开播回调' },
  { key: 'streamEndUrl', label: '断流回调' },
  { key: 'recordUrl', label: '录制文件回调' },
  { key: 'recordStatusUrl', label: '录制状态回调' },
  { key: 'recordExceptionUrl', label: '录制异常回调' },
  { key: 'pushExceptionUrl', label: '推流异常回调' },
]

const formRef = ref()
const saving = ref(false)
const form = reactive({ name: '', description: '', callbackKey: '' })
const items = ref(ITEMS.map((i) => ({ ...i, enabled: false, url: '' })))
const levels = ref<string[]>(['error'])

const nameRules = [
  { required: true, message: '请输入模板名称' },
  { match: /^[一-龥A-Za-z0-9_-]+$/, message: '仅支持中文、英文、数字、_ 和 -' },
]

const boundDomains = computed(() => (props.template?.rules || []).map((r) => r.domainName).join('、'))

const fillDefaults = () => {
  for (const item of items.value) {
    const url = props.defaults?.[item.key]
    if (url) {
      item.url = url
      item.enabled = true
    }
  }
}

watch(
  () => props.visible,
  (open) => {
    if (!open) return
    const t = props.template
    form.name = t?.name || ''
    form.description = t?.description || ''
    form.callbackKey = t?.callbackKey || ''
    levels.value = t?.recordExceptionLevels ? t.recordExceptionLevels.split(',') : ['error']
    items.value = ITEMS.map((i) => ({ ...i, url: t?.[i.key] || '', enabled: !!t?.[i.key] }))
    // 新建时按系统回调地址预填全部回调
    if (!t?.id) fillDefaults()
  },
  { immediate: true },
)

const submit = async () => {
  if (await formRef.value?.validate()) return
  const enabled = items.value.filter((i) => i.enabled)
  if (!enabled.length) {
    Message.warning('至少启用一个回调')
    return
  }
  const bad = enabled.find((i) => !/^https?:\/\//.test(i.url.trim()))
  if (bad) {
    Message.warning(`${bad.label}须以 http:// 或 https:// 开头`)
    return
  }
  const payload: Partial<CallbackTemplate> = { ...form }
  for (const i of items.value) payload[i.key] = i.enabled ? i.url.trim() : ''
  payload.recordExceptionLevels = payload.recordExceptionUrl ? levels.value.join(',') : ''
  saving.value = true
  try {
    const saved = await saveCallbackTemplate(payload, props.template?.id)
    if (saved.syncStatus === 'synced') Message.success('已保存并同步到腾讯云')
    else Message.warning(`已保存，${SYNC_STATUS[saved.syncStatus].label}：${saved.syncError || ''}`)
    emit('saved', saved)
    emit('update:visible', false)
  } catch (e: any) {
    Message.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.ctm-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; }
.ctm-base { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; background: var(--color-fill-1); border-radius: 6px; margin-bottom: 16px; }
.ctm-label { font-size: 13px; color: var(--color-text-2); }
.ctm-mono { font-family: Consolas, 'Cascadia Mono', monospace; font-size: 13px; overflow-wrap: anywhere; }
.ctm-strong { color: var(--color-text-1); }
.ctm-section-title { display: flex; justify-content: space-between; align-items: baseline; font-weight: 600; margin-bottom: 4px; }
.ctm-tip { font-size: 12px; color: var(--color-text-3); font-weight: normal; }
.ctm-row { display: grid; grid-template-columns: 130px minmax(0, 1fr); gap: 12px; align-items: center; padding: 8px 0; border-top: 1px solid var(--color-border-1); }
.ctm-row-input { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.ctm-levels { display: flex; align-items: center; gap: 8px; }
.ctm-muted { color: var(--color-text-2); }
.ctm-note { font-size: 12px; line-height: 1.6; color: var(--color-text-2); background: var(--color-fill-1); border-radius: 4px; padding: 8px 10px; }
.ctm-key { margin-top: 12px; }
.ctm-info { padding: 10px 14px; border-radius: 6px; background: rgb(var(--arcoblue-1)); color: rgb(var(--arcoblue-6)); font-size: 13px; line-height: 1.7; }
@media (max-width: 640px) {
  .ctm-grid { grid-template-columns: minmax(0, 1fr); }
  .ctm-row { grid-template-columns: minmax(0, 1fr); }
}
</style>
