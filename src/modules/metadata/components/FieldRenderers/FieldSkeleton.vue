<!-- 字段加载骨架 - 异步字段组件加载中的占位 -->
<template>
  <a-skeleton
    :loading="true"
    :animation="true"
    class="field-skeleton"
    :data-control-type="controlType"
  >
    <a-skeleton-line v-if="isMultiRow" :rows="rows" :widths="['100%']" />
    <a-skeleton-line v-else :widths="['100%']" />
  </a-skeleton>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  controlType?: string
  displayRows?: number
}>(), {
  controlType: 'text',
  displayRows: 1
})

// 多行控件
const MULTI_ROW = ['textarea', 'json', 'richtext', 'clob', 'xml', 'code']
const isMultiRow = computed(() => {
  const t = (props.controlType || 'text').toLowerCase()
  return MULTI_ROW.includes(t) || (props.displayRows || 1) > 1
})

// 骨架行数
const rows = computed(() => {
  const r = props.displayRows || 1
  return MULTI_ROW.includes((props.controlType || '').toLowerCase()) ? Math.min(r, 5) : Math.min(r, 2)
})
</script>

<style scoped>
.field-skeleton {
  width: 100%;
  min-height: 32px;
  display: flex;
  align-items: center;
}
.field-skeleton :deep(.arco-skeleton-line) {
  margin: 0;
  height: 20px;
}
</style>