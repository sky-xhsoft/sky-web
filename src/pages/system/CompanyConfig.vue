<template>
  <!-- 公司配置：腾讯云直播 / 云盘存储 / AI 同传，折叠面板，一次展开一项 -->
  <div class="company-config">
    <div class="cc-head">
      <span class="cc-title">公司配置</span>
      <span class="cc-note">{{ isAdmin ? '直播、存储与 AI 能力依赖以下配置' : '仅管理员可修改' }}</span>
    </div>

    <a-spin :loading="loading" style="width: 100%">
      <div v-for="section in sections" :key="section.key" :class="['cc-item', { 'is-open': openKey === section.key }]">
        <div :class="['cc-item-head', { 'is-clickable': isAdmin }]" @click="toggle(section.key)">
          <span class="cc-item-title">{{ section.title }}</span>
          <span :class="['cc-tag', `is-${section.status.level}`]">{{ statusText[section.status.level] }}</span>
          <span class="cc-item-summary">{{ section.status.summary }}</span>
          <span v-if="isAdmin" class="cc-arrow">{{ openKey === section.key ? '收起 ▴' : '展开 ▾' }}</span>
        </div>

        <div v-if="isAdmin && openKey === section.key" class="cc-item-body">
          <div class="cc-desc">
            {{ section.desc }}
            <a-link v-if="section.keyLink" :href="section.keyLink" target="_blank" class="cc-key-link">获取密钥 ↗</a-link>
          </div>

          <!-- 腾讯云直播 -->
          <div v-if="section.key === 'live'" class="cc-grid2">
            <div class="cc-field">
              <div class="cc-label">SecretId</div>
              <a-input v-model="secretInputs.tencentCloudSecretId" :placeholder="secretPlaceholder('tencentCloudSecretId')" class="cc-mono" />
            </div>
            <div class="cc-field">
              <div class="cc-label">SecretKey</div>
              <a-input-password v-model="secretInputs.tencentCloudSecretKey" :placeholder="secretPlaceholder('tencentCloudSecretKey')" class="cc-mono" />
            </div>
            <div class="cc-field">
              <div class="cc-label">区域</div>
              <a-input v-model="form.tencentCloudRegion" placeholder="例如 ap-guangzhou" class="cc-mono" />
            </div>
            <div class="cc-field">
              <div class="cc-label">回调密钥</div>
              <a-input-password v-model="secretInputs.tencentCloudCallbackKey" :placeholder="secretPlaceholder('tencentCloudCallbackKey', '未设置')" class="cc-mono" />
              <div class="cc-hint">与腾讯云直播回调模板中的「回调密钥」一致</div>
            </div>
          </div>

          <!-- 云盘存储 -->
          <template v-else-if="section.key === 'storage'">
            <div class="cc-field">
              <div class="cc-label">存储类型</div>
              <a-radio-group v-model="form.storageType" type="button" size="small">
                <a-radio value="tencentCOS">腾讯云 COS</a-radio>
                <a-radio value="local">服务器本地</a-radio>
              </a-radio-group>
              <div v-if="form.storageType === 'local'" class="cc-hint">文件保存在服务器磁盘，适合测试或私有化部署</div>
            </div>
            <template v-if="form.storageType === 'tencentCOS'">
              <div class="cc-field">
                <div class="cc-label">Bucket 地址</div>
                <a-input v-model="form.tencentCosBucketUrl" placeholder="https://{bucket}.cos.{region}.myqcloud.com" class="cc-mono" />
                <div v-if="parsedBucket.bucket" class="cc-chips">
                  <span class="cc-chip">Bucket 名称 <b>{{ parsedBucket.bucket }}</b></span>
                  <span class="cc-chip">区域 <b>{{ parsedBucket.region }}</b>（已从地址识别）</span>
                </div>
              </div>
              <!-- 地址无法识别时手动填写 -->
              <div v-if="form.tencentCosBucketUrl && !parsedBucket.bucket" class="cc-grid2">
                <div class="cc-field">
                  <div class="cc-label">Bucket 名称</div>
                  <a-input v-model="form.tencentCosBucketName" placeholder="例如 mybucket-1250000000" class="cc-mono" />
                </div>
                <div class="cc-field">
                  <div class="cc-label">区域</div>
                  <a-input v-model="form.tencentCosRegion" placeholder="例如 ap-guangzhou" class="cc-mono" />
                </div>
              </div>
              <div class="cc-grid2">
                <div class="cc-field">
                  <div class="cc-label">访问密钥</div>
                  <a-radio-group v-model="cosKeyMode" type="button" size="small">
                    <a-radio value="live">使用直播密钥</a-radio>
                    <a-radio value="own">单独设置</a-radio>
                  </a-radio-group>
                  <div class="cc-hint">直播和存储在同一个腾讯云账号时无需重复填写</div>
                </div>
                <div class="cc-field">
                  <div class="cc-label">CDN 域名（可选）</div>
                  <a-input v-model="form.tencentCosCdnDomain" placeholder="https://cdn.example.com" class="cc-mono" />
                </div>
              </div>
              <div v-if="cosKeyMode === 'own'" class="cc-grid2">
                <div class="cc-field">
                  <div class="cc-label">COS SecretId</div>
                  <a-input v-model="secretInputs.tencentCosSecretId" :placeholder="secretPlaceholder('tencentCosSecretId')" class="cc-mono" />
                </div>
                <div class="cc-field">
                  <div class="cc-label">COS SecretKey</div>
                  <a-input-password v-model="secretInputs.tencentCosSecretKey" :placeholder="secretPlaceholder('tencentCosSecretKey')" class="cc-mono" />
                </div>
              </div>
            </template>
          </template>

          <!-- AI 同传 / 字幕 -->
          <div v-else class="cc-grid2">
            <div class="cc-field">
              <div class="cc-label">Access Key ID</div>
              <a-input v-model="secretInputs.volcengineAccessKeyId" :placeholder="secretPlaceholder('volcengineAccessKeyId')" class="cc-mono" />
            </div>
            <div class="cc-field">
              <div class="cc-label">Access Key Secret</div>
              <a-input-password v-model="secretInputs.volcengineAccessKeySecret" :placeholder="secretPlaceholder('volcengineAccessKeySecret')" class="cc-mono" />
            </div>
            <div class="cc-field">
              <div class="cc-label">区域</div>
              <a-input v-model="form.volcengineRegion" placeholder="例如 cn-north-1" class="cc-mono" />
            </div>
            <div class="cc-field">
              <div class="cc-label">火山方舟 API Key <span class="cc-hint-inline">（字幕同传词库智能提取）</span></div>
              <a-input-password v-model="secretInputs.arkApiKey" :placeholder="secretPlaceholder('arkApiKey')" class="cc-mono" />
            </div>
            <div class="cc-field">
              <div class="cc-label">火山方舟推理接入点</div>
              <a-input v-model="form.arkModel" placeholder="例如 ep-20261011xxxxxx-xxxxx" class="cc-mono" />
              <div class="cc-hint">固定使用北京区域（cn-beijing）：请在火山方舟控制台「在线推理」的北京区域创建豆包模型接入点，填写 ep- 开头的接入点 ID</div>
            </div>
          </div>

          <div class="cc-foot">
            <span v-if="changeCount" class="cc-changed">● 有 {{ changeCount }} 项修改未保存</span>
            <span class="cc-spacer" />
            <a-button size="small" :disabled="!changeCount" @click="resetEdits">撤销</a-button>
            <a-button size="small" type="primary" :loading="submitting" :disabled="!changeCount" @click="handleSave">保存</a-button>
          </div>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { getCompanyConfig, updateCompanyConfig, type UpdateCompanyConfigRequest } from '@/api/company'
