<template>
  <div class="cloud-page">
    <CloudView />
  </div>
</template>

<script setup lang="ts">
import { CloudView } from '@/modules/cloud'
</script>

<style scoped>
.cloud-page {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
