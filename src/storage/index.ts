import type { StorageAdapter } from './adapter'
import { indexedDBAdapter } from './indexeddb'
import { isTauri } from '@/utils/platform'

let _adapter: StorageAdapter | null = null
let _initPromise: Promise<StorageAdapter> | null = null

/**
 * 异步初始化存储适配器（单例，只执行一次）
 */
function initStorage(): Promise<StorageAdapter> {
  if (_adapter) return Promise.resolve(_adapter)
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    if (isTauri()) {
      try {
        const { sqliteAdapter } = await import('./sqlite')
        _adapter = sqliteAdapter
        console.log('[Storage] 使用 SQLite 适配器')
      } catch (e) {
        console.error('[Storage] SQLite 加载失败，回退到 IndexedDB:', e)
        _adapter = indexedDBAdapter
      }
    } else {
      _adapter = indexedDBAdapter
      console.log('[Storage] 使用 IndexedDB 适配器')
    }
    return _adapter
  })()

  return _initPromise
}

/**
 * 包装器 — 每个方法显式转发，不使用 Proxy
 */
export const storage: StorageAdapter = {
  async get<T>(table: string, key: string): Promise<T | undefined> {
    const adapter = await initStorage()
    return adapter.get<T>(table, key)
  },

  async set<T>(table: string, key: string, value: T): Promise<void> {
    const adapter = await initStorage()
    return adapter.set<T>(table, key, value)
  },

  async delete(table: string, key: string): Promise<void> {
    const adapter = await initStorage()
    return adapter.delete(table, key)
  },

  async insert<T>(table: string, item: T): Promise<void> {
    const adapter = await initStorage()
    return adapter.insert<T>(table, item)
  },

  async updateById(table: string, id: string, updates: Record<string, unknown>): Promise<void> {
    const adapter = await initStorage()
    return adapter.updateById(table, id, updates)
  },

  async deleteById(table: string, id: string): Promise<void> {
    const adapter = await initStorage()
    return adapter.deleteById(table, id)
  },

  async getAllSorted<T>(table: string, sortBy: string, desc?: boolean): Promise<T[]> {
    const adapter = await initStorage()
    return adapter.getAllSorted<T>(table, sortBy, desc)
  },

  async clear(table: string): Promise<void> {
    const adapter = await initStorage()
    return adapter.clear(table)
  },
}
