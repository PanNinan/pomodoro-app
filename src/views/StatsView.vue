<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, HeatmapChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  CalendarComponent,
  VisualMapComponent,
} from 'echarts/components'
import { useStatsStore } from '@/stores/stats'
import { useSettings } from '@/composables/useSettings'
import StatsSummary from '@/components/stats/StatsSummary.vue'
import TrendChart from '@/components/stats/TrendChart.vue'
import TagPieChart from '@/components/stats/TagPieChart.vue'
import CalendarHeatmap from '@/components/stats/CalendarHeatmap.vue'
import MonthlyChart from '@/components/stats/MonthlyChart.vue'

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  HeatmapChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  CalendarComponent,
  VisualMapComponent,
])

const statsStore = useStatsStore()
const { settings: uiSettings } = useSettings()
const activeTab = ref('overview')

onMounted(() => {
  statsStore.loadRecords()
})
</script>

<template>
  <div class="stats-view">
    <h1>专注统计</h1>

    <!-- 调试：数据状态 -->
    <n-tag v-if="statsStore.records.length === 0" type="warning" size="small" style="margin-bottom: 16px;">
      ⚠️ 暂无记录（内存: {{ statsStore.records.length }} 条，加载中: {{ statsStore.loading }}）
    </n-tag>
    <n-tag v-else type="success" size="small" style="margin-bottom: 16px;">
      ✅ 已加载 {{ statsStore.records.length }} 条记录
    </n-tag>

    <!-- 概览卡片 -->
    <StatsSummary />

    <!-- 打卡日历 -->
    <div v-if="uiSettings.showCalendar" class="stats-view__section">
      <h3>打卡日历</h3>
      <CalendarHeatmap />
    </div>

    <!-- 图表区域 -->
    <n-tabs v-model:value="activeTab" type="line" animated>
      <n-tab-pane name="overview" tab="趋势">
        <div class="stats-view__chart">
          <h3>最近 14 天专注趋势</h3>
          <TrendChart mode="trend" />
        </div>
      </n-tab-pane>

      <n-tab-pane name="weekly" tab="本周">
        <div class="stats-view__chart">
          <h3>本周番茄统计</h3>
          <TrendChart mode="weekly" />
        </div>
      </n-tab-pane>

      <n-tab-pane name="monthly" tab="本月">
        <div class="stats-view__chart">
          <h3>本月番茄统计</h3>
          <MonthlyChart />
        </div>
      </n-tab-pane>

      <n-tab-pane name="tags" tab="标签">
        <div class="stats-view__chart">
          <h3>标签分布</h3>
          <TagPieChart />
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped>
.stats-view {
  max-width: 700px;
  margin: 0 auto;
}

.stats-view h1 {
  margin: 0 0 24px;
  font-size: 24px;
}

.stats-view__section {
  margin-bottom: 24px;
}

.stats-view__section h3 {
  margin: 0 0 12px;
  font-size: 15px;
  color: var(--n-text-color-2);
}

.stats-view__chart {
  padding: 16px 0;
}

.stats-view__chart h3 {
  margin: 0 0 16px;
  font-size: 15px;
  color: var(--n-text-color-2);
}
</style>
