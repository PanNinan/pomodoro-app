<script setup lang="ts">
import { computed } from 'vue'
import { useTimer } from '@/composables/useTimer'

const props = defineProps<{
  size?: number
  strokeWidth?: number
}>()

const { progress, isFocusing, isBreak } = useTimer()

const size = computed(() => props.size ?? 280)
const strokeWidth = computed(() => props.strokeWidth ?? 8)
const radius = computed(() => (size.value - strokeWidth.value) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => circumference.value * (1 - progress.value))
const center = computed(() => size.value / 2)

const ringColor = computed(() => {
  if (isBreak.value) return '#52c41a' // 绿色 — 休息
  if (isFocusing.value) return '#e74c3c' // 红色 — 专注
  return '#d9d9d9' // 灰色 — 空闲
})

const bgColor = computed(() => {
  return isBreak.value ? '#f6ffed' : '#fff1f0'
})
</script>

<template>
  <div class="timer-ring" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" class="timer-ring__svg">
      <!-- 背景圆环 -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        :stroke="bgColor"
        fill="none"
      />
      <!-- 进度圆环 -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        :stroke="ringColor"
        fill="none"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        class="timer-ring__progress"
        :style="{ transform: 'rotate(-90deg)', transformOrigin: 'center' }"
      />
    </svg>
    <!-- 中心插槽 -->
    <div class="timer-ring__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.timer-ring {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-ring__svg {
  position: absolute;
  top: 0;
  left: 0;
}

.timer-ring__progress {
  transition: stroke-dashoffset 0.5s ease, stroke 0.3s ease;
}

.timer-ring__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
