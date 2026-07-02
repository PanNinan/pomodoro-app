<script setup lang="ts">
import { useRoute } from 'vue-router'
import { NAV_ITEMS } from '@/constants/defaults'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const { isDark, toggle } = useTheme()
</script>

<template>
  <nav class="side-nav">
    <div class="side-nav__logo">
      <span class="side-nav__logo-icon">🍅</span>
      <span class="side-nav__logo-text">番茄时钟</span>
    </div>

    <div class="side-nav__menu">
      <router-link
        v-for="item in NAV_ITEMS"
        :key="item.key"
        :to="item.route"
        class="side-nav__item"
        :class="{ 'side-nav__item--active': route.path === item.route }"
      >
        <span class="side-nav__icon" :class="`mdi ${item.icon}`" />
        <span class="side-nav__label">{{ item.label }}</span>
      </router-link>
    </div>

    <div class="side-nav__footer">
      <button class="side-nav__theme-btn" @click="toggle" :title="isDark ? '切换到浅色' : '切换到深色'">
        <span v-if="isDark">☀️</span>
        <span v-else>🌙</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.side-nav {
  width: 200px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--n-color);
  border-right: 1px solid var(--n-border-color);
  padding: 24px 0;
}

.side-nav__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 24px 24px;
  border-bottom: 1px solid var(--n-border-color);
  margin-bottom: 16px;
}

.side-nav__logo-icon {
  font-size: 28px;
}

.side-nav__logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--n-text-color);
}

.side-nav__menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 12px;
  flex: 1;
}

.side-nav__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--n-text-color-2);
  transition: all 0.2s ease;
  font-size: 15px;
}

.side-nav__item:hover {
  background-color: var(--n-button-color-hover);
  color: var(--n-text-color);
}

.side-nav__item--active {
  background-color: var(--n-primary-color-hover);
  color: var(--n-primary-color);
  font-weight: 500;
}

.side-nav__icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
}

.side-nav__footer {
  padding: 16px 24px;
  border-top: 1px solid var(--n-border-color);
  margin-top: auto;
}

.side-nav__theme-btn {
  background: none;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 18px;
  width: 100%;
  transition: all 0.2s ease;
  color: var(--n-text-color);
}

.side-nav__theme-btn:hover {
  background-color: var(--n-button-color-hover);
}
</style>
