/**
 * 存储适配器接口
 * Web 端用 IndexedDB，桌面端用 SQLite
 */
export interface StorageAdapter {
  // ─── KV 存储（settings 等配置项） ───

  /** 获取单个值 */
  get<T>(table: string, key: string): Promise<T | undefined>

  /** 设置单个值（upsert） */
  set<T>(table: string, key: string, value: T): Promise<void>

  /** 删除单个值 */
  delete(table: string, key: string): Promise<void>

  // ─── 表级操作（tasks / records 等） ───

  /** 插入一条记录 */
  insert<T>(table: string, item: T): Promise<void>

  /** 按 ID 更新部分字段 */
  updateById(table: string, id: string, updates: Record<string, unknown>): Promise<void>

  /** 按 ID 删除 */
  deleteById(table: string, id: string): Promise<void>

  /** 获取所有记录，可指定排序字段和方向 */
  getAllSorted<T>(table: string, sortBy: string, desc?: boolean): Promise<T[]>

  /** 清空某个表 */
  clear(table: string): Promise<void>
}
