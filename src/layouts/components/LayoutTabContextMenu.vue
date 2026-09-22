<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconRefresh, IconClose, IconCloseCircle } from '@arco-design/web-vue/es/icon'

interface Props {
  visible: boolean
  x: number
  y: number
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'action', action: string): void
}>()

const { t } = useI18n()

const menuOptions = computed(() => [
  { key: 'refresh', title: t('layout.refresh'), icon: IconRefresh },
  { key: 'close', title: t('layout.close'), icon: IconClose },
  { key: 'closeOther', title: t('layout.closeOther'), icon: IconCloseCircle },
  { key: 'closeAll', title: t('layout.closeAll'), icon: IconCloseCircle },
])
</script>

<template>
  <div
    v-if="visible"
    class="tab-context-menu"
    :style="{ left: x + 'px', top: y + 'px' }"
    @click.stop
    @contextmenu.stop
  >
    <a-menu @menu-item-click="emit('action', $event)">
      <a-menu-item v-for="item in menuOptions" :key="item.key">
        <template #icon>
          <component :is="item.icon" />
        </template>
        {{ item.title }}
      </a-menu-item>
    </a-menu>
  </div>
</template>

<style scoped>
.tab-context-menu {
  position: fixed;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 120px;
}
</style>
