import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ArcoVue from '@arco-design/web-vue'
import {
  IconSettings, IconExport, IconFile, IconInfoCircle, IconLanguage, IconScissor, IconDelete, IconPlus,
  IconSwap, IconDown, IconEdit, IconSearch, IconRefresh, IconEmail, IconPhone, IconUser,
} from '@arco-design/web-vue/es/icon'
import '@arco-design/web-vue/dist/arco.css'
import i18n, { changeLanguage } from './locales'
import { createPersistPlugin } from './stores/plugins/persist'
import vLazy from './directives/vLazy'
import './style.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/arco-override.css'
import './styles/animations.css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(createPersistPlugin())

app.use(pinia)
app.use(router)
app.use(ArcoVue)
// 只全局注册模板中未显式导入就使用的图标（如 <icon-plus>），其余图标各组件按需导入；
// 不再整包注册全部图标（约 336KB）。新页面请在组件内显式导入图标。
const globalIcons = {
  IconSettings, IconExport, IconFile, IconInfoCircle, IconLanguage, IconScissor, IconDelete, IconPlus,
  IconSwap, IconDown, IconEdit, IconSearch, IconRefresh, IconEmail, IconPhone, IconUser,
}
for (const [name, component] of Object.entries(globalIcons)) {
  app.component(name, component)
}
app.use(i18n)

// 注册全局指令
app.directive('lazy', vLazy)

app.mount('#app')

// 监听路由参数变化，自动切换语言
router.afterEach((to) => {
  const lang = to.query.lang
  if (lang && typeof lang === 'string') {
    changeLanguage(lang, router)
  }
})

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
