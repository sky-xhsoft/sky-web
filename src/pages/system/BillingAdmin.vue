<template>
  <div class="billing-admin-page">
    <V2PageHeader title="计费管理" description="价格、套餐、资源包、公司账户、扣费设置与复核">
      <template #actions>
        <a-select v-if="tab === 'reconcile'" v-model="month" :style="{ width: '150px' }" aria-label="月份">
          <a-option v-for="m in months" :key="m" :value="m">{{ m.replace('-', ' 年 ') }} 月</a-option>
        </a-select>
      </template>
    </V2PageHeader>

    <div v-if="settings" :class="settings.chargeMode === 'charge' ? 'ba-note' : 'ba-warn'">
      {{ settings.chargeMode === 'charge' ? `正式扣费中：自 ${settings.chargeFrom} 起每天按用量从余额扣费。` : '试算中：各公司只看到预估费用，余额不扣。核对无误后在「扣费设置」中开启扣费。' }}
      <span v-if="pending">有 {{ pending }} 条赠送 / 调账申请待复核。</span>
    </div>

    <a-tabs v-model:active-key="tab" class="ba-tabs" lazy-load>
      <a-tab-pane key="accounts" title="公司账户"><AdminAccounts :threshold="settings?.reviewThreshold || 10000000" @changed="loadSettings" /></a-tab-pane>
      <a-tab-pane key="prices" title="单价"><AdminPrices /></a-tab-pane>
      <a-tab-pane key="plans" title="套餐"><AdminPlans /></a-tab-pane>
      <a-tab-pane key="packs" title="资源包"><AdminPackDefs /></a-tab-pane>
      <a-tab-pane key="requests" :title="pending ? `复核（${pending}）` : '复核'"><AdminRequests @changed="loadSettings" /></a-tab-pane>
      <a-tab-pane key="settings" title="扣费设置"><AdminSettings @changed="loadSettings" /></a-tab-pane>
      <a-tab-pane key="reconcile" title="用量对账"><BillingReconcile :month="month" /></a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { V2PageHeader } from '@/components/ui'
import { getBillSettings, type BillSettings } from '@/api/billing'
import { recentMonths } from '@/pages/live/components/billing'
import BillingReconcile from '@/pages/live/components/BillingReconcile.vue'
import AdminAccounts from './billing/AdminAccounts.vue'
import AdminPrices from './billing/AdminPrices.vue'
import AdminPlans from './billing/AdminPlans.vue'
import AdminPackDefs from './billing/AdminPackDefs.vue'
import AdminRequests from './billing/AdminRequests.vue'
import AdminSettings from './billing/AdminSettings.vue'

const tab = ref('accounts')
const months = recentMonths(new Date())
const month = ref(months[0])
const settings = ref<BillSettings | null>(null)
const pending = ref(0)
const loadSettings = async () => {
  try {
    const res = await getBillSettings()
    settings.value = res.settings
    pending.value = res.pendingCount
  } catch {
    // 无权限时页面各标签会各自提示
  }
}
onMounted(loadSettings)
</script>

<style scoped>
.billing-admin-page { display: flex; flex-direction: column; gap: 16px; }
.ba-tabs :deep(.arco-tabs-content) { padding-top: 16px; }
.ba-note { padding: 10px 14px; border-radius: 6px; background: var(--info-bg); color: var(--brand-blue); font-size: 13px; }
.ba-warn { padding: 10px 14px; border-radius: 6px; background: var(--warning-bg); color: var(--warning); font-size: 13px; }
</style>
