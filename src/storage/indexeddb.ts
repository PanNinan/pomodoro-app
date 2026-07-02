import Dexie, { type Table } from 'dexie'
import type { StorageAdapter } from './adapter'
import type { Task, PomodoroRecord } from '@/types'

/**
 * 番茄时钟 IndexedDB 数据库
 */
class PomodoroDB extends Dexie {
  tasks!: Table<Task, string>
  records!: Table<PomodoroRecord, string>
  settings!: Table<{ key: string; value: unknown }, string>

  constructor() {
    super('PomodoroDB')
    this.version(2).stores({
      tasks: 'id, status, createdAt, order, *tags',
      records: 'id, taskId, startedAt, endedAt, tag',
      settings: 'key',
    })
  }
}

const db = new PomodoroDB()

/**
 * IndexedDB 存储适配器实现
 */
export const indexedDBAdapter: StorageAdapter = {
  // ─── KV ───

  async get<T>(_table: string, key: string): Promise<T | undefined> {
    const row = await db.settings.get(key)
    return row?.value as T | undefined
  },

  async set<T>(_table: string, key: string, value: T): Promise<void> {
    await db.settings.put({ key, value })
  },

  async delete(_table: string, key: string): Promise<void> {
    await db.settings.delete(key)
  },

  // ─── 表级操作 ───

  async insert<T>(table: string, item: T): Promise<void> {
    const t = db.tables.find((t) => t.name === table)
    if (t) await t.add(item)
  },

  async updateById(table: string, id: string, updates: Record<string, unknown>): Promise<void> {
    const t = db.tables.find((t) => t.name === table)
    if (t) await t.update(id, updates)
  },

  async deleteById(table: string, id: string): Promise<void> {
    const t = db.tables.find((t) => t.name === table)
    if (t) await t.delete(id)
  },

  async getAllSorted<T>(table: string, sortBy: string, desc = false): Promise<T[]> {
    const t = db.tables.find((t) => t.name === table)
    if (!t) return []
    let collection = t.orderBy(sortBy)
    if (desc) collection = collection.reverse()
    return collection.toArray() as Promise<T[]>
  },

  async clear(table: string): Promise<void> {
    const t = db.tables.find((t) => t.name === table)
    if (t) await t.clear()
  },
}

/** 导出 db 实例，仅在需要 Dexie 特有能力时使用 */
export { db }
