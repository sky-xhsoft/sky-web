<template>
  <div class="live-domain-page">
    <!-- 顶部说明 -->
    <div class="page-notice">
      <div class="notice-item">
        <strong>{{ texts.pushDomainNotice }}</strong>
        {{ texts.pushDomainNoticeDesc }} <a href="#" target="_blank">{{ texts.usageLimits }}</a>
      </div>
      <div class="notice-item">
        <strong>{{ texts.playDomainNotice }}</strong>
        {{ texts.playDomainNoticeDesc }} <a href="#" target="_blank">{{ texts.domainManagement }}</a> {{ texts.or }} <a href="#" target="_blank">{{ texts.cnameConfig }}</a>
      </div>
      <div class="notice-item">
        {{ texts.domainOwnershipNotice }} <a href="#" target="_blank">{{ texts.domainOwnership }}</a>
      </div>
    </div>

    <!-- 搜索和添加按钮 -->
    <div class="page-toolbar">
      <div class="toolbar-right">
        <a-input-search
          v-model="searchKeyword"
          :placeholder="texts.searchPlaceholder"
          style="width: 260px"
          @search="handleSearch"
        />
        <a-button type="primary" @click="showAddDialog">
          <template #icon>
            <icon-plus />
          </template>
          {{ texts.addDomain }}
        </a-button>
      </div>
    </div>

    <!-- 域名列表表格 -->
    <a-table
      :loading="loading"
      :data="filteredDomains"
      :pagination="pagination"
      :bordered="{ wrapper: true, cell: true }"
      row-key="name"
    >
      <template #columns>
        <a-table-column :title="texts.domainTitle" data-index="name" :width="200">
          <template #cell="{ record }">
            <div class="domain-cell">
              <a-link>{{ record.name }}</a-link>
              <icon-copy class="copy-icon" @click="copyToClipboard(record.name)" />
            </div>
          </template>
        </a-table-column>

        <a-table-column :title="texts.cname" :width="300">
          <template #cell="{ record }">
            <div class="cname-cell">
              <a-tooltip :content="getCnameStatusTooltip(record.cnameConfigured)">
                <icon-check-circle-fill
                  v-if="record.cnameConfigured === 1"
                  class="cname-status-icon cname-success"
                />
                <icon-exclamation-circle-fill
                  v-else
                  class="cname-status-icon cname-unconfigured"
                />
              </a-tooltip>
              <span>{{ record.cname || record.name + '.liveplay.com' }}</span>
              <icon-copy class="copy-icon" @click="copyToClipboard(record.cname)" />
            </div>
          </template>
        </a-table-column>

        <a-table-column :title="texts.type" :width="80">
          <template #cell="{ record }">
            <a-tag :color="record.type === 0 ? 'blue' : 'green'">
              {{ record.type === 0 ? texts.pushDomain : texts.playDomain }}
            </a-tag>
          </template>
        </a-table-column>

        <a-table-column :title="texts.region" data-index="region" :width="80">
          <template #cell="{ record }">
            {{ record.region || texts.globalAcceleration }}
          </template>
        </a-table-column>

        <a-table-column :title="texts.status" :width="120">
          <template #cell="{ record }">
            <div class="status-cell">
              <span :class="['status-dot', record.status === 1 ? 'status-enabled' : 'status-disabled']"></span>
              <span>{{ record.status === 1 ? texts.enabled : texts.disabled }}</span>
            </div>
          </template>
        </a-table-column>

        <a-table-column :title="texts.createTime" :width="180">
          <template #cell="{ record }">
            {{ formatDateTime(record.createTime) }}
          </template>
        </a-table-column>

        <a-table-column :title="texts.actions" :width="200" fixed="right">
          <template #cell="{ record }">
            <a-space>
              <a-link @click="handleManage(record)">{{ texts.manage }}</a-link>
              <a-link
                v-if="record.status === 1"
                @click="handleForbid(record)"
              >
                {{ texts.disable }}
              </a-link>
              <a-link
                v-else
                status="success"
                @click="handleEnable(record)"
              >
                {{ texts.enable }}
              </a-link>
              <a-link status="danger" @click="handleDelete(record)">{{ texts.delete }}</a-link>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <!-- 添加域名对话框 - 步进式 -->
    <a-modal
      v-model:visible="addDialogVisible"
      :title="currentStep === 1 ? texts.addDomainTitle : texts.cnameConfigTitle"
      :width="700"
      :footer="false"
      @cancel="handleCancelAdd"
    >
      <a-steps :current="currentStep" style="margin-bottom: 24px">
        <a-step :title="texts.basicConfig" />
        <a-step :title="texts.cnameConfigTitle" />
      </a-steps>

      <!-- 步骤1：基本配置 -->
      <div v-if="currentStep === 1">
        <a-form
          ref="addFormRef"
          :model="addForm"
          :rules="addFormRules"
          layout="vertical"
        >
          <a-form-item :label="texts.typeLabel" field="domainType">
            <a-radio-group v-model="addForm.domainType">
              <a-radio :value="0">{{ texts.pushDomain }}</a-radio>
              <a-radio :value="1">{{ texts.playDomain }}</a-radio>
            </a-radio-group>
            <div class="form-tip">
              {{ texts.typeTip }}
            </div>
          </a-form-item>

          <a-form-item :label="texts.accelerationRegion" field="region">
            <a-select v-model="addForm.region" :placeholder="texts.regionPlaceholder">
              <a-option value="global">{{ texts.globalAcceleration }}</a-option>
              <a-option value="cn">{{ texts.mainlandChina }}</a-option>
              <a-option value="overseas">{{ texts.overseas }}</a-option>
            </a-select>
          </a-form-item>

          <a-form-item :label="texts.domainName" field="domainName">
            <a-input
              v-model="addForm.domainName"
              :placeholder="texts.domainNamePlaceholder"
            />
            <div class="form-tip">
              {{ texts.domainNameTip }}
            </div>
          </a-form-item>

          <a-form-item :label="texts.tags">
            <a-input
              v-model="addForm.tags"
              :placeholder="texts.tagsPlaceholder"
            />
            <div class="form-tip">
              {{ texts.tagsTip }}
            </div>
          </a-form-item>
        </a-form>

        <div style="text-align: right; margin-top: 24px">
          <a-space>
            <a-button @click="handleCancelAdd">{{ texts.cancel }}</a-button>
            <a-button type="primary" :loading="submitting" @click="handleAddDomain">
              {{ texts.addAndNext }}
            </a-button>
          </a-space>
        </div>
      </div>

      <!-- 步骤2：CNAME配置 -->
      <div v-if="currentStep === 2">
        <a-alert type="success" style="margin-bottom: 20px">
          {{ texts.domainAddedSuccess }}
        </a-alert>

        <!-- CNAME 配置状态 -->
        <div class="cname-status-card" style="margin-bottom: 20px">
          <div class="status-header">
            <span class="status-label">{{ texts.cnameStatusLabel }}</span>
            <a-tag :color="cnameStatusColor" size="large">
              <template #icon>
                <span :class="['status-dot', cnameStatusClass]"></span>
              </template>
              {{ cnameStatusText }}
            </a-tag>
          </div>
        </div>

        <div class="cname-config-section">
          <h4>{{ texts.configSteps }}：</h4>
          <ol class="config-steps">
            <li>{{ texts.step1 }}</li>
            <li>{{ texts.step2 }}</li>
            <li>{{ texts.step3 }}</li>
          </ol>

          <a-table
            :data="cnameRecords"
            :pagination="false"
            :bordered="{ wrapper: true, cell: true }"
            style="margin: 16px 0"
          >
            <template #columns>
              <a-table-column :title="texts.domainTitle" data-index="domain" :width="200" />
              <a-table-column :title="texts.hostRecord" data-index="host" :width="120" />
              <a-table-column :title="texts.recordType" data-index="type" :width="100" />
              <a-table-column :title="texts.recordValue" data-index="value">
                <template #cell="{ record }">
                  <div class="cname-cell">
                    <span>{{ record.value }}</span>
                    <icon-copy class="copy-icon" @click="copyToClipboard(record.value)" />
                  </div>
                </template>
              </a-table-column>
            </template>
          </a-table>

          <a-alert type="info" style="margin-bottom: 16px">
            <template #icon>
              <icon-info-circle />
            </template>
            {{ texts.cnameNotice }}
          </a-alert>

          <div class="config-links">
            <a href="https://cloud.tencent.com/document/product/267/19908" target="_blank">
              {{ texts.howToConfigCname }}
            </a>
            <span class="divider">|</span>
            <a href="#" @click.prevent="checkCnameStatus">
              {{ texts.checkCnameStatus }}
            </a>
          </div>
        </div>

        <div style="text-align: right; margin-top: 24px">
          <a-space>
            <a-button @click="handleFinishAdd">{{ texts.configureLater }}</a-button>
            <a-button type="primary" @click="handleFinishAdd">
              {{ texts.finish }}
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconPlus,
  IconCopy,
  IconInfoCircle,
  IconCheckCircleFill,
  IconExclamationCircleFill
} from '@arco-design/web-vue/es/icon'
import type { FormInstance, FieldRule } from '@arco-design/web-vue'
import {
  listDomains,
  addDomain,
  deleteDomain,
  enableDomain,
  forbidDomain,
  verifyDomainOwner
} from '@/api/live'
import { useNavigationStore } from '@/stores/navigation'
import { useI18n } from 'vue-i18n'
import { formatDateTime } from '@/utils/date'

