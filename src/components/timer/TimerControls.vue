<script setup lang="ts">
import { computed } from 'vue'
import { useTimer } from '@/composables/useTimer'

const { status, start, pause, resume, reset, skip } = useTimer()

function handleMainAction() {
  if (status.value === 'idle' || status.value === 'break_idle') {
    start()
  } else if (status.value === 'running' || status.value === 'break_running') {
    pause()
  } else if (status.value === 'paused' || status.value === 'break_paused') {
    resume()
  }
}

const mainLabel = computed(() => {
  const labels: Record<string, string> = {
    idle: '开始专注',
    running: '暂停',
    paused: '继续',
    break_idle: '开始休息',
    break_running: '暂停休息',
    break_paused: '继续休息',
  }
  return labels[status.value] ?? '开始'
})

const mainType = computed(() => {
  if (status.value === 'running' || status.value === 'break_running') return 'warning'
  return 'primary'
})

const showSecondary = computed(() =>
  status.value !== 'idle' && status.value !== 'break_idle'
)
</script>

<template>
  <div class="timer-controls">
    <n-button
      v-if="showSecondary"
      quaternary
      size="large"
      @click="reset"
    >
      <template #icon>
        <n-icon><span class="mdi mdi-restart" /></n-icon>
      </template>
      重置
    </n-button>

    <n-button
      :type="mainType"
      size="large"
      round
      strong
      class="timer-controls__main"
      @click="handleMainAction"
    >
      {{ mainLabel }}
    </n-button>

    <n-button
      v-if="showSecondary"
      quaternary
      size="large"
      @click="skip"
    >
      <template #icon>
        <n-icon><span class="mdi mdi-skip-next" /></n-icon>
      </template>
      跳过
    </n-button>
  </div>
</template>

<style scoped>
.timer-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.timer-controls__main {
  min-width: 120px;
  font-size: 16px;
}
</style>
