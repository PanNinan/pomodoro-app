/** 计时器状态 */
export type TimerStatus =
  | 'idle'           // 等待开始
  | 'running'        // 专注中
  | 'paused'         // 专注暂停
  | 'break_idle'     // 休息等待
  | 'break_running'  // 休息中
  | 'break_paused'   // 休息暂停

/** 计时器状态数据 */
export interface TimerState {
  status: TimerStatus
  remaining: number          // 剩余秒数
  totalDuration: number      // 当前阶段总时长（秒）
  currentPomodoro: number    // 当前是第几个番茄（从 1 开始）
}

/** 计时器配置 */
export interface TimerConfig {
  focusDuration: number        // 专注时长（秒），默认 25 * 60
  shortBreakDuration: number   // 短休息时长（秒），默认 5 * 60
  longBreakDuration: number    // 长休息时长（秒），默认 15 * 60
  longBreakInterval: number    // 每几个番茄一次长休息，默认 4
  autoStartBreak: boolean      // 休息是否自动开始
  autoStartPomodoro: boolean   // 番茄是否自动开始
  soundEnabled: boolean        // 提示音是否开启
}

/** 任务状态 */
export type TaskStatus = 'todo' | 'doing' | 'done'

/** 任务优先级 */
export type TaskPriority = 'low' | 'medium' | 'high'

/** 任务数据模型 */
export interface Task {
  id: string
  title: string
  description?: string
  pomodoroEstimate: number     // 预估番茄数
  pomodoroActual: number       // 实际完成番茄数
  status: TaskStatus
  priority: TaskPriority
  tags: string[]
  createdAt: string            // ISO 日期
  completedAt?: string         // ISO 日期
  order: number                // 排序序号
}

/** 番茄完成记录 */
export interface PomodoroRecord {
  id: string
  taskId?: string              // 关联的任务 ID
  startedAt: string            // ISO 日期时间
  endedAt: string              // ISO 日期时间
  duration: number             // 实际专注秒数
  completed: boolean           // 是否完整完成
  tag?: string                 // 标签
}

/** 每日统计 */
export interface DailyStats {
  date: string                 // "YYYY-MM-DD"
  pomodoroCount: number
  totalMinutes: number
  completedTasks: number
}
