/**
 * 云盘页面路由入口
 *
 * 这是一个轻量的路由包装器，实际内容在 CloudView.vue 中实现
 */
<template>
  <CloudView />
</template>

<script setup lang="ts">
import CloudView from '@/modules/cloud/views/CloudView.vue'
</script>

<style scoped>
/* 无需额外样式 */
</style>
