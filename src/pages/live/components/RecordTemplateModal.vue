<template>
  <V2Modal
    :visible="visible"
    :title="template?.id ? '编辑录制模板' : '新增录制模板'"
    :width="640"
    :ok-loading="saving"
    ok-text="保存并同步"
    unmount-on-close
    @ok="submit"
    @cancel="$emit('update:visible', false)"
    @update:visible="$emit('update:visible', $event)"
  >
    <a-form ref="formRef" :model="form" layout="vertical">
      <div class="rtm-grid">
        <a-form-item field="name" label="模板名称" :rules="nameRules" validate-trigger="blur">
          <a-input v-model="form.name" placeholder="仅支持中文、英文、数字、_ 和 -" :max-length="255" />
        </a-form-item>
        <a-form-item field="description" label="描述">
          <a-input v-model="form.description" :max-length="1024" />
        </a-form-item>
        <a-form-item field="cosRegion" label="COS 地域" :rules="[{ required: true, message: '请选择地域' }]">
          <a-select v-model="form.cosRegion" :options="regionOptions" :loading="bucketsLoading" allow-search placeholder="选择地域" @change="onRegionChange" />
        </a-form-item>
        <a-form-item field="cosBucket" label="COS 存储桶" :rules="[{ required: true, message: '请选择存储桶' }]">
          <a-select v-model="form.cosBucket" :options="bucketOptions" :loading="bucketsLoading" allow-search placeholder="选择存储桶" @change="onBucketChange" />
        </a-form-item>
      </div>
      <div class="rtm-buckets">
        <span v-if="bucketsLoading">正在获取本公司腾讯云账号下的存储桶…</span>
        <span v-else-if="bucketsError" class="rtm-warn">{{ bucketsError }}</span>
        <span v-else>本公司腾讯云账号下共 {{ buckets.length }} 个存储桶</span>
        <a-link v-if="!bucketsLoading" :hoverable="false" @click="loadBuckets">刷新</a-link>
      </div>
      <a-form-item field="cosPath" label="存储路径" :rules="pathRules">
        <a-input v-model="form.cosPath" class="rtm-mono" />
        <template #extra>须以 / 开头，并包含时间占位符（如 {StartYear}）或 {RandomID}，否则录制文件会重名覆盖</template>
      </a-form-item>
      <div class="rtm-grid">
        <a-form-item field="minutes" label="分段时长（分钟）">
          <a-input-number v-model="form.minutes" :min="1" :max="720" />
        </a-form-item>
        <a-form-item field="removeWatermark" label="录制内容">
          <a-radio-group v-model="form.removeWatermark">
            <a-radio value="Y">原始流</a-radio>
            <a-radio value="N">带水印 / 转码流</a-radio>
          </a-radio-group>
        </a-form-item>
      </div>
      <div class="rtm-info">
        录制格式为 MP4，存储至 COS。录制为腾讯云付费增值功能，推流期间产生录制和 COS 存储费用。
        <template v-if="defaults?.cosBucket">本公司 COS：{{ defaults.cosBucket }}（{{ defaults.cosRegion }}）。</template>
      </div>
    </a-form>
  </V2Modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { V2Modal } from '@/components/ui'
import { listCosBuckets, saveRecordTemplate, SYNC_STATUS, type CosBucketOption, type RecordTemplate, type TemplateDefaults } from '@/api/liveTemplate'

const props = defineProps<{ visible: boolean; template?: RecordTemplate | null; defaults?: TemplateDefaults | null }>()
const emit = defineEmits<{ 'update:visible': [boolean]; saved: [RecordTemplate] }>()

const formRef = ref()
const saving = ref(false)
const form = reactive({ name: '', description: '', cosBucket: '', cosRegion: '', cosPath: '', minutes: 30, removeWatermark: 'Y' as 'Y' | 'N' })

