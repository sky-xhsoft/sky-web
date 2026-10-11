<template>
  <div class="br">
    <V2Card :padding="false">
      <div class="br-head">
        <div>
          <div class="br-title">全部公司用量</div>
          <div class="br-sub">{{ month }}，含使用平台腾讯云账号和自有账号的公司</div>
        </div>
        <div class="br-actions">
          <a-range-picker v-model="range" value-format="YYYY-MM-DD" :disabled-date="isFuture" :style="{ width: '250px' }" aria-label="重新计量日期" />
          <a-select v-model="meters" multiple placeholder="全部计费点" :style="{ width: '220px' }" aria-label="重新计量的计费点" allow-clear>
            <a-option value="live_duration">直播时长</a-option>
            <a-option value="play_flux">播放流量</a-option>
            <a-option value="storage">存储空间</a-option>
          </a-select>
          <a-popconfirm content="按所选日期重新计算用量，会替换这些日期的现有结果。确定重新计量？" @ok="recompute">
            <a-button type="primary" :loading="recomputing" :disabled="!range || range.length !== 2">重新计量</a-button>
          </a-popconfirm>
        </div>
      </div>
      <a-table :data="data?.companies || []" :loading="loading" :pagination="false" row-key="companyId" :scroll="{ x: 760 }">
        <template #columns>
          <a-table-column title="公司">
            <template #cell="{ record }">
              <div class="br-name">{{ record.companyName || `公司 ${record.companyId}` }}</div>
              <div class="br-sub">ID {{ record.companyId }}</div>
            </template>
          </a-table-column>
          <a-table-column title="腾讯云账号" :width="190">
            <template #cell="{ record }">
              <a-tag :color="record.account === 'global' ? 'arcoblue' : 'gray'" size="small">{{ accountLabel(record.account) }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="直播时长" :width="160" align="right"><template #cell="{ record }"><span class="br-num">{{ formatMinutes(record.liveMinutes) }}</span></template></a-table-column>
          <a-table-column title="播放流量" :width="140" align="right"><template #cell="{ record }"><span class="br-num">{{ formatGB(record.playGb) }}</span></template></a-table-column>
          <a-table-column title="存储（日均）" :width="140" align="right"><template #cell="{ record }"><span class="br-num">{{ formatGB(record.storageAvgGb) }}</span></template></a-table-column>
        </template>
        <template #empty><div class="br-empty">{{ month }} 没有用量</div></template>
      </a-table>
    </V2Card>

    <V2Card :padding="false">
      <div class="br-head">
        <div>
          <div class="br-title">播放流量对账</div>
          <div class="br-sub">按流监控流量用于分摊，计费流量来自腾讯云账单；两者相差超过 3% 或拉取失败时需要核对</div>
        </div>
        <a-radio-group v-model="fluxFilter" type="button" size="small">
          <a-radio value="all">全部 {{ flux.length }}</a-radio>
          <a-radio value="issue">需核对 {{ issues }}</a-radio>
        </a-radio-group>
      </div>
      <a-table :data="shownFlux" :loading="loading" :pagination="shownFlux.length > 20 ? { pageSize: 20 } : false" row-key="id" :scroll="{ x: 900 }">
        <template #columns>
          <a-table-column title="日期" :width="110"><template #cell="{ record }"><span class="br-num">{{ record.usageDate }}</span></template></a-table-column>
          <a-table-column title="账号 / 播放域名">
            <template #cell="{ record }">
              <div class="br-name">{{ record.playDomain }}</div>
              <div class="br-sub">{{ accountLabel(record.account) }} · {{ record.streamCount }} 条流</div>
            </template>
          </a-table-column>
          <a-table-column title="监控流量" :width="120" align="right"><template #cell="{ record }"><span class="br-num">{{ formatGB(record.monitorMb / 1024) }}</span></template></a-table-column>
          <a-table-column title="计费流量" :width="120" align="right"><template #cell="{ record }"><span class="br-num">{{ formatGB(record.billingMb / 1024) }}</span></template></a-table-column>
          <a-table-column title="未归属直播间" :width="130" align="right"><template #cell="{ record }"><span class="br-num">{{ formatGB(record.unattributedMb / 1024) }}</span></template></a-table-column>
          <a-table-column title="状态" :width="220">
            <template #cell="{ record }">
              <a-tag :color="STATUS[record.status].color" size="small">{{ STATUS[record.status].label }}</a-tag>
              <div v-if="record.message" class="br-sub br-msg">{{ record.message }}</div>
            </template>
          </a-table-column>
        </template>
        <template #empty><div class="br-empty">{{ fluxFilter === 'issue' ? '没有需要核对的记录' : `${month} 还没有流量对账记录` }}</div></template>
      </a-table>
    </V2Card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { V2Card } from '@/components/ui'
import { getReconcile, recomputeUsage, type CompanyUsage, type FluxReconcile, type MeterKey } from '@/api/billing'
import { accountLabel, formatGB, formatMinutes } from './billing'

const props = defineProps<{ month: string }>()

const STATUS: Record<FluxReconcile['status'], { label: string; color: string }> = {
  ok: { label: '一致', color: 'green' },
  diff: { label: '需核对', color: 'orange' },
  error: { label: '拉取失败', color: 'red' },
}

const loading = ref(false)
const data = ref<{ companies: CompanyUsage[]; flux: FluxReconcile[] } | null>(null)
const flux = computed(() => data.value?.flux || [])
const fluxFilter = ref<'all' | 'issue'>('all')
const issues = computed(() => flux.value.filter((f) => f.status !== 'ok').length)
const shownFlux = computed(() => (fluxFilter.value === 'issue' ? flux.value.filter((f) => f.status !== 'ok') : flux.value))

const load = async () => {
  loading.value = true
  try {
    data.value = await getReconcile(props.month)
  } catch (e: any) {
    Message.error(e?.response?.data?.message || e?.message || '加载对账失败')
  } finally {
    loading.value = false
  }
}
watch(() => props.month, load, { immediate: true })

// ---------- 重新计量 ----------
const range = ref<string[]>()
const meters = ref<MeterKey[]>([])
const recomputing = ref(false)
const isFuture = (d: Date) => dayjs(d).isAfter(dayjs(), 'day')
const recompute = async () => {
  if (!range.value || range.value.length !== 2) return
  const [from, to] = range.value
  if (dayjs(to).diff(dayjs(from), 'day') > 30) {
    Message.warning('一次最多重新计量 31 天')
    return
  }
  recomputing.value = true
  try {
    await recomputeUsage({ from, to, meters: meters.value.length ? meters.value : undefined })
    Message.success(`已重新计量 ${from} 至 ${to}`)
  } catch (e: any) {
    Message.error(e?.response?.data?.message || e?.message || '重新计量失败')
  } finally {
    recomputing.value = false
    load()
  }
}
</script>

<style scoped>
.br { display: flex; flex-direction: column; gap: 16px; }
.br-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 14px 20px; flex-wrap: wrap; border-bottom: 1px solid var(--color-border-1); }
.br-title { font-weight: 600; }
.br-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.br-name { font-weight: 500; }
.br-sub { font-size: 12px; color: var(--color-text-3); }
.br-msg { margin-top: 2px; line-height: 1.5; }
.br-num { font-variant-numeric: tabular-nums; }
.br-empty { padding: 28px 0; color: var(--color-text-3); }
</style>
