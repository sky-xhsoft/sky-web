<template>
  <V2Card :padding="false">
    <div class="bl-head">
      <div class="bl-row">
        <span class="bl-title">公司账户</span>
        <span>{{ rows.length }} 家公司 · 余额合计 {{ formatMoney(totalBalance) }}</span>
        <span v-if="arrears" class="bl-neg">{{ arrears }} 家欠费</span>
      </div>
      <div class="bl-actions">
        <a-select v-model="filter" :style="{ width: '120px' }" aria-label="账户状态">
          <a-option value="">全部</a-option>
          <a-option value="arrears">欠费</a-option>
          <a-option value="plan">有套餐</a-option>
        </a-select>
        <a-input-search v-model="keyword" placeholder="公司名称或 ID" allow-clear :style="{ width: '200px' }" />
      </div>
    </div>
    <a-table :data="shown" :loading="loading" row-key="companyId" :pagination="shown.length > 20 ? { pageSize: 20 } : false" :scroll="{ x: 1000 }">
      <template #columns>
        <a-table-column title="公司"><template #cell="{ record }">
          <div class="bl-name">{{ record.companyName }}</div><div class="bl-sub">ID {{ record.companyId }}</div>
        </template></a-table-column>
        <a-table-column title="余额" align="right" :width="140"><template #cell="{ record }">
          <span class="bl-num" :class="{ 'bl-neg': record.balance < 0 }">{{ formatMoney(record.balance) }}</span>
          <div v-if="record.giftBalance" class="bl-sub">赠送 {{ formatMoney(record.giftBalance) }}</div>
        </template></a-table-column>
        <a-table-column title="授信" align="right" :width="110"><template #cell="{ record }"><span class="bl-num bl-sub">{{ record.creditLimit ? formatMoney(record.creditLimit) : '—' }}</span></template></a-table-column>
        <a-table-column title="状态" :width="80"><template #cell="{ record }">
          <a-tag size="small" :color="record.status === 'arrears' ? 'red' : 'green'">{{ record.status === 'arrears' ? '欠费' : '正常' }}</a-tag>
        </template></a-table-column>
        <a-table-column title="套餐" :width="170"><template #cell="{ record }">
          <span v-if="record.planName">{{ record.planName }}<div class="bl-sub">至 {{ record.planEndDate }}</div></span>
          <span v-else class="bl-sub">按量计费</span>
        </template></a-table-column>
        <a-table-column title="本月用量费用" align="right" :width="130"><template #cell="{ record }"><span class="bl-num">{{ formatMoney(record.monthCost) }}</span></template></a-table-column>
        <a-table-column title="最近流水" :width="140"><template #cell="{ record }"><span class="bl-sub bl-num">{{ record.lastTxnTime || '—' }}</span></template></a-table-column>
        <a-table-column title="操作" :width="190" fixed="right"><template #cell="{ record }">
          <a-button type="text" size="mini" @click="openDetail(record)">详情</a-button>
          <a-button type="text" size="mini" @click="openAction('recharge', record)">充值</a-button>
          <a-dropdown @select="(v: any) => openAction(v, record)">
            <a-button type="text" size="mini">更多</a-button>
            <template #content>
              <a-doption value="gift">赠送</a-doption>
              <a-doption value="adjust">调账</a-doption>
              <a-doption value="credit">设置授信</a-doption>
              <a-doption value="subscribe">开通 / 升级套餐</a-doption>
              <a-doption value="pack">发放资源包</a-doption>
            </template>
          </a-dropdown>
        </template></a-table-column>
      </template>
      <template #empty><div class="bl-empty">没有符合条件的公司</div></template>
    </a-table>

    <AccountActionModal v-model:visible="actionOpen" :action="action" :account="current" :plans="plans" :packs="packs" :threshold="threshold" @done="onDone" />

    <a-drawer v-model:visible="detailOpen" :title="`${current?.companyName || ''} · 计费账户`" :width="980" :footer="false" unmount-on-close>
      <div v-if="current" class="bl">
        <div class="bl-actions">
          <span class="bl-sub">导出账单</span>
          <a-select v-model="exportMonth" :style="{ width: '140px' }" aria-label="导出月份">
            <a-option v-for="m in months" :key="m" :value="m">{{ m }}</a-option>
          </a-select>
          <a-button :loading="exporting" @click="doExport">导出 Excel</a-button>
        </div>
        <BillingOverview ref="detailOverview" :company-id="current.companyId" />
        <BillingTransactions :month="months[0]" :company-id="current.companyId" />
      </div>
    </a-drawer>
  </V2Card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { V2Card } from '@/components/ui'
import { exportStatement, listAccounts, listAllPackDefs, listAllPlans, type AccountRow, type BillPackDef, type BillPlan } from '@/api/billing'
import { formatMoney, recentMonths } from '@/pages/live/components/billing'
import BillingOverview from '@/pages/live/components/BillingOverview.vue'
import BillingTransactions from '@/pages/live/components/BillingTransactions.vue'
import AccountActionModal from './AccountActionModal.vue'
import type { AccountAction } from './types'

const props = defineProps<{ threshold: number }>()
const emit = defineEmits<{ (e: 'changed'): void }>()

const loading = ref(false)
const rows = ref<AccountRow[]>([])
const plans = ref<BillPlan[]>([])
const packs = ref<BillPackDef[]>([])
const keyword = ref('')
const filter = ref('')
const shown = computed(() => {
  const kw = keyword.value.trim()
  return rows.value.filter((r) => {
    if (kw && !r.companyName.includes(kw) && String(r.companyId) !== kw) return false
    if (filter.value === 'arrears' && r.status !== 'arrears') return false
    if (filter.value === 'plan' && !r.planName) return false
    return true
  })
})
const totalBalance = computed(() => rows.value.reduce((s, r) => s + r.balance, 0))
const arrears = computed(() => rows.value.filter((r) => r.status === 'arrears').length)

const load = async () => {
  loading.value = true
  try {
    const [a, p, k] = await Promise.all([listAccounts(), listAllPlans(), listAllPackDefs()])
    rows.value = a || []
    plans.value = p || []
    packs.value = k || []
  } catch (e: any) {
    Message.error(e?.response?.data?.message || e?.message || '加载账户失败')
  } finally {
    loading.value = false
  }
}

const current = ref<AccountRow | null>(null)
const action = ref<AccountAction>('recharge')
const actionOpen = ref(false)
const openAction = (a: AccountAction, r: AccountRow) => {
  current.value = r
  action.value = a
  actionOpen.value = true
}
const detailOverview = ref<{ reload: () => void } | null>(null)
const onDone = () => {
  load()
  detailOverview.value?.reload()
  emit('changed')
}

const detailOpen = ref(false)
const months = recentMonths(new Date())
const exportMonth = ref(months[1])
const exporting = ref(false)
const openDetail = (r: AccountRow) => {
  current.value = r
  detailOpen.value = true
}
const doExport = async () => {
  if (!current.value) return
  exporting.value = true
  try {
    await exportStatement(exportMonth.value, current.value.companyId)
  } catch (e: any) {
    const msg = e?.response?.data instanceof Blob ? '该月账单尚未生成' : e?.response?.data?.message || e?.message
    Message.error(msg || '导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(load)
defineExpose({ reload: load, threshold: props.threshold })
</script>

<style scoped src="@/pages/live/components/billing.css"></style>
