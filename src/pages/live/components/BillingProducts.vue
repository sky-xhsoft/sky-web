<template>
  <div class="bl">
    <div class="bl-note">套餐和资源包用账户余额购买（含授信额度）。套餐从开通当天起一个月有效，额度当期有效、不结转；周期内可升级到更高的套餐，按剩余天数补差价。</div>

    <V2Card v-if="sub" :padding="false">
      <div class="bl-head">
        <div class="bl-row">
          <span class="bl-title">当前套餐：{{ sub.planName }}</span>
          <span>{{ sub.startDate }} 至 {{ sub.endDate }}</span>
        </div>
        <div class="bl-actions">
          <span class="bl-sub">到期自动续费</span>
          <a-switch v-model="autoRenew" :loading="renewSaving" aria-label="到期自动续费" @change="onAutoRenew" />
        </div>
      </div>
      <div class="bp-hint bl-sub">开启后，到期次日从余额扣下一个月的套餐费；余额不足时不续费，回到按量计费。</div>
    </V2Card>

    <V2Card :padding="false">
      <div class="bl-head"><span class="bl-title">套餐</span><span class="bl-sub">账户余额 {{ formatMoney(balance) }}</span></div>
      <div class="bp-cards">
        <article v-for="p in plans" :key="p.id" class="bp-card" :class="{ 'is-current': sub?.planId === p.id }">
          <div class="bl-name">{{ p.name }}</div>
          <div class="bp-price">{{ formatMoney(p.monthlyFee) }}<span class="bl-sub"> / 月</span></div>
          <ul class="bp-list">
            <li>直播时长 {{ formatQty('live_duration', p.quotaMinutes) }}</li>
            <li>播放流量 {{ formatQty('play_flux', p.quotaFluxGb) }}</li>
            <li>存储空间 每天 {{ formatQty('storage', p.quotaStorageGb) }}</li>
          </ul>
          <div v-if="p.description" class="bl-sub">{{ p.description }}</div>
          <a-button :type="sub?.planId === p.id ? 'secondary' : 'primary'" :disabled="!canBuyPlan(p)" long @click="confirmPlan(p)">{{ planAction(p) }}</a-button>
        </article>
        <div v-if="!plans.length && !loading" class="bl-empty">暂无在售套餐</div>
      </div>
    </V2Card>

    <V2Card :padding="false">
      <div class="bl-head"><span class="bl-title">资源包</span><span class="bl-sub">套餐额度用完后抵扣；可叠加，先到期的先用</span></div>
      <div class="bp-cards">
        <article v-for="p in packs" :key="p.id" class="bp-card">
          <div class="bl-name">{{ p.name }}</div>
          <div class="bp-price">{{ formatMoney(p.price) }}</div>
          <ul class="bp-list">
            <li>{{ METERS[p.meter].label }} {{ formatQty(p.meter, p.quantity) }}</li>
            <li>购买后 {{ p.validMonths }} 个月内有效</li>
          </ul>
          <div v-if="p.description" class="bl-sub">{{ p.description }}</div>
          <a-button type="primary" long @click="confirmPack(p)">购买</a-button>
        </article>
        <div v-if="!packs.length && !loading" class="bl-empty">暂无在售资源包</div>
      </div>
    </V2Card>

    <a-modal v-model:visible="confirm.open" :title="confirm.title" :ok-loading="confirm.busy" ok-text="确认购买" :on-before-ok="doBuy" @cancel="confirm.open = false">
      <dl class="bl-dl">
        <dt>商品</dt><dd>{{ confirm.name }}</dd>
        <dt>应付</dt><dd class="bl-name">{{ formatMoney(confirm.fee) }}</dd>
        <dt>当前余额</dt><dd>{{ formatMoney(balance) }}</dd>
        <dt>购买后余额</dt><dd :class="{ 'bl-neg': balance - confirm.fee < 0 }">{{ formatMoney(balance - confirm.fee) }}</dd>
      </dl>
      <div v-if="confirm.note" class="bl-sub bp-confirm-note">{{ confirm.note }}</div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { V2Card } from '@/components/ui'
import { buyPack, getAccountOverview, getProducts, setAutoRenew, subscribePlan, type AccountOverview, type BillPackDef, type BillPlan } from '@/api/billing'
import { METERS, formatMoney, formatQty } from './billing'