import type { CompanyConf } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

type Level = 'ok' | 'warn' | 'off'
type SectionKey = 'live' | 'storage' | 'ai'
type SecretField =
  | 'tencentCloudSecretId'
  | 'tencentCloudSecretKey'
  | 'tencentCloudCallbackKey'
  | 'tencentCosSecretId'
  | 'tencentCosSecretKey'
  | 'volcengineAccessKeyId'
  | 'volcengineAccessKeySecret'
  | 'arkApiKey'
type TextField =
  | 'tencentCloudRegion'
  | 'storageType'
  | 'tencentCosBucketUrl'
  | 'tencentCosBucketName'
  | 'tencentCosRegion'
  | 'tencentCosCdnDomain'
  | 'volcengineRegion'
  | 'arkModel'

const SECRET_FIELDS: SecretField[] = [
  'tencentCloudSecretId', 'tencentCloudSecretKey', 'tencentCloudCallbackKey',
  'tencentCosSecretId', 'tencentCosSecretKey', 'volcengineAccessKeyId', 'volcengineAccessKeySecret', 'arkApiKey',
]
const TEXT_FIELDS: TextField[] = [
  'tencentCloudRegion', 'storageType', 'tencentCosBucketUrl', 'tencentCosBucketName',
  'tencentCosRegion', 'tencentCosCdnDomain', 'volcengineRegion', 'arkModel',
]

