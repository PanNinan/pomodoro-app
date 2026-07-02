import { watch } from 'vue'
import { useTimer } from '@/composables/useTimer'
import { useNotification } from '@/composables/useNotification'
import { useTaskStore } from '@/stores/task'
import { useStatsStore } from '@/stores/stats'
import { nowISO } from '@/utils/date'

/**
 * 番茄完成回调逻辑 — 记录、任务关联、通知
 */
export function usePomodoroComplete() {
  const { status, config, formattedTime, statusLabel, onTimerComplete, onTimerBreakEnd } = useTimer()
  const { notifyFocusComplete, notifyBreakEnd } = useNotification()
  const taskStore = useTaskStore()
  const statsStore = useStatsStore()

  // 当前专注开始时间
  let focusStartTime = ''

  // 监听状态变化，记录专注开始时间 + 更新页面标题
  watch(status, (newStatus) => {
    if (newStatus === 'running') {
      focusStartTime = nowISO()
    }
    document.title = `${formattedTime.value} - ${statusLabel.value} | 番茄时钟`
  })

  // 注册计时器完成回调
  onTimerComplete(async (taskId) => {
    const task = taskId ? taskStore.tasks.find((t) => t.id === taskId) : undefined
    const tag = task?.tags?.[0]

    // 判断这个番茄是否会让任务完成
    const taskWillComplete = task
      ? task.pomodoroActual + 1 >= task.pomodoroEstimate
      : false

    await statsStore.addRecord({
      taskId,
      startedAt: focusStartTime || nowISO(),
      endedAt: nowISO(),
      duration: config.value.focusDuration,
      completed: true,
      tag,
    })

    if (taskId) {
      await taskStore.incrementPomodoro(taskId)
    }

    notifyFocusComplete(taskWillComplete ? task?.title : undefined)
  })

  // 注册休息结束回调
  onTimerBreakEnd(() => {
    notifyBreakEnd()
  })
}
