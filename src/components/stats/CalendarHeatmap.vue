<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { HeatmapChart } from 'echarts/charts'
import { TooltipComponent, VisualMapComponent, CalendarComponent } from 'echarts/components'
import { useStatsStore } from '@/stores/stats'
import { format, subDays } from 'date-fns'
import EmptyChart from '@/components/common/EmptyChart.vue'

use([CanvasRenderer, HeatmapChart, TooltipComponent, VisualMapComponent, CalendarComponent])

const statsStore = useStatsStore()

const hasData = computed(() => statsStore.heatmapData.some(([, v]) => v > 0))

const option = computed(() => {
  const end = new Date()
  const start = subDays(end, 364)

  return {
    tooltip: {
      formatter: (params: { data: [string, number] }) => {
        const [date, count] = params.data
        return `${date}<br/>🍅 ${count} 个番茄`
      },
    },
    visualMap: {
      min: 0,
      max: 10,
      type: 'piecewise',
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      pieces: [
        { min: 0, max: 0, label: '0', color: '#ebedf0' },
        { min: 1, max: 2, label: '1-2', color: '#ffc107' },
        { min: 3, max: 5, label: '3-5', color: '#ff9800' },
        { min: 6, max: 8, label: '6-8', color: '#f44336' },
        { min: 9, label: '9+', color: '#b71c1c' },
      ],
      show: true,
    },
    calendar: {
      range: [format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')],
      cellSize: ['auto', 13],
      itemStyle: { borderWidth: 3, borderColor: '#fff' },
      yearLabel: { show: false },
      monthLabel: { nameMap: 'ZH' },
      dayLabel: { nameMap: 'ZH' },
      left: 30,
      right: 30,
      top: 20,
      bottom: 40,
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: statsStore.heatmapData,
      },
    ],
  }
})
</script>

<template>
  <div class="calendar-heatmap">
    <v-chart v-if="hasData" :option="option" style="height: 200px" autoresize />
    <EmptyChart v-else text="暂无打卡记录" />
  </div>
</template>
