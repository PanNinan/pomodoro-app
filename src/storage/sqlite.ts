import Database from '@tauri-apps/plugin-sql'
import type { StorageAdapter } from './adapter'

let db: Database | null = null

/**
 * 初始化 SQLite 数据库，创建表结构
 */
async function initDB(): Promise<Database> {
  if (db) return db

  db = await Database.load('sqlite:pomodoro.db')

  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id                TEXT PRIMARY KEY,
      title             TEXT NOT NULL,
      description       TEXT,
      pomodoroEstimate  INTEGER NOT NULL DEFAULT 4,
      pomodoroActual    INTEGER NOT NULL DEFAULT 0,
      status            TEXT NOT NULL DEFAULT 'todo',
      priority          TEXT NOT NULL DEFAULT 'medium',
      tags              TEXT NOT NULL DEFAULT '[]',
      createdAt         TEXT NOT NULL,
      completedAt       TEXT,
      sort_order        INTEGER NOT NULL DEFAULT 0
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS records (
      id         TEXT PRIMARY KEY,
      taskId     TEXT,
      startedAt  TEXT NOT NULL,
      endedAt    TEXT NOT NULL,
      duration   INTEGER NOT NULL,
      completed  INTEGER NOT NULL DEFAULT 1,
      tag        TEXT
    )
  `)

  return db
}

/**
 * SQLite 存储适配器实现
 */
export const sqliteAdapter: StorageAdapter = {
  // ─── KV ───

  async get<T>(_table: string, key: string): Promise<T | undefined> {
    const db = await initDB()
    const rows = await db.select<{ value: string }[]>(
      'SELECT value FROM settings WHERE key = $1',
      [key]
    )
    if (rows.length === 0) return undefined
    return JSON.parse(rows[0].value) as T
  },

  async set<T>(_table: string, key: string, value: T): Promise<void> {
    const db = await initDB()
    await db.execute(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2',
      [key, JSON.stringify(value)]
    )
  },

  async delete(_table: string, key: string): Promise<void> {
    const db = await initDB()
    await db.execute('DELETE FROM settings WHERE key = $1', [key])
  },

  // ─── 表级操作 ───

  async insert<T>(table: string, item: T): Promise<void> {
    const db = await initDB()
    const data = item as Record<string, unknown>
    const keys = Object.keys(data)

    // tasks 表的 order 字段映射为 sort_order（order 是 SQL 保留字）
    const columns = keys.map((k) => (k === 'order' ? 'sort_order' : k))
    const placeholders = keys.map((_, i) => `$${i + 1}`)
    const values = keys.map((k) => {
      const v = data[k]
      if (typeof v === 'boolean') return v ? 1 : 0
      if (Array.isArray(v)) return JSON.stringify(v)
      if (v === undefined || v === null) return null
      return v
    })

    await db.execute(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
      values
    )
  },

  async updateById(table: string, id: string, updates: Record<string, unknown>): Promise<void> {
    const db = await initDB()
    const keys = Object.keys(updates)
    if (keys.length === 0) return

    const sets = keys.map((k, i) => {
      const col = k === 'order' ? 'sort_order' : k
      return `${col} = $${i + 1}`
    })
    const values = keys.map((k) => {
      const v = updates[k]
      if (typeof v === 'boolean') return v ? 1 : 0
      if (Array.isArray(v)) return JSON.stringify(v)
      if (v === undefined || v === null) return null
      return v
    })
    values.push(id)

    await db.execute(
      `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${keys.length + 1}`,
      values
    )
  },

  async deleteById(table: string, id: string): Promise<void> {
    const db = await initDB()
    await db.execute(`DELETE FROM ${table} WHERE id = $1`, [id])
  },

  async getAllSorted<T>(table: string, sortBy: string, desc = false): Promise<T[]> {
    const db = await initDB()
    const col = sortBy === 'order' ? 'sort_order' : sortBy
    const dir = desc ? 'DESC' : 'ASC'
    const rows = await db.select<Record<string, unknown>[]>(
      `SELECT * FROM ${table} ORDER BY ${col} ${dir}`
    )
    return rows.map((row) => {
      // sort_order → order 映射回去
      if ('sort_order' in row) {
        row.order = row.sort_order
        delete row.sort_order
      }
      // tags 字段反序列化
      if (typeof row.tags === 'string') {
        try { row.tags = JSON.parse(row.tags as string) } catch { row.tags = [] }
      }
      // completed 字段 → boolean（兼容旧数据 "true" 字符串和新数据 1/0 整数）
      if ('completed' in row) {
        const raw = row.completed
        row.completed = raw === 1 || raw === '1' || raw === true || raw === 'true'
      }
      return row as T
    })
  },

  async clear(table: string): Promise<void> {
    const db = await initDB()
    await db.execute(`DELETE FROM ${table}`)
  },
}
