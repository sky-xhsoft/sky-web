<template>
  <div class="bl">
    <div class="bl-grid">
      <section v-for="(m, key) in METERS" :key="key" class="bl-tile" :aria-label="`${m.label}默认单价`">
        <div class="bl-k">{{ m.label }} · 默认单价</div>
        <div class="bl-v">{{ current(key, 0) ? formatUnitPrice(key, current(key, 0)!.unitPrice) : '未设置' }}</div>
        <div class="bl-row">
          <span v-if="current(key, 0)">自 {{ current(key, 0)!.effectiveDate }} 起</span>
          <span v-if="upcoming(key, 0)" class="bl-pos">{{ upcoming(key, 0)!.effectiveDate }} 起调整为 {{ formatUnitPrice(key, upcoming(key, 0)!.unitPrice) }}</span>
        </div>
        <div class="bl-foot">{{ key === 'storage' ? '按 GB·月计价，每天按当天占用 ÷ 当月天数折算' : `按每天用量计价（${m.priceUnit}）` }}</div>
      </section>
    </div>
    <div v-if="missing.length" class="bl-warn">尚未设置默认单价：{{ missing.join('、') }}。没有单价的计费点按 0 元计费。</div>

    <V2Card :padding="false">
      <div class="bl-head">
        <div><span class="bl-title">单价版本</span><span class="bl-sub ap-tip">改价请新增一个版本，从生效日期起的用量按新单价计费；已用于扣费的版本不能删除</span></div>
        <a-button type="primary" @click="openCreate"><template #icon><icon-plus /></template>新增单价</a-button>
      </div>
      <a-table :data="rows" :loading="loading" row-key="id" size="small" :pagination="rows.length > 20 ? { pageSize: 20 } : false" :scroll="{ x: 900 }">
        <template #columns>
          <a-table-column title="计费点" :width="100"><template #cell="{ record }">{{ METERS[record.meter].label }}</template></a-table-column>
          <a-table-column title="适用" :width="200"><template #cell="{ record }">
            <span v-if="!record.companyId">默认（所有公司）</span>
            <span v-else>{{ companyName(record.companyId) }}<span class="bl-sub"> · 专属价</span></span>
          </template></a-table-column>
          <a-table-column title="单价" align="right" :width="150"><template #cell="{ record }"><span class="bl-num">{{ formatUnitPrice(record.meter, record.unitPrice) }}</span></template></a-table-column>
          <a-table-column title="生效日期" :width="110"><template #cell="{ record }"><span class="bl-num">{{ record.effectiveDate }}</span></template></a-table-column>
          <a-table-column title="状态" :width="90"><template #cell="{ record }">
            <a-tag size="small" :color="STATE[state(record)].color">{{ STATE[state(record)].label }}</a-tag>
          </template></a-table-column>
          <a-table-column title="备注" :min-width="140"><template #cell="{ record }"><span class="bl-sub">{{ record.remark || '—' }}</span></template></a-table-column>
          <a-table-column title="创建" :width="150"><template #cell="{ record }"><span class="bl-sub">{{ record.createBy }} · {{ fmt(record.createTime) }}</span></template></a-table-column>
          <a-table-column title="操作" :width="80"><template #cell="{ record }">
            <a-popconfirm v-if="state(record) === 'upcoming'" content="删除这个未生效的单价版本？" @ok="remove(record)">
              <a-button type="text" size="mini" status="danger">删除</a-button>
            </a-popconfirm>
          </template></a-table-column>
        </template>
        <template #empty><div class="bl-empty">还没有单价，请先为三个计费点设置默认单价</div></template>
      </a-table>
    </V2Card>

    <a-modal v-model:visible="open" title="新增单价" :ok-loading="saving" ok-text="保存" :width="520" :on-before-ok="save">
      <a-form :model="form" layout="vertical">
        <a-form-item label="计费点" required>
          <a-radio-group v-model="form.meter" type="button">
            <a-radio v-for="(m, key) in METERS" :key="key" :value="key">{{ m.label }}</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="适用范围" required>
          <a-select v-model="form.companyId" allow-search placeholder="选择公司">
            <a-option :value="0">默认（所有公司）</a-option>
            <a-option v-for="c in companies" :key="c.companyId" :value="c.companyId">{{ c.companyName }}（ID {{ c.companyId }}）</a-option>
          </a-select>
          <template #extra>选择公司时为该公司的专属价，优先于默认价</template>
        </a-form-item>
        <a-form-item :label="`单价（元 / ${METERS[form.meter].priceUnit}）`" required>
          <a-input-number v-model="form.price" :precision="4" :min="0" :step="0.01" style="width: 100%"><template #prefix>¥</template></a-input-number>
          <template #extra>{{ form.meter === 'storage' ? '存储按 GB·月计价，每天按当天占用 ÷ 当月天数折算' : '最多 4 位小数' }}</template>
        </a-form-item>
        <a-form-item label="生效日期" required>
          <a-date-picker v-model="form.effectiveDate" value-format="YYYY-MM-DD" style="width: 100%" />
          <template #extra>从这天起的用量按新单价计费。须晚于已扣费的最后一天；设置过去的日期后，到「扣费设置」重新计价才会更新试算金额</template>
        </a-form-item>
        <a-form-item label="备注">
          <a-input v-model="form.remark" :max-length="100" placeholder="可选，如「2026 年 Q4 调价」" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import dayjs from 'dayjs'
