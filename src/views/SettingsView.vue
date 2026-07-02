<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTimer } from '@/composables/useTimer'
import { useNotification } from '@/composables/useNotification'
import { useTheme } from '@/composables/useTheme'
import { useStatsStore } from '@/stores/stats'
import { useTaskStore } from '@/stores/task'
import { secondsToMinutes, minutesToSeconds } from '@/utils/time'
import { isTauri } from '@/utils/platform'

const { config, updateConfig } = useTimer()
const { requestPermission, permission, isDesktop } = useNotification()
const { mode: themeMode, isDark, setMode } = useTheme()
const statsStore = useStatsStore()
const taskStore = useTaskStore()

// 本地编辑用的分钟数
const focusMinutes = ref(secondsToMinutes(config.value.focusDuration))
const shortBreakMinutes = ref(secondsToMinutes(config.value.shortBreakDuration))
const longBreakMinutes = ref(secondsToMinutes(config.value.longBreakDuration))
const longBreakInterval = ref(config.value.longBreakInterval)
const autoStartBreak = ref(config.value.autoStartBreak)
const autoStartPomodoro = ref(config.value.autoStartPomodoro)
const soundEnabled = ref(config.value.soundEnabled)

// 主题选项
const themeOptions = [
  { label: '跟随系统', value: 'system' },
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
]

// 同步配置
watch(
  [focusMinutes, shortBreakMinutes, longBreakMinutes, longBreakInterval, autoStartBreak, autoStartPomodoro, soundEnabled],
  () => {
    updateConfig({
      focusDuration: minutesToSeconds(focusMinutes.value),
      shortBreakDuration: minutesToSeconds(shortBreakMinutes.value),
      longBreakDuration: minutesToSeconds(longBreakMinutes.value),
      longBreakInterval: longBreakInterval.value,
      autoStartBreak: autoStartBreak.value,
      autoStartPomodoro: autoStartPomodoro.value,
      soundEnabled: soundEnabled.value,
    })
  },
  { deep: true }
)

async function handleRequestPermission() {
  await requestPermission()
}

async function handleClearRecords() {
  const { storage } = await import('@/storage')
  await storage.clear('records')
  await statsStore.loadRecords()
}

async function handleClearTasks() {
  const { storage } = await import('@/storage')
  await storage.clear('tasks')
  await taskStore.loadTasks()
}
</script>

<template>
  <div class="settings-view">
    <h1>设置</h1>

    <!-- 时长配置 -->
    <n-card title="⏱️ 时长配置" size="small" class="settings-view__card">
      <n-form label-placement="left" label-width="120">
        <n-form-item label="专注时长">
          <n-input-number v-model:value="focusMinutes" :min="1" :max="120" :step="5">
            <template #suffix>分钟</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="短休息时长">
          <n-input-number v-model:value="shortBreakMinutes" :min="1" :max="30">
            <template #suffix>分钟</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="长休息时长">
          <n-input-number v-model:value="longBreakMinutes" :min="1" :max="60">
            <template #suffix>分钟</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="长休息间隔">
          <n-input-number v-model:value="longBreakInterval" :min="2" :max="10">
            <template #suffix>个番茄</template>
          </n-input-number>
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 自动化配置 -->
    <n-card title="🔄 自动化" size="small" class="settings-view__card">
      <n-form label-placement="left" label-width="120">
        <n-form-item label="自动开始休息">
          <n-switch v-model:value="autoStartBreak" />
        </n-form-item>
        <n-form-item label="自动开始番茄">
          <n-switch v-model:value="autoStartPomodoro" />
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 外观配置 -->
    <n-card title="🎨 外观" size="small" class="settings-view__card">
      <n-form label-placement="left" label-width="120">
        <n-form-item label="主题模式">
          <n-radio-group v-model:value="themeMode" @update:value="setMode">
            <n-radio-button
              v-for="opt in themeOptions"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
            />
          </n-radio-group>
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 通知配置 -->
    <n-card title="🔔 通知" size="small" class="settings-view__card">
      <n-form label-placement="left" label-width="120">
        <n-form-item label="提示音">
          <n-switch v-model:value="soundEnabled" />
        </n-form-item>
        <n-form-item label="系统通知">
          <div style="display: flex; align-items: center; gap: 12px;">
            <n-tag :type="permission === 'granted' ? 'success' : 'warning'" size="small">
              {{ permission === 'granted' ? '已授权' : '未授权' }}
            </n-tag>
            <n-tag v-if="isDesktop" type="info" size="small" :bordered="false">
              桌面原生通知
            </n-tag>
            <n-button
              v-if="permission !== 'granted'"
              size="small"
              @click="handleRequestPermission"
            >
              请求授权
            </n-button>
          </div>
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 桌面端信息 -->
    <n-card v-if="isTauri()" title="🖥️ 桌面端" size="small" class="settings-view__card">
      <n-form label-placement="left" label-width="120">
        <n-form-item label="全局快捷键">
          <div style="color: var(--n-text-color-3); font-size: 13px;">
            <div>Ctrl+Shift+P — 开始/暂停</div>
            <div>Ctrl+Shift+R — 重置</div>
          </div>
        </n-form-item>
        <n-form-item label="系统托盘">
          <n-tag type="success" size="small">已启用</n-tag>
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 数据管理 -->
    <n-card title="🗂️ 数据管理" size="small" class="settings-view__card">
      <n-form label-placement="left" label-width="120">
        <n-form-item label="番茄记录">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: var(--n-text-color-3); font-size: 13px;">
              共 {{ statsStore.records.length }} 条
            </span>
            <n-popconfirm @positive-click="handleClearRecords">
              <template #trigger>
                <n-button size="small" type="error" quaternary>清除所有记录</n-button>
              </template>
              清除后统计数据将清空，任务不受影响。确认？
            </n-popconfirm>
          </div>
        </n-form-item>
        <n-form-item label="任务数据">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: var(--n-text-color-3); font-size: 13px;">
              共 {{ taskStore.tasks.length }} 个任务
            </span>
            <n-popconfirm @positive-click="handleClearTasks">
              <template #trigger>
                <n-button size="small" type="error" quaternary>清除所有任务</n-button>
              </template>
              所有任务将被删除，确认？
            </n-popconfirm>
          </div>
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 关于 -->
    <n-card title="ℹ️ 关于" size="small" class="settings-view__card">
      <div style="color: var(--n-text-color-3); font-size: 14px;">
        <p>番茄时钟 v0.1.0</p>
        <p>基于 Vue 3 + TypeScript + Naive UI + Tauri 构建</p>
      </div>
    </n-card>
  </div>
</template>

<style scoped>
.settings-view {
  max-width: 600px;
  margin: 0 auto;
}

.settings-view h1 {
  margin: 0 0 24px;
  font-size: 24px;
}

.settings-view__card {
  margin-bottom: 16px;
}
</style>
