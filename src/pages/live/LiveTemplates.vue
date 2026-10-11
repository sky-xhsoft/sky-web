<template>
  <div class="live-templates-page">
    <V2PageHeader title="模板管理" description="在本系统配置回调、录制模板，保存后自动同步到本公司的云账号（每个账号最多 50 个模板）">
      <template #actions>
        <V2Button type="secondary" :loading="importing" @click="doImport">从云端导入</V2Button>
        <V2Button v-if="failedCount" type="secondary" :loading="resyncing" @click="resyncFailed">重新同步失败项（{{ failedCount }}）</V2Button>
        <V2Button @click="openCreate">
          <template #icon><icon-plus /></template>
          {{ tab === 'callback' ? '新增回调模板' : '新增录制模板' }}
        </V2Button>
      </template>
    </V2PageHeader>

    <div v-if="defaults && !defaults.tencentConfigured" class="lt-alert">本公司未配置云直播密钥：模板只能保存在本地，无法同步。请先在公司配置中填写 SecretId / SecretKey。</div>
    <div v-else-if="cloudError" class="lt-alert">未能与云端对账：{{ cloudError }}</div>

    <V2Card :padding="false" class="lt-card">
      <div class="lt-toolbar">
        <a-tabs v-model:active-key="tab" class="lt-tabs" @change="load">
          <a-tab-pane key="callback" :title="`回调模板 ${callbacks.length}`" />
          <a-tab-pane key="record" :title="`录制模板 ${records.length}`" />
        </a-tabs>
        <div class="lt-filters">
          <a-select v-model="statusFilter" :style="{ width: '140px' }" aria-label="同步状态">
            <a-option value="">全部状态</a-option>
            <a-option v-for="(v, k) in SYNC_STATUS" :key="k" :value="k">{{ v.label }}</a-option>
          </a-select>
          <a-input-search v-model="keyword" placeholder="搜索模板名称 / 域名" allow-clear class="lt-search" />
        </div>
      </div>

      <div class="lt-table-wrap">
        <a-table :loading="loading" :data="rows" :pagination="false" row-key="id" :scroll="{ x: 1100 }">
          <template #columns>
            <a-table-column title="模板名称" :width="220">
              <template #cell="{ record }">
                <div class="lt-name">{{ record.name }}</div>
                <div class="lt-sub">{{ sourceLabel(record.source) }}<template v-if="record.description"> · {{ record.description }}</template></div>
              </template>
            </a-table-column>
            <a-table-column title="云端 ID" :width="110">
              <template #cell="{ record }"><span :class="record.cloudTemplateId ? 'lt-mono' : 'lt-muted'">{{ record.cloudTemplateId || '—' }}</span></template>
            </a-table-column>
            <a-table-column :title="tab === 'callback' ? '已配置回调' : '录制配置'">
              <template #cell="{ record }">
                <template v-if="tab === 'callback'">
                  <span v-for="k in callbackKinds(record)" :key="k" class="lt-chip">{{ k }}</span>
                </template>
                <template v-else>
                  <div v-if="record.cosStore === 'Y'">存储桶 · <span class="lt-mono">{{ record.cosBucket }} · {{ record.cosRegion }}</span></div>
                  <div v-else>云点播 VOD</div>
                  <div class="lt-sub">{{ (record.formats || 'mp4').toUpperCase() }} · 每 {{ Math.round(record.recordInterval / 60) }} 分钟一段</div>
                </template>
              </template>
            </a-table-column>
            <a-table-column title="绑定域名" :width="220">
              <template #cell="{ record }">
                <div v-if="!record.rules?.length" class="lt-muted">未绑定</div>
                <div v-for="r in record.rules" :key="`${r.domainName}/${r.appName}/${r.streamName}`">
                  <a class="lt-link" @click="openDomain(r.domainName)">{{ r.domainName }}</a>
                  <span class="lt-muted"> · {{ r.appName || '（空）' }}{{ r.streamName ? ` / ${r.streamName}` : '' }}</span>
                </div>
              </template>
            </a-table-column>
            <a-table-column title="同步状态" :width="230">
              <template #cell="{ record }">
                <V2Tag :type="SYNC_STATUS[record.syncStatus as TemplateSyncStatus]?.type || 'neutral'">{{ SYNC_STATUS[record.syncStatus as TemplateSyncStatus]?.label || record.syncStatus }}</V2Tag>
                <div v-if="record.syncError" class="lt-sync-error" :class="`lt-sync-error--${record.syncStatus}`">{{ record.syncError }}</div>
              </template>
            </a-table-column>
            <a-table-column title="最后同步" :width="170">
              <template #cell="{ record }"><span class="lt-muted lt-nowrap">{{ record.syncTime ? formatDateTime(record.syncTime) : '—' }}</span></template>
            </a-table-column>
            <a-table-column title="操作" :width="250" fixed="right">
              <template #cell="{ record }">
                <div class="lt-ops">
                  <template v-if="record.syncStatus === 'drift'">
                    <V2Button type="text" size="sm" @click="sync(record, '以本地覆盖云端')">以本地覆盖</V2Button>
                    <V2Button type="text" size="sm" @click="pull(record)">用云端更新</V2Button>
                  </template>
                  <V2Button v-else-if="record.syncStatus !== 'synced'" type="text" size="sm" @click="sync(record, '重新同步')">重新同步</V2Button>
                  <V2Button v-if="tab === 'callback' || record.cosStore === 'Y'" type="text" size="sm" @click="openEdit(record)">编辑</V2Button>
                  <V2Button type="text" size="sm" @click="openBind(record)">绑定域名</V2Button>
                  <a-popconfirm :content="`确定删除模板「${record.name}」？云端的模板会同时删除`" @ok="remove(record)">
                    <V2Button type="text" size="sm" class="lt-danger">删除</V2Button>
                  </a-popconfirm>
                </div>
              </template>
            </a-table-column>
          </template>
          <template #empty>
            <div class="lt-empty">还没有{{ tab === 'callback' ? '回调' : '录制' }}模板。可以新增，或从云端导入已有模板。</div>
          </template>
        </a-table>
      </div>
    </V2Card>

    <CallbackTemplateModal v-model:visible="callbackVisible" :template="editingCallback" :defaults="defaults" @saved="load" />
    <RecordTemplateModal v-model:visible="recordVisible" :template="editingRecord" :defaults="defaults" @saved="load" />
    <BindTemplateModal v-model:visible="bindVisible" :kind="tab" :template-id="bindTemplateId" @bound="load" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import { V2PageHeader, V2Card, V2Button, V2Tag } from '@/components/ui'
