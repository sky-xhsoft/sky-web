import { createI18n } from 'vue-i18n'
import { ref } from 'vue'
import type { Router } from 'vue-router'
import zhCN from './zh-CN'
import enUS from './en-US'
import ArcoZhCN from '@arco-design/web-vue/es/locale/lang/zh-cn'
import ArcoEnUS from '@arco-design/web-vue/es/locale/lang/en-us'
import { useMenuStore } from '../stores/menu'

// 语言配置
export type LocaleCode = 'zh-CN' | 'en-US'

export interface LanguageOption {
  code: LocaleCode
  name: string
  flag: string
  arcoLocale: any
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳', arcoLocale: ArcoZhCN },
  { code: 'en-US', name: 'English', flag: '🇺🇸', arcoLocale: ArcoEnUS }
]

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS
} as const

function isLocaleCode(locale: string): locale is LocaleCode {
  return Object.prototype.hasOwnProperty.call(messages, locale)
}

// 从 localStorage 获取语言，默认为浏览器语言或中文
function getDefaultLanguage(): LocaleCode {
  const saved = localStorage.getItem('language')
  if (saved && isLocaleCode(saved)) {
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

// 当前 Arco Design 的语言设置（用于响应式更新）
export const currentArcoLocale = ref(LANGUAGES.find(l => l.code === getDefaultLanguage())?.arcoLocale || ArcoZhCN)

export function changeLanguage(locale: string, router?: Router) {
  if (isLocaleCode(locale)) {
    i18n.global.locale.value = locale
    localStorage.setItem('language', locale)
    // 更新 Arco Design 的语言
    const langOpt = LANGUAGES.find(l => l.code === locale)
    if (langOpt) {
      currentArcoLocale.value = langOpt.arcoLocale
    }
    // 更新菜单显示语言
    if (router) {
      try {
        const menuStore = useMenuStore()
        menuStore.updateMenuLanguage(locale, router)
      } catch {
        // 忽略错误，可能 store 还未初始化
      }
    }
  }
}

export function getCurrentLanguage(): string {
  return i18n.global.locale.value
}

export function getArcoLocale(locale?: string) {
  const targetLang = locale || getCurrentLanguage()
  return LANGUAGES.find(l => l.code === targetLang)?.arcoLocale || ArcoZhCN
}