const { t } = useI18n()
const navigationStore = useNavigationStore()

const texts = computed(() => ({
  pushDomainNotice: t('liveDomain.pushDomainNotice'),
  pushDomainNoticeDesc: t('liveDomain.pushDomainNoticeDesc'),
  usageLimits: t('liveDomain.usageLimits'),
  playDomainNotice: t('liveDomain.playDomainNotice'),
  playDomainNoticeDesc: t('liveDomain.playDomainNoticeDesc'),
  domainManagement: t('liveDomain.domainManagement'),
  cnameConfig: t('liveDomain.cnameConfig'),
  domainOwnershipNotice: t('liveDomain.domainOwnershipNotice'),
  domainOwnership: t('liveDomain.domainOwnership'),
  searchPlaceholder: t('liveDomain.searchPlaceholder'),
  addDomain: t('liveDomain.addDomain'),
  domainTitle: t('liveDomain.domainTitle'),
  cname: t('liveDomain.cname'),
  type: t('liveDomain.type'),
  region: t('liveDomain.region'),
  status: t('liveDomain.status'),
  createTime: t('liveDomain.createTime'),
  actions: t('liveDomain.actions'),
  manage: t('liveDomain.manage'),
  disable: t('liveDomain.disable'),
  enable: t('liveDomain.enable'),
  delete: t('liveDomain.delete'),
  pushDomain: t('liveDomain.pushDomain'),
  playDomain: t('liveDomain.playDomain'),
  globalAcceleration: t('liveDomain.globalAcceleration'),
  enabled: t('liveDomain.enabled'),
  disabled: t('liveDomain.disabled'),
  cnameConfigured: t('liveDomain.cnameConfigured'),
  cnameNotConfigured: t('liveDomain.cnameNotConfigured'),
  addDomainTitle: t('liveDomain.addDomainTitle'),
  cnameConfigTitle: t('liveDomain.cnameConfigTitle'),
  basicConfig: t('liveDomain.basicConfig'),
  typeLabel: t('liveDomain.typeLabel'),
  typeTip: t('liveDomain.typeTip'),
  accelerationRegion: t('liveDomain.accelerationRegion'),
  regionPlaceholder: t('liveDomain.regionPlaceholder'),
  mainlandChina: t('liveDomain.mainlandChina'),
  overseas: t('liveDomain.overseas'),
  domainName: t('liveDomain.domainName'),
  domainNamePlaceholder: t('liveDomain.domainNamePlaceholder'),
  domainNameTip: t('liveDomain.domainNameTip'),
  tags: t('liveDomain.tags'),
  tagsPlaceholder: t('liveDomain.tagsPlaceholder'),
  tagsTip: t('liveDomain.tagsTip'),
  cancel: t('liveDomain.cancel'),
  addAndNext: t('liveDomain.addAndNext'),
  domainAddedSuccess: t('liveDomain.domainAddedSuccess'),
  cnameStatusLabel: t('liveDomain.cnameStatusLabel'),
  configSteps: t('liveDomain.configSteps'),
  step1: t('liveDomain.step1'),
  step2: t('liveDomain.step2'),
  step3: t('liveDomain.step3'),
  hostRecord: t('liveDomain.hostRecord'),
  recordType: t('liveDomain.recordType'),
  recordValue: t('liveDomain.recordValue'),
  cnameNotice: t('liveDomain.cnameNotice'),
  howToConfigCname: t('liveDomain.howToConfigCname'),
  checkCnameStatus: t('liveDomain.checkCnameStatus'),
  configureLater: t('liveDomain.configureLater'),
  finish: t('liveDomain.finish'),
  cnameConfiguredStatus: t('liveDomain.cnameConfiguredStatus'),
  cnameConfigFailedStatus: t('liveDomain.cnameConfigFailedStatus'),
  cnameNotConfiguredStatus: t('liveDomain.cnameNotConfiguredStatus'),
  loadDomainsError: t('liveDomain.loadDomainsError'),
  pleaseInputDomain: t('liveDomain.pleaseInputDomain'),
  pleaseInputValidDomain: t('liveDomain.pleaseInputValidDomain'),
  pleaseSelectDomainType: t('liveDomain.pleaseSelectDomainType'),
  pleaseSelectAccelerationRegion: t('liveDomain.pleaseSelectAccelerationRegion'),
  addDomainSuccess: t('liveDomain.addDomainSuccess'),
  addDomainError: t('liveDomain.addDomainError'),
  domainInfoNotExist: t('liveDomain.domainInfoNotExist'),
  cnameVerifySuccess: t('liveDomain.cnameVerifySuccess'),
  cnameVerifyFailed: t('liveDomain.cnameVerifyFailed'),
  checkCnameError: t('liveDomain.checkCnameError'),
  domainDetailTitle: t('liveDomain.domainDetailTitle'),
  enableDomainTitle: t('liveDomain.enableDomainTitle'),
  enableDomainConfirm: t('liveDomain.enableDomainConfirm'),
  confirm: t('liveDomain.confirm'),
  enableDomainSuccess: t('liveDomain.enableDomainSuccess'),
  enableDomainError: t('liveDomain.enableDomainError'),
  disableDomainTitle: t('liveDomain.disableDomainTitle'),
  disableDomainConfirm: t('liveDomain.disableDomainConfirm'),
  disableDomainSuccess: t('liveDomain.disableDomainSuccess'),
  disableDomainError: t('liveDomain.disableDomainError'),
  deleteDomainTitle: t('liveDomain.deleteDomainTitle'),
  deleteDomainConfirm: t('liveDomain.deleteDomainConfirm'),
  deleteDomainSuccess: t('liveDomain.deleteDomainSuccess'),
  deleteDomainError: t('liveDomain.deleteDomainError'),
  copySuccess: t('liveDomain.copySuccess'),
  copyError: t('liveDomain.copyError'),
  copyManual: t('liveDomain.copyManual'),
}))

