<template>
  <V2Modal
    :visible="visible"
    title="应用标准配置"
    :width="680"
    :ok-loading="applying"
    :ok-text="results ? '完成' : '确认应用'"
    unmount-on-close
    @ok="results ? close() : apply()"
    @cancel="close"
    @update:visible="$emit('update:visible', $event)"
  >
    <a-spin :loading="loading" class="scm-spin">
      <div v-if="loadError" class="scm-error">{{ loadError }}</div>

      <!-- 执行结果 -->
      <div v-else-if="results" class="scm-results">
        <div v-for="(s, i) in results" :key="i" class="scm-result">
          <V2Tag :type="s.ok ? (s.skipped ? 'neutral' : 'success') : 'error'">{{ s.ok ? (s.skipped ? '跳过' : '成功') : '失败' }}</V2Tag>
          <div><b>{{ s.step }}</b><div class="scm-muted">{{ s.message }}</div></div>
        </div>
      </div>

      <!-- 预览 -->
      <div v-else-if="plan">
        <div class="scm-sub">推流域名 <b>{{ domain }}</b> · 确认后同步到本公司云账号</div>

        <div class="scm-step">
          <span class="scm-num">1</span>
          <div>
            <template v-if="plan.callback.exists">
              <div class="scm-head"><V2Tag type="warning">补全</V2Tag><b>回调模板 {{ plan.callback.templateName }}（{{ plan.callback.cloudTemplateId }}）</b></div>
              <div class="scm-muted">
                <template v-if="plan.callback.missing?.length">新增{{ plan.callback.missing.join('、') }}回调；</template>
                <template v-else>已包含全部标准回调；</template>
                保留已有回调，以及控制台配置的高光切片回调。地址指向 <span class="scm-mono">{{ plan.callbackBase }}</span>
              </div>
              <a-radio-group v-model="callbackMode" direction="vertical" class="scm-options">
                <a-radio value="complete">补全现有模板（推荐：高光切片回调不受影响；该模板绑定的其他域名会同时补全）</a-radio>
                <a-radio value="replace">新建 {{ plan.callback.standardName }} 并替换（高光切片回调需到云平台控制台重新填写）</a-radio>
              </a-radio-group>
            </template>
            <template v-else>
              <div class="scm-head"><V2Tag type="success">新建并绑定</V2Tag><b>回调模板 {{ plan.callback.standardName }}</b></div>
              <div class="scm-muted">开播 · 断流 · 录制文件 · 录制状态 · 录制异常 · 推流异常，地址指向 <span class="scm-mono">{{ plan.callbackBase }}</span>，绑定 AppName = live</div>
            </template>
          </div>
        </div>

        <div class="scm-step">
          <span class="scm-num">2</span>
          <div>
            <div class="scm-head">
              <V2Tag :type="replaceRecord ? (plan.record.exists ? 'warning' : 'success') : 'neutral'">{{ replaceRecord ? (plan.record.exists ? '替换' : '新建并绑定') : '不变' }}</V2Tag>
              <b>录制模板 {{ plan.record.standardName }}</b>
            </div>
            <div v-if="plan.record.error" class="scm-error-text">{{ plan.record.error }}</div>
            <div v-else class="scm-muted">
              存储至本公司 COS（{{ plan.record.cosBucket }} · {{ plan.record.cosRegion }}）· MP4 · 录制原始流 · 每 {{ plan.record.recordInterval / 60 }} 分钟一段 · 路径 <span class="scm-mono">{{ plan.record.cosPath }}</span>
            </div>
            <div v-if="plan.record.exists" class="scm-diff">
              <div class="scm-box"><div class="scm-muted">当前</div>{{ plan.record.templateName }}（{{ plan.record.cloudTemplateId }}）· {{ Math.round(plan.record.currentInterval / 60) }} 分钟一段{{ plan.record.storesCompanyCos ? ' · 已存储至本公司存储桶' : '' }}</div>
              <icon-arrow-right />
              <div class="scm-box"><div class="scm-muted">替换为</div>{{ plan.record.standardName }} · {{ plan.record.recordInterval / 60 }} 分钟一段</div>
            </div>
            <a-checkbox v-if="plan.record.exists" v-model="replaceRecord" :disabled="!!plan.record.error" class="scm-options">替换已有录制规则（取消则保留当前录制模板）</a-checkbox>
          </div>
        </div>

        <div class="scm-warn">
          <div class="scm-warn-title">执行前请确认</div>
          <div>· 新绑定约 10 分钟生效；替换规则会先解绑再绑定，正在直播的流需<b>重新推流</b>后才按新配置</div>
          <div>· 录制为云平台付费功能，推流期间产生录制和存储费用</div>
          <div>· 高光切片的模板和回调地址只能在云平台控制台配置，本操作不会改动</div>
          <div>· 被替换的模板不会被删除，可在「模板管理」中继续使用</div>
        </div>
      </div>
    </a-spin>
  </V2Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconArrowRight } from '@arco-design/web-vue/es/icon'
