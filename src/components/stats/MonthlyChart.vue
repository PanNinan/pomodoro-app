<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { TooltipComponent, GridComponent } from 'echarts/components'
import { useStatsStore } from '@/stores/stats'
import EmptyChart from '@/components/common/EmptyChart.vue'

use([CanvasRenderer, BarChart, TooltipComponent, GridComponent])

const statsStore = useStatsStore()

const now = new Date()
const year = now.getFullYear()
const month = now.getMonth() + 1

const option = computed(() => {
  const data = statsStore.getMonthlyStats(year, month)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, bottom: 30, top: 20 },
    xAxis: { type: 'category', data: data.weeks },
    yAxis: { type: 'value', name: '番茄数' },
    series: [
      {
        type: 'bar',
        data: data.pomodoros,
        itemStyle: { color: '#e74c3c', borderRadius: [4, 4, 0, 0] },
        barWidth: '40%',
      },
    ],
  }
})

const isEmpty = computed(() => {
  const data = statsStore.getMonthlyStats(year, month)
  return data.pomodoros.every((v) => v === 0)
})
</script>

<template>
  <div class="monthly-chart">
    <v-chart v-if="!isEmpty" :option="option" style="height: 300px" autoresize />
    <EmptyChart v-else text="本月暂无专注记录" />
  </div>
</template>
