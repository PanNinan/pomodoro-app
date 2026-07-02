/**
 * 检测当前是否在 Tauri 环境中
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * 检测当前是否在浏览器环境中
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}
