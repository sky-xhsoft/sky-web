<template>
  <div class="cloud-top-bar">
    <CloudBreadcrumb
      :items="props.items"
      :current-id="props.currentId"
      @navigate="$emit('navigate', $event)"
    />

    <div class="cloud-top-bar__actions">
      <a-button @click="$emit('open-share-manager')" size="small">
        <icon-share-alt />
        我的分享
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconShareAlt } from '@arco-design/web-vue/es/icon'
import CloudBreadcrumb from './CloudBreadcrumb.vue'

interface Props {
  items: Array<{ id: number; name: string }>
  currentId: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'navigate', item: { id: number; name: string }): void
  (e: 'open-share-manager'): void
}>()
</script>

<style scoped>
.cloud-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 24px;
  background: linear-gradient(to right, #ffffff 0%, #fafafa 100%);
  border-bottom: 1px solid #e8e8e8;
  flex-wrap: wrap;
  min-height: 64px;
}

.cloud-top-bar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 968px) {
  .cloud-top-bar {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
  }

  .cloud-top-bar__actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
