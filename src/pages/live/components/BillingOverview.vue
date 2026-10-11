<template>
  <div class="bl">
    <template v-if="data">
      <div v-if="data.status === 'arrears'" class="bl-bad">
        已欠费：余额 {{ formatMoney(data.account.balance) }}{{ data.account.creditLimit ? `，授信额度 ${formatMoney(data.account.creditLimit)}` : '' }}。请尽快联系平台充值。
      </div>
      <div v-if="data.settings.chargeMode !== 'charge'" class="bl-note">试算阶段：以下费用为按当前单价计算的预估，暂不从余额扣除。</div>
      <div v-else class="bl-note">自 {{ data.settings.chargeFrom }} 起，每天凌晨按前一天的用量从余额扣费；套餐额度和资源包优先抵扣。</div>

      <div class="bl-grid">
        <section class="bl-tile" aria-label="账户余额">
          <div class="bl-k">账户余额</div>
          <div class="bl-v" :class="{ 'is-neg': data.account.balance < 0 }">{{ formatMoney(data.account.balance) }}</div>
          <div class="bl-row">
            <span v-if="data.account.giftBalance">其中赠送 {{ formatMoney(data.account.giftBalance) }}</span>
            <span v-if="data.account.creditLimit">授信额度 {{ formatMoney(data.account.creditLimit) }}</span>
            <span v-if="!data.account.giftBalance && !data.account.creditLimit">充值请联系平台</span>
          </div>
          <div class="bl-foot">赠送金额优先消费，消费顺序：套餐额度 → 资源包 → 余额</div>
        </section>
        <section class="bl-tile" aria-label="本月费用">
          <div class="bl-k">本月费用{{ trial ? '（预估）' : '' }}</div>
          <div class="bl-v">{{ formatMoney(data.usageCost + data.feeCost) }}</div>
          <div class="bl-row">
            <span>用量 {{ formatMoney(data.usageCost) }}</span>
            <span v-if="data.feeCost">套餐与资源包 {{ formatMoney(data.feeCost) }}</span>
          </div>
          <div class="bl-foot">
            <span v-for="c in data.meterCosts" :key="c.meter">{{ METERS[c.meter].label }} {{ formatMoney(c.amount) }}</span>
            <span>{{ data.ratedDay ? `已计价到 ${data.ratedDay}` : '本月还没有计价' }}</span>
          </div>
        </section>
        <section class="bl-tile" aria-label="月底预计">
          <div class="bl-k">月底预计</div>
          <div class="bl-v">{{ formatMoney(data.estimate) }}</div>
          <div class="bl-row"><span>按本月已计价天数的日均用量推算</span></div>
          <div class="bl-foot">用量每天凌晨 4 点后计价前一天；实际以月账单为准</div>
        </section>
      </div>

      <V2Card :padding="false">
        <div class="bl-head">
          <span class="bl-title">套餐</span>
          <a-button v-if="!adminView" type="text" size="small" @click="emit('go', 'products')">{{ sub ? '升级或续费设置' : '开通套餐' }}</a-button>
        </div>
        <div v-if="sub" class="bo-plan">
          <div class="bl-row">
            <span class="bl-name">{{ sub.planName }}</span>
            <span>{{ sub.startDate }} 至 {{ sub.endDate }}</span>
            <a-tag size="small" :color="sub.autoRenew ? 'green' : 'gray'">{{ sub.autoRenew ? '到期自动续费' : '到期不续费' }}</a-tag>
          </div>
          <div class="bl-quota">
            <span>直播时长</span>
            <div class="bl-bar"><i :class="{ 'is-high': quotaPercent(sub.usedMinutes, sub.quotaMinutes) >= 90 }" :style="{ width: `${quotaPercent(sub.usedMinutes, sub.quotaMinutes)}%` }" /></div>
            <span class="bl-sub">{{ formatQty('live_duration', sub.usedMinutes) }} / {{ formatQty('live_duration', sub.quotaMinutes) }}</span>
            <span>播放流量</span>
            <div class="bl-bar"><i :class="{ 'is-high': quotaPercent(sub.usedFluxGb, sub.quotaFluxGb) >= 90 }" :style="{ width: `${quotaPercent(sub.usedFluxGb, sub.quotaFluxGb)}%` }" /></div>
            <span class="bl-sub">{{ formatQty('play_flux', sub.usedFluxGb) }} / {{ formatQty('play_flux', sub.quotaFluxGb) }}</span>
          </div>
          <div class="bl-sub">存储：每天占用 {{ formatQty('storage', sub.quotaStorageGb) }} 以内不计费，超出部分按量计费；直播时长、播放流量额度用完后按量计费</div>
        </div>
        <div v-else class="bo-plan bl-sub">未开通套餐，全部用量按单价计费。</div>
      </V2Card>

      <V2Card v-if="data.packs.length" :padding="false">
        <div class="bl-head"><span class="bl-title">资源包</span><span class="bl-sub">先到期的先用</span></div>
        <a-table :data="data.packs" :pagination="false" row-key="id" size="small" :scroll="{ x: 560 }">
          <template #columns>
            <a-table-column title="资源包"><template #cell="{ record }">
              <span class="bl-name">{{ record.name }}</span>
              <a-tag v-if="record.source === 'grant'" size="small" color="cyan" class="bo-tag">赠送</a-tag>
            </template></a-table-column>
            <a-table-column title="剩余 / 总量" :width="220" align="right"><template #cell="{ record }">
              <span class="bl-num">{{ formatQty(record.meter, record.remaining) }} / {{ formatQty(record.meter, record.total) }}</span>
            </template></a-table-column>
            <a-table-column title="有效期" :width="200"><template #cell="{ record }">
              <span class="bl-num">{{ record.validFrom }} 至 {{ record.validTo }}</span>
            </template></a-table-column>
          </template>
        </a-table>
      </V2Card>
    </template>
    <a-spin v-else :loading="loading" class="bo-loading" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { V2Card } from '@/components/ui'
import { getAccountOverview, getCompanyOverview, type AccountOverview } from '@/api/billing'
import { METERS, formatMoney, formatQty, quotaPercent } from './billing'

// 费用概览；传 companyId 时为平台查看该公司（不显示购买入口）
const props = defineProps<{ companyId?: number }>()
const emit = defineEmits<{ (e: 'go', tab: string): void }>()

const loading = ref(false)
const data = ref<AccountOverview | null>(null)
const adminView = computed(() => !!props.companyId)
const sub = computed(() => data.value?.subscription || null)
const trial = computed(() => data.value?.settings.chargeMode !== 'charge')

const load = async () => {
  loading.value = true
  try {
    data.value = props.companyId ? await getCompanyOverview(props.companyId) : await getAccountOverview()
  } catch (e: any) {
    Message.error(e?.response?.data?.message || e?.message || '加载费用概览失败')
  } finally {
    loading.value = false
  }
}
onMounted(load)
defineExpose({ reload: load })
</script>

<style scoped src="./billing.css"></style>
<style scoped>
.bo-plan { padding: 14px 20px 16px; display: flex; flex-direction: column; gap: 12px; }
.bo-tag { margin-left: 6px; }
.bo-loading { display: block; padding: 40px 0; }
</style>
