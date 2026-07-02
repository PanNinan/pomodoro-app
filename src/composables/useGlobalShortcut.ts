import { ref, readonly } from 'vue'
import { isTauri } from '@/utils/platform'

const registered = ref(false)

/**
 * 注册全局快捷键
 */
async function registerShortcuts(handlers: {
  onStartPause?: () => void
  onReset?: () => void
}): Promise<void> {
  if (!isTauri()) return

  try {
    const { register } = await import('@tauri-apps/plugin-global-shortcut')

    // Ctrl+Shift+P 开始/暂停
    if (handlers.onStartPause) {
      await register('CommandOrControl+Shift+P', (event) => {
        if (event.state === 'Released') {
          handlers.onStartPause?.()
        }
      })
    }

    // Ctrl+Shift+R 重置
    if (handlers.onReset) {
      await register('CommandOrControl+Shift+R', (event) => {
        if (event.state === 'Released') {
          handlers.onReset?.()
        }
      })
    }

    registered.value = true
  } catch (e) {
    console.warn('Global shortcut registration failed:', e)
  }
}

/**
 * 注销全局快捷键
 */
async function unregisterShortcuts(): Promise<void> {
  if (!isTauri()) return

  try {
    const { unregister } = await import('@tauri-apps/plugin-global-shortcut')
    await unregister('CommandOrControl+Shift+P')
    await unregister('CommandOrControl+Shift+R')
    registered.value = false
  } catch (e) {
    console.warn('Global shortcut unregister failed:', e)
  }
}

/**
 * useGlobalShortcut composable
 */
export function useGlobalShortcut() {
  return {
    registered: readonly(registered),
    registerShortcuts,
    unregisterShortcuts,
  }
}
