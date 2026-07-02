<script setup lang="ts">
import SideNav from './SideNav.vue'
</script>

<template>
  <div class="app-layout">
    <SideNav />
    <main class="app-layout__main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.app-layout__main {
  flex: 1;
  padding: 32px 40px;
  overflow-y: auto;
}
</style>
