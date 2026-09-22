<template>
  <div class="v2-card" :class="[{ 'v2-card--hover': hover, 'v2-card--pad': padding }]">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  hover?: boolean
  padding?: boolean
}

withDefaults(defineProps<Props>(), {
  hover: false,
  padding: true,
})
</script>

<style scoped>
.v2-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.v2-card--pad {
  padding: 20px;
}

.v2-card--hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
</style>