// 前端使用的域名信息接口（小写字段）
interface DomainInfo {
  name: string
  type: number
  status: number
  createTime: string
  updateTime?: string
  cname?: string
  region?: string
  cnameConfigured?: number // 0-未配置，1-已配置，2-配置失败
}

// 数据
const loading = ref(false)
const domains = ref<DomainInfo[]>([])
const activeTab = ref('push')
const searchKeyword = ref('')

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: true,
  showPageSize: true,
})

// 添加对话框
const addDialogVisible = ref(false)
const submitting = ref(false)
const currentStep = ref(1)
const addedDomainName = ref('')
const cnameStatus = ref(0) // 0-未配置，1-已配置，2-配置失败
const addFormRef = ref<FormInstance>()
const addForm = reactive({
  domainName: '',
  domainType: 0,
  region: 'global',
  tags: ''
})

// 表单验证规则
const addFormRules = computed(() => ({
  domainName: [
    { required: true, message: texts.value.pleaseInputDomain },
    {
      match: /^[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
      message: texts.value.pleaseInputValidDomain
    }
  ],
  domainType: [
    { required: true, message: texts.value.pleaseSelectDomainType }
  ],
  region: [
    { required: true, message: texts.value.pleaseSelectAccelerationRegion }
  ]
}))

// 过滤后的域名列表
const filteredDomains = computed(() => {
  let result = domains.value

  // 过滤掉以 tlivecloud.com 为后缀的域名
  result = result.filter(d => !d.name.endsWith('tlivecloud.com'))

  // 根据搜索关键词过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(d =>
      d.name.toLowerCase().includes(keyword)
    )
  }

  pagination.total = result.length
  return result
})

