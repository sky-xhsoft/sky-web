<template>
  <V2Card :padding="false">
    <div class="bl-head">
      <div><span class="bl-title">赠送 / 调账复核</span><span class="bl-sub ar-tip">超过复核金额的赠送、调账须由另一位平台管理员复核后才入账；申请人不能复核自己的申请</span></div>
      <a-radio-group v-model="status" type="button" size="small" @change="load">
        <a-radio value="pending">待复核</a-radio>
        <a-radio value="">全部</a-radio>
      </a-radio-group>
    </div>
    <a-table :data="rows" :loading="loading" row-key="id" :pagination="rows.length > 20 ? { pageSize: 20 } : false" :scroll="{ x: 960 }">
      <template #columns>
        <a-table-column title="申请时间" :width="140"><template #cell="{ record }"><span class="bl-num">{{ fmt(record.createTime) }}</span></template></a-table-column>
        <a-table-column title="公司" :width="180"><template #cell="{ record }">{{ companyName(record.companyId) }}</template></a-table-column>
        <a-table-column title="类型" :width="80"><template #cell="{ record }">{{ record.type === 'gift' ? '赠送' : '调账' }}</template></a-table-column>
        <a-table-column title="金额" align="right" :width="130"><template #cell="{ record }">
          <span class="bl-num" :class="record.amount > 0 ? 'bl-pos' : 'bl-neg'">{{ formatSigned(record.amount) }}</span>
        </template></a-table-column>
        <a-table-column title="原因" :min-width="180"><template #cell="{ record }">{{ record.reason }}</template></a-table-column>
        <a-table-column title="申请人" :width="100"><template #cell="{ record }">{{ record.requestBy }}</template></a-table-column>
        <a-table-column title="状态" :width="170"><template #cell="{ record }">
          <a-tag size="small" :color="STATUS[record.status].color">{{ STATUS[record.status].label }}</a-tag>
          <div v-if="record.reviewBy" class="bl-sub">{{ record.reviewBy }} · {{ record.reviewTime ? fmt(record.reviewTime) : '' }}{{ record.reviewRemark ? ` · ${record.reviewRemark}` : '' }}</div>
        </template></a-table-column>
        <a-table-column title="操作" :width="140"><template #cell="{ record }">
          <template v-if="record.status === 'pending'">
            <a-button type="text" size="mini" @click="openReview(record, true)">通过</a-button>
            <a-button type="text" size="mini" status="danger" @click="openReview(record, false)">驳回</a-button>
          </template>
        </template></a-table-column>
      </template>
      <template #empty><div class="bl-empty">{{ status ? '没有待复核的申请' : '没有申请' }}</div></template>
    </a-table>

    <a-modal v-model:visible="review.open" :title="review.approve ? '复核通过' : '驳回申请'" :ok-loading="review.busy" :ok-text="review.approve ? '通过并入账' : '驳回'" :on-before-ok="submit">
      <dl v-if="review.row" class="bl-dl">
        <dt>公司</dt><dd>{{ companyName(review.row.companyId) }}</dd>
        <dt>{{ review.row.type === 'gift' ? '赠送' : '调账' }}金额</dt><dd>{{ formatSigned(review.row.amount) }}</dd>
        <dt>原因</dt><dd>{{ review.row.reason }}</dd>
        <dt>申请人</dt><dd>{{ review.row.requestBy }}</dd>
      </dl>
      <a-textarea v-model="review.remark" class="ar-remark" :max-length="200" placeholder="复核意见（可选）" />
    </a-modal>
  </V2Card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { V2Card } from '@/components/ui'
import { listAccounts, listRequests, reviewRequest, type AccountRow, type AdjustRequest } from '@/api/billing'
import { formatSigned } from '@/pages/live/components/billing'

const emit = defineEmits<{ (e: 'changed'): void }>()
const STATUS = { pending: { label: '待复核', color: 'orange' }, approved: { label: '已通过', color: 'green' }, rejected: { label: '已驳回', color: 'gray' } }

const loading = ref(false)
const rows = ref<AdjustRequest[]>([])
const companies = ref<AccountRow[]>([])
const status = ref('pending')
const fmt = (v: string) => dayjs(v).format('MM-DD HH:mm')
const companyName = (id: number) => companies.value.find((c) => c.companyId === id)?.companyName || `公司 ${id}`
const load = async () => {
  loading.value = true
  try {
    const [r, a] = await Promise.all([listRequests(status.value || undefined), companies.value.length ? Promise.resolve(companies.value) : listAccounts()])
    rows.value = r || []
    companies.value = a || []
  } catch (e: any) {
    Message.error(e?.response?.data?.message || e?.message || '加载申请失败')
  } finally {
    loading.value = false
  }
}

const review = reactive({ open: false, busy: false, approve: true, remark: '', row: null as AdjustRequest | null })
const openReview = (r: AdjustRequest, approve: boolean) => Object.assign(review, { open: true, approve, remark: '', row: r })
const submit = async () => {
  if (!review.row) return
  review.busy = true
  try {
    await reviewRequest(review.row.id, review.approve, review.remark.trim())
    Message.success(review.approve ? '已通过并入账' : '已驳回')
    review.open = false
    load()
    emit('changed')
  } catch (e: any) {
    Message.error(e?.response?.data?.message || e?.message || '复核失败')
    return false
  } finally {
    review.busy = false
  }
}
onMounted(load)
defineExpose({ reload: load })
</script>

<style scoped src="@/pages/live/components/billing.css"></style>
<style scoped>
.ar-tip { margin-left: 12px; }
.ar-remark { margin-top: 14px; }
</style>
