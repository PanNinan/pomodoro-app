import { ref } from 'vue'
import { storage } from '@/storage'

const SETTINGS_KEY = 'pomodoro:ui_settings'

interface UISettings {
  showCalendar: boolean
}

const DEFAULTS: UISettings = {
  showCalendar: true,
}

const settings = ref<UISettings>({ ...DEFAULTS })
let _loaded = false

async function loadSettings(): Promise<void> {
  if (_loaded) return
  try {
    const saved = await storage.get<UISettings>('settings', SETTINGS_KEY)
    if (saved) settings.value = { ...DEFAULTS, ...saved }
    _loaded = true
  } catch {
    // 忽略
  }
}

async function saveSettings(): Promise<void> {
  try {
    await storage.set('settings', SETTINGS_KEY, { ...settings.value })
  } catch {
    // 忽略
  }
}

function updateSetting<K extends keyof UISettings>(key: K, value: UISettings[K]): void {
  settings.value[key] = value
  saveSettings()
}

export function useSettings() {
  // 首次调用时加载
  loadSettings()

  return {
    settings,
    updateSetting,
  }
}
