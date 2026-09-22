<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const tableName = computed(() => route.params.tableName || route.path.split('/').pop() || '')
</script>

<template>
  <div class="table-view">
    <a-card>
      <p>这里将展示表 {{ tableName }} 的列表/表单等内容。</p>
    </a-card>
  </div>
</template>

<style scoped>
.table-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
