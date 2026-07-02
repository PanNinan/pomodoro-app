import { ref, computed, readonly } from 'vue'
import type { TimerStatus, TimerConfig } from '@/types'
import { DEFAULT_TIMER_CONFIG, STORAGE_KEYS } from '@/constants/defaults'
import { formatTime } from '@/utils/time'
import { nowISO } from '@/utils/date'
import { storage } from '@/storage'

// 全局单例状态
const status = ref<TimerStatus>('idle')
const remaining = ref(DEFAULT_TIMER_CONFIG.focusDuration)
const totalDuration = ref(DEFAULT_TIMER_CONFIG.focusDuration)
const currentPomodoro = ref(1)
const config = ref<TimerConfig>({ ...DEFAULT_TIMER_CONFIG })
const currentTaskId = ref<string | null>(null)

// 内部计时变量
let intervalId: ReturnType<typeof setInterval> | null = null
let lastTick = 0

// 当前番茄开始时间（用于记录）
let pomodoroStartTime = ''

// 事件回调
let onComplete: ((taskId?: string) => void) | null = null
let onBreakEnd: (() => void) | null = null

/**
 * 从存储恢复配置
 */
async function loadConfig(): Promise<void> {
  try {
    const saved = await storage.get<Partial<TimerConfig>>('settings', STORAGE_KEYS.TIMER_CONFIG)
    if (saved) {
      config.value = { ...DEFAULT_TIMER_CONFIG, ...saved }
    }
  } catch {
    // 忽略
  }
}

/**
 * 保存配置到存储
 */
async function saveConfig(): Promise<void> {
  try {
    await storage.set('settings', STORAGE_KEYS.TIMER_CONFIG, { ...config.value })
  } catch {
    // 忽略
  }
}

// 模块加载时恢复配置，加载完成后同步到计时器
loadConfig().then(() => {
  if (status.value === 'idle') {
    remaining.value = config.value.focusDuration
    totalDuration.value = config.value.focusDuration
  }
})

// ─── 模块级单例 computed — 只创建一次 ───

const progress = computed(() => {
  if (totalDuration.value === 0) return 0
  return 1 - remaining.value / totalDuration.value
})

const formattedTime = computed(() => formatTime(remaining.value))

const isFocusing = computed(() =>
  status.value === 'running' || status.value === 'paused'
)

const isBreak = computed(() =>
  status.value === 'break_running' || status.value === 'break_paused' || status.value === 'break_idle'
)

const STATUS_LABELS: Record<TimerStatus, string> = {
  idle: '准备专注',
  running: '专注中',
  paused: '已暂停',
  break_idle: '准备休息',
  break_running: '休息中',
  break_paused: '休息暂停',
}

const statusLabel = computed(() => STATUS_LABELS[status.value])

const pomodoroInRound = computed(() => currentPomodoro.value)

// 调试用
function debugSkip(seconds: number = 3): void {
  remaining.value = seconds
}

if (typeof window !== 'undefined') {
  (window as any).__timerDebug = debugSkip
}

/**
 * 清除计时器
 */
function clearTimer(): void {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

/**
 * 计时器 tick — 使用 Date.now() 校准，避免 Tab 休眠导致漂移
 */
function tick(): void {
  const now = Date.now()
  const elapsed = Math.floor((now - lastTick) / 1000)
  if (elapsed >= 1) {
    remaining.value = Math.max(0, remaining.value - elapsed)
    lastTick = now
  }

  if (remaining.value <= 0) {
    handlePhaseComplete()
  }
}

/**
 * 当前阶段完成时的处理
 */
async function handlePhaseComplete(): Promise<void> {
  clearTimer()

  if (status.value === 'running') {
    // 专注完成 — 先等回调完成（通知、数据库写入）
    if (onComplete) await onComplete(currentTaskId.value ?? undefined)

    if (currentPomodoro.value >= config.value.longBreakInterval) {
      // 该长休息了
      status.value = 'break_idle'
      remaining.value = config.value.longBreakDuration
      totalDuration.value = config.value.longBreakDuration
      currentPomodoro.value = 0
    } else {
      // 短休息
      status.value = 'break_idle'
      remaining.value = config.value.shortBreakDuration
      totalDuration.value = config.value.shortBreakDuration
    }

    if (config.value.autoStartBreak) {
      startBreak()
    }
  } else if (status.value === 'break_running') {
    // 休息完成 — 先等回调完成
    if (onBreakEnd) await onBreakEnd()
    currentPomodoro.value++
    status.value = 'idle'
    remaining.value = config.value.focusDuration
    totalDuration.value = config.value.focusDuration

    if (config.value.autoStartPomodoro) {
      start()
    }
  }
}

/**
 * 开始专注
 */
function start(): void {
  pomodoroStartTime = nowISO()
  lastTick = Date.now()
  status.value = 'running'
  intervalId = setInterval(tick, 1000)
}

/**
 * 暂停专注
 */
function pause(): void {
  clearTimer()
  if (status.value === 'running') {
    status.value = 'paused'
  } else if (status.value === 'break_running') {
    status.value = 'break_paused'
  }
}

/**
 * 恢复
 */
function resume(): void {
  lastTick = Date.now()
  if (status.value === 'paused') {
    status.value = 'running'
  } else if (status.value === 'break_paused') {
    status.value = 'break_running'
  }
  intervalId = setInterval(tick, 1000)
}

/**
 * 重置到初始状态
 */
function reset(): void {
  clearTimer()
  status.value = 'idle'
  remaining.value = config.value.focusDuration
  totalDuration.value = config.value.focusDuration
}

/**
 * 跳过当前阶段
 */
function skip(): void {
  clearTimer()
  handlePhaseComplete()
}

/**
 * 开始休息
 */
function startBreak(): void {
  lastTick = Date.now()
  status.value = 'break_running'
  intervalId = setInterval(tick, 1000)
}

/**
 * 更新配置
 */
async function updateConfig(updates: Partial<TimerConfig>): Promise<void> {
  config.value = { ...config.value, ...updates }
  await saveConfig()

  // 如果在 idle 状态下修改了时长，同步更新 remaining
  if (status.value === 'idle') {
    remaining.value = config.value.focusDuration
    totalDuration.value = config.value.focusDuration
  }
}

/**
 * 设置当前关联任务
 */
function setCurrentTask(taskId: string | null): void {
  currentTaskId.value = taskId
}

/**
 * 注册事件回调
 */
function onTimerComplete(callback: (taskId?: string) => void): void {
  onComplete = callback
}

function onTimerBreakEnd(callback: () => void): void {
  onBreakEnd = callback
}

/**
 * useTimer composable — 返回模块级单例状态和方法
 */
export function useTimer() {
  return {
    // 状态
    status: readonly(status),
    remaining: readonly(remaining),
    totalDuration: readonly(totalDuration),
    currentPomodoro: readonly(currentPomodoro),
    config,

    // 计算属性（模块级单例）
    progress,
    formattedTime,
    isFocusing,
    isBreak,
    statusLabel,
    pomodoroInRound,

    // 操作
    start,
    pause,
    resume,
    reset,
    skip,
    startBreak,
    updateConfig,
    setCurrentTask,
    debugSkip,

    // 事件
    onTimerComplete,
    onTimerBreakEnd,
  }
}
