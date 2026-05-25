<template>
  <div
    :class="['base-image', { 'is-loading': loading, 'is-error': error }]"
    :style="{ width: width, height: height }"
  >
    <!-- 加载占位 -->
    <div v-if="loading" class="base-image__placeholder">
      <a-spin :size="16" />
    </div>

    <!-- 错误占位 -->
    <div v-else-if="error" class="base-image__error">
      <icon-image-close />
      <span v-if="errorText" class="base-image__error-text">{{ errorText }}</span>
    </div>

    <!-- 实际图片 -->
    <img
      v-show="!loading && !error"
      ref="imgRef"
      :src="lazy ? placeholder : src"
      :data-src="lazy ? src : undefined"
      :alt="alt"
      :loading="lazy ? 'lazy' : 'eager'"
      :class="['base-image__img', objectFit && `object-fit-${objectFit}`]"
      @load="handleLoad"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { IconImageClose } from '@arco-design/web-vue/es/icon'

interface Props {
  /** 图片源地址 */
  src: string
  /** 替代文本（无障碍） */
  alt?: string
  /** 宽度 */
  width?: string | number
  /** 高度 */
  height?: string | number
  /** 是否启用懒加载（默认 true） */
  lazy?: boolean
  /** 占位图（懒加载时使用） */
  placeholder?: string
  /** 错误文本 */
  errorText?: string
  /** object-fit CSS 属性 */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  lazy: true,
  placeholder:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNlZWUiLz48L3N2Zz4=',
  objectFit: 'cover',
})

const emit = defineEmits<{
  (e: 'load', event: Event): void
  (e: 'error', event: Event): void
}>()

const imgRef = ref<HTMLImageElement | null>(null)
const loading = ref(true)
const error = ref(false)
let observer: IntersectionObserver | null = null

function handleLoad(e: Event) {
  loading.value = false
  error.value = false
  emit('load', e)
}

function handleError(e: Event) {
  loading.value = false
  error.value = true
  emit('error', e)
}

/**
 * 设置 IntersectionObserver 实现懒加载
 * 当图片进入视口时，将 data-src 赋值给 src
 */
function setupLazyLoad() {
  if (!props.lazy || !imgRef.value || !('IntersectionObserver' in window)) {
    loading.value = false
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && imgRef.value) {
          const dataSrc = imgRef.value.dataset.src
          if (dataSrc) {
            imgRef.value.src = dataSrc
            imgRef.value.removeAttribute('data-src')
          }
          if (observer && imgRef.value) {
            observer.unobserve(imgRef.value)
          }
        }
      })
    },
    {
      rootMargin: '50px',
      threshold: 0.01,
    }
  )

  observer.observe(imgRef.value)
}

watch(
  () => props.src,
  () => {
    loading.value = true
    error.value = false
  }
)

onMounted(() => {
  setupLazyLoad()
})

onBeforeUnmount(() => {
  if (observer && imgRef.value) {
    observer.unobserve(imgRef.value)
    observer.disconnect()
  }
})
</script>

<style scoped>
.base-image {
  position: relative;
  display: inline-block;
  overflow: hidden;
  background-color: #f5f5f5;
}

.base-image__img {
  width: 100%;
  height: 100%;
  display: block;
  transition: opacity 0.3s ease;
}

.base-image__img.object-fit-contain {
  object-fit: contain;
}
.base-image__img.object-fit-cover {
  object-fit: cover;
}
.base-image__img.object-fit-fill {
  object-fit: fill;
}
.base-image__img.object-fit-none {
  object-fit: none;
}
.base-image__img.object-fit-scale-down {
  object-fit: scale-down;
}

.base-image__placeholder,
.base-image__error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #999;
  background-color: #f5f5f5;
}

.base-image__error-text {
  font-size: 12px;
}
</style>