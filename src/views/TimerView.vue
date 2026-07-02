<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import TimerRing from '@/components/timer/TimerRing.vue'
import TimerDisplay from '@/components/timer/TimerDisplay.vue'
import TimerControls from '@/components/timer/TimerControls.vue'
import { useTimer } from '@/composables/useTimer'
import { useNotification } from '@/composables/useNotification'
import { useGlobalShortcut } from '@/composables/useGlobalShortcut'
import { usePomodoroComplete } from '@/composables/usePomodoroComplete'
import { useTaskStore } from '@/stores/task'
import { useStatsStore } from '@/stores/stats'

const { status, start, pause, resume, reset, setCurrentTask: setTimerTask } = useTimer()
const { init: initNotification } = useNotification()
const { registerShortcuts, unregisterShortcuts } = useGlobalShortcut()
const taskStore = useTaskStore()
const statsStore = useStatsStore()

// 注册番茄完成/休息结束回调（记录 + 通知）
usePomodoroComplete()

// 选择任务 — 同步更新 taskStore 和 timer
function selectTask(taskId: string | null) {
  taskStore.setCurrentTask(taskId)
  setTimerTask(taskId)
}

// 托盘快捷操作回调
function handleStartPause() {
  const s = status.value
  if (s === 'idle' || s === 'break_idle') {
    start()
  } else if (s === 'running' || s === 'break_running') {
    pause()
  } else if (s === 'paused' || s === 'break_paused') {
    resume()
  }
}

onMounted(async () => {
  await initNotification()
  await taskStore.loadTasks()
  await statsStore.loadRecords()

  await registerShortcuts({
    onStartPause: handleStartPause,
    onReset: () => reset(),
  })

  ;(window as any).__tauriStartTimer = () => start()
  ;(window as any).__tauriPauseTimer = () => pause()
})

onUnmounted(async () => {
  await unregisterShortcuts()
})
</script>

<template>
  <div class="timer-view">
    <div class="timer-view__center">
      <div v-if="taskStore.activeTask" class="timer-view__task-tag">
        <n-tag size="small" type="info" :bordered="false">
          📋 {{ taskStore.activeTask.title }}
        </n-tag>
      </div>

      <TimerRing :size="300" :stroke-width="10">
        <TimerDisplay />
      </TimerRing>

      <TimerControls />

      <div class="timer-view__shortcuts">
        <n-text depth="3" style="font-size: 12px;">
          Ctrl+Shift+P 开始/暂停 · Ctrl+Shift+R 重置
        </n-text>
      </div>
    </div>

    <div class="timer-view__tasks">
      <div class="timer-view__tasks-header">
        <span>快速选择任务</span>
      </div>
      <div class="timer-view__tasks-list">
        <div
          v-for="task in taskStore.doingTasks.slice(0, 5)"
          :key="task.id"
          class="timer-view__task-item"
          :class="{ 'timer-view__task-item--active': taskStore.currentTaskId === task.id }"
          @click="selectTask(taskStore.currentTaskId === task.id ? null : task.id)"
        >
          <span class="timer-view__task-title">{{ task.title }}</span>
          <span class="timer-view__task-count">
            {{ task.pomodoroActual }}/{{ task.pomodoroEstimate }} 🍅
          </span>
        </div>
        <div v-if="taskStore.doingTasks.length === 0" class="timer-view__empty">
          暂无进行中的任务
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timer-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  max-width: 500px;
  margin: 0 auto;
  padding-top: 40px;
}

.timer-view__center {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timer-view__task-tag {
  margin-bottom: 24px;
}

.timer-view__shortcuts {
  margin-top: 16px;
  opacity: 0.6;
}

.timer-view__tasks {
  width: 100%;
}

.timer-view__tasks-header {
  font-size: 14px;
  color: var(--n-text-color-3);
  margin-bottom: 12px;
}

.timer-view__tasks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timer-view__task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.timer-view__task-item:hover {
  border-color: var(--n-primary-color);
}

.timer-view__task-item--active {
  border-color: var(--n-primary-color);
  background-color: var(--n-primary-color-hover);
}

.timer-view__task-title {
  font-size: 14px;
  color: var(--n-text-color);
}

.timer-view__task-count {
  font-size: 13px;
  color: var(--n-text-color-3);
}

.timer-view__empty {
  text-align: center;
  padding: 24px;
  color: var(--n-text-color-3);
  font-size: 14px;
}
</style>
