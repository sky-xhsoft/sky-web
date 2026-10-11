<template>
  <a-modal :visible="visible" :title="title" :ok-loading="busy" :ok-text="okText" :width="520" unmount-on-close @ok="submit" @cancel="emit('update:visible', false)">
    <div class="aa-company">{{ account?.companyName }}（ID {{ account?.companyId }}）· 余额 {{ formatMoney(account?.balance || 0) }}</div>
    <a-form :model="form" layout="vertical">
      <template v-if="action === 'recharge' || action === 'gift' || action === 'adjust' || action === 'credit'">
        <a-form-item :label="amountLabel" required>
          <a-input-number v-model="form.amount" :precision="2" :min="action === 'adjust' ? undefined : 0" :step="100" placeholder="单位：元" style="width: 100%">
            <template #prefix>¥</template>
          </a-input-number>
          <template #extra>
            <span v-if="action === 'adjust'">正数为补入，负数为扣减</span>
            <span v-else-if="action === 'credit'">余额加授信额度小于 0 时为欠费；0 表示不授信</span>
            <span v-else-if="action === 'gift'">赠送金额优先消费，不可退款</span>
          </template>
        </a-form-item>
        <a-form-item v-if="action === 'recharge'" label="转账凭证号" required>
          <a-input v-model="form.voucher" :max-length="128" placeholder="银行回单号或转账流水号" />
        </a-form-item>
        <a-form-item v-if="action !== 'credit'" :label="action === 'recharge' ? '备注' : '原因'" :required="action !== 'recharge'">
          <a-textarea v-model="form.reason" :max-length="200" :auto-size="{ minRows: 2, maxRows: 4 }" :placeholder="action === 'recharge' ? '可选' : '必填，记入流水和审计日志'" />
        </a-form-item>
        <div v-if="needReview" class="aa-review">金额超过复核阈值 {{ formatMoney(threshold) }}，提交后需另一位平台管理员复核才会入账。</div>
      </template>
      <template v-else-if="action === 'subscribe'">
        <a-form-item label="套餐" required>
          <a-select v-model="form.id" placeholder="选择套餐">
            <a-option v-for="p in plans" :key="p.id" :value="p.id">{{ p.name }} · {{ formatMoney(p.monthlyFee) }}/月{{ p.status === 'off' ? '（已下架）' : '' }}</a-option>
          </a-select>
          <template #extra>公司没有有效套餐时从今天开通一个月；已有套餐时只能升级，按剩余天数补差价</template>
        </a-form-item>
        <a-form-item label="套餐费">
          <a-radio-group v-model="form.free">
            <a-radio :value="false">从余额扣</a-radio>
            <a-radio :value="true">免费开通</a-radio>
          </a-radio-group>
        </a-form-item>
      </template>
      <template v-else-if="action === 'pack'">
        <a-form-item label="资源包" required>
          <a-select v-model="form.id" placeholder="选择资源包">
            <a-option v-for="p in packs" :key="p.id" :value="p.id">{{ p.name }}（{{ p.validMonths }} 个月有效）{{ p.status === 'off' ? '（已下架）' : '' }}</a-option>
          </a-select>
          <template #extra>平台发放的资源包免费，不产生流水</template>
        </a-form-item>
      </template>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  adminSubscribe, giftOrAdjust, grantPack, rechargeAccount, setCreditLimit,
  type AccountRow, type BillPackDef, type BillPlan,
} from '@/api/billing'
import { formatMoney, yuanToLi } from '@/pages/live/components/billing'
import type { AccountAction } from './types'

const props = defineProps<{ visible: boolean; action: AccountAction; account: AccountRow | null; plans: BillPlan[]; packs: BillPackDef[]; threshold: number }>()
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void; (e: 'done'): void }>()

const TITLES: Record<AccountAction, string> = { recharge: '录入线下充值', gift: '赠送', adjust: '调账', credit: '设置授信额度', subscribe: '开通 / 升级套餐', pack: '发放资源包' }
const title = computed(() => TITLES[props.action])
const okText = computed(() => (needReview.value ? '提交复核' : '确定'))
const amountLabel = computed(() => ({ recharge: '充值金额', gift: '赠送金额', adjust: '调账金额', credit: '授信额度' } as Record<string, string>)[props.action])

const form = reactive({ amount: undefined as number | undefined, voucher: '', reason: '', id: undefined as number | undefined, free: false })
const busy = ref(false)
watch(() => props.visible, (v) => {
  if (!v) return
  Object.assign(form, { amount: props.action === 'credit' ? (props.account?.creditLimit || 0) / 1000 : undefined, voucher: '', reason: '', id: undefined, free: false })
})
const needReview = computed(() => (props.action === 'gift' || props.action === 'adjust') && Math.abs(yuanToLi(form.amount)) > props.threshold)

const submit = async () => {
  const companyId = props.account?.companyId
  if (!companyId) return
  const amount = yuanToLi(form.amount)
  busy.value = true
  try {
    switch (props.action) {
      case 'recharge':
        await rechargeAccount(companyId, { amount, voucher: form.voucher.trim(), reason: form.reason.trim() })
        Message.success(`已充值 ${formatMoney(amount)}`)
        break
      case 'gift':
      case 'adjust': {
        const res = await giftOrAdjust(companyId, props.action, { amount, reason: form.reason.trim() })
        Message.success(res.pending ? '已提交复核，复核通过后入账' : '已入账')
        break
      }
      case 'credit':
        await setCreditLimit(companyId, amount)
        Message.success('已设置授信额度')
        break
      case 'subscribe':
        if (!form.id) throw new Error('请选择套餐')
        await adminSubscribe(companyId, form.id, form.free)
        Message.success('套餐已开通')
        break
      case 'pack':
        if (!form.id) throw new Error('请选择资源包')
        await grantPack(companyId, form.id)
        Message.success('资源包已发放')
        break
    }
    emit('update:visible', false)
    emit('done')
  } catch (e: any) {
    Message.error(e?.response?.data?.message || e?.message || '操作失败')
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.aa-company { margin-bottom: 14px; font-size: 13px; color: var(--text-secondary); }
.aa-review { padding: 8px 12px; border-radius: 6px; background: var(--warning-bg); color: var(--warning); font-size: 13px; }
</style>
