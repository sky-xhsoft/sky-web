<template>
  <div class="page-skeleton">
    <!-- 页面头部骨架 -->
    <div class="skeleton-header">
      <a-skeleton :animation="true">
        <a-skeleton-shape shape="circle" size="40px" />
        <a-skeleton-line :rows="1" :widths="['200px']" style="margin-top: 12px" />
      </a-skeleton>
    </div>

    <!-- 表单骨架 -->
    <div class="skeleton-form" v-if="type === 'form'">
      <a-skeleton :animation="true" :loading="true">
        <a-skeleton-line :rows="6" :widths="['30%', '100%', '30%', '100%', '30%', '50%']" />
      </a-skeleton>
    </div>

    <!-- 表格骨架 -->
    <div class="skeleton-table" v-if="type === 'table'">
      <a-skeleton :animation="true" :loading="true">
        <a-skeleton-line :rows="1" :widths="['100%']" />
        <a-skeleton-line :rows="8" :widths="['100%', '100%', '100%', '100%', '100%', '100%', '100%', '60%']" />
      </a-skeleton>
    </div>

    <!-- 卡片骨架 -->
    <div class="skeleton-card" v-if="type === 'card'">
      <a-skeleton :animation="true" :loading="true">
        <a-skeleton-line :rows="3" :widths="['60%', '40%', '80%']" />
      </a-skeleton>
    </div>

    <!-- 列表骨架 -->
    <div class="skeleton-list" v-if="type === 'list'">
      <div v-for="i in 5" :key="i" class="skeleton-list-item">
        <a-skeleton :animation="true" :loading="true">
          <a-skeleton-shape shape="circle" size="32px" />
          <a-skeleton-line :rows="2" :widths="['70%', '40%']" />
        </a-skeleton>
      </div>
    </div>

    <!-- 通用骨架 -->
    <div class="skeleton-generic" v-if="type === 'generic'">
      <a-skeleton :animation="true" :loading="true">
        <a-skeleton-line :rows="5" :widths="['80%', '100%', '60%', '100%', '30%']" />
      </a-skeleton>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'form' | 'table' | 'card' | 'list' | 'generic'
}

withDefaults(defineProps<Props>(), {
  type: 'generic'
})
</script>

<style scoped>
.page-skeleton {
  padding: 24px;
  background: #ffffff;
  border-radius: 8px;
}

.skeleton-header {
  margin-bottom: 32px;
}

.skeleton-header :deep(.arco-skeleton) {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.skeleton-list-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.skeleton-list-item :deep(.arco-skeleton) {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.skeleton-list-item:last-child {
  border-bottom: none;
}
</style>
