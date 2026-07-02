import { format } from 'date-fns'

/**
 * 获取今天的日期字符串 "YYYY-MM-DD"
 */
export function today(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/**
 * ISO 字符串转本地日期字符串
 */
export function formatDate(iso: string): string {
  return format(new Date(iso), 'yyyy-MM-dd')
}

/**
 * ISO 字符串转本地日期时间字符串
 */
export function formatDateTime(iso: string): string {
  return format(new Date(iso), 'yyyy-MM-dd HH:mm')
}

/**
 * 获取当前 ISO 时间戳
 */
export function nowISO(): string {
  return new Date().toISOString()
}