// ---------- 地域与存储桶：从公司腾讯云账号拉取后下拉选择，存储桶按所选地域筛选 ----------
const buckets = ref<CosBucketOption[]>([])
const bucketsLoading = ref(false)
const bucketsError = ref('')
// 编辑时原值不在账号的存储桶中（如已删除）也要显示出来
const missing = '（不在本账号中）'
const regionOptions = computed(() => {
  const regions = [...new Set(buckets.value.map((b) => b.region))]
  const opts = regions.map((r) => ({ value: r, label: r }))
  if (form.cosRegion && !regions.includes(form.cosRegion)) opts.unshift({ value: form.cosRegion, label: form.cosRegion + missing })
  return opts
})
const bucketOptions = computed(() => {
  const opts = buckets.value
    .filter((b) => !form.cosRegion || b.region === form.cosRegion)
    .map((b) => ({ value: b.bucket, label: `${b.bucket}${form.cosRegion ? '' : `（${b.region}）`}${b.company ? ' · 公司默认' : ''}` }))
  if (form.cosBucket && !opts.some((o) => o.value === form.cosBucket)) opts.unshift({ value: form.cosBucket, label: form.cosBucket + missing })
  return opts
})
// 换地域后原存储桶不在该地域时：只有一个或有公司默认存储桶则自动选上，否则清空
const onRegionChange = () => {
  const inRegion = buckets.value.filter((b) => b.region === form.cosRegion)
  if (inRegion.some((b) => b.bucket === form.cosBucket)) return
  form.cosBucket = (inRegion.find((b) => b.company) || (inRegion.length === 1 ? inRegion[0] : null))?.bucket || ''
}
// 未选地域时直接选存储桶，带出其地域
const onBucketChange = () => {
  const found = buckets.value.find((b) => b.bucket === form.cosBucket && (!form.cosRegion || b.region === form.cosRegion))
  if (found) form.cosRegion = found.region
}
const loadBuckets = async () => {
  bucketsLoading.value = true
  bucketsError.value = ''
  try {
    buckets.value = await listCosBuckets()
  } catch (e: any) {
    buckets.value = []
    bucketsError.value = e?.response?.data?.message || e?.message || '获取存储桶失败'
  } finally {
    bucketsLoading.value = false
  }
}

const nameRules = [
  { required: true, message: '请输入模板名称' },
  { match: /^[一-龥A-Za-z0-9_-]+$/, message: '仅支持中文、英文、数字、_ 和 -' },
]
const pathRules = [
  { required: true, message: '请输入存储路径' },
  {
    validator: (v: string, cb: (e?: string) => void) => {
      if (!v?.startsWith('/')) return cb('须以 / 开头')
      if (!/\{(Start|End)\w*\}|\{RandomID\}/.test(v)) return cb('须包含时间占位符或 {RandomID}')
      cb()
    },
  },
]

watch(
  () => props.visible,
  (open) => {
    if (!open) return
    const t = props.template
    const d = props.defaults
    form.name = t?.name || ''
    form.description = t?.description || ''
    form.cosBucket = t?.cosBucket ?? d?.cosBucket ?? ''
    form.cosRegion = t?.cosRegion ?? d?.cosRegion ?? ''
    form.cosPath = t?.cosPath || d?.cosPath || '/video/live/{StreamID}/{StartYear}{StartMonth}{StartDay}/'
    form.minutes = Math.round((t?.recordInterval || d?.recordInterval || 1800) / 60)
    form.removeWatermark = t?.removeWatermark || 'Y'
    loadBuckets()
  },
  { immediate: true },
)

const submit = async () => {
  if (await formRef.value?.validate()) return
  saving.value = true
  try {
    const { minutes, ...rest } = form
    const saved = await saveRecordTemplate({ ...rest, recordInterval: minutes * 60 }, props.template?.id)
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
.rtm-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; }
.rtm-mono :deep(input) { font-family: Consolas, 'Cascadia Mono', monospace; }
.rtm-warn { color: rgb(var(--warning-6)); }
.rtm-buckets { display: flex; gap: 8px; align-items: center; margin: -8px 0 16px; color: var(--color-text-3); font-size: 12px; }
.rtm-info { padding: 10px 14px; border-radius: 6px; background: var(--color-fill-1); color: var(--color-text-2); font-size: 13px; line-height: 1.7; }
@media (max-width: 640px) {
  .rtm-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
