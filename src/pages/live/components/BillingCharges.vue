<template>
  <V2Card :padding="false">
    <div class="bl-head">
      <div>
        <span class="bl-title">费用明细</span>
        <span class="bl-sub bc-total">合计 {{ formatMoney(total) }}{{ trialDays ? `（含试算 ${trialDays} 天）` : '' }}</span>
      </div>
      <a-select v-model="meter" :style="{ width: '140px' }" aria-label="计费点">
        <a-option value="">全部计费点</a-option>
        <a-option v-for="(v, k) in METERS" :key="k" :value="k">{{ v.label }}</a-option>
      </a-select>
    </div>
    <a-table :data="shown" :loading="loading" :pagination="shown.length > 31 ? { pageSize: 31 } : false" row-key="id" size="small" :scroll="{ x: 900 }">
      <template #columns>
        <a-table-column title="日期" :width="110"><template #cell="{ record }"><span class="bl-num">{{ record.usageDate }}</span></template></a-table-column>
        <a-table-column title="计费点" :width="100"><template #cell="{ record }">{{ METERS[record.meter].label }}</template></a-table-column>
        <a-table-column title="用量" align="right"><template #cell="{ record }"><span class="bl-num">{{ formatQty(record.meter, record.usage) }}</span></template></a-table-column>
        <a-table-column title="套餐抵扣" align="right"><template #cell="{ record }"><span class="bl-num bl-sub">{{ record.planOffset ? formatQty(record.meter, record.planOffset) : '—' }}</span></template></a-table-column>
        <a-table-column title="资源包抵扣" align="right"><template #cell="{ record }"><span class="bl-num bl-sub">{{ record.packOffset ? formatQty(record.meter, record.packOffset) : '—' }}</span></template></a-table-column>
        <a-table-column title="计费量" align="right"><template #cell="{ record }"><span class="bl-num">{{ formatQty(record.meter, record.billable) }}</span></template></a-table-column>
        <a-table-column title="单价" align="right" :width="140"><template #cell="{ record }"><span class="bl-num bl-sub">{{ formatUnitPrice(record.meter, record.unitPrice) }}</span></template></a-table-column>
        <a-table-column title="费用" align="right" :width="120"><template #cell="{ record }"><span class="bl-num">{{ formatMoney(record.amount) }}</span></template></a-table-column>
        <a-table-column title="状态" :width="90"><template #cell="{ record }">
          <a-tag size="small" :color="record.mode === 'charge' ? 'green' : 'gray'">{{ record.mode === 'charge' ? '已扣费' : '试算' }}</a-tag>
        </template></a-table-column>
      </template>
      <template #empty><div class="bl-empty">{{ month }} 还没有费用。用量在次日凌晨 4 点后计价。</div></template>
    </a-table>
    <div class="bl-sub bc-note">存储按「GB·月」计价，每天按当天占用 ÷ 当月天数折算；套餐的存储额度是每天的免费占用量。</div>
  </V2Card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { V2Card } from '@/components/ui'
import { getCharges, type BillCharge } from '@/api/billing'
import { METERS, formatMoney, formatQty, formatUnitPrice } from './billing'

// 费用明细：每天每个计费点一行
const props = defineProps<{ month: string }>()

const loading = ref(false)
const rows = ref<BillCharge[]>([])
const meter = ref('')
const shown = computed(() => (meter.value ? rows.value.filter((r) => r.meter === meter.value) : rows.value))
const total = computed(() => shown.value.reduce((s, r) => s + r.amount, 0))
const trialDays = computed(() => new Set(shown.value.filter((r) => r.mode !== 'charge').map((r) => r.usageDate)).size)

const load = async () => {
  loading.value = true
  try {
    rows.value = (await getCharges(props.month)) || []
  } catch (e: any) {
    Message.error(e?.response?.data?.message || e?.message || '加载费用明细失败')
  } finally {
    loading.value = false
  }
}
watch(() => props.month, load)
onMounted(load)
defineExpose({ reload: load })
</script>

<style scoped src="./billing.css"></style>
<style scoped>
.bc-total { margin-left: 12px; }
.bc-note { padding: 10px 20px 14px; }
</style>