const statusText: Record<Level, string> = { ok: '已配置', warn: '配置不完整', off: '未配置' }

const authStore = useAuthStore()
// 后端 IS_ADMIN 为 Y / N；保存接口仅管理员可调用
const isAdmin = computed(() => authStore.user?.isAdmin === 'Y')

const loading = ref(false)
const submitting = ref(false)
const conf = ref<Partial<CompanyConf>>({})

// 非密钥字段：编辑值；密钥字段：只在输入新值时提交（接口返回的是脱敏值，不回填）
const form = reactive<Record<TextField, string>>({} as Record<TextField, string>)
const secretInputs = reactive<Record<SecretField, string>>({} as Record<SecretField, string>)
const cosKeyMode = ref<'live' | 'own'>('live')

const has = (field: SecretField) => !!secretInputs[field] || !!conf.value[field]

const secretPlaceholder = (field: SecretField, emptyText = '请输入') =>
  conf.value[field] ? `已设置（${conf.value[field]}），留空不修改` : emptyText

// 与后端一致：COS 地址 https://{bucket}.cos.{region}.myqcloud.com
const parseBucketUrl = (url: string) => {
  const m = /^(?:https?:\/\/)?([^./]+)\.cos\.([a-z0-9-]+)\.myqcloud\.com/.exec((url || '').trim())
  return m ? { bucket: m[1], region: m[2] } : { bucket: '', region: '' }
}
const parsedBucket = computed(() => parseBucketUrl(form.tencentCosBucketUrl))

// 与后端一致的存储类型规范化：cos → tencentCOS；为空且填了 COS 地址按 COS，否则本地
const normalizeStorageType = (c: Partial<CompanyConf>) => {
  const t = (c.storageType || '').trim().toLowerCase()
  if (t === 'cos' || t === 'tencentcos') return 'tencentCOS'
  if (t === 'local') return 'local'
  if (t === '') return c.tencentCosBucketUrl ? 'tencentCOS' : 'local'
  return c.storageType || 'local'
}

const resetEdits = () => {
  const c = conf.value
  TEXT_FIELDS.forEach((f) => { form[f] = (c[f] as string) || '' })
  form.storageType = normalizeStorageType(c)
  SECRET_FIELDS.forEach((f) => { secretInputs[f] = '' })
  cosKeyMode.value = c.tencentCosSecretId || c.tencentCosSecretKey ? 'own' : 'live'
}

