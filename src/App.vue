<template>
  <a-config-provider :locale="currentArcoLocale">
    <RouterView />
  </a-config-provider>
</template>

<script setup lang="ts">
import { currentArcoLocale } from './locales'
</script>
