<script setup lang="ts">
defineProps<{
  text?: string
}>()
</script>

<template>
  <div class="empty-chart">
    <div class="empty-chart__icon">📊</div>
    <div class="empty-chart__text">{{ text || '暂无数据' }}</div>
    <div class="empty-chart__hint">完成番茄后这里会显示统计图表</div>
  </div>
</template>

<style scoped>
.empty-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  border: 1px dashed var(--n-border-color);
  border-radius: 8px;
  background-color: var(--n-color);
}

.empty-chart__icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.4;
}

.empty-chart__text {
  font-size: 15px;
  color: var(--n-text-color-2);
  margin-bottom: 4px;
}

.empty-chart__hint {
  font-size: 13px;
  color: var(--n-text-color-3);
}
</style>
