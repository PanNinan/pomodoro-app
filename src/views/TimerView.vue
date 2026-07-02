<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
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

const showDrawer = ref(false)

// 注册番茄完成/休息结束回调（记录 + 通知）
usePomodoroComplete()

// 选择任务 — 同步更新 taskStore 和 timer
function selectTask(taskId: string | null) {
  taskStore.setCurrentTask(taskId)
  setTimerTask(taskId)
  showDrawer.value = false
}

// 托盘快捷操作回调
function handleStartPause() {
  const s = status.value
  if (s === 'idle' || s === 'break_idle') start()
  else if (s === 'running' || s === 'break_running') pause()
  else if (s === 'paused' || s === 'break_paused') resume()
}

onMounted(async () => {
  await initNotification()
  await taskStore.loadTasks()
  await statsStore.loadRecords()
  await registerShortcuts({ onStartPause: handleStartPause, onReset: () => reset() })
  ;(window as any).__tauriStartTimer = () => start()
  ;(window as any).__tauriPauseTimer = () => pause()
})

onUnmounted(async () => { await unregisterShortcuts() })
</script>

<template>
  <div class="timer-view">
    <div class="timer-view__center">
      <!-- 当前任务 -->
      <div
        class="timer-view__active-task"
        :class="{ 'timer-view__active-task--has': taskStore.activeTask }"
        @click="showDrawer = true"
      >
        <template v-if="taskStore.activeTask">
          <span class="timer-view__active-dot" />
          <span>{{ taskStore.activeTask.title }}</span>
          <span class="timer-view__active-count">
            {{ taskStore.activeTask.pomodoroActual }}/{{ taskStore.activeTask.pomodoroEstimate }} 🍅
          </span>
        </template>
        <template v-else>
          <span>📋 选择任务...</span>
        </template>
      </div>

      <!-- 计时器 -->
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

    <!-- 右侧抽屉 — 任务选择 -->
    <n-drawer v-model:show="showDrawer" :width="320" placement="right">
      <n-drawer-content title="选择任务" closable>
        <!-- 进行中 -->
        <div class="drawer__section">
          <div class="drawer__section-title">进行中</div>
          <div
            v-for="task in taskStore.doingTasks"
            :key="task.id"
            class="drawer__item"
            :class="{ 'drawer__item--active': taskStore.currentTaskId === task.id }"
            @click="selectTask(task.id)"
          >
            <div class="drawer__item-left">
              <span class="drawer__item-dot" />
              <span class="drawer__item-title">{{ task.title }}</span>
            </div>
            <span class="drawer__item-count">
              {{ task.pomodoroActual }}/{{ task.pomodoroEstimate }}
            </span>
          </div>
          <div v-if="!taskStore.doingTasks.length" class="drawer__empty">暂无进行中的任务</div>
        </div>

        <!-- 待办 -->
        <div class="drawer__section">
          <div class="drawer__section-title">待办</div>
          <div
            v-for="task in taskStore.todoTasks.slice(0, 10)"
            :key="task.id"
            class="drawer__item"
            @click="selectTask(task.id)"
          >
            <div class="drawer__item-left">
              <span class="drawer__item-title">{{ task.title }}</span>
            </div>
            <span class="drawer__item-count">🍅{{ task.pomodoroEstimate }}</span>
          </div>
          <div v-if="!taskStore.todoTasks.length" class="drawer__empty">暂无待办任务</div>
        </div>

        <!-- 取消选择 -->
        <div v-if="taskStore.currentTaskId" class="drawer__clear" @click="selectTask(null)">
          取消当前任务选择
        </div>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<style scoped>
.timer-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  max-width: 500px;
  margin: 0 auto;
  padding-top: 40px;
}

.timer-view__center {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 当前任务按钮 */
.timer-view__active-task {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  border-radius: 24px;
  border: 1px dashed var(--n-border-color);
  cursor: pointer;
  font-size: 14px;
  color: var(--n-text-color-3);
  margin-bottom: 24px;
  transition: all 0.2s;
  user-select: none;
}

.timer-view__active-task:hover {
  border-color: var(--n-primary-color);
  color: var(--n-text-color);
}

.timer-view__active-task--has {
  border-style: solid;
  border-color: var(--n-primary-color);
  color: var(--n-text-color);
  background-color: rgba(231, 76, 60, 0.04);
}

.timer-view__active-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--n-primary-color);
  flex-shrink: 0;
}

.timer-view__active-count {
  font-size: 12px;
  color: var(--n-text-color-3);
}

.timer-view__shortcuts {
  margin-top: 16px;
  opacity: 0.6;
}

/* 抽屉样式 */
.drawer__section {
  margin-bottom: 20px;
}

.drawer__section-title {
  font-size: 12px;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  padding: 0 4px;
}

.drawer__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.drawer__item:hover {
  background-color: var(--n-button-color-hover);
}

.drawer__item--active {
  background-color: rgba(231, 76, 60, 0.08);
  border-left: 3px solid var(--n-primary-color);
}

.drawer__item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.drawer__item-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--n-primary-color);
  flex-shrink: 0;
}

.drawer__item-title {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawer__item-count {
  font-size: 12px;
  color: var(--n-text-color-3);
  flex-shrink: 0;
  margin-left: 8px;
}

.drawer__empty {
  font-size: 13px;
  color: var(--n-text-color-3);
  padding: 12px 4px;
}

.drawer__clear {
  text-align: center;
  padding: 12px;
  font-size: 13px;
  color: var(--n-text-color-3);
  cursor: pointer;
  border-top: 1px solid var(--n-border-color);
  margin-top: 8px;
}

.drawer__clear:hover {
  color: var(--n-primary-color);
}
</style>