// CNAME 配置记录
const cnameRecords = computed(() => {
  if (!addedDomainName.value) return []

  return [{
    domain: addedDomainName.value,
    host: '@',
    type: 'CNAME',
    value: addedDomainName.value + '.liveplay.com'
  }]
})

// CNAME 状态文本
const cnameStatusText = computed(() => {
  switch (cnameStatus.value) {
    case 1:
      return texts.value.cnameConfiguredStatus
    case 2:
      return texts.value.cnameConfigFailedStatus
    default:
      return texts.value.cnameNotConfiguredStatus
  }
})

// CNAME 状态颜色
const cnameStatusColor = computed(() => {
  switch (cnameStatus.value) {
    case 1:
      return 'green'
    case 2:
      return 'red'
    default:
      return 'gray'
  }
})

// CNAME 状态样式类
const cnameStatusClass = computed(() => {
  switch (cnameStatus.value) {
    case 1:
      return 'status-enabled'
    case 2:
      return 'status-disabled'
    default:
      return 'status-disabled'
  }
})

// 加载域名列表
const loadDomains = async () => {
  loading.value = true
  try {
    const response = await listDomains(undefined)

    // 后端返回格式: { code: 200, data: { domains: [...], total: 3 } }
    const result = response.data
    if (result && result.data) {
      // 后端返回的字段名是大写的，需要转换为小写以便前端使用
      const rawDomains = result.data.domains || []
      domains.value = rawDomains.map((d: any) => ({
        name: d.Name,
        type: d.Type,
        status: d.Status,
        createTime: d.CreateTime,
        updateTime: d.UpdateTime,
        cname: d.TargetDomain || '', // 使用后端返回的 TargetDomain 字段
        region: d.Region || texts.value.globalAcceleration,
        cnameConfigured: d.BCName || 0 // 使用后端返回的 BCName 字段
      }))
    } else {
      domains.value = []
    }
  } catch (error: any) {
    console.error('加载域名列表失败:', error)
    Message.error(error.response?.data?.message || texts.value.loadDomainsError)
    domains.value = []
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
}

// 显示添加对话框
const showAddDialog = () => {
  addForm.domainName = ''
  addForm.domainType = 0 // 默认推流域名
  addForm.region = 'global'
  addForm.tags = ''
  currentStep.value = 1
  addedDomainName.value = ''
  cnameStatus.value = 0 // 重置为未配置
  addDialogVisible.value = true
}

// 取消添加
const handleCancelAdd = () => {
  addDialogVisible.value = false
  currentStep.value = 1
  addedDomainName.value = ''
  cnameStatus.value = 0 // 重置为未配置
}

// 添加域名（步骤1）
const handleAddDomain = async () => {

  if (!addFormRef.value) {
    return
  }

  try {
    await addFormRef.value.validate()
  } catch (error) {
    // 验证失败
    console.error('Validation error:', error)
    return
  }

  submitting.value = true
  try {
    await addDomain({
      domainName: addForm.domainName,
      domainType: addForm.domainType
    })
    Message.success(texts.value.addDomainSuccess)
    addedDomainName.value = addForm.domainName
    cnameStatus.value = 0 // 重置为未配置
    currentStep.value = 2
    loadDomains()
  } catch (error: any) {
    console.error('Add domain error:', error)
    Message.error(error.response?.data?.message || texts.value.addDomainError)
  } finally {
    submitting.value = false
  }
}

// 完成添加（步骤2）
const handleFinishAdd = () => {
  addDialogVisible.value = false
  currentStep.value = 1
  addedDomainName.value = ''
  cnameStatus.value = 0 // 重置为未配置
}

// 查询 CNAME 状态
const checkCnameStatus = async () => {
  if (!addedDomainName.value) {
    Message.warning(texts.value.domainInfoNotExist)
    return
  }

  try {
    const response = await verifyDomainOwner(addedDomainName.value, 'dnsCheck')
    const result = response.data.data

    // 更新状态
    cnameStatus.value = result.status

    if (result.status === 1) {
      Message.success(texts.value.cnameVerifySuccess)
    } else {
      // status === 0 (未验证) 或 status === 2 (验证失败) 都显示相同提示
      Message.error(texts.value.cnameVerifyFailed)
    }
  } catch (error: any) {
    Message.error(error.response?.data?.message || texts.value.checkCnameError)
  }
}

// 获取 CNAME 状态提示文本
const getCnameStatusTooltip = (status?: number) => {
  return status === 1 ? texts.value.cnameConfigured : texts.value.cnameNotConfigured
}

// 管理域名
const handleManage = (row: DomainInfo) => {
  // 使用 navigationStore 跳转到域名详情页
  navigationStore.navigateTo('LiveDomainDetail', `${texts.value.domainDetailTitle} - ${row.name}`, { domainName: row.name })
}

// 启用域名
const handleEnable = async (row: DomainInfo) => {
  Modal.confirm({
    title: texts.value.enableDomainTitle,
    content: `${texts.value.enableDomainConfirm} ${row.name}？`,
    okText: texts.value.confirm,
    cancelText: texts.value.cancel,
    onOk: async () => {
      try {
        await enableDomain(row.name)
        Message.success(texts.value.enableDomainSuccess)
        loadDomains()
      } catch (error: any) {
        Message.error(error.response?.data?.message || texts.value.enableDomainError)
      }
    }
  })
}

// 禁用域名
const handleForbid = async (row: DomainInfo) => {
  Modal.confirm({
    title: texts.value.disableDomainTitle,
    content: `${texts.value.disableDomainConfirm} ${row.name}？`,
    okText: texts.value.confirm,
    cancelText: texts.value.cancel,
    onOk: async () => {
      try {
        await forbidDomain(row.name)
        Message.success(texts.value.disableDomainSuccess)
        loadDomains()
      } catch (error: any) {
        Message.error(error.response?.data?.message || texts.value.disableDomainError)
      }
    }
  })
}

// 删除域名
const handleDelete = async (row: DomainInfo) => {
  Modal.confirm({
    title: texts.value.deleteDomainTitle,
    content: `${texts.value.deleteDomainConfirm} ${row.name}？`,
    okText: texts.value.confirm,
    cancelText: texts.value.cancel,
    okButtonProps: {
      status: 'danger'
    },
    onOk: async () => {
      try {
        await deleteDomain(row.name)
        Message.success(texts.value.deleteDomainSuccess)
        loadDomains()
      } catch (error: any) {
        Message.error(error.response?.data?.message || texts.value.deleteDomainError)
      }
    }
  })
}

// 复制到剪贴板
const copyToClipboard = (text: string) => {
  if (!text) return

  // 优先使用 Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      Message.success(texts.value.copySuccess)
    }).catch(() => {
      Message.error(texts.value.copyError)
    })
  } else {
    // 降级方案：使用传统的 document.execCommand
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textarea)

      if (successful) {
        Message.success(texts.value.copySuccess)
      } else {
        Message.error(texts.value.copyError)
      }
    } catch (err) {
      Message.error(texts.value.copyManual)
    }
  }
}

