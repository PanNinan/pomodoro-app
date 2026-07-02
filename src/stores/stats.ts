import { defineStore } from 'pinia'
import { ref, computed, readonly, toRaw } from 'vue'
import type { PomodoroRecord, DailyStats } from '@/types'
import { storage } from '@/storage'
import { generateId } from '@/utils/uuid'
import { today } from '@/utils/date'
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, eachWeekOfInterval } from 'date-fns'

const TABLE = 'records'

export const useStatsStore = defineStore('stats', () => {
  const records = ref<PomodoroRecord[]>([])
  const loading = ref(false)

  // 从数据库加载记录
  async function loadRecords(): Promise<void> {
    loading.value = true
    try {
      records.value = await storage.getAllSorted<PomodoroRecord>(TABLE, 'startedAt', true)
    } finally {
      loading.value = false
    }
  }

  // 添加记录
  async function addRecord(
    data: Omit<PomodoroRecord, 'id'>
  ): Promise<PomodoroRecord> {
    const record: PomodoroRecord = {
      id: generateId(),
      ...data,
    }
    await storage.insert(TABLE, toRaw(record))
    records.value.unshift(record)
    return record
  }

  // 获取指定日期的统计
  function getDailyStats(date: string): DailyStats {
    const dayRecords = records.value.filter(
      (r) => format(new Date(r.startedAt), 'yyyy-MM-dd') === date
    )
    const completedRecords = dayRecords.filter((r) => r.completed)
    const totalMinutes = Math.round(
      completedRecords.reduce((sum, r) => sum + r.duration, 0) / 60
    )
    return {
      date,
      pomodoroCount: completedRecords.length,
      totalMinutes,
      completedTasks: 0,
    }
  }

  // 今日统计
  const todayStats = computed(() => getDailyStats(today()))

  // 本周统计
  function getWeeklyStats(startDate: Date): DailyStats[] {
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(startDate, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    return days.map((day) => getDailyStats(format(day, 'yyyy-MM-dd')))
  }

  // 月度统计 — 按周汇总
  function getMonthlyStats(year: number, month: number): { weeks: string[]; pomodoros: number[]; minutes: number[] } {
    const monthStart = startOfMonth(new Date(year, month - 1))
    const monthEnd = endOfMonth(monthStart)
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 })

    const result = { weeks: [] as string[], pomodoros: [] as number[], minutes: [] as number[] }

    for (const weekStart of weeks) {
      const weekEnd2 = endOfWeek(weekStart, { weekStartsOn: 1 })
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd2 })
      let totalPomodoros = 0
      let totalMinutes = 0
      for (const day of days) {
        const stats = getDailyStats(format(day, 'yyyy-MM-dd'))
        totalPomodoros += stats.pomodoroCount
        totalMinutes += stats.totalMinutes
      }
      result.weeks.push(`第${weeks.indexOf(weekStart) + 1}周`)
      result.pomodoros.push(totalPomodoros)
      result.minutes.push(totalMinutes)
    }

    return result
  }

  // 连续专注天数
  const streak = computed(() => {
    let count = 0
    let checkDate = new Date()
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd')
      const stats = getDailyStats(dateStr)
      if (stats.pomodoroCount === 0) break
      count++
      checkDate = subDays(checkDate, 1)
    }
    return count
  })

  // 趋势数据（最近 N 天）
  function getTrendData(days: number = 7): { dates: string[]; minutes: number[] } {
    const result: { dates: string[]; minutes: number[] } = { dates: [], minutes: [] }
    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
      const stats = getDailyStats(date)
      result.dates.push(format(subDays(new Date(), i), 'MM/dd'))
      result.minutes.push(stats.totalMinutes)
    }
    return result
  }

  // 标签分布 — 按任务去重，每个标签统计的是"有多少个任务使用了该标签"
  const tagDistribution = computed(() => {
    const tagTaskMap = new Map<string, Set<string>>()
    records.value
      .filter((r) => r.completed && r.tag && r.taskId)
      .forEach((r) => {
        const tag = r.tag!
        if (!tagTaskMap.has(tag)) tagTaskMap.set(tag, new Set())
        tagTaskMap.get(tag)!.add(r.taskId!)
      })
    return Array.from(tagTaskMap.entries()).map(([name, taskIds]) => ({
      name,
      value: taskIds.size,
    }))
  })

  // 打卡热力图数据（最近 365 天）
  const heatmapData = computed(() => {
    const result: [string, number][] = []
    for (let i = 364; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
      const stats = getDailyStats(date)
      result.push([date, stats.pomodoroCount])
    }
    return result
  })

  return {
    records: readonly(records),
    loading: readonly(loading),
    todayStats,
    streak,
    tagDistribution,
    heatmapData,
    loadRecords,
    addRecord,
    getDailyStats,
    getWeeklyStats,
    getMonthlyStats,
    getTrendData,
  }
})
