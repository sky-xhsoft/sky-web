/**
 * v-lazy 图片懒加载指令
 * 使用 IntersectionObserver API，当图片进入视口时才加载
 *
 * 使用示例：
 * <img v-lazy="'/path/to/image.jpg'" />
 * <img v-lazy="{ src: '/path.jpg', placeholder: '/placeholder.svg' }" />
 */
import type { Directive, DirectiveBinding } from 'vue'

const DEFAULT_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNlZWUiLz48L3N2Zz4='

const DEFAULT_ERROR_IMAGE = DEFAULT_PLACEHOLDER

interface LazyOptions {
  src: string
  placeholder?: string
  errorImage?: string
  rootMargin?: string
}

const observerMap = new WeakMap<HTMLImageElement, IntersectionObserver>()

function getOptions(binding: DirectiveBinding): LazyOptions {
  if (typeof binding.value === 'string') {
    return { src: binding.value }
  }
  return binding.value as LazyOptions
}

function loadImage(el: HTMLImageElement, opts: LazyOptions) {
  const img = new Image()
  img.onload = () => {
    el.src = opts.src
    el.classList.remove('lazy-loading')
    el.classList.add('lazy-loaded')
  }
  img.onerror = () => {
    el.src = opts.errorImage || DEFAULT_ERROR_IMAGE
    el.classList.remove('lazy-loading')
    el.classList.add('lazy-error')
  }
  img.src = opts.src
}

function setupObserver(el: HTMLImageElement, opts: LazyOptions) {
  if (!('IntersectionObserver' in window)) {
    // 浏览器不支持 IntersectionObserver，直接加载
    loadImage(el, opts)
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadImage(el, opts)
          observer.unobserve(el)
        }
      })
    },
    {
      rootMargin: opts.rootMargin || '50px',
      threshold: 0.01,
    }
  )

  observer.observe(el)
  observerMap.set(el, observer)
}

const vLazy: Directive<HTMLImageElement, string | LazyOptions> = {
  mounted(el, binding) {
    const opts = getOptions(binding)
    el.src = opts.placeholder || DEFAULT_PLACEHOLDER
    el.classList.add('lazy-loading')
    setupObserver(el, opts)
  },
  updated(el, binding) {
    // src 变化时重新加载
    if (binding.value !== binding.oldValue) {
      const oldObserver = observerMap.get(el)
      if (oldObserver) {
        oldObserver.unobserve(el)
        oldObserver.disconnect()
      }
      const opts = getOptions(binding)
      el.classList.remove('lazy-loaded', 'lazy-error')
      el.classList.add('lazy-loading')
      el.src = opts.placeholder || DEFAULT_PLACEHOLDER
      setupObserver(el, opts)
    }
  },
  unmounted(el) {
    const observer = observerMap.get(el)
    if (observer) {
      observer.unobserve(el)
      observer.disconnect()
      observerMap.delete(el)
    }
  },
}

export default vLazy