// 用户修改 Bucket 地址时同步名称与区域（加载 / 撤销时地址未变，不算修改）
watch(() => form.tencentCosBucketUrl, (url) => {
  if ((url || '') === (conf.value.tencentCosBucketUrl || '')) return
  const { bucket, region } = parseBucketUrl(url)
  if (bucket) {
    form.tencentCosBucketName = bucket
    form.tencentCosRegion = region
  }
})

// 待提交内容：只包含实际修改的字段
const payload = computed<UpdateCompanyConfigRequest>(() => {
  const c = conf.value
  const p: Record<string, string> = {}
  TEXT_FIELDS.forEach((f) => {
    if (f === 'storageType') return
    if ((form[f] || '') !== ((c[f] as string) || '')) p[f] = form[f]
  })
  SECRET_FIELDS.forEach((f) => {
    if (secretInputs[f]) p[f] = secretInputs[f]
  })
  // 使用直播密钥：不提交 COS 单独密钥；原先单独设置过的清空
  if (cosKeyMode.value === 'live') {
    delete p.tencentCosSecretId
    delete p.tencentCosSecretKey
    if (c.tencentCosSecretId || c.tencentCosSecretKey) {
      p.tencentCosSecretId = ''
      p.tencentCosSecretKey = ''
    }
  }
  // 存储有改动或类型变化时明确写入存储类型（历史数据可能为空或别名）
  const storageTouched = ['tencentCosBucketUrl', 'tencentCosBucketName', 'tencentCosRegion', 'tencentCosCdnDomain', 'tencentCosSecretId', 'tencentCosSecretKey'].some((k) => k in p)
  if (form.storageType !== normalizeStorageType(c) || (storageTouched && form.storageType !== c.storageType)) {
    p.storageType = form.storageType
  }
  return p as UpdateCompanyConfigRequest
})
const changeCount = computed(() => Object.keys(payload.value).length)

// ==================== 各项状态 ====================
const liveStatus = computed(() => {
  const id = has('tencentCloudSecretId')
  const key = has('tencentCloudSecretKey')
  if (!id && !key) return { level: 'off' as Level, summary: '需要腾讯云 SecretId 与 SecretKey' }
  if (!id || !key) return { level: 'warn' as Level, summary: `缺少 ${id ? 'SecretKey' : 'SecretId'}` }
  const region = form.tencentCloudRegion || '未设置区域'
  return { level: 'ok' as Level, summary: `${region} · ${has('tencentCloudCallbackKey') ? '回调密钥已设置' : '回调密钥未设置'}` }
})

const storageStatus = computed(() => {
  if (form.storageType === 'local') return { level: 'ok' as Level, summary: '服务器本地存储' }
  const missing: string[] = []
  if (!form.tencentCosBucketUrl) missing.push('Bucket 地址')
  else {
    if (!(parsedBucket.value.bucket || form.tencentCosBucketName)) missing.push('Bucket 名称')
    if (!(parsedBucket.value.region || form.tencentCosRegion)) missing.push('区域')
  }
  const keysOk = cosKeyMode.value === 'live'
    ? has('tencentCloudSecretId') && has('tencentCloudSecretKey')
    : has('tencentCosSecretId') && has('tencentCosSecretKey')
  if (!keysOk) missing.push(cosKeyMode.value === 'live' ? '直播密钥' : 'COS 密钥')
  if (missing.length) return { level: 'warn' as Level, summary: `腾讯云 COS · 缺少${missing.join('、')}` }
  const region = parsedBucket.value.region || form.tencentCosRegion
  return { level: 'ok' as Level, summary: `腾讯云 COS · ${region}` }
})

const aiStatus = computed(() => {
  const id = has('volcengineAccessKeyId')
  const key = has('volcengineAccessKeySecret')
  if (!id && !key) return { level: 'off' as Level, summary: isAdmin.value ? '需要火山引擎 Access Key' : '请联系管理员配置' }
  if (!id || !key) return { level: 'warn' as Level, summary: `缺少 ${id ? 'Access Key Secret' : 'Access Key ID'}` }
  const ark = has('arkApiKey') && !!form.arkModel ? '词库提取已开启' : '未配置词库提取'
  return { level: 'ok' as Level, summary: `${form.volcengineRegion || 'cn-north-1'} · ${ark}` }
})

