<template>
  <a-dropdown v-if="currentLang" @select="handleSelect">
    <a-button size="small" :icon="currentLang.flag">
      {{ currentLang.name }}
    </a-button>
    <template #content>
      <a-doption
        v-for="lang in langs"
        :key="lang.code"
        :value="lang.code"
      >
        <div class="lang-option">
          <span class="lang-flag">{{ lang.flag }}</span>
          <span class="lang-name">{{ lang.name }}</span>
        </div>
      </a-doption>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { LANGUAGES, changeLanguage } from '@/locales'
import { useRouter } from 'vue-router'

const { locale } = useI18n()
const router = useRouter()

const langs = LANGUAGES

const currentLang = computed(() => {
  const current = locale.value
  return LANGUAGES.find(l => l.code === current)
})

const handleSelect = (value: string) => {
  changeLanguage(value, router)
}
</script>

<style scoped>
.lang-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  .lang-flag {
    font-size: 16px;
    width: 24px;
    text-align: center;
  }

  .lang-name {
    flex: 1;
  }
}
</style>
