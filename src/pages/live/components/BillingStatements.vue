<template>
  <V2Card :padding="false">
    <div class="bl-head">
      <span class="bl-title">月账单</span>
      <span class="bl-sub">每月 1 日凌晨生成上月账单；期初余额 + 收入 − 支出 = 期末余额</span>
    </div>
    <a-table :data="list" :loading="loading" :pagination="false" row-key="id" :scroll="{ x: 820 }">
      <template #columns>
        <a-table-column title="月份" :width="110"><template #cell="{ record }"><span class="bl-name bl-num">{{ record.month }}</span></template></a-table-column>
        <a-table-column title="期初余额" align="right"><template #cell="{ record }"><span class="bl-num">{{ formatMoney(record.opening) }}</span></template></a-table-column>
        <a-table-column title="收入" align="right"><template #cell="{ record }"><span class="bl-num bl-pos">{{ formatSigned(income(record)) }}</span></template></a-table-column>
        <a-table-column title="支出" align="right"><template #cell="{ record }"><span class="bl-num">{{ formatMoney(spend(record)) }}</span></template></a-table-column>
        <a-table-column title="期末余额" align="right"><template #cell="{ record }"><span class="bl-num" :class="{ 'bl-neg': record.closing < 0 }">{{ formatMoney(record.closing) }}</span></template></a-table-column>
        <a-table-column title="操作" :width="160"><template #cell="{ record }">
          <a-button type="text" size="mini" @click="open(record.month)">详情</a-button>
          <a-button type="text" size="mini" :loading="exporting === record.month" @click="doExport(record.month)">导出</a-button>
        </template></a-table-column>
      </template>
      <template #empty><div class="bl-empty">还没有账单。每月 1 日凌晨生成上月账单。</div></template>
    </a-table>

    <a-drawer v-model:visible="drawer" :title="`${detail?.month || ''} 账单`" :width="720" :footer="false" unmount-on-close>
      <div v-if="detail" class="bl">
        <dl class="bl-dl">
          <dt>期初余额</dt><dd>{{ formatMoney(detail.opening) }}</dd>
          <dt>充值</dt><dd class="bl-pos">{{ formatSigned(detail.recharge) }}</dd>
          <dt>赠送</dt><dd class="bl-pos">{{ formatSigned(detail.gift) }}</dd>
          <dt>调账</dt><dd>{{ formatSigned(detail.adjust) }}</dd>
          <dt>直播时长</dt><dd>{{ formatSigned(-detail.usageDuration) }}</dd>
          <dt>播放流量</dt><dd>{{ formatSigned(-detail.usageFlux) }}</dd>
          <dt>存储空间</dt><dd>{{ formatSigned(-detail.usageStorage) }}</dd>
          <dt>以往月份补扣 / 退还</dt><dd>{{ formatSigned(-detail.usageAdjust) }}</dd>
          <dt>套餐费</dt><dd>{{ formatSigned(-detail.planFee) }}</dd>
          <dt>资源包</dt><dd>{{ formatSigned(-detail.packFee) }}</dd>
          <dt class="bl-name">期末余额</dt><dd class="bl-name">{{ formatMoney(detail.closing) }}</dd>
        </dl>
        <div class="bl-title">用量与抵扣</div>
        <a-table :data="detail.detail.meters" :pagination="false" row-key="meter" size="small" :scroll="{ x: 640 }">
          <template #columns>
            <a-table-column title="计费点" :width="90"><template #cell="{ record }">{{ METERS[record.meter].label }}</template></a-table-column>
            <a-table-column title="用量" align="right"><template #cell="{ record }"><span class="bl-num">{{ formatQty(record.meter, record.usage) }}</span></template></a-table-column>
            <a-table-column title="套餐抵扣" align="right"><template #cell="{ record }"><span class="bl-num">{{ formatQty(record.meter, record.planOffset) }}</span></template></a-table-column>
            <a-table-column title="资源包抵扣" align="right"><template #cell="{ record }"><span class="bl-num">{{ formatQty(record.meter, record.packOffset) }}</span></template></a-table-column>
            <a-table-column title="费用" align="right"><template #cell="{ record }">
              <span class="bl-num">{{ formatMoney(record.amount) }}</span>
              <div v-if="record.trialDays" class="bl-sub">含试算 {{ record.trialDays }} 天</div>
            </template></a-table-column>
          </template>
        </a-table>
        <template v-if="detail.detail.subscriptions.length">
          <div class="bl-title">套餐</div>
          <div v-for="s in detail.detail.subscriptions" :key="s.id" class="bl-row">
            <span class="bl-name">{{ s.planName }}</span><span>{{ s.startDate }} 至 {{ s.endDate }}</span><span>套餐费 {{ formatMoney(s.fee) }}</span>
          </div>
        </template>
        <div class="bl-title">直播间用量（{{ detail.detail.rooms.length }}）</div>
        <a-table :data="detail.detail.rooms" :pagination="detail.detail.rooms.length > 10 ? { pageSize: 10, size: 'small' } : false" row-key="roomId" size="small">
          <template #columns>
            <a-table-column title="直播间"><template #cell="{ record }">{{ record.roomName || `直播间 ${record.roomId}` }}<span v-if="record.deleted" class="bl-sub">（已删除）</span></template></a-table-column>
            <a-table-column title="直播时长" align="right"><template #cell="{ record }"><span class="bl-num">{{ formatMinutes(record.liveMinutes) }}</span></template></a-table-column>
            <a-table-column title="播放流量" align="right"><template #cell="{ record }"><span class="bl-num">{{ formatGB(record.playGb) }}</span></template></a-table-column>
          </template>
        </a-table>
        <div><a-button type="primary" :loading="exporting === detail.month" @click="doExport(detail.month)">导出 Excel</a-button></div>
      </div>
    </a-drawer>
  </V2Card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { V2Card } from '@/components/ui'
import { exportStatement, getStatement, getStatements, type BillStatement, type StatementView } from '@/api/billing'
import { METERS, formatGB, formatMinutes, formatMoney, formatQty, formatSigned } from './billing'

const loading = ref(false)
const list = ref<BillStatement[]>([])
const drawer = ref(false)
const detail = ref<StatementView | null>(null)
const exporting = ref('')

const income = (s: BillStatement) => s.recharge + s.gift + s.adjust
const spend = (s: BillStatement) => s.usageDuration + s.usageFlux + s.usageStorage + s.usageAdjust + s.planFee + s.packFee
const err = (e: any, fallback: string) => Message.error(e?.response?.data?.message || e?.message || fallback)

const load = async () => {
  loading.value = true
  try {
    list.value = (await getStatements()) || []
  } catch (e) {
    err(e, '加载账单失败')
  } finally {
    loading.value = false
  }
}
const open = async (month: string) => {
  try {
    detail.value = await getStatement(month)
    drawer.value = true
  } catch (e) {
    err(e, '加载账单详情失败')
  }
}
const doExport = async (month: string) => {
  exporting.value = month
  try {
    await exportStatement(month)
  } catch (e) {
    err(e, '导出失败')
  } finally {
    exporting.value = ''
  }
}
onMounted(load)
defineExpose({ reload: load })
</script>

<style scoped src="./billing.css"></style>
