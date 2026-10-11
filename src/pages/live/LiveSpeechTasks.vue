<template>
  <div class="live-speech-page">
    <V2PageHeader title="同传字幕" description="本公司全部直播间的声影同传、实时同传与原文字幕任务：查看实时状态，停止、重启、删除或复制新建" />
    <V2Card class="ls-card">
      <SpeechTaskTable />
    </V2Card>
  </div>
</template>

<script setup lang="ts">
import { V2PageHeader, V2Card } from '@/components/ui'
import SpeechTaskTable from './components/SpeechTaskTable.vue'
</script>

<style scoped>
.live-speech-page { display: flex; flex-direction: column; gap: 16px; }
</style>
