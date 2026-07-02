import { defineStore } from 'pinia'
import { ref, computed, watch, readonly, toRaw } from 'vue'
import type { PomodoroRecord, DailyStats } from '@/types'
import { storage } from '@/storage'
import { generateId } from '@/utils/uuid'
import { today } from '@/utils/date'
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, eachWeekOfInterval } from 'date-fns'

const TABLE = 'records'
let _loaded = false // 避免重复从 DB 加载

export const useStatsStore = defineStore('stats', () => {
  const records = ref<PomodoroRecord[]>([])
  const loading = ref(false)

  // ─── 预计算索引：按日期分组 ───
  // records 变化时自动重建，后续 getDailyStats 直接 O(1) 查表
  const dateIndex = ref<Map<string, { all: PomodoroRecord[]; completed: PomodoroRecord[] }>>(new Map())

  function rebuildDateIndex() {
    const map = new Map<string, { all: PomodoroRecord[]; completed: PomodoroRecord[] }>()
    for (const r of records.value) {
      const date = format(new Date(r.startedAt), 'yyyy-MM-dd')
      if (!map.has(date)) map.set(date, { all: [], completed: [] })
      const entry = map.get(date)!
      entry.all.push(r)
      if (r.completed) entry.completed.push(r)
    }
    dateIndex.value = map
  }

  // records 变化时自动重建索引
  watch(records, rebuildDateIndex, { immediate: true })

  // ─── 从数据库加载（只加载一次） ───
  async function loadRecords(): Promise<void> {
    if (_loaded && records.value.length > 0) return
    loading.value = true
    try {
      const data = await storage.getAllSorted<PomodoroRecord>(TABLE, 'startedAt', true)
      if (data.length > 0) {
        records.value = data
        _loaded = true
      }
    } catch (e) {
      console.error('[StatsStore] loadRecords 失败:', e)
    } finally {
      loading.value = false
    }
  }

  // ─── 清除所有记录 ───
  async function clearRecords(): Promise<void> {
    await storage.clear(TABLE)
    records.value = []
    _loaded = true
  }

  // ─── 添加记录 ───
  async function addRecord(data: Omit<PomodoroRecord, 'id'>): Promise<PomodoroRecord> {
    const record: PomodoroRecord = { id: generateId(), ...data }
    records.value.unshift(record)
    try {
      await storage.insert(TABLE, toRaw(record))
    } catch (e) {
      console.error('[StatsStore] addRecord 持久化失败:', e)
    }
    return record
  }

  // ─── 获取指定日期统计（O(1) 查表） ───
  function getDailyStats(date: string): DailyStats {
    const entry = dateIndex.value.get(date)
    if (!entry) return { date, pomodoroCount: 0, totalMinutes: 0, completedTasks: 0 }
    const totalMinutes = Math.round(
      entry.completed.reduce((sum, r) => sum + r.duration, 0) / 60
    )
    return { date, pomodoroCount: entry.completed.length, totalMinutes, completedTasks: 0 }
  }

  // ─── 今日统计 ───
  const todayStats = computed(() => getDailyStats(today()))

  // ─── 本周统计 ───
  function getWeeklyStats(startDate: Date): DailyStats[] {
    const days = eachDayOfInterval({
      start: startOfWeek(startDate, { weekStartsOn: 1 }),
      end: endOfWeek(startDate, { weekStartsOn: 1 }),
    })
    return days.map((d) => getDailyStats(format(d, 'yyyy-MM-dd')))
  }

  // ─── 月度统计 ───
  function getMonthlyStats(year: number, month: number) {
    const monthStart = startOfMonth(new Date(year, month - 1))
    const monthEnd = endOfMonth(monthStart)
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 })

    const result = { weeks: [] as string[], pomodoros: [] as number[], minutes: [] as number[] }
    for (let i = 0; i < weeks.length; i++) {
      const days = eachDayOfInterval({ start: weeks[i], end: endOfWeek(weeks[i], { weekStartsOn: 1 }) })
      let totalP = 0, totalM = 0
      for (const day of days) {
        const s = getDailyStats(format(day, 'yyyy-MM-dd'))
        totalP += s.pomodoroCount
        totalM += s.totalMinutes
      }
      result.weeks.push(`第${i + 1}周`)
      result.pomodoros.push(totalP)
      result.minutes.push(totalM)
    }
    return result
  }

  // ─── 连续专注天数 ───
  const streak = computed(() => {
    let count = 0
    const d = new Date()
    while (true) {
      const entry = dateIndex.value.get(format(d, 'yyyy-MM-dd'))
      if (!entry || entry.completed.length === 0) break
      count++
      d.setDate(d.getDate() - 1)
    }
    return count
  })

  // ─── 趋势数据 ───
  function getTrendData(days: number = 7) {
    const result = { dates: [] as string[], minutes: [] as number[] }
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(new Date(), i)
      result.dates.push(format(d, 'MM/dd'))
      result.minutes.push(getDailyStats(format(d, 'yyyy-MM-dd')).totalMinutes)
    }
    return result
  }

  // ─── 标签分布 ───
  const tagDistribution = computed(() => {
    const tagTaskMap = new Map<string, Set<string>>()
    for (const r of records.value) {
      if (r.completed && r.tag && r.taskId) {
        if (!tagTaskMap.has(r.tag)) tagTaskMap.set(r.tag, new Set())
        tagTaskMap.get(r.tag)!.add(r.taskId)
      }
    }
    return Array.from(tagTaskMap.entries()).map(([name, set]) => ({ name, value: set.size }))
  })

  // ─── 热力图数据（用 dateIndex O(1) 查表） ───
  const heatmapData = computed(() => {
    const result: [string, number][] = []
    for (let i = 364; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
      const entry = dateIndex.value.get(date)
      result.push([date, entry ? entry.completed.length : 0])
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
    clearRecords,
    addRecord,
    getDailyStats,
    getWeeklyStats,
    getMonthlyStats,
    getTrendData,
  }
})
