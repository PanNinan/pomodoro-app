import { ref, computed, watch } from 'vue'
import { STORAGE_KEYS } from '@/constants/defaults'
import { storage } from '@/storage'

type ThemeMode = 'light' | 'dark' | 'system'

const mode = ref<ThemeMode>('system')
const systemDark = ref(false)

function detectSystemTheme(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(dark: boolean): void {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}

async function loadTheme(): Promise<void> {
  try {
    const saved = await storage.get<string>('settings', STORAGE_KEYS.THEME)
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      mode.value = saved as ThemeMode
    }
  } catch {
    // 忽略
  }
}

async function saveTheme(): Promise<void> {
  try {
    await storage.set('settings', STORAGE_KEYS.THEME, mode.value)
  } catch {
    // 忽略
  }
}

async function init(): Promise<void> {
  await loadTheme()

  systemDark.value = detectSystemTheme()

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    systemDark.value = e.matches
  })

  applyTheme(isDark.value)
}

const isDark = computed(() => {
  if (mode.value === 'system') return systemDark.value
  return mode.value === 'dark'
})

function setMode(newMode: ThemeMode): void {
  mode.value = newMode
  saveTheme()
  applyTheme(isDark.value)
}

function toggle(): void {
  setMode(isDark.value ? 'light' : 'dark')
}

watch(isDark, (dark) => {
  applyTheme(dark)
})

export function useTheme() {
  return {
    mode,
    isDark,
    init,
    setMode,
    toggle,
  }
}