import { useNavigationStore } from '@/stores/navigation'
import { formatDateTime } from '@/utils/date'
import {
  callbackKinds, deleteTemplate, getTemplateDefaults, importTemplates, listCallbackTemplates, listRecordTemplates, pullTemplate, syncTemplate, SYNC_STATUS,
  type CallbackTemplate, type RecordTemplate, type TemplateDefaults, type TemplateKind, type TemplateSyncStatus,
} from '@/api/liveTemplate'
import CallbackTemplateModal from './components/CallbackTemplateModal.vue'
import RecordTemplateModal from './components/RecordTemplateModal.vue'
import BindTemplateModal from './components/BindTemplateModal.vue'

type Row = CallbackTemplate | RecordTemplate

const navigationStore = useNavigationStore()
const tab = ref<TemplateKind>('callback')
const loading = ref(false)
const importing = ref(false)
const resyncing = ref(false)
const callbacks = ref<CallbackTemplate[]>([])
const records = ref<RecordTemplate[]>([])
const cloudError = ref('')
const defaults = ref<TemplateDefaults | null>(null)
const keyword = ref('')
const statusFilter = ref('')

const callbackVisible = ref(false)
const recordVisible = ref(false)
const bindVisible = ref(false)
const editingCallback = ref<CallbackTemplate | null>(null)
const editingRecord = ref<RecordTemplate | null>(null)
const bindTemplateId = ref<number>()

const current = computed<Row[]>(() => (tab.value === 'callback' ? callbacks.value : records.value))
const rows = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return current.value.filter((r) => {
    if (statusFilter.value && r.syncStatus !== statusFilter.value) return false
    if (!kw) return true
    return r.name.toLowerCase().includes(kw) || (r.rules || []).some((x) => x.domainName.toLowerCase().includes(kw))
  })
})
const failedCount = computed(() => current.value.filter((r) => r.syncStatus === 'failed' || r.syncStatus === 'pending').length)

const sourceLabel = (s: string) => ({ local: '本系统创建', import: '从云端导入', standard: '标准配置' } as Record<string, string>)[s] || s