const sections = computed(() => [
  { key: 'live' as SectionKey, title: '腾讯云直播', desc: '用于直播域名、推流 / 播放地址、社媒分发与直播回调', keyLink: 'https://console.cloud.tencent.com/cam/capi', status: liveStatus.value },
  { key: 'storage' as SectionKey, title: '云盘存储', desc: '云盘上传的文件、直播录制与切片的保存位置', keyLink: '', status: storageStatus.value },
  { key: 'ai' as SectionKey, title: 'AI 同传 / 字幕', desc: '火山引擎账号，用于直播同传、字幕与翻译', keyLink: 'https://console.volcengine.com/iam/keymanage/', status: aiStatus.value },
])

// 一次只展开一项；默认展开第一个需要处理的项
const openKey = ref<SectionKey | ''>('')
const toggle = (key: SectionKey) => {
  if (!isAdmin.value) return
  openKey.value = openKey.value === key ? '' : key
}

const loadConfig = async () => {
  loading.value = true
  try {
    conf.value = (await getCompanyConfig()) || {}
    resetEdits()
    if (isAdmin.value && !openKey.value) {
      openKey.value = sections.value.find((s) => s.status.level !== 'ok')?.key || ''
    }
  } catch (error: any) {
    console.error('加载公司配置失败:', error)
    Message.error(error.response?.data?.message || '加载配置失败')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!changeCount.value) return
  submitting.value = true
  try {
    const updated = await updateCompanyConfig(payload.value)
    conf.value = updated || {}
    authStore.companyConf = updated
    resetEdits()
    Message.success('保存成功')
  } catch (error: any) {
    console.error('保存公司配置失败:', error)
    Message.error(error.response?.data?.message || error.message || '保存配置失败')
  } finally {
    submitting.value = false
  }
}

onMounted(loadConfig)

defineExpose({ sections, payload })
</script>

<style scoped>
.company-config {
  padding: 18px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
}

.cc-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.cc-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.cc-note {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-tertiary);
}

.cc-item {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
}

.cc-item + .cc-item {
  margin-top: 8px;
}

.cc-item.is-open {
  border-color: var(--brand-blue);
}

.cc-item-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
}

.cc-item-head.is-clickable {
  cursor: pointer;
}

.cc-item-title {
  min-width: 96px;
  font-weight: 600;
  color: var(--text-primary);
}

.cc-item-summary {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  color: var(--text-tertiary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cc-arrow {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-tertiary);
}

.cc-tag {
  flex-shrink: 0;
  padding: 0 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.cc-tag.is-ok {
  background: var(--success-bg);
  color: var(--success);
}

.cc-tag.is-warn {
  background: var(--warning-bg);
  color: var(--warning);
}

.cc-tag.is-off {
  background: var(--bg-page);
  color: var(--text-tertiary);
}

.cc-item-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px 14px;
  border-top: 1px dashed var(--border-light);
}

.cc-desc {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--text-tertiary);
}

.cc-key-link {
  margin-left: auto;
  font-size: 12px;
}

.cc-grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}

.cc-label {
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.cc-hint-inline { font-size: 12px; color: var(--color-text-3); font-weight: 400; }
.cc-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.cc-mono :deep(input) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.cc-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.cc-chip {
  padding: 2px 10px;
  border-radius: 12px;
  background: var(--bg-page);
  font-size: 12px;
  color: var(--text-secondary);
}

.cc-chip b {
  font-weight: 500;
  color: var(--text-primary);
}

.cc-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
}

.cc-spacer {
  flex: 1;
}

.cc-changed {
  font-size: 12px;
  color: var(--warning);
}
</style>
