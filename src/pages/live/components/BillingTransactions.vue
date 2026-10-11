<template>
  <V2Card :padding="false">
    <div class="bl-head">
      <span class="bl-title">交易流水</span>
      <div class="bl-actions">
        <a-select v-model="type" :style="{ width: '140px' }" aria-label="流水类型" @change="reload">
          <a-option value="">全部类型</a-option>
          <a-option v-for="(v, k) in TXN_TYPES" :key="k" :value="k">{{ v.label }}</a-option>
        </a-select>
        <a-checkbox v-model="allPeriods" @change="reload">不限月份</a-checkbox>
      </div>
    </div>
    <a-table :data="items" :loading="loading" row-key="id" size="small" :scroll="{ x: 860 }"
      :pagination="{ current: page, pageSize: 20, total, size: 'small', showTotal: true }" @page-change="onPage">
      <template #columns>
        <a-table-column title="时间" :width="160"><template #cell="{ record }"><span class="bl-num">{{ fmt(record.createTime) }}</span></template></a-table-column>
        <a-table-column title="类型" :width="110"><template #cell="{ record }">
          <a-tag size="small" :color="TXN_TYPES[record.type]?.color">{{ TXN_TYPES[record.type]?.label || record.type }}</a-tag>
        </template></a-table-column>
        <a-table-column title="金额" align="right" :width="130"><template #cell="{ record }">
          <span class="bl-num" :class="record.amount > 0 ? 'bl-pos' : 'bl-neg'">{{ formatSigned(record.amount) }}</span>
        </template></a-table-column>
        <a-table-column title="变动后余额" align="right" :width="130"><template #cell="{ record }"><span class="bl-num">{{ formatMoney(record.balanceAfter) }}</span></template></a-table-column>
        <a-table-column title="说明" :min-width="200"><template #cell="{ record }">
          <div>{{ record.remark || '—' }}</div>
          <div v-if="record.voucher || record.giftAmount" class="bl-sub">
            <span v-if="record.voucher">凭证 {{ record.voucher }}</span>
            <span v-if="record.giftAmount"> 赠送部分 {{ formatSigned(record.giftAmount) }}</span>
          </div>
        </template></a-table-column>
        <a-table-column title="账期" :width="90"><template #cell="{ record }"><span class="bl-num bl-sub">{{ record.period }}</span></template></a-table-column>
        <a-table-column title="操作人" :width="110"><template #cell="{ record }"><span class="bl-sub">{{ record.operator || '—' }}</span></template></a-table-column>
      </template>
      <template #empty><div class="bl-empty">没有流水</div></template>
    </a-table>
  </V2Card>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { V2Card } from '@/components/ui'
import { getCompanyTransactions, getTransactions, type BillTransaction } from '@/api/billing'
import { TXN_TYPES, formatMoney, formatSigned } from './billing'

// 余额流水；传 companyId 时为平台查看该公司
const props = defineProps<{ month: string; companyId?: number }>()

const items = ref<BillTransaction[]>([])
const total = ref(0)
const page = ref(1)
const type = ref('')
const allPeriods = ref(false)
const loading = ref(false)
const fmt = (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm')

const load = async () => {
  loading.value = true
  try {
    const params = { period: allPeriods.value ? undefined : props.month, type: type.value || undefined, page: page.value, pageSize: 20 }
    const res = props.companyId ? await getCompanyTransactions(props.companyId, params) : await getTransactions(params)
    items.value = res.items || []
    total.value = res.total || 0
  } catch (e: any) {
    Message.error(e?.response?.data?.message || e?.message || '加载流水失败')
  } finally {
    loading.value = false
  }
}
const reload = () => {
  page.value = 1
  load()
}
const onPage = (p: number) => {
  page.value = p
  load()
}
watch(() => [props.month, props.companyId], reload)
onMounted(load)
defineExpose({ reload })
</script>

<style scoped src="./billing.css"></style>
