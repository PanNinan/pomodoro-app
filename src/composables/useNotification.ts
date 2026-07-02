import { ref, readonly } from 'vue'
import { isTauri } from '@/utils/platform'

type NotificationPermission = 'default' | 'granted' | 'denied'

const permission = ref<NotificationPermission>('default')
const isDesktop = ref(false)

/**
 * 初始化：检测平台并请求权限
 */
async function init(): Promise<void> {
  isDesktop.value = isTauri()

  if (isDesktop.value) {
    // Tauri 环境：使用原生通知插件
    try {
      const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification')
      const granted = await isPermissionGranted()
      if (granted) {
        permission.value = 'granted'
      } else {
        const result = await requestPermission()
        permission.value = result === 'granted' ? 'granted' : 'denied'
      }
    } catch (e) {
      console.warn('Tauri notification init failed:', e)
    }
  } else {
    // 浏览器环境
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        permission.value = 'granted'
      }
    }
  }
}

/**
 * 请求通知权限
 */
async function requestPermission(): Promise<boolean> {
  if (isDesktop.value) {
    try {
      const { requestPermission: req, isPermissionGranted } = await import('@tauri-apps/plugin-notification')
      const granted = await isPermissionGranted()
      if (granted) {
        permission.value = 'granted'
        return true
      }
      const result = await req()
      permission.value = result === 'granted' ? 'granted' : 'denied'
      return result === 'granted'
    } catch {
      return false
    }
  }

  // 浏览器环境
  if (!('Notification' in window)) {
    console.warn('当前浏览器不支持通知')
    return false
  }

  if (Notification.permission === 'granted') {
    permission.value = 'granted'
    return true
  }

  const result = await Notification.requestPermission()
  permission.value = result as NotificationPermission
  return result === 'granted'
}

/**
 * 发送通知（自动适配 Tauri / 浏览器）
 */
async function notify(title: string, body?: string): Promise<void> {
  if (isDesktop.value) {
    try {
      const { sendNotification } = await import('@tauri-apps/plugin-notification')
      sendNotification({ title, body })
    } catch (e) {
      console.warn('Tauri notify failed:', e)
    }
    return
  }

  // 浏览器环境
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const notification = new Notification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'pomodoro',
  })

  setTimeout(() => notification.close(), 5000)
}

/**
 * 专注完成通知
 * @param taskName - 如果任务刚好完成，传入任务名称
 */
async function notifyFocusComplete(taskName?: string): Promise<void> {
  if (taskName) {
    await notify(`🎉 ${taskName} 任务完成！`, '太棒了，休息一下吧～')
  } else {
    await notify('🍅 专注完成！', '休息一下吧，准备下一轮番茄～')
  }
}

/**
 * 休息结束通知
 */
async function notifyBreakEnd(): Promise<void> {
  await notify('⏰ 休息结束！', '准备开始下一个番茄，加油！')
}

/**
 * useNotification composable
 */
export function useNotification() {
  return {
    permission: readonly(permission),
    isDesktop: readonly(isDesktop),
    init,
    requestPermission,
    notify,
    notifyFocusComplete,
    notifyBreakEnd,
  }
}