const emit = defineEmits<{ (e: 'changed'): void }>()

const loading = ref(false)
const overview = ref<AccountOverview | null>(null)
const plans = ref<BillPlan[]>([])
const packs = ref<BillPackDef[]>([])
const sub = computed(() => overview.value?.subscription || null)
const balance = computed(() => overview.value?.account.balance || 0)
const autoRenew = ref(true)
const renewSaving = ref(false)
const err = (e: any, fallback: string) => Message.error(e?.response?.data?.message || e?.message || fallback)

const load = async () => {
  loading.value = true
  try {
    const [o, p] = await Promise.all([getAccountOverview(), getProducts()])
    overview.value = o
    plans.value = p.plans || []
    packs.value = p.packs || []
    autoRenew.value = o.subscription?.autoRenew ?? true
  } catch (e) {
    err(e, '加载套餐失败')
  } finally {
    loading.value = false
  }
}

// 当前套餐的月费：周期内只能升级到月费更高的套餐
const currentFee = computed(() => plans.value.find((p) => p.id === sub.value?.planId)?.monthlyFee ?? 0)
const canBuyPlan = (p: BillPlan) => !sub.value || (p.id !== sub.value.planId && p.monthlyFee > currentFee.value)
const planAction = (p: BillPlan) => {
  if (!sub.value) return '开通'
  if (p.id === sub.value.planId) return '当前套餐'
  return p.monthlyFee > currentFee.value ? '升级' : '到期后可更换'
}
// 升级补差价：（新月费 − 当前月费）× 剩余天数 ÷ 周期天数
const upgradeFee = (p: BillPlan) => {
  const s = sub.value!
  const total = dayjs(s.endDate).diff(dayjs(s.startDate), 'day') + 1
  const left = dayjs(s.endDate).diff(dayjs().startOf('day'), 'day') + 1
  return Math.round(((p.monthlyFee - currentFee.value) * left) / total)
}

const confirm = reactive({ open: false, busy: false, title: '', name: '', fee: 0, note: '', run: async () => {} })
const confirmPlan = (p: BillPlan) => {
  const upgrade = !!sub.value
  Object.assign(confirm, {
    open: true,
    title: upgrade ? '升级套餐' : '开通套餐',
    name: p.name,
    fee: upgrade ? upgradeFee(p) : p.monthlyFee,
    note: upgrade ? `补 ${dayjs().format('YYYY-MM-DD')} 至 ${sub.value!.endDate} 的差价，额度按剩余天数补发。` : `有效期 ${dayjs().format('YYYY-MM-DD')} 起一个月。`,
    run: () => subscribePlan(p.id),
  })
}
const confirmPack = (p: BillPackDef) => {
  Object.assign(confirm, { open: true, title: '购买资源包', name: p.name, fee: p.price, note: `从今天起 ${p.validMonths} 个月内有效。`, run: () => buyPack(p.id) })
}
const doBuy = async () => {
  confirm.busy = true
  try {
    await confirm.run()
    Message.success('购买成功')
    confirm.open = false
    emit('changed')
    await load()
  } catch (e) {
    err(e, '购买失败')
    return false
  } finally {
    confirm.busy = false
  }
}
const onAutoRenew = async (v: string | number | boolean) => {
  renewSaving.value = true
  try {
    await setAutoRenew(!!v)
    Message.success(v ? '已开启自动续费' : '已关闭自动续费')
  } catch (e) {
    autoRenew.value = !v
    err(e, '设置失败')
  } finally {
    renewSaving.value = false
  }
}
onMounted(load)
defineExpose({ reload: load })
</script>

<style scoped src="./billing.css"></style>
<style scoped>
.bp-hint { padding: 10px 20px 14px; }
.bp-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; padding: 16px 20px 20px; }
.bp-card { border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 10px; background: var(--bg-card); }
.bp-card.is-current { border-color: var(--brand-blue); box-shadow: 0 0 0 1px var(--brand-blue) inset; }
.bp-price { font-size: 22px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--text-primary); }
.bp-list { margin: 0; padding-left: 1.2em; color: var(--text-secondary); font-size: 13px; display: flex; flex-direction: column; gap: 2px; }
.bp-confirm-note { margin-top: 12px; }
</style>
