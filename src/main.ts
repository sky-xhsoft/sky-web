import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ArcoVue from '@arco-design/web-vue'
import ArcoVueIcon from '@arco-design/web-vue/es/icon'
import '@arco-design/web-vue/dist/arco.css'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ArcoVue)
app.use(ArcoVueIcon)
app.mount('#app')

// 修改 Message 容器位置
setTimeout(() => {
  const observer = new MutationObserver(() => {
    const messageWrapper = document.querySelector('.arco-message-wrapper') as HTMLElement
    if (messageWrapper && messageWrapper.style.left) {
      messageWrapper.style.left = 'auto'
      messageWrapper.style.right = '20px'
      messageWrapper.style.transform = 'none'
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
}, 0)
