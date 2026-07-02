import type { StorageAdapter } from './adapter'
import { indexedDBAdapter } from './indexeddb'
import { isTauri } from '@/utils/platform'

let _adapter: StorageAdapter | null = null

/**
 * 异步初始化存储适配器（仅首次调用执行，后续返回缓存）
 */
async function initStorage(): Promise<StorageAdapter> {
  if (_adapter) return _adapter

  if (isTauri()) {
    const { sqliteAdapter } = await import('./sqlite')
    _adapter = sqliteAdapter
  } else {
    _adapter = indexedDBAdapter
  }

  return _adapter
}

/**
 * 代理对象 — 将所有调用转发给异步初始化后的适配器
 * 外部使用方式不变：storage.get(...) / storage.insert(...) 等
 */
export const storage: StorageAdapter = new Proxy({} as StorageAdapter, {
  get(_target, prop: keyof StorageAdapter) {
    return (...args: unknown[]) =>
      initStorage().then((adapter) => (adapter[prop] as Function).apply(adapter, args))
  },
})
