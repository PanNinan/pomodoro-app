/**
 * 秒数格式化为 "MM:SS"
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * 秒数格式化为可读文本 "25分钟" / "1小时5分钟"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
  }
  return `${mins}分钟`
}

/**
 * 分钟数转秒数
 */
export function minutesToSeconds(minutes: number): number {
  return minutes * 60
}

/**
 * 秒数转分钟数（向下取整）
 */
export function secondsToMinutes(seconds: number): number {
  return Math.floor(seconds / 60)
}
