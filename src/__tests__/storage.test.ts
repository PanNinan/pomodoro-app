import { describe, it, expect, beforeEach } from 'vitest'
import type { StorageAdapter } from '@/storage/adapter'

/**
 * StorageAdapter 接口合规测试
 * 用内存实现验证接口契约，不依赖 IndexedDB / SQLite
 */
class MemoryAdapter implements StorageAdapter {
  private kv = new Map<string, unknown>()
  private tables = new Map<string, Map<string, unknown>>()

  private getTable(table: string) {
    if (!this.tables.has(table)) this.tables.set(table, new Map())
    return this.tables.get(table)!
  }

  async get<T>(_table: string, key: string): Promise<T | undefined> {
    return this.kv.get(key) as T | undefined
  }

  async set<T>(_table: string, key: string, value: T): Promise<void> {
    this.kv.set(key, value)
  }

  async delete(_table: string, key: string): Promise<void> {
    this.kv.delete(key)
  }

  async insert<T>(table: string, item: T): Promise<void> {
    const data = item as Record<string, unknown>
    this.getTable(table).set(data.id as string, item)
  }

  async updateById(table: string, id: string, updates: Record<string, unknown>): Promise<void> {
    const t = this.getTable(table)
    const existing = t.get(id) as Record<string, unknown> | undefined
    if (existing) {
      t.set(id, { ...existing, ...updates })
    }
  }

  async deleteById(table: string, id: string): Promise<void> {
    this.getTable(table).delete(id)
  }

  async getAllSorted<T>(table: string, sortBy: string, desc = false): Promise<T[]> {
    const items = Array.from(this.getTable(table).values()) as T[]
    return items.sort((a: any, b: any) => {
      const va = a[sortBy] ?? 0
      const vb = b[sortBy] ?? 0
      return desc ? (vb > va ? 1 : -1) : (va > vb ? 1 : -1)
    })
  }

  async clear(table: string): Promise<void> {
    this.getTable(table).clear()
  }
}

describe('StorageAdapter (MemoryAdapter)', () => {
  let adapter: MemoryAdapter

  beforeEach(() => {
    adapter = new MemoryAdapter()
  })

  describe('KV operations', () => {
    it('get returns undefined for missing key', async () => {
      expect(await adapter.get('settings', 'missing')).toBeUndefined()
    })

    it('set and get round-trips', async () => {
      await adapter.set('settings', 'theme', 'dark')
      expect(await adapter.get('settings', 'theme')).toBe('dark')
    })

    it('set overwrites existing value', async () => {
      await adapter.set('settings', 'theme', 'light')
      await adapter.set('settings', 'theme', 'dark')
      expect(await adapter.get('settings', 'theme')).toBe('dark')
    })

    it('delete removes key', async () => {
      await adapter.set('settings', 'theme', 'dark')
      await adapter.delete('settings', 'theme')
      expect(await adapter.get('settings', 'theme')).toBeUndefined()
    })

    it('stores objects', async () => {
      const config = { focusDuration: 1500, shortBreakDuration: 300 }
      await adapter.set('settings', 'timer', config)
      expect(await adapter.get('settings', 'timer')).toEqual(config)
    })
  })

  describe('Table operations', () => {
    const task = { id: 't1', title: '测试', order: 0, status: 'todo' }

    it('insert and getAllSorted', async () => {
      await adapter.insert('tasks', task)
      const all = await adapter.getAllSorted('tasks', 'order')
      expect(all).toHaveLength(1)
      expect(all[0]).toEqual(task)
    })

    it('updateById patches fields', async () => {
      await adapter.insert('tasks', task)
      await adapter.updateById('tasks', 't1', { status: 'doing' })
      const all = await adapter.getAllSorted('tasks', 'order')
      expect(all[0]).toMatchObject({ status: 'doing', title: '测试' })
    })

    it('deleteById removes item', async () => {
      await adapter.insert('tasks', task)
      await adapter.deleteById('tasks', 't1')
      expect(await adapter.getAllSorted('tasks', 'order')).toHaveLength(0)
    })

    it('clear removes all items', async () => {
      await adapter.insert('tasks', { ...task, id: 't1' })
      await adapter.insert('tasks', { ...task, id: 't2' })
      await adapter.clear('tasks')
      expect(await adapter.getAllSorted('tasks', 'order')).toHaveLength(0)
    })

    it('getAllSorted sorts ascending', async () => {
      await adapter.insert('tasks', { id: 't2', title: 'B', order: 2 })
      await adapter.insert('tasks', { id: 't1', title: 'A', order: 1 })
      const all = await adapter.getAllSorted<{ id: string; order: number }>('tasks', 'order')
      expect(all.map((t) => t.id)).toEqual(['t1', 't2'])
    })

    it('getAllSorted sorts descending', async () => {
      await adapter.insert('tasks', { id: 't1', title: 'A', order: 1 })
      await adapter.insert('tasks', { id: 't2', title: 'B', order: 2 })
      const all = await adapter.getAllSorted<{ id: string; order: number }>('tasks', 'order', true)
      expect(all.map((t) => t.id)).toEqual(['t2', 't1'])
    })
  })
})
