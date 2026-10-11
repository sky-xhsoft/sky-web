<template>
  <V2Modal
    :visible="visible"
    :title="kind === 'callback' ? '绑定回调模板' : '绑定录制模板'"
    :width="520"
    :ok-loading="saving"
    ok-text="绑定"
    unmount-on-close
    @ok="submit"
    @cancel="$emit('update:visible', false)"
    @update:visible="$emit('update:visible', $event)"
  >
    <a-form :model="form" layout="vertical">
      <a-form-item label="推流域名" required>
        <a-input v-if="domain" :model-value="domain" disabled />
        <a-select v-else v-model="form.domain" :loading="loadingOptions" placeholder="选择推流域名" allow-search>
          <a-option v-for="d in domains" :key="d" :value="d">{{ d }}</a-option>
        </a-select>
      </a-form-item>
      <a-form-item label="模板" required>
        <a-select v-model="form.templateId" :loading="loadingOptions" placeholder="选择模板" :disabled="!!templateId">
          <a-option v-for="t in templates" :key="t.id" :value="t.id">
            {{ t.name }}<span class="btm-muted">{{ t.cloudTemplateId ? `（云端 ID ${t.cloudTemplateId}）` : '（未同步）' }}</span>
          </a-option>
        </a-select>
      </a-form-item>
      <div class="btm-grid">
        <a-form-item label="AppName">
          <a-input v-model="form.appName" :placeholder="props.appName === '' ? '（空：对整个域名生效）' : 'live'" />
        </a-form-item>
        <a-form-item v-if="kind === 'record'" label="流名称">
          <a-input v-model="form.streamName" placeholder="留空：全部流" />
        </a-form-item>
      </div>
      <div class="btm-info">
        本系统推流地址使用 AppName = live。域名已有其他模板时会先解绑再绑定：新绑定约 10 分钟生效，正在直播的流需重新推流后才按新配置。
      </div>
    </a-form>
  </V2Modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { V2Modal } from '@/components/ui'
import { listDomains } from '@/api/live'
import { bindTemplate, listCallbackTemplates, listRecordTemplates, type TemplateKind } from '@/api/liveTemplate'

// appName：更换已有规则时传入其 AppName（可能为空，表示对整个域名生效），沿用原值才能替换而不是新增一条规则
const props = defineProps<{ visible: boolean; kind: TemplateKind; domain?: string; templateId?: number; appName?: string }>()
const emit = defineEmits<{ 'update:visible': [boolean]; bound: [] }>()

const saving = ref(false)
const loadingOptions = ref(false)
const domains = ref<string[]>([])
const templates = ref<{ id: number; name: string; cloudTemplateId: number }[]>([])
const form = reactive({ domain: '', templateId: undefined as number | undefined, appName: 'live', streamName: '' })

const loadOptions = async () => {
  loadingOptions.value = true
  try {
    const res = props.kind === 'callback' ? await listCallbackTemplates() : await listRecordTemplates()
    templates.value = res.items || []
    if (!props.domain) {
      const d = await listDomains(0)
      const list = d.data?.data?.domains || []
      domains.value = list.filter((x: any) => (x.Type ?? x.type) === 0).map((x: any) => x.Name || x.name)
    }
  } catch (e: any) {
    Message.error(e?.message || '加载失败')
  } finally {
    loadingOptions.value = false
  }
}

watch(
  () => props.visible,
  (open) => {
    if (!open) return
    form.domain = props.domain || ''
    form.templateId = props.templateId
    form.appName = props.appName ?? 'live'
    form.streamName = ''
    loadOptions()
  },
  { immediate: true },
)

const submit = async () => {
  const domain = props.domain || form.domain
  if (!domain || !form.templateId) {
    Message.warning('请选择推流域名和模板')
    return
  }
  saving.value = true
  try {
    const appName = form.appName.trim()
    const domainWide = appName === '' && props.appName === ''
    await bindTemplate(domain, { kind: props.kind, templateId: form.templateId, appName: domainWide ? '' : appName || 'live', streamName: form.streamName.trim(), domainWide })
    Message.success('已绑定，约 10 分钟后生效')
    emit('bound')
    emit('update:visible', false)
  } catch (e: any) {
    Message.error(e?.message || '绑定失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.btm-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; }
.btm-muted { color: var(--color-text-3); margin-left: 4px; }
.btm-info { padding: 10px 14px; border-radius: 6px; background: var(--color-fill-1); color: var(--color-text-2); font-size: 13px; line-height: 1.7; }
</style>
