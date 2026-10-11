<template>
  <div class="live-domain-page">
    <V2Card class="page-notice" :padding="true" style="margin-bottom: 20px;">
      <div class="notice-item">
        <strong>{{ t('liveDomain.pageNotice.pushDomain') }}</strong>
        系统提供的推流域名仅供测试使用，<a href="#" target="_blank">使用上有诸多限制</a>，建议您尽快添加自有域名。
      </div>
      <div class="notice-item">
        <strong>{{ t('liveDomain.pageNotice.playDomain') }}</strong>
        若需要在您自有域名下播放直播流，需要先添加播放域名，并完成域名CNAME配置。<a href="#" target="_blank">域名管理</a> 或 <a href="#" target="_blank">CNAME配置</a>
      </div>
      <div class="notice-item">{{ t('liveDomain.pageNotice.domainOwner') }}</div>
    </V2Card>

    <V2PageHeader
      :title="t('liveDomain.title') || '域名管理'"
      :description="t('liveDomain.desc') || '管理推流/播放域名及 CNAME 配置'"
    >
      <template #actions>
        <a-input-search v-model="searchKeyword" :placeholder="t('liveDomain.searchPlaceholder')" style="width: 260px" @search="handleSearch" />
        <V2Button @click="showAddDialog">
          <template #icon><icon-plus /></template>
          {{ t('liveDomain.addDomain') }}
        </V2Button>
      </template>
    </V2PageHeader>

    <V2Card :padding="false" style="overflow: hidden;">
      <a-table :loading="loading" :data="filteredDomains" :pagination="pagination" :bordered="{ wrapper: true, cell: true }" row-key="name">
        <template #columns>
          <a-table-column :title="t('liveDomain.domainTable.domain')" data-index="name" :width="200">
            <template #cell="{ record }">
              <div class="domain-cell"><a-link>{{ record.name }}</a-link><icon-copy class="copy-icon" @click="copyToClipboard(record.name)" /></div>
            </template>
          </a-table-column>
          <a-table-column :title="t('liveDomain.domainTable.cname')" :width="300">
            <template #cell="{ record }">
              <div class="cname-cell">
                <a-tooltip :content="getCnameStatusTooltip(record.cnameConfigured)">
                  <icon-check-circle-fill v-if="record.cnameConfigured === 1" class="cname-status-icon cname-success" />
                  <icon-exclamation-circle-fill v-else class="cname-status-icon cname-unconfigured" />
                </a-tooltip>
                <span>{{ record.cname || defaultCname(record.name, record.type) }}</span>
                <icon-copy class="copy-icon" @click="copyToClipboard(record.cname || defaultCname(record.name, record.type))" />
              </div>
            </template>
          </a-table-column>
          <a-table-column :title="t('liveDomain.domainTable.type')" :width="80">
            <template #cell="{ record }">
              <V2Tag :type="record.type === 0 ? 'info' : 'success'">{{ record.type === 0 ? t('liveDomain.domainTable.pushDomain') : t('liveDomain.domainTable.playDomain') }}</V2Tag>
            </template>
          </a-table-column>
          <a-table-column :title="t('liveDomain.domainTable.region')" data-index="region" :width="80">
            <template #cell="{ record }">{{ record.region || t('liveDomain.domainTable.globalAcceleration') }}</template>
          </a-table-column>
          <a-table-column :title="t('liveDomain.domainTable.status')" :width="120">
            <template #cell="{ record }">
              <div class="status-cell"><span :class="['status-dot', record.status === 1 ? 'status-enabled' : 'status-disabled']"></span><span>{{ record.status === 1 ? t('liveDomain.domainTable.enabled') : t('liveDomain.domainTable.disabled') }}</span></div>
            </template>
          </a-table-column>
          <a-table-column :title="t('liveDomain.domainTable.createTime')" :width="180">
            <template #cell="{ record }">{{ formatDateTime(record.createTime) }}</template>
          </a-table-column>
          <a-table-column :title="t('liveDomain.domainTable.operations')" :width="200" fixed="right">
            <template #cell="{ record }">
              <a-space>
                <a-link @click="handleManage(record)">{{ t('liveDomain.domainTable.manage') }}</a-link>
                <a-link v-if="record.status === 1" @click="handleForbid(record)">{{ t('liveDomain.domainTable.forbid') }}</a-link>
                <a-link v-else status="success" @click="handleEnable(record)">{{ t('liveDomain.domainTable.enable') }}</a-link>
                <a-link status="danger" @click="handleDelete(record)">{{ t('liveDomain.domainTable.delete') }}</a-link>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </V2Card>

    <a-modal v-model:visible="addDialogVisible" :title="currentStep === 1 ? t('liveDomain.addStepTitle.step1') : t('liveDomain.addStepTitle.step2')" :width="700" :footer="false" @cancel="handleCancelAdd">
      <a-steps :current="currentStep" style="margin-bottom: 24px">
        <a-step :title="t('liveDomain.addDialog.basicConfig')" />
        <a-step :title="t('liveDomain.addDialog.cnameConfig')" />
      </a-steps>
      <div v-if="currentStep === 1">
        <a-form ref="addFormRef" :model="addForm" :rules="addFormRules" layout="vertical">
          <a-form-item :label="t('liveDomain.addDialog.domainType')" field="domainType">
            <a-radio-group v-model="addForm.domainType">
              <a-radio :value="0">{{ t('liveDomain.domainTable.pushDomain') }}</a-radio>
              <a-radio :value="1">{{ t('liveDomain.domainTable.playDomain') }}</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item :label="t('liveDomain.addDialog.accelerationRegion')" field="region">
            <a-select v-model="addForm.region" placeholder="请选择加速区域">
              <a-option :value="'global'">{{ t('liveDomain.addDialog.region.global') }}</a-option>
              <a-option :value="'cn'">{{ t('liveDomain.addDialog.region.cn') }}</a-option>
              <a-option :value="'overseas'">{{ t('liveDomain.addDialog.region.overseas') }}</a-option>
            </a-select>
          </a-form-item>
          <a-form-item :label="t('liveDomain.addDialog.domainName')" field="domainName">
            <a-input v-model="addForm.domainName" placeholder="请输入域名，如：push.example.com" />
            <template #extra>
              <div v-if="needVerify" class="owner-verify-tip">
                <icon-exclamation-circle-fill class="owner-verify-icon" />{{ t('liveDomain.ownerVerify.tip') }}
                <a-link v-if="!verifying" @click="handleVerifyOwner">{{ t('liveDomain.ownerVerify.verifyBtn') }}</a-link>
                <a-spin v-else size="small" style="margin-left: 4px" />
              </div>
            </template>
          </a-form-item>
          <a-form-item :label="t('liveDomain.addDialog.tags')" field="tags">
            <a-input v-model="addForm.tags" placeholder="请输入标签，多个标签用逗号分隔" />
          </a-form-item>
        </a-form>
        <div style="text-align: right; margin-top: 24px">
          <a-space>
            <V2Button type="secondary" @click="handleCancelAdd">{{ t('liveDomain.confirm.cancel') }}</V2Button>
            <V2Button :loading="submitting" @click="handleAddDomain">{{ t('liveDomain.addDialog.nextStep') }}</V2Button>
          </a-space>
        </div>
      </div>
      <div v-if="currentStep === 2">
        <a-alert type="success" style="margin-bottom: 20px">{{ t('liveDomain.cname.configSuccess') }}</a-alert>
        <V2Card class="cname-status-card" :padding="true" style="margin-bottom: 20px">
          <div class="status-header">
            <span class="status-label">{{ t('liveDomain.cname.status.label') }}</span>
            <V2Tag :type="cnameStatusClass === 'status-enabled' ? 'success' : 'neutral'">
              <span :class="['status-dot', cnameStatusClass]"></span>{{ cnameStatusText }}
            </V2Tag>
          </div>
        </V2Card>
        <div class="cname-config-section">
          <h4>{{ t('liveDomain.cname.configSteps') }}</h4>
          <V2Card :padding="false" style="overflow: hidden; margin: 16px 0;">
            <a-table :data="cnameRecords" :pagination="false" :bordered="{ wrapper: true, cell: true }">
              <template #columns>
                <a-table-column :title="t('liveDomain.cname.record.domain')" data-index="domain" :width="200" />
                <a-table-column :title="t('liveDomain.cname.record.host')" data-index="host" :width="120" />
                <a-table-column :title="t('liveDomain.cname.record.type')" data-index="type" :width="100" />
                <a-table-column :title="t('liveDomain.cname.record.value')" data-index="value">
                  <template #cell="{ record: rec }">
                    <div class="cname-cell"><span>{{ rec.value }}</span><icon-copy class="copy-icon" @click="copyToClipboard(rec.value)" /></div>
                  </template>
                </a-table-column>
              </template>
            </a-table>
          </V2Card>
          <a-alert type="info" style="margin-bottom: 16px"><template #icon><icon-info-circle /></template>{{ t('liveDomain.cname.statusCheckTip') }}</a-alert>
          <div class="config-links">
            <a href="https://cloud.tencent.com/document/product/267/19908" target="_blank">{{ t('liveDomain.configLinks.howToConfig') }}</a>
            <span class="divider">|</span>
            <a href="#" @click.prevent="checkCnameStatus">{{ t('liveDomain.configLinks.checkCname') }}</a>
          </div>
        </div>
        <div style="text-align: right; margin-top: 24px">
          <a-space>
            <V2Button type="secondary" @click="handleFinishAdd">{{ t('liveDomain.addDialog.laterConfig') }}</V2Button>
            <V2Button @click="handleFinishAdd">{{ t('liveDomain.confirm.complete') }}</V2Button>
          </a-space>
        </div>
      </div>
    </a-modal>
    <!-- 域名归属验证信息弹窗 -->
    <a-modal
      v-model:visible="verifyOwnerInfoVisible"
      :title="t('liveDomain.ownerVerify.modalTitle')"
      :width="560"
      :footer="false"
      @cancel="verifyOwnerInfoVisible = false"
    >
      <template v-if="verifyOwnerInfo">
        <a-alert v-if="verifyOwnerInfo.status >= 0" type="success" style="margin-bottom: 16px">
          {{ t('liveDomain.ownerVerify.verified') }}
        </a-alert>
        <a-alert v-else type="warning" style="margin-bottom: 16px">
          {{ t('liveDomain.ownerVerify.notVerified') }}
        </a-alert>
        <h4 class="owner-verify-section-title">{{ t('liveDomain.ownerVerify.dnsTip') }}</h4>
        <a-card :bordered="true" style="margin-bottom: 16px">
          <a-descriptions :column="1" size="small">
            <a-descriptions-item :label="t('liveDomain.ownerVerify.domain')">
              {{ verifyOwnerInfo.mainDomain || addForm.domainName }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('liveDomain.ownerVerify.hostRecord')">
              <span class="owner-verify-value">cssauth</span>
            </a-descriptions-item>
            <a-descriptions-item :label="t('liveDomain.ownerVerify.recordType')">
              <span class="owner-verify-value">TXT</span>
            </a-descriptions-item>
            <a-descriptions-item :label="t('liveDomain.ownerVerify.verifyContent')">
              <div class="owner-verify-content">
                <code>{{ verifyOwnerInfo.content || '-' }}</code>
                <icon-copy v-if="verifyOwnerInfo.content" class="copy-icon" @click="copyToClipboard(verifyOwnerInfo.content)" />
              </div>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
        <a-alert type="info">
          <template #icon><icon-info-circle /></template>
          {{ t('liveDomain.ownerVerify.howTo') }}
        </a-alert>
        <div style="text-align: center; margin-top: 20px">
          <a-button type="primary" :loading="verifying" @click="handleVerifyOwner">
            {{ t('liveDomain.ownerVerify.recheckBtn') }}
          </a-button>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { IconPlus, IconCopy, IconInfoCircle, IconCheckCircleFill, IconExclamationCircleFill } from '@arco-design/web-vue/es/icon'
import { useNavigationStore } from '@/stores/navigation'
import { defaultCname, useDomainList } from '@/composables/useDomainList'
import { useI18n } from 'vue-i18n'
import { V2PageHeader, V2Card, V2Button, V2Tag } from '@/components/ui'
import type { DomainInfo } from '@/composables/useDomainList'

const { t } = useI18n()
const navigationStore = useNavigationStore()
const verifyOwnerInfoVisible = ref(false)

const {
  loading, filteredDomains, pagination, searchKeyword, handleSearch,
  handleEnable, handleForbid, handleDelete, getCnameStatusTooltip, copyToClipboard, formatDateTime,
  addDialogVisible, submitting, currentStep, cnameStatusText, cnameStatusClass, cnameRecords,
  addFormRef, addForm, addFormRules, showAddDialog, handleCancelAdd, handleAddDomain, handleFinishAdd, checkCnameStatus,
  needVerify, verifying, verifyOwnerInfo, handleVerifyOwner,
} = useDomainList()

// 调起归属验证后展示返回的验证信息弹窗
watch(verifyOwnerInfo, (v) => {
  verifyOwnerInfoVisible.value = !!(v && v.content)
})

function handleManage(row: DomainInfo) {
  navigationStore.navigateTo('LiveDomainDetail', `域名详情 - ${row.name}`, { domainName: row.name })
}
</script>

<style scoped>
.live-domain-page { padding: 12px; background: var(--bg-page); min-height: 100%; overflow-y: auto; }
.page-notice { background: var(--info-bg); border: 1px solid rgba(22, 93, 255, 0.2); font-size: 14px; line-height: 1.8; }
.notice-item { margin-bottom: 8px; }
.notice-item:last-child { margin-bottom: 0; }
.notice-item strong { font-weight: 600; color: var(--text-primary); }
.notice-item a { color: var(--brand-blue); text-decoration: none; }
.domain-cell, .cname-cell { display: flex; align-items: center; gap: 8px; }
.copy-icon { cursor: pointer; color: var(--text-secondary); font-size: 14px; }
.copy-icon:hover { color: var(--brand-blue); }
.cname-status-icon { font-size: 16px; flex-shrink: 0; }
.owner-verify-tip { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--warning); }
.owner-verify-icon { font-size: 14px; flex-shrink: 0; }
.owner-verify-section-title { font-size: 14px; font-weight: 600; margin: 0 0 12px; color: var(--text-primary); }
.owner-verify-content { display: flex; align-items: center; gap: 8px; word-break: break-all; }
.owner-verify-value { font-family: var(--font-mono, monospace); font-weight: 500; }
.owner-verify-content code { background: var(--fill-secondary, #f2f3f5); padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.cname-success { color: var(--success); }
.cname-unconfigured { color: var(--text-secondary); }
.status-cell { display: flex; align-items: center; gap: 6px; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; }
.status-enabled { background-color: var(--success); }
.status-disabled { background-color: var(--text-secondary); }
.cname-config-section { padding: 8px 0; }
.cname-config-section h4 { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px; }
.config-links { display: flex; align-items: center; gap: 12px; font-size: 14px; }
.config-links a { color: var(--brand-blue); text-decoration: none; }
.config-links .divider { color: var(--border); }
.cname-status-card { background: var(--bg-hover); border: 1px solid var(--border); }
.status-header { display: flex; align-items: center; gap: 12px; }
.status-label { font-size: 14px; font-weight: 600; color: var(--text-primary); }
</style>