const load = async () => {
  loading.value = true
  try {
    const [cb, rec, d] = await Promise.all([listCallbackTemplates(), listRecordTemplates(), defaults.value ? Promise.resolve(defaults.value) : getTemplateDefaults()])
    callbacks.value = cb.items || []
    records.value = rec.items || []
    defaults.value = d
    cloudError.value = (tab.value === 'callback' ? cb.cloudError : rec.cloudError) || ''
  } catch (e: any) {
    Message.error(e?.message || '加载模板失败')
  } finally {
    loading.value = false
  }
}

const doImport = async () => {
  importing.value = true
  try {
    const r = await importTemplates()
    Message.success(`已导入回调模板 ${r.callbackTemplates} 个、录制模板 ${r.recordTemplates} 个、规则 ${r.rules} 条`)
    await load()
  } catch (e: any) {
    Message.error(e?.message || '导入失败')
  } finally {
    importing.value = false
  }
}

const sync = async (r: Row, label: string) => {
  try {
    await syncTemplate(tab.value, r.id)
    Message.success(`${label}成功`)
  } catch (e: any) {
    Message.error(e?.message || `${label}失败`)
  }
  await load()
}

const resyncFailed = async () => {
  resyncing.value = true
  const targets = current.value.filter((r) => r.syncStatus === 'failed' || r.syncStatus === 'pending')
  let ok = 0
  for (const r of targets) {
    try {
      await syncTemplate(tab.value, r.id)
      ok++
    } catch {
      // 失败原因会显示在列表中
    }
  }
  resyncing.value = false
  Message.info(`重新同步 ${targets.length} 个，成功 ${ok} 个`)
  await load()
}

const pull = async (r: Row) => {
  try {
    await pullTemplate(tab.value, r.id)
    Message.success('已用云端配置更新本地')
  } catch (e: any) {
    Message.error(e?.message || '更新失败')
  }
  await load()
}

const remove = async (r: Row) => {
  try {
    await deleteTemplate(tab.value, r.id)
    Message.success('已删除')
    await load()
  } catch (e: any) {
    Message.error(e?.message || '删除失败')
  }
}

const openCreate = () => {
  if (tab.value === 'callback') {
    editingCallback.value = null
    callbackVisible.value = true
  } else {
    editingRecord.value = null
    recordVisible.value = true
  }
}

const openEdit = (r: Row) => {
  if (tab.value === 'callback') {
    editingCallback.value = r as CallbackTemplate
    callbackVisible.value = true
  } else {
    editingRecord.value = r as RecordTemplate
    recordVisible.value = true
  }
}

const openBind = (r: Row) => {
  bindTemplateId.value = r.id
  bindVisible.value = true
}

const openDomain = (domainName: string) => {
  navigationStore.navigateTo('LiveDomainDetail', `域名详情 - ${domainName}`, { domainName, tab: 'templates' }, false)
}

onMounted(load)
</script>

<style scoped>
.live-templates-page { display: flex; flex-direction: column; gap: 16px; }
.lt-alert { padding: 10px 14px; border-radius: 6px; background: var(--warning-bg); color: var(--warning); font-size: 13px; }
.lt-card { overflow: hidden; }
.lt-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 0 20px; border-bottom: 1px solid var(--color-border-1); }
.lt-tabs :deep(.arco-tabs-content) { display: none; }
.lt-tabs :deep(.arco-tabs-nav::before) { display: none; }
.lt-filters { display: flex; gap: 8px; flex-wrap: wrap; padding: 10px 0; }
.lt-search { width: 240px; }
.lt-table-wrap { overflow-x: auto; }
.lt-name { font-weight: 600; }
.lt-sub { font-size: 12px; color: var(--color-text-3); margin-top: 4px; }
.lt-mono { font-family: Consolas, 'Cascadia Mono', monospace; font-size: 13px; }
.lt-muted { color: var(--color-text-3); }
.lt-nowrap { white-space: nowrap; }
.lt-chip { display: inline-block; padding: 1px 8px; border-radius: 4px; background: var(--color-fill-2); color: var(--color-text-2); font-size: 12px; margin: 2px 4px 2px 0; }
.lt-link { color: rgb(var(--arcoblue-6)); cursor: pointer; }
.lt-sync-error { font-size: 12px; margin-top: 6px; line-height: 1.5; }
.lt-sync-error--failed { color: rgb(var(--red-6)); }
.lt-sync-error--drift { color: rgb(var(--orange-7)); }
.lt-ops { display: flex; flex-wrap: wrap; gap: 2px; }
.lt-danger { color: rgb(var(--red-6)) !important; }
.lt-empty { padding: 32px 0; color: var(--color-text-3); }
@media (max-width: 640px) {
  .lt-search { width: 100%; }
}
</style>
