<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { useStatsStore } from '@/stores/stats'
import EmptyChart from '@/components/common/EmptyChart.vue'

use([CanvasRenderer, PieChart, TooltipComponent, LegendComponent])

const statsStore = useStatsStore()

const hasData = computed(() => statsStore.tagDistribution.length > 0)

const option = computed(() => ({
  tooltip: { trigger: 'item' },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      data: statsStore.tagDistribution,
      label: { show: true, formatter: '{b}: {c} ({d}%)' },
    },
  ],
}))
</script>

<template>
  <div class="tag-pie-chart">
    <v-chart v-if="hasData" :option="option" style="height: 300px" autoresize />
    <EmptyChart v-else text="暂无标签数据" />
  </div>
</template>
