<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'
import { useStatsStore } from '@/stores/stats'
import EmptyChart from '@/components/common/EmptyChart.vue'

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, GridComponent])

const statsStore = useStatsStore()

const props = defineProps<{
  mode: 'trend' | 'weekly'
}>()

// 最近 14 天趋势
const trendOption = computed(() => {
  const data = statsStore.getTrendData(14)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, bottom: 30, top: 20 },
    xAxis: { type: 'category', data: data.dates },
    yAxis: { type: 'value', name: '分钟' },
    series: [
      {
        type: 'line',
        data: data.minutes,
        smooth: true,
        areaStyle: { opacity: 0.15 },
        lineStyle: { width: 2 },
        itemStyle: { color: '#e74c3c' },
      },
    ],
  }
})

// 本周统计
const weekOption = computed(() => {
  const weekData = statsStore.getWeeklyStats(new Date())
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, bottom: 30, top: 20 },
    xAxis: {
      type: 'category',
      data: weekData.map((d) => {
        const dayMap = ['日', '一', '二', '三', '四', '五', '六']
        return '周' + dayMap[new Date(d.date).getDay()]
      }),
    },
    yAxis: { type: 'value', name: '番茄数' },
    series: [
      {
        type: 'line',
        data: weekData.map((d) => d.pomodoroCount),
        smooth: true,
        areaStyle: { opacity: 0.15 },
        lineStyle: { width: 2 },
        itemStyle: { color: '#52c41a' },
      },
    ],
  }
})

const option = computed(() =>
  props.mode === 'trend' ? trendOption.value : weekOption.value
)

const isEmpty = computed(() => {
  const series = option.value.series[0]?.data as number[]
  return !series || series.every((v) => v === 0)
})
</script>

<template>
  <div class="trend-chart">
    <v-chart v-if="!isEmpty" :option="option" style="height: 300px" autoresize />
    <EmptyChart v-else text="暂无专注记录" />
  </div>
</template>
