<template>
  <div class="push-domain-page">
    <V2Card class="page-notice" :padding="true" style="margin-bottom: 20px;">
      <div class="notice-item">
        <strong>关于推流域名：</strong>
        系统提供的推流域名仅供测试使用，<a href="#" target="_blank">使用上有诸多限制</a>，建议您尽快添加自有域名。
      </div>
      <div class="notice-item">
        您当前已添加 <a href="#" target="_blank">域名归属</a> 中包含主播推流的域名。
      </div>
    </V2Card>

    <V2PageHeader
      title="推流域名管理"
      description="管理推流域名及 CNAME 配置"
    >
      <template #actions>
        <a-input-search v-model="searchKeyword" placeholder="输入关键词搜索域名" style="width: 260px" @search="handleSearch" />
        <V2Button @click="showAddDialog">
          <template #icon><icon-plus /></template>
          添加推流域名
        </V2Button>
      </template>
    </V2PageHeader>

    <V2Card :padding="false" style="overflow: hidden;">
      <a-table :loading="loading" :data="filteredDomains" :pagination="pagination" :bordered="{ wrapper: true, cell: true }" row-key="name">
        <template #columns>
          <a-table-column title="域名" data-index="name" :width="200">
            <template #cell="{ record }"><div class="domain-cell"><a-link>{{ record.name }}</a-link><icon-copy class="copy-icon" @click="copyToClipboard(record.name)" /></div></template>
          </a-table-column>
          <a-table-column title="CNAME" :width="250">
            <template #cell="{ record }">
              <div class="cname-cell">
                <a-tooltip :content="getCnameStatusTooltip(record.cnameConfigured)">
                  <icon-check-circle-fill v-if="record.cnameConfigured === 1" class="cname-status-icon cname-success" />
                  <icon-exclamation-circle-fill v-else class="cname-status-icon cname-unconfigured" />
                </a-tooltip>
                <span>{{ record.cname || record.name + '.livepush.com' }}</span>
                <icon-copy class="copy-icon" @click="copyToClipboard(record.cname)" />
              </div>
            </template>
          </a-table-column>
          <a-table-column title="状态" :width="100">
            <template #cell="{ record }">
              <V2Tag :type="record.status === 1 ? 'success' : 'neutral'">{{ record.status === 1 ? '已启用' : '已停用' }}</V2Tag>
            </template>
          </a-table-column>
          <a-table-column title="创建时间" :width="180">
            <template #cell="{ record }">{{ formatDateTime(record.createTime) }}</template>
          </a-table-column>
          <a-table-column title="操作" :width="200" fixed="right">
            <template #cell="{ record }">
              <a-space>
                <a-link @click="handleManage(record)">管理</a-link>
                <a-link v-if="record.status === 1" @click="handleForbid(record)">停用</a-link>
                <a-link v-else status="success" @click="handleEnable(record)">启用</a-link>
                <a-link status="danger" @click="handleDelete(record)">删除</a-link>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </V2Card>

    <a-modal v-model:visible="addDialogVisible" :title="currentStep === 1 ? '第一步：基本配置' : '第二步：CNAME配置'" :width="700" :footer="false" @cancel="handleCancelAdd" class="v2-modal">
      <a-steps :current="currentStep" style="margin-bottom: 24px"><a-step title="基本配置" /><a-step title="CNAME配置" /></a-steps>
      <div v-if="currentStep === 1">
        <a-form ref="addFormRef" :model="addForm" :rules="addFormRules" layout="vertical">
          <a-form-item label="域名类型" field="domainType">
            <a-radio-group v-model="addForm.domainType"><a-radio :value="0">推流域名</a-radio><a-radio :value="1">播放域名</a-radio></a-radio-group>
          </a-form-item>
          <a-form-item label="加速区域" field="region">
            <a-select v-model="addForm.region" placeholder="请选择加速区域">
              <a-option :value="'global'">全球加速</a-option><a-option :value="'cn'">中国大陆</a-option><a-option :value="'overseas'">中国境外</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="域名名称" field="domainName"><a-input v-model="addForm.domainName" placeholder="请输入域名，如：push.example.com" /></a-form-item>
          <a-form-item label="标签" field="tags"><a-input v-model="addForm.tags" placeholder="请输入标签，多个标签用逗号分隔" /></a-form-item>
        </a-form>
        <div style="text-align: right; margin-top: 24px"><a-space><V2Button type="secondary" @click="handleCancelAdd">取消</V2Button><V2Button :loading="submitting" @click="handleAddDomain">下一步</V2Button></a-space></div>
      </div>
      <div v-if="currentStep === 2">
        <a-alert type="success" style="margin-bottom: 20px">域名添加成功！请完成CNAME配置。</a-alert>
        <V2Card class="cname-status-card" :padding="true" style="margin-bottom: 20px">
          <div class="status-header">
            <span class="status-label">CNAME状态</span>
            <V2Tag :type="cnameStatusClass === 'status-enabled' ? 'success' : 'neutral'">
              <span :class="['status-dot', cnameStatusClass]"></span>{{ cnameStatusText }}
            </V2Tag>
          </div>
        </V2Card>
        <V2Card :padding="false" style="overflow: hidden; margin: 16px 0;">
          <a-table :data="cnameRecords" :pagination="false" :bordered="{ wrapper: true, cell: true }">
            <template #columns>
              <a-table-column title="域名" data-index="domain" :width="200" /><a-table-column title="主机记录" data-index="host" :width="120" />
              <a-table-column title="记录类型" data-index="type" :width="100" />
              <a-table-column title="记录值" data-index="value"><template #cell="{ record: rec }"><div class="cname-cell"><span>{{ rec.value }}</span><icon-copy class="copy-icon" @click="copyToClipboard(rec.value)" /></div></template></a-table-column>
            </template>
          </a-table>
        </V2Card>
        <a-alert type="info" style="margin-bottom: 16px"><template #icon><icon-info-circle /></template>CNAME配置生效需要一定时间，请耐心等待。</a-alert>
        <div class="config-links"><a href="https://cloud.tencent.com/document/product/267/19908" target="_blank">如何配置CNAME？</a><span class="divider">|</span><a href="#" @click.prevent="checkCnameStatus">查询CNAME状态</a></div>
        <div style="text-align: right; margin-top: 24px"><a-space><V2Button type="secondary" @click="handleFinishAdd">稍后配置</V2Button><V2Button @click="handleFinishAdd">完成</V2Button></a-space></div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { IconPlus, IconCopy, IconInfoCircle, IconCheckCircleFill, IconExclamationCircleFill } from '@arco-design/web-vue/es/icon'
