import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'v2_theme'

function readSavedTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    // ignore storage errors
  }
  return 'light'
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(readSavedTheme())

  function applyTheme(value: Theme) {
    document.documentElement.setAttribute('data-theme', value)
    document.documentElement.classList.toggle('dark', value === 'dark')
    theme.value = value
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // ignore storage errors
    }
  }

  function toggleTheme() {
    applyTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  // Apply the saved theme immediately on store creation
  applyTheme(theme.value)

  // Keep document attribute in sync if theme is changed from outside
  watch(theme, (value) => {
    applyTheme(value)
  })

  return { theme, applyTheme, toggleTheme }
})