// 初始化
onMounted(() => {
  loadDomains()
})
</script>

<style scoped>
.live-domain-page {
  padding: 20px;
  background: #fff;
  min-height: 100%;
  overflow-y: auto;
}

.page-notice {
  background: #e8f4ff;
  border: 1px solid #bedaff;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.8;
}

.notice-item {
  margin-bottom: 8px;
}

.notice-item:last-child {
  margin-bottom: 0;
}

.notice-item strong {
  font-weight: 600;
  color: #1d2129;
}

.notice-item a {
  color: #165dff;
  text-decoration: none;
}

.notice-item a:hover {
  text-decoration: underline;
}

.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.domain-cell,
.cname-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.copy-icon {
  cursor: pointer;
  color: #86909c;
  font-size: 14px;
}

.copy-icon:hover {
  color: #165dff;
}

.cname-status-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.cname-success {
  color: #00b42a;
}

.cname-failed {
  color: #f53f3f;
}

.cname-unconfigured {
  color: #86909c;
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-enabled {
  background-color: #00b42a;
}

.status-disabled {
  background-color: #86909c;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #86909c;
  line-height: 1.5;
}

.cname-config-section {
  padding: 8px 0;
}

.cname-config-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 12px;
}

.config-steps {
  margin: 0 0 16px 0;
  padding-left: 20px;
  font-size: 14px;
  color: #4e5969;
  line-height: 1.8;
}

.config-steps li {
  margin-bottom: 8px;
}

.config-links {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.config-links a {
  color: #165dff;
  text-decoration: none;
}

.config-links a:hover {
  text-decoration: underline;
}

.config-links .divider {
  color: #e5e6eb;
}

.cname-status-card {
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  padding: 16px;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-label {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}
</style>
