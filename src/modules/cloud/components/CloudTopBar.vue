<template>
  <div class="cloud-top-bar">
    <CloudBreadcrumb
      :items="props.items"
      :current-id="props.currentId"
      @navigate="$emit('navigate', $event)"
    />

    <div class="cloud-top-bar__actions">
      <V2Button type="secondary" size="sm" @click="$emit('open-share-manager')">
        <template #icon><icon-share-alt /></template>
        {{ t('cloud.myShares') }}
      </V2Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconShareAlt } from '@arco-design/web-vue/es/icon'
import CloudBreadcrumb from './CloudBreadcrumb.vue'
import { useI18n } from 'vue-i18n'
import { V2Button } from '@/components/ui'

interface Props {
  items: Array<{ id: number | null; name: string }>
  currentId: number | null
}

const props = defineProps<Props>()

defineEmits<{
  (e: 'navigate', item: { id: number | null; name: string }): void
  (e: 'open-share-manager'): void
}>()

const { t } = useI18n()
</script>

<style scoped>
.cloud-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 24px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
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
