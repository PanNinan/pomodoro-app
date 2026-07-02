<script setup lang="ts">
import { useTimer } from '@/composables/useTimer'

const { formattedTime, statusLabel, pomodoroInRound, config } = useTimer()
</script>

<template>
  <div class="timer-display">
    <div class="timer-display__time">{{ formattedTime }}</div>
    <div class="timer-display__status">{{ statusLabel }}</div>
    <div class="timer-display__round">
      <span
        v-for="i in config.longBreakInterval"
        :key="i"
        class="timer-display__dot"
        :class="{ 'timer-display__dot--active': i <= pomodoroInRound }"
      />
    </div>
  </div>
</template>

<style scoped>
.timer-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.timer-display__time {
  font-size: 56px;
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
  color: var(--n-text-color);
  line-height: 1;
}

.timer-display__status {
  font-size: 14px;
  color: var(--n-text-color-3);
  letter-spacing: 1px;
}

.timer-display__round {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.timer-display__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--n-border-color);
  transition: background-color 0.3s ease;
}

.timer-display__dot--active {
  background-color: #e74c3c;
}
</style>
