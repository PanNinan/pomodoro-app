<script setup lang="ts">
import { useStatsStore } from '@/stores/stats'

const statsStore = useStatsStore()
</script>

<template>
  <div class="stats-summary">
    <n-card size="small">
      <n-statistic label="今日番茄" :value="statsStore.todayStats.pomodoroCount">
        <template #suffix>🍅</template>
      </n-statistic>
    </n-card>
    <n-card size="small">
      <n-statistic label="今日专注" :value="statsStore.todayStats.totalMinutes">
        <template #suffix>分钟</template>
      </n-statistic>
    </n-card>
    <n-card size="small">
      <n-statistic label="连续天数" :value="statsStore.streak">
        <template #suffix>🔥</template>
      </n-statistic>
    </n-card>
  </div>
</template>

<style scoped>
.stats-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
</style>
