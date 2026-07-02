/**
 * 测试数据生成器 — 填充一年的番茄记录和任务数据
 *
 * 使用方式（浏览器/Tauri 控制台）：
 *   await __seedData()
 *
 * 清除全部数据：
 *   await __clearAllData()
 */
import { storage } from '@/storage'
import type { Task, PomodoroRecord, TaskPriority } from '@/types'
import { format, subDays, addHours, addMinutes } from 'date-fns'

// ─── 配置 ───

const TAGS = ['工作', '学习', '阅读', '运动', '写作', '编程', '设计', '英语']
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']
const TASK_TEMPLATES = [
  { title: '完成项目方案', estimate: 6, tags: ['工作', '设计'] },
  { title: '阅读《深入理解计算机系统》', estimate: 8, tags: ['阅读', '学习'] },
  { title: 'LeetCode 刷题', estimate: 4, tags: ['编程', '学习'] },
  { title: '写技术博客', estimate: 3, tags: ['写作', '编程'] },
  { title: '英语听力练习', estimate: 2, tags: ['英语', '学习'] },
  { title: '前端框架调研', estimate: 5, tags: ['编程', '工作'] },
  { title: '每日运动打卡', estimate: 1, tags: ['运动'] },
  { title: '整理读书笔记', estimate: 2, tags: ['阅读', '学习'] },
  { title: '设计系统组件库', estimate: 10, tags: ['设计', '编程'] },
  { title: '学习 Rust 编程', estimate: 6, tags: ['编程', '学习'] },
  { title: '周报撰写', estimate: 1, tags: ['工作', '写作'] },
  { title: '代码 Review', estimate: 2, tags: ['工作', '编程'] },
  { title: '产品需求分析', estimate: 3, tags: ['工作'] },
  { title: '学习算法导论', estimate: 8, tags: ['学习', '编程'] },
  { title: '健身训练计划', estimate: 2, tags: ['运动'] },
  { title: '团队分享准备', estimate: 4, tags: ['工作', '写作'] },
  { title: 'Vue 3 源码阅读', estimate: 5, tags: ['编程', '阅读'] },
  { title: '英语口语练习', estimate: 3, tags: ['英语'] },
  { title: '项目文档编写', estimate: 3, tags: ['工作', '写作'] },
  { title: '数据库优化', estimate: 4, tags: ['编程', '工作'] },
]

// ─── 工具函数 ───

function randomId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── 生成任务 ───

function generateTasks(): Task[] {
  return TASK_TEMPLATES.map((t, i) => {
    const status = i < 4 ? 'doing' : i < 10 ? 'todo' : 'done'
    const actual = status === 'done' ? t.estimate : status === 'doing' ? randomInt(0, t.estimate - 1) : 0

    return {
      id: randomId(),
      title: t.title,
      description: `${t.title}的详细描述`,
      pomodoroEstimate: t.estimate,
      pomodoroActual: actual,
      status,
      priority: randomPick(PRIORITIES),
      tags: t.tags,
      createdAt: subDays(new Date(), randomInt(30, 365)).toISOString(),
      completedAt: status === 'done' ? subDays(new Date(), randomInt(1, 30)).toISOString() : undefined,
      order: i,
    }
  })
}

// ─── 生成番茄记录 ───

function generateRecords(tasks: Task[]): PomodoroRecord[] {
  const records: PomodoroRecord[] = []
  const now = new Date()

  // 活跃任务（doing + done）
  const activeTasks = tasks.filter((t) => t.status === 'doing' || t.status === 'done')

  for (let dayOffset = 365; dayOffset >= 0; dayOffset--) {
    const day = subDays(now, dayOffset)
    const dayOfWeek = day.getDay()

    // 周末少做，工作日多做
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const pomodoroCount = isWeekend ? randomInt(0, 4) : randomInt(2, 8)

    // 30% 的概率完全休息（模拟偶尔摸鱼）
    if (Math.random() < 0.3 && dayOffset > 7) continue

    for (let j = 0; j < pomodoroCount; j++) {
      // 模拟一天中的工作时间段（9-12, 14-18, 20-22）
      const hourSlots = [9, 10, 11, 14, 15, 16, 17, 20, 21]
      const hour = randomPick(hourSlots)
      const minute = randomInt(0, 59)

      const startTime = addMinutes(addHours(day, hour), minute)
      const duration = randomInt(23 * 60, 27 * 60) // 23~27 分钟
      const endTime = new Date(startTime.getTime() + duration * 1000)

      // 随机关联一个活跃任务
      const task = activeTasks.length > 0 && Math.random() < 0.7
        ? randomPick(activeTasks)
        : undefined

      records.push({
        id: randomId(),
        taskId: task?.id,
        startedAt: startTime.toISOString(),
        endedAt: endTime.toISOString(),
        duration,
        completed: Math.random() > 0.05, // 95% 完成率
        tag: task?.tags?.[0] ?? randomPick(TAGS),
      })
    }
  }

  // 按时间正序
  records.sort((a, b) => a.startedAt.localeCompare(b.startedAt))
  return records
}

// ─── 主函数 ───

/**
 * 填充一年的测试数据（已有数据时跳过）
 */
export async function seedTestData(): Promise<{ tasks: number; records: number }> {
  // 检查是否已有数据
  const existing = await storage.getAllSorted('records', 'startedAt')
  if (existing.length > 0) {
    console.log(`[Seed] 已有 ${existing.length} 条记录，跳过填充。如需重新生成请先执行 __clearAllData()`)
    return { tasks: 0, records: 0 }
  }

  console.log('[Seed] 开始生成测试数据...')

  const tasks = generateTasks()
  const records = generateRecords(tasks)

  console.log(`[Seed] 生成 ${tasks.length} 个任务, ${records.length} 条记录`)

  // 写入任务
  for (const task of tasks) {
    await storage.insert('tasks', task)
  }
  console.log(`[Seed] 任务写入完成`)

  // 写入记录（分批，每批 100 条）
  const BATCH = 100
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH)
    for (const record of batch) {
      await storage.insert('records', record)
    }
    console.log(`[Seed] 记录写入 ${Math.min(i + BATCH, records.length)}/${records.length}`)
  }

  console.log('[Seed] ✅ 测试数据填充完成')
  return { tasks: tasks.length, records: records.length }
}

/**
 * 清除所有数据
 */
export async function clearAllData(): Promise<void> {
  await storage.clear('tasks')
  await storage.clear('records')
  await storage.clear('settings')
  console.log('[Seed] 🗑️ 所有数据已清除')
}

// ─── 手动激活（控制台调用） ───
// 用法：
//   1. 在控制台执行: import('@/utils/seed').then(m => m.activateSeed())
//   2. 然后: await __seedData() 或 await __clearAllData()

export function activateSeed(): void {
  if (typeof window !== 'undefined') {
    (window as any).__seedData = seedTestData
    (window as any).__clearAllData = clearAllData
    console.log('[Seed] ✅ 已激活。可用命令: __seedData() / __clearAllData()')
  }
}
