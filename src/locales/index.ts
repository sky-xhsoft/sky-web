import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS
}

// 从 localStorage 获取语言，默认为浏览器语言或中文
function getDefaultLanguage(): string {
  const saved = localStorage.getItem('language')
  if (saved && ['zh-CN', 'en-US'].includes(saved)) {
    return saved
  }
  const browserLang = navigator.language || (navigator as any).userLanguage
  if (browserLang && browserLang.startsWith('en')) {
    return 'en-US'
  }
  return 'zh-CN'
}

const i18n = createI18n({
  legacy: false,
  locale: getDefaultLanguage(),
  fallbackLocale: 'zh-CN',
  messages
})

export default i18n

export function changeLanguage(locale: string) {
  if (messages[locale]) {
    i18n.global.locale.value = locale
    localStorage.setItem('language', locale)
  }
}

export function getCurrentLanguage(): string {
  return i18n.global.locale.value
}
