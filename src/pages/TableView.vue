<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const tableName = computed(() => route.params.tableName || route.path.split('/').pop() || '')
</script>

<template>
  <div class="table-view">
    <div class="page-header">
      <div>
        <div class="title">{{ tableName }}</div>
        <div class="subtitle">通用表页占位（后续可接入元数据与 CRUD）</div>
      </div>
    </div>
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
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.title {
  font-size: 18px;
  font-weight: 700;
}
.subtitle {
  color: var(--color-text-2);
}
</style>
