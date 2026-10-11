<template>
  <div class="bl">
    <V2Card :padding="false">
      <div class="bl-head">
        <div><span class="bl-title">套餐</span><span class="bl-sub ad-tip">修改只影响之后开通、续费、升级的周期；已开通的周期不变</span></div>
        <a-button type="primary" @click="edit()"><template #icon><icon-plus /></template>新增套餐</a-button>
      </div>
      <a-table :data="plans" :loading="loading" row-key="id" :pagination="false" :scroll="{ x: 900 }">
        <template #columns>
          <a-table-column title="套餐"><template #cell="{ record }">
            <div class="bl-name">{{ record.name }}</div><div class="bl-sub">{{ record.description || '—' }}</div>
          </template></a-table-column>
          <a-table-column title="月费" align="right" :width="120"><template #cell="{ record }"><span class="bl-num">{{ formatMoney(record.monthlyFee) }}</span></template></a-table-column>
          <a-table-column title="直播时长" align="right" :width="120"><template #cell="{ record }"><span class="bl-num">{{ formatQty('live_duration', record.quotaMinutes) }}</span></template></a-table-column>
          <a-table-column title="播放流量" align="right" :width="110"><template #cell="{ record }"><span class="bl-num">{{ formatQty('play_flux', record.quotaFluxGb) }}</span></template></a-table-column>
          <a-table-column title="存储（每天）" align="right" :width="120"><template #cell="{ record }"><span class="bl-num">{{ formatQty('storage', record.quotaStorageGb) }}</span></template></a-table-column>
          <a-table-column title="排序" align="right" :width="70"><template #cell="{ record }"><span class="bl-num bl-sub">{{ record.sortNo }}</span></template></a-table-column>
          <a-table-column title="状态" :width="90"><template #cell="{ record }">
            <a-tag size="small" :color="record.status === 'on' ? 'green' : 'gray'">{{ record.status === 'on' ? '在售' : '已下架' }}</a-tag>
          </template></a-table-column>
          <a-table-column title="操作" :width="140"><template #cell="{ record }">
            <a-button type="text" size="mini" @click="edit(record)">编辑</a-button>
            <a-button type="text" size="mini" @click="toggle(record)">{{ record.status === 'on' ? '下架' : '上架' }}</a-button>
          </template></a-table-column>
        </template>
        <template #empty><div class="bl-empty">还没有套餐</div></template>
      </a-table>
    </V2Card>

    <a-modal v-model:visible="open" :title="form.id ? '编辑套餐' : '新增套餐'" :ok-loading="saving" ok-text="保存" :width="560" :on-before-ok="save">
      <a-form :model="form" layout="vertical">
        <a-form-item label="名称" required><a-input v-model="form.name" :max-length="30" placeholder="如：基础版" /></a-form-item>
        <a-form-item label="月费（元）" required>
          <a-input-number v-model="form.fee" :precision="2" :min="0" :step="10" style="width: 100%"><template #prefix>¥</template></a-input-number>
        </a-form-item>
        <div class="ad-grid">
          <a-form-item label="直播时长（分钟 / 月）"><a-input-number v-model="form.quotaMinutes" :precision="0" :min="0" :step="100" /></a-form-item>
          <a-form-item label="播放流量（GB / 月）"><a-input-number v-model="form.quotaFluxGb" :precision="3" :min="0" :step="10" /></a-form-item>
          <a-form-item label="存储（GB，每天）"><a-input-number v-model="form.quotaStorageGb" :precision="3" :min="0" :step="10" /></a-form-item>
        </div>
        <div class="bl-sub ad-note">直播时长、播放流量是周期内的总额度，用完后按单价计费；存储是每天的免费占用量，超出部分按单价计费。</div>
        <div class="ad-grid">
          <a-form-item label="排序（小的在前）"><a-input-number v-model="form.sortNo" :precision="0" /></a-form-item>
          <a-form-item label="状态">
            <a-radio-group v-model="form.status"><a-radio value="on">在售</a-radio><a-radio value="off">下架</a-radio></a-radio-group>
          </a-form-item>
        </div>
        <a-form-item label="说明"><a-input v-model="form.description" :max-length="200" placeholder="可选，显示在套餐卡片上" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import { V2Card } from '@/components/ui'
import { listAllPlans, savePlan, type BillPlan } from '@/api/billing'
import { formatMoney, formatQty, yuanToLi } from '@/pages/live/components/billing'

const loading = ref(false)
const plans = ref<BillPlan[]>([])
const err = (e: any, fallback: string) => Message.error(e?.response?.data?.message || e?.message || fallback)
const load = async () => {
  loading.value = true
  try {
    plans.value = (await listAllPlans()) || []
  } catch (e) {
    err(e, '加载套餐失败')
  } finally {
    loading.value = false
  }
}

const open = ref(false)
const saving = ref(false)
const empty = () => ({ id: 0, name: '', fee: undefined as number | undefined, quotaMinutes: 0, quotaFluxGb: 0, quotaStorageGb: 0, sortNo: 0, status: 'on' as 'on' | 'off', description: '' })
const form = reactive(empty())
const edit = (p?: BillPlan) => {
  Object.assign(form, p ? { ...p, fee: p.monthlyFee / 1000 } : empty())
  open.value = true
}
const payload = (p: typeof form) => ({
  id: p.id || undefined, name: p.name.trim(), monthlyFee: yuanToLi(p.fee), quotaMinutes: p.quotaMinutes || 0, quotaFluxGb: p.quotaFluxGb || 0,
  quotaStorageGb: p.quotaStorageGb || 0, sortNo: p.sortNo || 0, status: p.status, description: p.description.trim(),
})
const save = async () => {
  if (!form.name.trim() || form.fee === undefined) {
    Message.warning('请填写名称和月费')
    return false
  }
  saving.value = true
  try {
    await savePlan(payload(form))
    Message.success('已保存')
    open.value = false
    load()
  } catch (e) {
    err(e, '保存失败')
    return false
  } finally {
    saving.value = false
  }
}
const toggle = async (p: BillPlan) => {
  try {
    await savePlan({ ...p, status: p.status === 'on' ? 'off' : 'on' })
    Message.success(p.status === 'on' ? '已下架，已开通的周期不受影响，到期不再自动续费' : '已上架')
    load()
  } catch (e) {
    err(e, '操作失败')
  }
}
onMounted(load)
defineExpose({ reload: load })
</script>

<style scoped src="@/pages/live/components/billing.css"></style>
<style scoped>
.ad-tip { margin-left: 12px; }
.ad-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0 12px; }
.ad-note { margin: -6px 0 14px; }
</style>
