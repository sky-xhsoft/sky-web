<template>
  <div
    ref="containerRef"
    class="virtual-list-container"
    @scroll="handleScroll"
  >
    <div :style="{ height: totalHeight + 'px', position: 'relative' }">
      <div :style="{ transform: `translateY(${offsetY}px)` }">
        <div
          v-for="item in visibleItems"
          :key="item.index"
          :style="{ height: itemHeight + 'px' }"
          class="virtual-list-item"
        >
          <slot :item="item.data" :index="item.index" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { throttle } from 'lodash-es'

interface Props {
  items: any[]
  itemHeight: number
  buffer?: number
}

const props = withDefaults(defineProps<Props>(), {
  buffer: 5
})

const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)
const containerHeight = ref(0)

const totalHeight = computed(() => props.items.length * props.itemHeight)

const visibleRange = computed(() => {
  const start = Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.buffer)
  const end = Math.min(
    props.items.length,
    Math.ceil((scrollTop.value + containerHeight.value) / props.itemHeight) + props.buffer
  )
  return { start, end }
})

const visibleItems = computed(() => {
  const { start, end } = visibleRange.value
  return props.items.slice(start, end).map((item, idx) => ({
    data: item,
    index: start + idx
  }))
})

const offsetY = computed(() => visibleRange.value.start * props.itemHeight)

const handleScroll = throttle((e: Event) => {
  scrollTop.value = (e.target as HTMLElement).scrollTop
}, 16)

onMounted(() => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight
  }
})
</script>

<style scoped>
.virtual-list-container {
  overflow-y: auto;
  height: 100%;
}

.virtual-list-item {
  overflow: hidden;
}
</style>