import { useNavigationStore } from '@/stores/navigation'
import { useDomainList } from '@/composables/useDomainList'
import type { DomainInfo } from '@/composables/useDomainList'
import { V2PageHeader, V2Card, V2Button, V2Tag } from '@/components/ui'

const navigationStore = useNavigationStore()

const {
  loading, filteredDomains, pagination, searchKeyword, handleSearch,
  handleEnable, handleForbid, handleDelete, getCnameStatusTooltip, copyToClipboard, formatDateTime,
  addDialogVisible, submitting, currentStep, cnameStatusText, cnameStatusClass, cnameRecords,
  addFormRef, addForm, addFormRules, showAddDialog, handleCancelAdd, handleAddDomain, handleFinishAdd, checkCnameStatus,
} = useDomainList({ defaultType: 0 })

function handleManage(row: DomainInfo) {
  navigationStore.navigateTo('LiveDomainDetail', `域名详情 - ${row.name}`, { domainName: row.name })
}
</script>

<style scoped>
.push-domain-page { padding: 12px; background: var(--bg-page); min-height: 100%; overflow-y: auto; }
.page-notice { background: var(--info-bg); border: 1px solid rgba(22, 93, 255, 0.2); font-size: 14px; line-height: 1.8; margin-bottom: 20px; }
.notice-item { margin-bottom: 8px; }
.notice-item:last-child { margin-bottom: 0; }
.notice-item strong { font-weight: 600; color: var(--text-primary); }
.notice-item a { color: var(--brand-blue); text-decoration: none; }
.domain-cell, .cname-cell { display: flex; align-items: center; gap: 8px; }
.copy-icon { cursor: pointer; color: var(--text-secondary); font-size: 14px; }
.copy-icon:hover { color: var(--brand-blue); }
.cname-status-icon { font-size: 16px; flex-shrink: 0; }
.cname-success { color: var(--success); }
.cname-unconfigured { color: var(--text-secondary); }
.cname-status-card { background: var(--bg-hover); border: 1px solid var(--border); }
.status-header { display: flex; align-items: center; gap: 12px; }
.status-label { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.status-dot { width: 6px; height: 6px; border-radius: 50%; }
.status-enabled { background-color: var(--success); }
.status-disabled { background-color: var(--text-secondary); }
.config-links { display: flex; align-items: center; gap: 12px; font-size: 14px; }
.config-links a { color: var(--brand-blue); text-decoration: none; }
.config-links .divider { color: var(--border); }
</style>