import { V2Card } from '@/components/ui'
import { createPrice, deletePrice, listAccounts, listPrices, type AccountRow, type BillPrice, type MeterKey } from '@/api/billing'
import { METERS, formatUnitPrice, yuanToUnitPrice } from '@/pages/live/components/billing'

const loading = ref(false)
const rows = ref<BillPrice[]>([])
const companies = ref<AccountRow[]>([])
const today = dayjs().format('YYYY-MM-DD')
const fmt = (v: string) => dayjs(v).format('MM-DD HH:mm')
const companyName = (id: number) => {
  const c = companies.value.find((x) => x.companyId === id)
  return c ? `${c.companyName}（ID ${id}）` : `公司 ${id}`
}

// 同一公司同一计费点：生效日期不晚于今天的最新一条为当前生效，之后的为待生效，之前的为已失效
const effectiveOf = (meter: string, companyId: number) =>
  rows.value.filter((r) => r.meter === meter && r.companyId === companyId && r.effectiveDate <= today)
    .sort((a, b) => (a.effectiveDate === b.effectiveDate ? b.id - a.id : b.effectiveDate.localeCompare(a.effectiveDate)))[0]
const current = (meter: string, companyId: number) => effectiveOf(meter, companyId)
const upcoming = (meter: string, companyId: number) =>
  rows.value.filter((r) => r.meter === meter && r.companyId === companyId && r.effectiveDate > today)
    .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate))[0]
const state = (r: BillPrice): 'current' | 'upcoming' | 'expired' => {
  if (r.effectiveDate > today) return 'upcoming'
  return effectiveOf(r.meter, r.companyId)?.id === r.id ? 'current' : 'expired'
}
const STATE = { current: { label: '当前生效', color: 'green' }, upcoming: { label: '待生效', color: 'arcoblue' }, expired: { label: '已失效', color: 'gray' } }
const missing = computed(() => Object.entries(METERS).filter(([k]) => !current(k, 0)).map(([, m]) => m.label))

const load = async () => {
  loading.value = true
  try {
    const [p, a] = await Promise.all([listPrices(), listAccounts()])
    rows.value = p || []
    companies.value = a || []
  } catch (e: any) {
    Message.error(e?.response?.data?.message || e?.message || '加载单价失败')
  } finally {
    loading.value = false
  }
}

const open = ref(false)
const saving = ref(false)
const form = reactive({ meter: 'live_duration' as MeterKey, companyId: 0, price: undefined as number | undefined, effectiveDate: today, remark: '' })
const openCreate = () => {
  Object.assign(form, { meter: 'live_duration', companyId: 0, price: undefined, effectiveDate: today, remark: '' })
  open.value = true
}
const save = async () => {
  if (form.price === undefined || form.price === null) {
    Message.warning('请填写单价')
    return false
  }
  saving.value = true
  try {
    await createPrice({ meter: form.meter, companyId: form.companyId, unitPrice: yuanToUnitPrice(form.price), effectiveDate: form.effectiveDate, remark: form.remark.trim() })
    Message.success('已保存')
    open.value = false
    load()
  } catch (e: any) {
    Message.error(e?.response?.data?.message || e?.message || '保存失败')
    return false
  } finally {
    saving.value = false
  }
}
const remove = async (r: BillPrice) => {
  try {
    await deletePrice(r.id)
    Message.success('已删除')
    load()
  } catch (e: any) {
    Message.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}
onMounted(load)
defineExpose({ reload: load })
</script>

<style scoped src="@/pages/live/components/billing.css"></style>
<style scoped>
.ap-tip { margin-left: 12px; }
</style>
