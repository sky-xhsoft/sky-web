<template>
  <div class="live-billing-page">
    <V2PageHeader title="费用中心" description="本公司账户余额、费用、账单与用量">
      <template #actions>
        <a-select v-if="monthTabs.includes(tab)" v-model="month" :style="{ width: '150px' }" aria-label="月份">
          <a-option v-for="m in months" :key="m" :value="m">{{ m.replace('-', ' 年 ') }} 月</a-option>
        </a-select>
        <V2Button type="secondary" @click="refresh"><template #icon><icon-refresh /></template>刷新</V2Button>
      </template>
    </V2PageHeader>

    <a-tabs v-model:active-key="tab" class="lb-tabs" lazy-load>
      <a-tab-pane key="overview" title="概览">
        <BillingOverview ref="overviewRef" @go="tab = $event" />
      </a-tab-pane>
      <a-tab-pane key="usage" title="用量明细">
        <BillingUsage ref="usageRef" :month="month" />
      </a-tab-pane>
      <a-tab-pane key="charges" title="费用明细">
        <BillingCharges ref="chargesRef" :month="month" />
      </a-tab-pane>
      <a-tab-pane key="statements" title="账单">
        <BillingStatements ref="statementsRef" />
      </a-tab-pane>
      <a-tab-pane key="transactions" title="交易流水">
        <BillingTransactions ref="txnsRef" :month="month" />
      </a-tab-pane>
      <a-tab-pane key="products" title="套餐与资源包">
        <BillingProducts ref="productsRef" @changed="overviewRef?.reload()" />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IconRefresh } from '@arco-design/web-vue/es/icon'
import { V2Button, V2PageHeader } from '@/components/ui'
import { recentMonths } from './components/billing'
import BillingOverview from './components/BillingOverview.vue'
import BillingUsage from './components/BillingUsage.vue'
import BillingCharges from './components/BillingCharges.vue'
import BillingStatements from './components/BillingStatements.vue'
import BillingTransactions from './components/BillingTransactions.vue'
import BillingProducts from './components/BillingProducts.vue'

const months = recentMonths(new Date())
const month = ref(months[0])
const tab = ref('overview')
const monthTabs = ['usage', 'charges', 'transactions']

type Reloadable = { reload: () => void } | null
const overviewRef = ref<Reloadable>(null)
const usageRef = ref<Reloadable>(null)
const chargesRef = ref<Reloadable>(null)
const statementsRef = ref<Reloadable>(null)
const txnsRef = ref<Reloadable>(null)
const productsRef = ref<Reloadable>(null)
const refresh = () => {
  const map: Record<string, Reloadable> = { overview: overviewRef.value, usage: usageRef.value, charges: chargesRef.value, statements: statementsRef.value, transactions: txnsRef.value, products: productsRef.value }
  map[tab.value]?.reload()
}
</script>

<style scoped>
.live-billing-page { display: flex; flex-direction: column; gap: 16px; }
.lb-tabs :deep(.arco-tabs-content) { padding-top: 16px; }
</style>
