<template>
  <div class="bl">
    <V2Card :padding="false">
      <div class="bl-head">
        <div><span class="bl-title">资源包</span><span class="bl-sub ad-tip">套餐额度用完后抵扣；修改只影响之后购买的资源包</span></div>
        <a-button type="primary" @click="edit()"><template #icon><icon-plus /></template>新增资源包</a-button>
      </div>
      <a-table :data="rows" :loading="loading" row-key="id" :pagination="false" :scroll="{ x: 860 }">
        <template #columns>
          <a-table-column title="资源包" :min-width="200"><template #cell="{ record }">
            <div class="bl-name">{{ record.name }}</div><div class="bl-sub">{{ record.description || '—' }}</div>
          </template></a-table-column>
          <a-table-column title="计费点" :width="100"><template #cell="{ record }">{{ METERS[record.meter].label }}</template></a-table-column>
          <a-table-column title="额度" align="right" :width="130"><template #cell="{ record }"><span class="bl-num">{{ formatQty(record.meter, record.quantity) }}</span></template></a-table-column>
          <a-table-column title="有效期" align="right" :width="90"><template #cell="{ record }"><span class="bl-num">{{ record.validMonths }} 个月</span></template></a-table-column>
          <a-table-column title="售价" align="right" :width="120"><template #cell="{ record }"><span class="bl-num">{{ formatMoney(record.price) }}</span></template></a-table-column>
          <a-table-column title="状态" :width="90"><template #cell="{ record }">
            <a-tag size="small" :color="record.status === 'on' ? 'green' : 'gray'">{{ record.status === 'on' ? '在售' : '已下架' }}</a-tag>
          </template></a-table-column>
          <a-table-column title="操作" :width="140"><template #cell="{ record }">
            <a-button type="text" size="mini" @click="edit(record)">编辑</a-button>
            <a-button type="text" size="mini" @click="toggle(record)">{{ record.status === 'on' ? '下架' : '上架' }}</a-button>
          </template></a-table-column>
        </template>
        <template #empty><div class="bl-empty">还没有资源包</div></template>
      </a-table>
    </V2Card>

    <a-modal v-model:visible="open" :title="form.id ? '编辑资源包' : '新增资源包'" :ok-loading="saving" ok-text="保存" :width="520" :on-before-ok="save">
      <a-form :model="form" layout="vertical">
        <a-form-item label="名称" required><a-input v-model="form.name" :max-length="30" placeholder="如：流量包 1 TB" /></a-form-item>
        <a-form-item label="计费点" required>
          <a-radio-group v-model="form.meter" type="button">
            <a-radio value="live_duration">直播时长</a-radio>
            <a-radio value="play_flux">播放流量</a-radio>
          </a-radio-group>
        </a-form-item>
        <div class="ad-grid">
          <a-form-item :label="`额度（${form.meter === 'live_duration' ? '分钟' : 'GB'}）`" required>
            <a-input-number v-model="form.quantity" :precision="form.meter === 'live_duration' ? 0 : 3" :min="0" :step="100" />
          </a-form-item>
          <a-form-item label="有效期（月）" required><a-input-number v-model="form.validMonths" :precision="0" :min="1" :max="36" /></a-form-item>
          <a-form-item label="售价（元）" required>
            <a-input-number v-model="form.price" :precision="2" :min="0" :step="10"><template #prefix>¥</template></a-input-number>
          </a-form-item>
        </div>
        <div class="ad-grid">
          <a-form-item label="排序（小的在前）"><a-input-number v-model="form.sortNo" :precision="0" /></a-form-item>
          <a-form-item label="状态">
            <a-radio-group v-model="form.status"><a-radio value="on">在售</a-radio><a-radio value="off">下架</a-radio></a-radio-group>
          </a-form-item>
        </div>
        <a-form-item label="说明"><a-input v-model="form.description" :max-length="200" placeholder="可选" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import { V2Card } from '@/components/ui'
import { listAllPackDefs, savePackDef, type BillPackDef, type MeterKey } from '@/api/billing'
import { METERS, formatMoney, formatQty, yuanToLi } from '@/pages/live/components/billing'

const loading = ref(false)
const rows = ref<BillPackDef[]>([])
const err = (e: any, fallback: string) => Message.error(e?.response?.data?.message || e?.message || fallback)
const load = async () => {
  loading.value = true
  try {
    rows.value = (await listAllPackDefs()) || []
  } catch (e) {
    err(e, '加载资源包失败')
  } finally {
    loading.value = false
  }
}

const open = ref(false)
const saving = ref(false)
const empty = () => ({ id: 0, name: '', meter: 'play_flux' as MeterKey, quantity: undefined as number | undefined, validMonths: 12, price: undefined as number | undefined, sortNo: 0, status: 'on' as 'on' | 'off', description: '' })
const form = reactive(empty())
const edit = (p?: BillPackDef) => {
  Object.assign(form, p ? { ...p, price: p.price / 1000 } : empty())
  open.value = true
}
const save = async () => {
  if (!form.name.trim() || !form.quantity || form.price === undefined) {
    Message.warning('请填写名称、额度和售价')
    return false
  }
  saving.value = true
  try {
    await savePackDef({
      id: form.id || undefined, name: form.name.trim(), meter: form.meter, quantity: form.quantity, validMonths: form.validMonths,
      price: yuanToLi(form.price), sortNo: form.sortNo || 0, status: form.status, description: form.description.trim(),
    })
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
const toggle = async (p: BillPackDef) => {
  try {
    await savePackDef({ ...p, status: p.status === 'on' ? 'off' : 'on' })
    Message.success(p.status === 'on' ? '已下架，已购买的资源包不受影响' : '已上架')
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
.ad-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0 12px; }
</style>
