<template>
  <div class="live-domain-page">
    <div class="page-notice">
      <div class="notice-item">
        <strong>{{ t('liveDomain.pageNotice.pushDomain') }}</strong>
        系统提供的推流域名仅供测试使用，<a href="#" target="_blank">使用上有诸多限制</a>，建议您尽快添加自有域名。
      </div>
      <div class="notice-item">
        <strong>{{ t('liveDomain.pageNotice.playDomain') }}</strong>
        若需要在您自有域名下播放直播流，需要先添加播放域名，并完成域名CNAME配置。<a href="#" target="_blank">域名管理</a> 或 <a href="#" target="_blank">CNAME配置</a>
      </div>
      <div class="notice-item">{{ t('liveDomain.pageNotice.domainOwner') }}</div>
    </div>

    <div class="page-toolbar">
      <div class="toolbar-right">
        <a-input-search v-model="searchKeyword" :placeholder="t('liveDomain.searchPlaceholder')" style="width: 260px" @search="handleSearch" />
        <a-button type="primary" @click="showAddDialog"><template #icon><icon-plus /></template>{{ t('liveDomain.addDomain') }}</a-button>
      </div>
    </div>

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
              <span>{{ record.cname || record.name + '.liveplay.com' }}</span>
              <icon-copy class="copy-icon" @click="copyToClipboard(record.cname)" />
            </div>
          </template>
        </a-table-column>
        <a-table-column :title="t('liveDomain.domainTable.type')" :width="80">
          <template #cell="{ record }">
            <a-tag :color="record.type === 0 ? 'blue' : 'green'">{{ record.type === 0 ? t('liveDomain.domainTable.pushDomain') : t('liveDomain.domainTable.playDomain') }}</a-tag>
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
          </a-form-item>
          <a-form-item :label="t('liveDomain.addDialog.title')" field="tags">
            <a-input v-model="addForm.tags" placeholder="请输入标签，多个标签用逗号分隔" />
          </a-form-item>
        </a-form>
        <div style="text-align: right; margin-top: 24px">
          <a-space><a-button @click="handleCancelAdd">{{ t('liveDomain.confirm.cancel') }}</a-button><a-button type="primary" :loading="submitting" @click="handleAddDomain">{{ t('liveDomain.addDialog.nextStep') }}</a-button></a-space>
        </div>
      </div>
      <div v-if="currentStep === 2">
        <a-alert type="success" style="margin-bottom: 20px">{{ t('liveDomain.cname.configSuccess') }}</a-alert>
        <div class="cname-status-card" style="margin-bottom: 20px">
          <div class="status-header"><span class="status-label">{{ t('liveDomain.cname.status.label') }}</span><a-tag :color="cnameStatusColor" size="large"><template #icon><span :class="['status-dot', cnameStatusClass]"></span></template>{{ cnameStatusText }}</a-tag></div>
        </div>
        <div class="cname-config-section">
          <h4>{{ t('liveDomain.cname.configSteps') }}</h4>
          <a-table :data="cnameRecords" :pagination="false" :bordered="{ wrapper: true, cell: true }" style="margin: 16px 0">
            <template #columns>
              <a-table-column :title="t('liveDomain.cname.record.domain')" data-index="domain" :width="200" />
              <a-table-column :title="t('liveDomain.cname.record.host')" data-index="host" :width="120" />
              <a-table-column :title="t('liveDomain.cname.record.type')" data-index="type" :width="100" />
              <a-table-column :title="t('liveDomain.cname.record.value')" data-index="value">
                <template #cell="{ record: rec }"><div class="cname-cell"><span>{{ rec.value }}</span><icon-copy class="copy-icon" @click="copyToClipboard(rec.value)" /></div></template>
              </a-table-column>
            </template>
          </a-table>
          <a-alert type="info" style="margin-bottom: 16px"><template #icon><icon-info-circle /></template>{{ t('liveDomain.cname.statusCheckTip') }}</a-alert>
          <div class="config-links"><a href="https://cloud.tencent.com/document/product/267/19908" target="_blank">{{ t('liveDomain.configLinks.howToConfig') }}</a><span class="divider">|</span><a href="#" @click.prevent="checkCnameStatus">{{ t('liveDomain.configLinks.checkCname') }}</a></div>
        </div>
        <div style="text-align: right; margin-top: 24px">
          <a-space><a-button @click="handleFinishAdd">{{ t('liveDomain.addDialog.laterConfig') }}</a-button><a-button type="primary" @click="handleFinishAdd">{{ t('liveDomain.confirm.complete') }}</a-button></a-space>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { IconPlus, IconCopy, IconInfoCircle, IconCheckCircleFill, IconExclamationCircleFill } from '@arco-design/web-vue/es/icon'
import { useNavigationStore } from '@/stores/navigation'
import { useDomainList } from '@/composables/useDomainList'
import { useI18n } from 'vue-i18n'
import type { DomainInfo } from '@/composables/useDomainList'

const { t } = useI18n()
const navigationStore = useNavigationStore()

const {
  loading, filteredDomains, pagination, searchKeyword, handleSearch,
  handleEnable, handleForbid, handleDelete, getCnameStatusTooltip, copyToClipboard, formatDateTime,
  addDialogVisible, submitting, currentStep, cnameStatusText, cnameStatusColor, cnameStatusClass, cnameRecords,
  addFormRef, addForm, addFormRules, showAddDialog, handleCancelAdd, handleAddDomain, handleFinishAdd, checkCnameStatus,
} = useDomainList()

function handleManage(row: DomainInfo) {
  navigationStore.navigateTo('LiveDomainDetail', `域名详情 - ${row.name}`, { domainName: row.name })
}
</script>

<style scoped>
.live-domain-page { padding: 20px; background: #fff; min-height: 100%; overflow-y: auto; }
.page-notice { background: #e8f4ff; border: 1px solid #bedaff; border-radius: 4px; padding: 16px; margin-bottom: 20px; font-size: 14px; line-height: 1.8; }
.notice-item { margin-bottom: 8px; }
.notice-item:last-child { margin-bottom: 0; }
.notice-item strong { font-weight: 600; color: #1d2129; }
.notice-item a { color: #165dff; text-decoration: none; }
.page-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.toolbar-right { display: flex; gap: 12px; align-items: center; }
.domain-cell, .cname-cell { display: flex; align-items: center; gap: 8px; }
.copy-icon { cursor: pointer; color: #86909c; font-size: 14px; }
.copy-icon:hover { color: #165dff; }
.cname-status-icon { font-size: 16px; flex-shrink: 0; }
.cname-success { color: #00b42a; }
.cname-unconfigured { color: #86909c; }
.status-cell { display: flex; align-items: center; gap: 6px; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; }
.status-enabled { background-color: #00b42a; }
.status-disabled { background-color: #86909c; }
.cname-config-section { padding: 8px 0; }
.cname-config-section h4 { font-size: 14px; font-weight: 600; color: #1d2129; margin-bottom: 12px; }
.config-links { display: flex; align-items: center; gap: 12px; font-size: 14px; }
.config-links a { color: #165dff; text-decoration: none; }
.config-links .divider { color: #e5e6eb; }
.cname-status-card { background: #f7f8fa; border: 1px solid #e5e6eb; border-radius: 4px; padding: 16px; }
.status-header { display: flex; align-items: center; gap: 12px; }
.status-label { font-size: 14px; font-weight: 600; color: #1d2129; }
</style>
