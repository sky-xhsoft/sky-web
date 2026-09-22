<template>
  <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" :width="size" :height="size">
    <defs>
      <linearGradient id="zg-grad-a" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#165dff"/>
        <stop offset="1" stop-color="#34c759"/>
      </linearGradient>
      <linearGradient id="zg-grad-b" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#34c759"/>
        <stop offset="1" stop-color="#00c9ff"/>
      </linearGradient>
    </defs>
    <!-- 圆形底座 -->
    <circle cx="24" cy="24" r="22" fill="#0f1b2d" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <!-- Z 形状：三条渐变斜条拼成 z -->
    <polygon points="16,14 33,14 19,34 15,34" fill="url(#zg-grad-a)"/>
    <polygon points="34,14 24,34 20,34 30,14" fill="url(#zg-grad-b)" opacity="0"/>
    <!-- Z 下横 -->
    <rect x="14" y="33" width="20" height="3.5" rx="1.7" fill="url(#zg-grad-a)"/>
    <!-- Z 上横 -->
    <rect x="14" y="11.5" width="20" height="3.5" rx="1.7" fill="url(#zg-grad-a)"/>
    <!-- 对角斜杠 -->
    <path d="M16,15 L34,33 L34,30 L20,15 Z" fill="url(#zg-grad-b)"/>
    <!-- 数据节点 -->
    <circle cx="35" cy="13.5" r="3.2" fill="#34c759" stroke="#0f1b2d" stroke-width="1.5"/>
    <circle cx="13" cy="34.5" r="3.2" fill="#00c9ff" stroke="#0f1b2d" stroke-width="1.5"/>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number | string }>(), { size: 32 })
</script>