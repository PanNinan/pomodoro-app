<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useDialog } from 'naive-ui'
import { isTauri } from '@/utils/platform'

const dialog = useDialog()

let unlisten: (() => void) | null = null

onMounted(async () => {
  if (!isTauri()) return

  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  const { listen } = await import('@tauri-apps/api/event')

  const appWindow = getCurrentWindow()

  unlisten = await listen('close-requested', () => {
    dialog.warning({
      title: '关闭番茄时钟',
      content: '你希望怎么处理？',
      positiveText: '最小化到托盘',
      negativeText: '直接退出',
      onPositiveClick: async () => {
        await appWindow.hide()
      },
      onNegativeClick: async () => {
        await appWindow.destroy()
      },
    })
  })
})

onUnmounted(() => { unlisten?.() })
</script>

<template />