import { V2Modal, V2Tag } from '@/components/ui'
import { applyStandard, getStandardPlan, type StandardPlan, type StandardStepResult } from '@/api/liveTemplate'

const props = defineProps<{ visible: boolean; domain: string }>()
const emit = defineEmits<{ 'update:visible': [boolean]; applied: [] }>()

const loading = ref(false)
const applying = ref(false)
const loadError = ref('')
const plan = ref<StandardPlan | null>(null)
const results = ref<StandardStepResult[] | null>(null)
const callbackMode = ref<'complete' | 'replace'>('complete')
const replaceRecord = ref(true)

watch(
  () => props.visible,
  async (open) => {
    if (!open) return
    plan.value = null
    results.value = null
    loadError.value = ''
    callbackMode.value = 'complete'
    loading.value = true
    try {
      plan.value = await getStandardPlan(props.domain)
      replaceRecord.value = plan.value.record.replaceDefault && !plan.value.record.error
    } catch (e: any) {
      loadError.value = e?.message || '加载标准配置失败'
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

const close = () => emit('update:visible', false)

const apply = async () => {
  if (!plan.value) return close()
  applying.value = true
  try {
    const res = await applyStandard(props.domain, { callbackMode: callbackMode.value, replaceRecord: replaceRecord.value })
    results.value = res.steps
    const failed = res.steps.filter((s) => !s.ok).length
    if (failed) Message.warning(`有 ${failed} 项未成功，请查看原因`)
    else Message.success('标准配置已应用，约 10 分钟后生效')
    emit('applied')
  } catch (e: any) {
    Message.error(e?.message || '应用失败')
  } finally {
    applying.value = false
  }
}
</script>

<style scoped>
.scm-spin { display: block; min-height: 120px; }
.scm-sub { font-size: 13px; color: var(--color-text-2); margin-bottom: 4px; }
.scm-step { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 12px; padding: 14px 0; border-top: 1px solid var(--color-border-1); }
.scm-num { width: 24px; height: 24px; border-radius: 50%; background: rgb(var(--arcoblue-1)); color: rgb(var(--arcoblue-6)); font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.scm-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
.scm-muted { font-size: 13px; color: var(--color-text-2); line-height: 1.7; }
.scm-mono { font-family: Consolas, 'Cascadia Mono', monospace; font-size: 12px; overflow-wrap: anywhere; }
.scm-options { margin-top: 10px; }
.scm-diff { display: grid; grid-template-columns: minmax(0, 1fr) 20px minmax(0, 1fr); gap: 8px; align-items: center; margin-top: 8px; }
.scm-box { background: var(--color-fill-1); border-radius: 4px; padding: 8px 10px; font-size: 13px; min-width: 0; }
.scm-warn { margin-top: 6px; padding: 12px 14px; background: rgb(var(--orange-1)); color: rgb(var(--orange-7)); border-radius: 6px; font-size: 13px; line-height: 1.8; }
.scm-warn-title { font-weight: 600; }
.scm-error, .scm-error-text { color: rgb(var(--red-6)); font-size: 13px; line-height: 1.7; }
.scm-results { display: flex; flex-direction: column; gap: 12px; }
.scm-result { display: flex; gap: 12px; align-items: flex-start; }
</style>
