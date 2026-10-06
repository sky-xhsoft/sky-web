<template>
  <a-modal
    :visible="visible"
    :title="title"
    :width="width"
    :mask-closable="maskClosable"
    :esc-to-close="escToClose"
    :unmount-on-close="unmountOnClose"
    :footer="footer"
    :ok-loading="okLoading"
    :ok-text="okText"
    :cancel-text="cancelText"
    class="v2-modal"
    @ok="$emit('ok', $event)"
    @cancel="$emit('cancel', $event)"
    @update:visible="$emit('update:visible', $event)"
  >
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </a-modal>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
  title?: string
  width?: string | number
  maskClosable?: boolean
  escToClose?: boolean
  unmountOnClose?: boolean
  footer?: boolean
  okLoading?: boolean
  okText?: string
  cancelText?: string
}

withDefaults(defineProps<Props>(), {
  title: '',
  width: 520,
  maskClosable: true,
  escToClose: true,
  unmountOnClose: false,
  footer: true,
  okLoading: false,
  okText: '确定',
  cancelText: '取消',
})

defineEmits<{
  ok: [event?: Event]
  cancel: [event?: Event]
  'update:visible': [visible: boolean]
}>()
</script>

<style scoped>
.v2-modal :deep(.arco-modal) {
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.v2-modal :deep(.arco-modal-header) {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.v2-modal :deep(.arco-modal-title) {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.v2-modal :deep(.arco-modal-body) {
  padding: 20px;
  color: var(--text-primary);
}

.v2-modal :deep(.arco-modal-footer) {
  padding: 12px 20px;
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
