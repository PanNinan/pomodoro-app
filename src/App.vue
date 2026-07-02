<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { darkTheme } from 'naive-ui'
import AppLayout from '@/components/common/AppLayout.vue'
import CloseGuard from '@/components/common/CloseGuard.vue'
import { useTheme } from '@/composables/useTheme'

const { isDark, init: initTheme } = useTheme()

const theme = computed(() => isDark.value ? darkTheme : null)

const themeOverrides = {
  common: {
    primaryColor: '#e74c3c',
    primaryColorHover: '#ff6b6b',
    primaryColorPressed: '#c0392b',
  },
}

onMounted(() => {
  initTheme()
})
</script>

<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-notification-provider>
        <n-dialog-provider>
          <CloseGuard />
          <n-global-style />
          <AppLayout />
        </n-dialog-provider>
      </n-notification-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;
}

html[data-theme="dark"] {
  background-color: #1a1a1a;
  color: #e0e0e0;
}

html[data-theme="light"] {
  background-color: #ffffff;
  color: #333333;
}
</style>
