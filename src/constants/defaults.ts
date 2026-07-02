import type { TimerConfig } from '@/types'

/** 默认计时器配置 */
export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  longBreakInterval: 4,
  autoStartBreak: false,
  autoStartPomodoro: false,
  soundEnabled: true,
}

/** 存储键名 */
export const STORAGE_KEYS = {
  TIMER_CONFIG: 'pomodoro:timer_config',
  AUDIO_CONFIG: 'pomodoro:audio_config',
  THEME: 'pomodoro:theme',
} as const

/** 导航菜单项 */
export const NAV_ITEMS = [
  { key: 'timer', label: '专注', icon: 'mdi:timer', route: '/' },
  { key: 'tasks', label: '任务', icon: 'mdi:checkbox-marked-outline', route: '/tasks' },
  { key: 'stats', label: '统计', icon: 'mdi:chart-line', route: '/stats' },
  { key: 'settings', label: '设置', icon: 'mdi:cog-outline', route: '/settings' },
] as const
