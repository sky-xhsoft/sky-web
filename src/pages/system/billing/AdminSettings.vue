<template>
  <div class="bl">
    <V2Card :padding="false">
      <div class="bl-head"><span class="bl-title">扣费模式</span></div>
      <div class="as-body">
        <a-radio-group v-model="form.chargeMode" direction="vertical">
          <a-radio value="trial">试算：每天计算费用，只显示预估金额，不从余额扣除</a-radio>
          <a-radio value="charge">扣费：从开始日期起按用量从余额扣费</a-radio>
        </a-radio-group>
        <a-form-item v-if="form.chargeMode === 'charge'" label="开始扣费的用量日期" class="as-item">
          <a-date-picker v-model="form.chargeFrom" value-format="YYYY-MM-DD" style="width: 220px" />
          <template #extra>这天之前的用量保持试算，不补扣；已扣费的日期之后切回试算，仍按差额调整</template>
        </a-form-item>
        <a-form-item label="赠送 / 调账复核金额" class="as-item">
          <a-input-number v-model="form.threshold" :precision="2" :min="0.01" :step="1000" style="width: 220px"><template #prefix>¥</template></a-input-number>
          <template #extra>单笔超过该金额的赠送、调账须另一位平台管理员复核</template>
        </a-form-item>
        <div class="bl-actions">
          <a-popconfirm :content="confirmText" @ok="save">
            <a-button type="primary" :loading="saving">保存设置</a-button>
          </a-popconfirm>
          <span class="bl-sub">当前：{{ settings ? (settings.chargeMode === 'charge' ? `扣费（自 ${settings.chargeFrom} 起）` : '试算') : '—' }}</span>
        </div>
      </div>
    </V2Card>

    <V2Card :padding="false">
      <div class="bl-head"><span class="bl-title">重新计价</span></div>
      <div class="as-body">
        <div class="bl-sub">调整单价、套餐或资源包后，按当前配置重新计算所选日期的费用（不重新拉取用量）。试算日期直接更新金额；已扣费的日期按差额补扣或退还。之后已计价的日期会一并按顺序重算。</div>
        <div class="bl-actions">
          <a-range-picker v-model="rerate" value-format="YYYY-MM-DD" :disabled-date="notBeforeToday" :style="{ width: '260px' }" aria-label="重新计价日期" />
          <a-popconfirm content="按当前单价和套餐重新计算所选日期的费用？已扣费的日期会按差额补扣或退还。" @ok="doRerate">
            <a-button :loading="rerating" :disabled="!rerate || rerate.length !== 2">重新计价</a-button>
          </a-popconfirm>
        </div>
      </div>
    </V2Card>

    <V2Card :padding="false">
      <div class="bl-head"><span class="bl-title">月账单</span></div>
      <div class="as-body">
        <div class="bl-sub">每月 1 日凌晨在上月最后一天计价后自动出账；出账前核对每家公司的流水合计等于账户余额。已出账到：{{ settings?.statementClosed || '尚未出账' }}</div>
        <div class="bl-actions">
          <a-select v-model="month" :style="{ width: '150px' }" aria-label="出账月份">
            <a-option v-for="m in pastMonths" :key="m" :value="m">{{ m }}</a-option>
          </a-select>
          <a-popconfirm content="为所选月份生成（或重新生成）全部公司的账单？" @ok="generate">
            <a-button :loading="generating">生成账单</a-button>
          </a-popconfirm>
        </div>
      </div>
    </V2Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { V2Card } from '@/components/ui'
import { generateStatements, getBillSettings, rerateRange, updateBillSettings, type BillSettings } from '@/api/billing'
import { recentMonths, yuanToLi } from '@/pages/live/components/billing'

const emit = defineEmits<{ (e: 'changed', s: BillSettings): void }>()

const settings = ref<BillSettings | null>(null)
const form = reactive({ chargeMode: 'trial' as 'trial' | 'charge', chargeFrom: '', threshold: 10000 })
const saving = ref(false)
const pastMonths = recentMonths(new Date(), 13).slice(1)
const month = ref(pastMonths[0])
const generating = ref(false)
const err = (e: any, fallback: string) => Message.error(e?.response?.data?.message || e?.message || fallback)

const confirmText = computed(() =>
  form.chargeMode === 'charge'
    ? `确认从 ${form.chargeFrom || '（未选日期）'} 起正式扣费？之后每天凌晨按前一天的用量从各公司余额扣费。`
    : '确认切换为试算？之后的用量只计算、不扣费。')

const load = async () => {
  try {
    const res = await getBillSettings()
    settings.value = res.settings
    Object.assign(form, {
      chargeMode: res.settings.chargeMode,
      chargeFrom: res.settings.chargeFrom || dayjs().format('YYYY-MM-DD'),
      threshold: res.settings.reviewThreshold / 1000,
    })
    emit('changed', res.settings)
  } catch (e) {
    err(e, '加载设置失败')
  }
}
const save = async () => {
  saving.value = true
  try {
    settings.value = await updateBillSettings({ chargeMode: form.chargeMode, chargeFrom: form.chargeMode === 'charge' ? form.chargeFrom : '', reviewThreshold: yuanToLi(form.threshold) })
    Message.success('已保存')
    emit('changed', settings.value)
  } catch (e) {
    err(e, '保存失败')
  } finally {
    saving.value = false
  }
}
const rerate = ref<string[]>()
const rerating = ref(false)
const notBeforeToday = (d: Date) => !dayjs(d).isBefore(dayjs(), 'day')
const doRerate = async () => {
  if (!rerate.value || rerate.value.length !== 2) return
  rerating.value = true
  try {
    await rerateRange(rerate.value[0], rerate.value[1])
    Message.success(`已重新计价 ${rerate.value[0]} 至 ${rerate.value[1]}`)
  } catch (e) {
    err(e, '重新计价失败')
  } finally {
    rerating.value = false
  }
}
const generate = async () => {
  generating.value = true
  try {
    await generateStatements(month.value)
    Message.success(`已生成 ${month.value} 账单`)
    load()
  } catch (e) {
    err(e, '生成账单失败')
  } finally {
    generating.value = false
  }
}
onMounted(load)
defineExpose({ reload: load })
</script>

<style scoped src="@/pages/live/components/billing.css"></style>
<style scoped>
.as-body { padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 14px; }
.as-item { margin-bottom: 0; }
</style>
