<template>
  <V2Modal
    :visible="visible"
    :title="`分享直播间${room?.roomName ? ` · ${room.roomName}` : ''}`"
    :width="520"
    :footer="false"
    unmount-on-close
    @cancel="$emit('update:visible', false)"
    @update:visible="$emit('update:visible', $event)"
  >
    <a-spin :loading="loading" style="width: 100%">
      <div class="srm">
        <div class="srm-row">
          <div class="srm-row-text">
            <div class="srm-label">开启分享</div>
            <div class="srm-hint">任何人打开链接即可观看，无需登录</div>
          </div>
          <a-switch :model-value="share.enabled" :loading="saving" aria-label="开启分享" @change="(v) => save(!!v)" />
        </div>

        <template v-if="share.enabled && share.code">
          <div class="srm-link">
            <a-input :model-value="link" readonly class="srm-link-input" aria-label="分享链接" />
            <a-button type="primary" @click="copy">复制链接</a-button>
          </div>
          <div class="srm-actions">
            <a :href="link" target="_blank" rel="noopener" class="srm-a">打开分享页</a>
            <a-popconfirm content="重新生成后，旧链接立即失效。确定重新生成？" @ok="save(true, true)">
              <a-link :hoverable="false" status="warning">重新生成链接</a-link>
            </a-popconfirm>
          </div>
        </template>

        <div class="srm-info">
          分享页只播放直播，不提供回放。直播结束 1 小时后链接自动失效；关闭分享后链接立即失效，再次开启沿用原链接。
        </div>
      </div>
    </a-spin>
  </V2Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { V2Modal } from '@/components/ui'
import { getRoomShare, shareLink, updateRoomShare, type RoomShare } from '@/api/liveShare'

const props = defineProps<{ visible: boolean; room?: { id: number | string; roomName?: string } | null }>()
defineEmits<{ 'update:visible': [boolean] }>()

const share = ref<RoomShare>({ enabled: false, code: '' })
const loading = ref(false)
const saving = ref(false)
const link = computed(() => (share.value.code ? shareLink(share.value.code) : ''))

const errMsg = (e: any, fallback: string) => e?.response?.data?.message || e?.message || fallback

const load = async () => {
  if (!props.room?.id) return
  loading.value = true
  try {
    share.value = await getRoomShare(props.room.id)
  } catch (e) {
    Message.error(errMsg(e, '获取分享设置失败'))
  } finally {
    loading.value = false
  }
}

const save = async (enabled: boolean, reset = false) => {
  if (!props.room?.id) return
  saving.value = true
  try {
    share.value = await updateRoomShare(props.room.id, { enabled, reset })
    Message.success(reset ? '已重新生成链接，旧链接已失效' : enabled ? '已开启分享' : '已关闭分享，链接已失效')
  } catch (e) {
    Message.error(errMsg(e, '保存分享设置失败'))
  } finally {
    saving.value = false
  }
}

const copy = async () => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(link.value)
    } else {
      const ta = document.createElement('textarea')
      ta.value = link.value
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    Message.success('链接已复制')
  } catch {
    Message.error('复制失败，请手动复制')
  }
}

watch(
  () => props.visible,
  (open) => {
    if (!open) return
    share.value = { enabled: false, code: '' }
    load()
  },
  { immediate: true },
)

defineExpose({ share, link, save })
</script>

<style scoped>
.srm { display: flex; flex-direction: column; gap: 16px; }
.srm-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.srm-row-text { display: flex; flex-direction: column; gap: 4px; }
.srm-label { font-size: 14px; font-weight: 500; color: var(--color-text-1); }
.srm-hint { font-size: 12px; color: var(--color-text-3); }
.srm-link { display: flex; gap: 8px; }
.srm-link-input { flex: 1; min-width: 0; }
.srm-link-input :deep(input) { font-family: Consolas, 'Cascadia Mono', monospace; font-size: 13px; }
.srm-actions { display: flex; gap: 20px; align-items: center; font-size: 13px; }
.srm-a { color: rgb(var(--primary-6)); text-decoration: none; }
.srm-a:hover { color: rgb(var(--primary-5)); }
.srm-info { padding: 10px 14px; border-radius: 6px; background: var(--color-fill-1); color: var(--color-text-2); font-size: 13px; line-height: 1.7; }
</style>
