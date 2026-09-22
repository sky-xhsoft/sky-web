<template>
  <div class="company-config-page">
    <V2PageHeader title="公司配置" description="管理当前租户的全局配置与云服务商凭证">
      <template #actions>
        <V2Button type="secondary" @click="handleReset">
          <template #icon><icon-refresh /></template>
          重置
        </V2Button>
        <V2Button :loading="submitting" @click="handleSubmit">
          <template #icon><icon-save /></template>
          保存配置
        </V2Button>
      </template>
    </V2PageHeader>

    <V2Card :padding="true">
      <a-tabs v-model:activeKey="activeTab" type="line" size="large">
        <a-tab-pane key="storage" title="存储配置">
          <a-form :model="form" layout="vertical" size="small">
            <div v-if="form.storageType === 'tencentCOS' || !form.storageType">
              <a-row :gutter="24">
                <a-col :span="12">
                  <a-form-item label="Bucket URL">
                    <a-input v-model="form.tencentCosBucketUrl" placeholder="https://bucket.cos.ap-guangzhou.myqcloud.com" @change="markChanged('tencentCosBucketUrl')" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="Bucket 名称">
                    <a-input v-model="form.tencentCosBucketName" placeholder="my-bucket" @change="markChanged('tencentCosBucketName')" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="Secret ID">
                    <a-input v-model="form.tencentCosSecretId" placeholder="请输入 Secret ID" @change="markChanged('tencentCosSecretId')" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="Secret Key">
                    <a-input-password v-model="form.tencentCosSecretKey" placeholder="请输入 Secret Key" @change="markChanged('tencentCosSecretKey')" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="区域">
                    <a-input v-model="form.tencentCosRegion" placeholder="ap-guangzhou" @change="markChanged('tencentCosRegion')" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="CDN 域名">
                    <a-input v-model="form.tencentCosCdnDomain" placeholder="https://cdn.example.com" @change="markChanged('tencentCosCdnDomain')" />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>
          </a-form>
        </a-tab-pane>

        <a-tab-pane key="cloud" title="云服务商凭证">
          <a-form :model="form" layout="vertical" size="small">
            <div class="section-title">通用云 API 凭证
              <a-link class="get-key-link" href="https://console.cloud.tencent.com/cam/capi" target="_blank">获取密钥</a-link>
            </div>
            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item label="Secret ID">
                  <a-input v-model="form.secretId" placeholder="请输入通用 Secret ID" @change="markChanged('secretId')" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="Secret Key">
                  <a-input-password v-model="form.secretKey" placeholder="请输入通用 Secret Key" @change="markChanged('secretKey')" />
                </a-form-item>
              </a-col>
            </a-row>

            <div class="section-title" style="margin-top: 16px;">腾讯云直播 / 云 API</div>
            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item label="Secret ID">
                  <a-input v-model="form.tencentCloudSecretId" placeholder="请输入腾讯云 Secret ID" @change="markChanged('tencentCloudSecretId')" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="Secret Key">
                  <a-input-password v-model="form.tencentCloudSecretKey" placeholder="请输入腾讯云 Secret Key" @change="markChanged('tencentCloudSecretKey')" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="区域">
                  <a-input v-model="form.tencentCloudRegion" placeholder="ap-guangzhou" @change="markChanged('tencentCloudRegion')" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="回调 Key">
                  <a-input v-model="form.tencentCloudCallbackKey" placeholder="请输入回调 Key" @change="markChanged('tencentCloudCallbackKey')" />
                </a-form-item>
              </a-col>
            </a-row>

            <div class="section-title" style="margin-top: 16px;">AI 智能</div>
            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item label="Access Key ID">
                  <a-input v-model="form.volcengineAccessKeyId" placeholder="请输入 Access Key ID" @change="markChanged('volcengineAccessKeyId')" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="Access Key Secret">
                  <a-input-password v-model="form.volcengineAccessKeySecret" placeholder="请输入 Access Key Secret" @change="markChanged('volcengineAccessKeySecret')" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="区域">
                  <a-input v-model="form.volcengineRegion" placeholder="cn-north-1" @change="markChanged('volcengineRegion')" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="服务">
                  <a-input v-model="form.volcengineService" placeholder="live" @change="markChanged('volcengineService')" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-tab-pane>
      </a-tabs>
    </V2Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconRefresh, IconSave } from '@arco-design/web-vue/es/icon'
import { getCompanyConfig, updateCompanyConfig, type UpdateCompanyConfigRequest } from '@/api/company'
import type { CompanyConf } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { V2PageHeader, V2Card, V2Button } from '@/components/ui'

const authStore = useAuthStore()
const activeTab = ref('storage')
const loading = ref(false)
const submitting = ref(false)

const form = reactive<Partial<CompanyConf>>({})
const originalForm = reactive<Partial<CompanyConf>>({})
const changedFields = new Set<string>()

const isMasked = (value?: string) => typeof value === 'string' && value.includes('****')

const markChanged = (field: string) => changedFields.add(field)

const loadConfig = async () => {
  loading.value = true
  try {
    const conf = await getCompanyConfig()
    if (conf) {
      Object.assign(form, conf)
      Object.assign(originalForm, JSON.parse(JSON.stringify(conf)))
    }
  } catch (error: any) {
    console.error('加载公司配置失败:', error)
    Message.error(error.response?.data?.message || '加载配置失败')
  } finally {
    loading.value = false
  }
}

const buildPayload = (): UpdateCompanyConfigRequest => {
  const payload: UpdateCompanyConfigRequest = {}
  const keys = Array.from(changedFields) as (keyof CompanyConf)[]
  keys.forEach((key) => {
    const value = form[key] as any
    if (isMasked(originalForm[key] as string) && isMasked(value)) return
    if (JSON.stringify(value) !== JSON.stringify(originalForm[key])) {
      payload[key] = value
    }
  })
  return payload
}

const handleSubmit = async () => {
  const payload = buildPayload()
  if (Object.keys(payload).length === 0) {
    Message.info('没有需要保存的修改')
    return
  }
  submitting.value = true
  try {
    const updated = await updateCompanyConfig(payload)
    Message.success('保存成功')
    Object.assign(form, updated)
    Object.assign(originalForm, JSON.parse(JSON.stringify(updated)))
    authStore.companyConf = updated
    changedFields.clear()
  } catch (error: any) {
    console.error('保存公司配置失败:', error)
    Message.error(error.response?.data?.message || '保存配置失败')
  } finally {
    submitting.value = false
  }
}

const handleReset = () => {
  Object.assign(form, JSON.parse(JSON.stringify(originalForm)))
  changedFields.clear()
  Message.success('已重置')
}

onMounted(() => loadConfig())
</script>

<style scoped>
.company-config-page {
  padding: 12px;
  background: var(--bg-page);
  height: 100%;
  overflow-y: auto;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.get-key-link {
  font-size: 13px;
  font-weight: 400;
}
</style>
